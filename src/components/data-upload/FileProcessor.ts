import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker using CDN (most reliable approach)
if (typeof window !== 'undefined') {
  // Use CDN worker for better reliability and compatibility
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  balance?: number;
}

// Enhanced transaction categories based on your research
const TRANSACTION_CATEGORIES = {
  income: {
    keywords: ['salary', 'pay', 'wage', 'transfer in', 'payment received', 'credit transfer', 'inward', 'reversal', 'refund', 'dividend', 'interest', 'bonus'],
    categories: {
      'salary': 'Salary',
      'transfer in': 'Business Income', 
      'dividend': 'Investment Income',
      'interest': 'Investment Income'
    }
  },
  expenses: {
    keywords: ['debit', 'withdrawal', 'transfer out', 'payment', 'charge', 'fee', 'purchase', 'atm', 'pos', 'outward'],
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
      'water': 'Utilities',
      'utility': 'Utilities',
      'bill': 'Utilities',
      'internet': 'Utilities',
      'mobile': 'Utilities',
      'airtime': 'Utilities',
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
      'atm': 'Cash Withdrawal',
      'withdrawal': 'Cash Withdrawal',
      'pos': 'Card Payments',
      'shopping': 'Shopping',
      'store': 'Shopping'
    }
  }
};

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

const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name));
    if (index !== -1) return index;
  }
  return -1;
};

const parseAmount = (value: any): number => {
  if (!value) return 0;
  const str = String(value).replace(/[₦,\s$£€]/g, '');
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
      let day, month, year;
      
      if (pattern.source.includes('Jan|Feb')) {
        day = match[1];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        month = (monthNames.indexOf(match[2]) + 1).toString();
        year = match[3];
      } else if (match[1].length === 4) {
        year = match[1];
        month = match[2];
        day = match[3];
      } else {
        day = match[1];
        month = match[2];
        year = match[3];
      }
      
      if (year.length === 2) {
        year = '20' + year;
      }
      
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return new Date().toISOString().split('T')[0];
};

export const parsePDF = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e: any) => {
      try {
        const arrayBuffer = e.target.result;
        
        console.log('Loading PDF with enhanced configuration...');
        
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          standardFontDataUrl: null,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
          disableFontFace: false,
          disableRange: false,
          disableStream: false,
          disableAutoFetch: false
        });
        
        const pdf = await loadingTask.promise;
        let fullText = '';

        console.log(`Processing PDF with ${pdf.numPages} pages`);

        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
              .replace(/\s+/g, ' ');
            fullText += pageText + '\n';
            
            console.log(`Page ${i} processed, text length: ${pageText.length}`);
          } catch (pageError) {
            console.warn(`Error processing page ${i}:`, pageError);
          }
        }
        
        console.log('Total extracted PDF text length:', fullText.length);
        
        if (fullText.length < 50) {
          throw new Error('PDF appears to be empty, scanned, or text extraction failed. Please ensure the PDF contains readable text (not a scanned image).');
        }
        
        const transactions = parseNigerianBankStatement(fullText);
        console.log('Final parsed transactions:', transactions.length);
        
        if (transactions.length === 0) {
          throw new Error('No transactions found in the PDF. This could mean:\n• The PDF is a scanned image rather than text-based\n• The statement format is not recognized\n• The file may be corrupted or password-protected');
        }
        
        resolve(transactions);
      } catch (error) {
        console.error('PDF parsing error:', error);
        reject(new Error(`Failed to process PDF: ${error.message}`));
      }
    };

    reader.onerror = (error) => {
      reject(new Error('Failed to read PDF file. Please ensure the file is not corrupted.'));
    };

    reader.readAsArrayBuffer(file);
  });
};

const parseNigerianBankStatement = (text: string): any[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const transactions: any[] = [];
  
  // Enhanced date patterns for better recognition
  const datePatterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g,
    /(\d{1,2}(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})/gi
  ];
  
  // Enhanced amount pattern with various currency symbols and formats
  const amountPattern = /(?:₦|NGN|USD|\$|£|€)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|(\d+\.\d{2})/g;
  
  // Enhanced line filtering
  const relevantLines = lines.filter(line => {
    const lower = line.toLowerCase().trim();
    const excludePatterns = [
      'account number', 'statement period', 'opening balance', 'closing balance',
      'page ', 'continued', 'brought forward', 'carried forward', 'total',
      'customer service', 'terms and conditions', 'generated on'
    ];
    
    return !excludePatterns.some(pattern => lower.includes(pattern)) && 
           line.trim().length > 15 &&
           /\d/.test(line); // Must contain at least one digit
  });
  
  console.log(`Processing ${relevantLines.length} relevant lines from PDF`);
  
  for (let i = 0; i < relevantLines.length; i++) {
    const line = relevantLines[i].trim();
    
    // Try to find date in the line
    let dateMatch = null;
    
    for (const pattern of datePatterns) {
      pattern.lastIndex = 0;
      dateMatch = pattern.exec(line);
      if (dateMatch) break;
    }
    
    if (dateMatch) {
      const dateStr = dateMatch[1];
      
      // Find all amounts in the line
      amountPattern.lastIndex = 0;
      const amountMatches = Array.from(line.matchAll(amountPattern));
      
      if (amountMatches && amountMatches.length > 0) {
        // Extract description by removing date and amounts
        let description = line
          .replace(new RegExp(dateStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
          .replace(/(?:₦|NGN|USD|\$|£|€)?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g, '')
          .replace(/\d+\.\d{2}/g, '')
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/^[\/\-\s]+|[\/\-\s]+$/g, '');
        
        if (description && amountMatches.length > 0) {
          const amounts = amountMatches.map(match => {
            const amount = match[1] || match[2];
            return parseFloat(amount.replace(/,/g, ''));
          }).filter(amount => !isNaN(amount) && amount > 0);
          
          if (amounts.length > 0) {
            // The transaction amount is usually the first or largest amount
            let transactionAmount = amounts[0];
            if (amounts.length > 1) {
              // If multiple amounts, use the one that's not likely a balance
              transactionAmount = amounts.length > 1 ? amounts[0] : Math.max(...amounts);
            }
            
            const balance = amounts.length > 1 ? amounts[amounts.length - 1] : null;
            
            // Enhanced transaction type detection
            let type = 'expense';
            const upperDescription = description.toUpperCase();
            
            if (TRANSACTION_CATEGORIES.income.keywords.some(keyword => 
              upperDescription.includes(keyword.toUpperCase()))) {
              type = 'income';
            }
            
            transactions.push({
              date: formatDate(dateStr),
              description: description,
              amount: transactionAmount,
              type: type,
              balance: balance,
              category: categorizeTransaction(description)
            });
          }
        }
      }
    }
  }
  
  // Remove duplicates and sort by date
  const uniqueTransactions = transactions
    .filter((t, index, self) => 
      index === self.findIndex(other => 
        other.date === t.date && 
        other.description === t.description && 
        Math.abs(other.amount - t.amount) < 0.01
      )
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  console.log(`Extracted ${uniqueTransactions.length} unique transactions from PDF`);
  return uniqueTransactions;
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

export const calculateSummary = (transactions: Transaction[]) => {
  const totalRevenue = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = totalRevenue - totalExpenses;

  return {
    totalTransactions: transactions.length,
    totalRevenue,
    totalExpenses,
    netIncome,
  };
};
