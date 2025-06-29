import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// PDF Worker Loading Algorithm with Multiple Fallbacks
class PDFWorkerManager {
  private static workerInitialized = false;
  private static initializationPromise: Promise<void> | null = null;

  static async initializeWorker(): Promise<void> {
    if (this.workerInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.tryWorkerStrategies();
    await this.initializationPromise;
  }

  private static async tryWorkerStrategies(): Promise<void> {
    const strategies = [
      // Strategy 1: Local worker import (most reliable)
      () => this.tryLocalWorker(),
      // Strategy 2: CDN with specific version
      () => this.tryCDNWorker('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js'),
      // Strategy 3: unpkg CDN
      () => this.tryCDNWorker(`https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js`),
      // Strategy 4: jsdelivr CDN
      () => this.tryCDNWorker('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js'),
      // Strategy 5: Disable worker (fallback)
      () => this.disableWorker()
    ];

    for (const strategy of strategies) {
      try {
        await strategy();
        console.log('PDF worker initialized successfully');
        this.workerInitialized = true;
        return;
      } catch (error) {
        console.warn('PDF worker strategy failed:', error.message);
        continue;
      }
    }

    throw new Error('All PDF worker initialization strategies failed');
  }

  private static async tryLocalWorker(): Promise<void> {
    try {
      // Try to import worker as a module
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?worker');
      pdfjsLib.GlobalWorkerOptions.workerPort = new worker.default();
      await this.testWorker();
    } catch (error) {
      throw new Error('Local worker import failed');
    }
  }

  private static async tryCDNWorker(url: string): Promise<void> {
    pdfjsLib.GlobalWorkerOptions.workerSrc = url;
    await this.testWorker();
  }

  private static async disableWorker(): Promise<void> {
    // Last resort: disable worker entirely
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    console.warn('PDF worker disabled - processing may be slower');
  }

  private static async testWorker(): Promise<void> {
    // Test the worker with a minimal PDF
    const testPDF = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
      0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a
    ]);
    
    try {
      const doc = await pdfjsLib.getDocument({ 
        data: testPDF,
        verbosity: 0 
      }).promise;
      await doc.destroy();
    } catch (error) {
      throw new Error('Worker test failed');
    }
  }
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  balance?: number;
  channel?: string;
  reference?: string;
  timestamp?: string;
  valueDate?: string;
  originalDescription?: string;
}

// Enhanced transaction categories based on Nigerian banking patterns
const TRANSACTION_CATEGORIES = {
  income: {
    keywords: ['salary', 'pay', 'wage', 'transfer in', 'payment received', 'credit transfer', 'inward', 'reversal', 'refund', 'dividend', 'interest', 'bonus', 'transfer from', 'interest earned'],
    categories: {
      'salary': 'Salary',
      'transfer in': 'Business Income', 
      'transfer from': 'Business Income',
      'dividend': 'Investment Income',
      'interest': 'Investment Income',
      'interest earned': 'Investment Income'
    }
  },
  expenses: {
    keywords: ['debit', 'withdrawal', 'transfer out', 'payment', 'charge', 'fee', 'purchase', 'atm', 'pos', 'outward', 'airtime', 'data', 'electricity'],
    categories: {
      'grocery': 'Food & Groceries',
      'supermarket': 'Food & Groceries',
      'food': 'Food & Groceries',
      'restaurant': 'Food & Groceries',
      'fuel': 'Transportation',
      'transport': 'Transportation',
      'uber': 'Transportation',
      'taxi': 'Transportation',
      'electric': 'Utilities',
      'electricity': 'Utilities',
      'water': 'Utilities',
      'utility': 'Utilities',
      'bill': 'Utilities',
      'internet': 'Utilities',
      'mobile': 'Utilities',
      'airtime': 'Utilities',
      'data': 'Utilities',
      'rent': 'Housing',
      'mortgage': 'Housing',
      'hospital': 'Healthcare',
      'medical': 'Healthcare',
      'pharmacy': 'Healthcare',
      'school': 'Education',
      'tuition': 'Education',
      'bank charge': 'Bank Charges',
      'service charge': 'Bank Charges',
      'transfer levy': 'Bank Charges',
      'ussd': 'Bank Charges',
      'commission': 'Bank Charges',
      'fee': 'Bank Charges',
      'charge': 'Bank Charges',
      'atm': 'Cash Withdrawal',
      'withdrawal': 'Cash Withdrawal',
      'pos': 'Card Payments',
      'shopping': 'Shopping',
      'store': 'Shopping'
    }
  }
};

// Enhanced bank statement parser
function parseBankStatement(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = text.split('\n');
  
  // Enhanced regex pattern for more accurate extraction
  const transactionRegex = /(\d{4} [A-Za-z]{3} \d{1,2} \d{2}:\d{2}:\d{2})\s+(\d{1,2} [A-Za-z]{3} \d{4})\s+(.*?)\s+([-+][\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+(\S+)\s+(\S+)/;
  
  // Alternative patterns for different bank formats
  const alternativePatterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.*?)\s+([-+]?[\d,]+\.\d{2})\s+([\d,]+\.\d{2})/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\s+(.*?)\s+([-+]?[\d,]+\.\d{2})/
  ];

  for (const line of lines) {
    // Try enhanced regex first
    let match = line.match(transactionRegex);
    
    if (match) {
      const amount = parseFloat(match[4].replace(/[,+]/g, ''));
      transactions.push({
        timestamp: match[1],
        valueDate: match[2],
        date: formatDate(match[2]),
        description: match[3].trim(),
        originalDescription: match[3].trim(),
        amount: Math.abs(amount),
        balance: parseFloat(match[5].replace(/,/g, '')),
        channel: match[6],
        reference: match[7],
        type: amount >= 0 ? 'income' : 'expense',
        category: categorizeTransaction(match[3])
      });
    } else {
      // Try alternative patterns
      for (const pattern of alternativePatterns) {
        match = line.match(pattern);
        if (match) {
          const amount = parseFloat(match[3].replace(/[,+-]/g, ''));
          if (!isNaN(amount) && amount > 0) {
            transactions.push({
              date: formatDate(match[1]),
              description: match[2].trim(),
              originalDescription: match[2].trim(),
              amount: amount,
              balance: match[4] ? parseFloat(match[4].replace(/,/g, '')) : undefined,
              type: determineTransactionType(match[2], amount),
              category: categorizeTransaction(match[2])
            });
          }
          break;
        }
      }
    }
  }
  
  return transactions;
}

function categorizeTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.map(tx => {
    const description = tx.description.toLowerCase();
    let autoCategory = tx.category;
    
    // Enhanced auto-categorization logic
    if (description.includes('transfer from') || 
        description.includes('interest earned') ||
        description.includes('salary') ||
        description.includes('dividend')) {
      autoCategory = 'Investment Income';
      tx.type = 'income';
    } else if (description.includes('airtime') || 
               description.includes('fee') || 
               description.includes('charge') ||
               description.includes('electricity') ||
               description.includes('data') ||
               description.includes('withdrawal') ||
               description.includes('transfer out')) {
      autoCategory = categorizeTransaction(description);
      tx.type = 'expense';
    }
    
    return { ...tx, category: autoCategory };
  });
}

function calculateTotals(transactions: Transaction[]) {
  const profit = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  const cost = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  return { 
    profit, 
    cost,
    totalTransactions: transactions.length,
    totalRevenue: profit,
    totalExpenses: cost,
    netIncome: profit - cost
  };
}

// Enhanced PDF text extraction with robust error handling
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Starting PDF text extraction...');
    
    // Initialize worker using our robust strategy
    await PDFWorkerManager.initializeWorker();
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0 // Reduce console noise
    }).promise;
    
    let text = '';
    const numPages = pdf.numPages;
    console.log(`Processing ${numPages} pages...`);
    
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ');
        text += pageText + '\n';
        console.log(`Page ${i} processed, extracted ${pageText.length} characters`);
      } catch (pageError) {
        console.warn(`Failed to process page ${i}:`, pageError);
        // Continue with other pages
      }
    }
    
    await pdf.destroy();
    console.log(`PDF processing complete. Total text length: ${text.length}`);
    return text;
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

export const parseExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const processedData = processExcelData(jsonData);
        resolve(processedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};

const processExcelData = (rawData: any[][]): any[] => {
  const transactions: any[] = [];
  let headerRow = -1;
  
  // Enhanced header detection
  const headerPatterns = [
    ['date', 'description', 'amount'],
    ['date', 'narration', 'debit', 'credit'],
    ['transaction date', 'description', 'amount'],
    ['value date', 'transaction details', 'withdrawal', 'deposit'],
    ['posting date', 'particulars', 'dr', 'cr']
  ];
  
  for (let i = 0; i < Math.min(rawData.length, 20); i++) {
    const row = rawData[i];
    if (row && Array.isArray(row)) {
      const rowStr = row.join('').toLowerCase().replace(/\s+/g, ' ');
      
      for (const pattern of headerPatterns) {
        if (pattern.every(term => rowStr.includes(term))) {
          headerRow = i;
          break;
        }
      }
      
      if (headerRow !== -1) break;
    }
  }
  
  if (headerRow === -1) {
    console.log('No header row found, trying to extract from first 5 rows');
    headerRow = 0;
  }
  
  const headers = rawData[headerRow] ? rawData[headerRow].map(h => String(h || '').toLowerCase().trim()) : [];
  console.log('Found headers:', headers);
  
  const dateCol = findColumnIndex(headers, ['date', 'transaction date', 'value date', 'trans date', 'posting date']);
  const descCol = findColumnIndex(headers, ['description', 'narration', 'details', 'transaction details', 'particulars', 'remark']);
  const debitCol = findColumnIndex(headers, ['debit', 'withdrawal', 'out', 'amount out', 'dr', 'debits']);
  const creditCol = findColumnIndex(headers, ['credit', 'deposit', 'in', 'amount in', 'cr', 'credits']);
  const amountCol = findColumnIndex(headers, ['amount', 'transaction amount', 'value']);
  const balanceCol = findColumnIndex(headers, ['balance', 'running balance', 'available balance', 'book balance']);
  
  console.log('Column mappings:', { dateCol, descCol, debitCol, creditCol, amountCol, balanceCol });
  
  for (let i = headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !Array.isArray(row)) continue;
    
    const dateStr = row[dateCol];
    const description = row[descCol];
    const debitAmount = parseAmount(row[debitCol]);
    const creditAmount = parseAmount(row[creditCol]);
    const singleAmount = parseAmount(row[amountCol]);
    const balance = parseAmount(row[balanceCol]);
    
    if (!dateStr && !description && debitAmount === 0 && creditAmount === 0 && singleAmount === 0) continue;
    
    let amount = 0;
    let type = 'expense';
    
    if (singleAmount > 0) {
      amount = singleAmount;
      const upperDescription = String(description || '').toUpperCase();
      if (TRANSACTION_CATEGORIES.income.keywords.some(keyword => upperDescription.includes(keyword.toUpperCase()))) {
        type = 'income';
      }
    } else if (debitAmount > 0) {
      amount = debitAmount;
      type = 'expense';
    } else if (creditAmount > 0) {
      amount = creditAmount;
      type = 'income';
    }
    
    if (amount > 0 && (dateStr || description)) {
      transactions.push({
        date: formatDate(dateStr),
        description: String(description || 'Transaction').trim(),
        originalDescription: String(description || 'Transaction').trim(),
        amount: amount,
        type: type,
        balance: balance,
        category: categorizeTransaction(String(description || ''))
      });
    }
  }
  
  console.log(`Extracted ${transactions.length} transactions from Excel`);
  return transactions;
};

export const parsePDF = (file: File): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting enhanced PDF processing...');
      
      const text = await extractTextFromPDF(file);
      console.log('PDF text extracted, length:', text.length);
      
      if (text.length < 50) {
        throw new Error('PDF appears to be empty, scanned, or text extraction failed. Please ensure the PDF contains readable text (not a scanned image).');
      }
      
      // Use enhanced parsing function
      const transactions = parseBankStatement(text);
      const categorizedTransactions = categorizeTransactions(transactions);
      
      console.log('Enhanced parsing completed:', categorizedTransactions.length, 'transactions found');
      
      if (categorizedTransactions.length === 0) {
        throw new Error('No transactions found in the PDF. This could mean:\n• The PDF is a scanned image rather than text-based\n• The statement format is not recognized\n• The file may be corrupted or password-protected');
      }
      
      resolve(categorizedTransactions);
    } catch (error) {
      console.error('Enhanced PDF parsing error:', error);
      reject(new Error(`Failed to process PDF: ${error.message}`));
    }
  });
};

// Helper functions
const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name));
    if (index !== -1) return index;
  }
  return -1;
};

const parseAmount = (value: any): number => {
  if (!value) return 0;
  const str = String(value).replace(/[₦,\s$£€+-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
};

const formatDate = (dateValue: any): string => {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  
  if (typeof dateValue === 'number' && dateValue > 1000) {
    const date = new Date((dateValue - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  const dateStr = String(dateValue);
  
  const patterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g,
    /(\d{1,2}(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})/gi
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      try {
        const parsedDate = new Date(match[0]);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  return new Date().toISOString().split('T')[0];
};

const determineTransactionType = (description: string, amount: number): 'income' | 'expense' => {
  const desc = description.toLowerCase();
  
  if (TRANSACTION_CATEGORIES.income.keywords.some(keyword => desc.includes(keyword))) {
    return 'income';
  }
  
  if (TRANSACTION_CATEGORIES.expenses.keywords.some(keyword => desc.includes(keyword))) {
    return 'expense';
  }
  
  return amount >= 0 ? 'income' : 'expense';
};

const categorizeTransaction = (description: string): string => {
  const desc = description.toUpperCase();
  
  // Check income categories first
  for (const [keyword, category] of Object.entries(TRANSACTION_CATEGORIES.income.categories)) {
    if (desc.includes(keyword.toUpperCase())) return category;
  }
  
  // Check expense categories
  for (const [keyword, category] of Object.entries(TRANSACTION_CATEGORIES.expenses.categories)) {
    if (desc.includes(keyword.toUpperCase())) return category;
  }
  
  return 'Uncategorized';
};

export const parseFile = async (file: File): Promise<any[]> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  console.log('Parsing file:', file.name, 'Extension:', fileExtension, 'Size:', file.size);
  
  if (file.size === 0) {
    throw new Error('File is empty. Please select a valid file.');
  }
  
  if (file.size > 100 * 1024 * 1024) { // 100MB limit
    throw new Error('File is too large. Please select a file smaller than 100MB.');
  }
  
  switch (fileExtension) {
    case 'pdf':
      return parsePDF(file);
    case 'csv':
    case 'xls':
    case 'xlsx':
      return parseExcel(file);
    default:
      throw new Error('Unsupported file format. Please upload PDF, CSV, XLS, or XLSX files.');
  }
};

export const mapTransactionType = (type: string): 'income' | 'expense' | 'transfer' | 'investment' | 'refund' => {
  const normalizedType = type.toLowerCase().trim();
  
  switch (normalizedType) {
    case 'income':
    case 'revenue':
    case 'earning':
    case 'profit':
      return 'income';
    case 'expense':
    case 'spending':
    case 'cost':
      return 'expense';
    case 'transfer':
      return 'transfer';
    case 'investment':
      return 'investment';
    case 'refund':
      return 'refund';
    default:
      return 'expense';
  }
};

export const calculateSummary = calculateTotals;

// Export function for CSV download
export const exportToCSV = (transactions: Transaction[]): string => {
  const headers = 'Date,Description,Amount,Category,Type,Balance';
  const rows = transactions.map(tx => 
    `"${tx.date}","${tx.description}",${tx.amount},${tx.category},${tx.type},${tx.balance || ''}`
  );
  return [headers, ...rows].join('\n');
};
