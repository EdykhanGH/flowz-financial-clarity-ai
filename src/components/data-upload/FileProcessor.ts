import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker using a more reliable method
if (typeof window !== 'undefined') {
  // Use local worker for better reliability
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).href;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  balance?: number;
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
        
        // Process the raw data to extract transactions
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
  
  // Find header row with more comprehensive search
  for (let i = 0; i < Math.min(rawData.length, 20); i++) {
    const row = rawData[i];
    if (row && Array.isArray(row)) {
      const rowStr = row.join('').toLowerCase();
      if ((rowStr.includes('date') || rowStr.includes('transaction date') || rowStr.includes('value date')) && 
          (rowStr.includes('description') || rowStr.includes('narration') || rowStr.includes('details') || rowStr.includes('particulars'))) {
        headerRow = i;
        break;
      }
    }
  }
  
  if (headerRow === -1) {
    console.log('No header row found, trying to extract from first 5 rows');
    // If no clear header, assume first few rows contain transaction data
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
  
  // Process data rows
  for (let i = headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !Array.isArray(row)) continue;
    
    const dateStr = row[dateCol];
    const description = row[descCol];
    const debitAmount = parseAmount(row[debitCol]);
    const creditAmount = parseAmount(row[creditCol]);
    const singleAmount = parseAmount(row[amountCol]);
    const balance = parseAmount(row[balanceCol]);
    
    // Skip empty rows
    if (!dateStr && !description && debitAmount === 0 && creditAmount === 0 && singleAmount === 0) continue;
    
    let amount = 0;
    let type = 'expense';
    
    if (singleAmount > 0) {
      amount = singleAmount;
      // Try to determine type from description or context
      const upperDescription = String(description || '').toUpperCase();
      if (upperDescription.includes('CREDIT') || upperDescription.includes('DEPOSIT') || 
          upperDescription.includes('SALARY') || upperDescription.includes('TRANSFER IN')) {
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
  
  // Handle Excel serial dates
  if (typeof dateValue === 'number' && dateValue > 1000) {
    const date = new Date((dateValue - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  // Handle string dates with multiple formats
  const dateStr = String(dateValue);
  
  // Try different date patterns
  const patterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})/i
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      let day, month, year;
      
      if (pattern.source.includes('Jan|Feb')) {
        // Month name pattern
        day = match[1];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        month = (monthNames.indexOf(match[2]) + 1).toString();
        year = match[3];
      } else if (match[1].length === 4) {
        // YYYY-MM-DD format
        year = match[1];
        month = match[2];
        day = match[3];
      } else {
        // DD-MM-YYYY format
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
        
        // Load PDF with better error handling
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          standardFontDataUrl: null,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true
        });
        
        const pdf = await loadingTask.promise;
        let fullText = '';

        console.log(`Processing PDF with ${pdf.numPages} pages`);

        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          } catch (pageError) {
            console.warn(`Error processing page ${i}:`, pageError);
          }
        }
        
        console.log('Extracted PDF text length:', fullText.length);
        
        if (fullText.length < 100) {
          throw new Error('PDF appears to be empty or text extraction failed. Please ensure the PDF contains readable text.');
        }
        
        // Parse Nigerian bank statement text format
        const transactions = parseNigerianBankStatement(fullText);
        console.log('Parsed transactions:', transactions.length);
        resolve(transactions);
      } catch (error) {
        console.error('PDF parsing error:', error);
        reject(new Error(`Failed to process PDF: ${error.message}. Please ensure the file is a valid PDF with readable text.`));
      }
    };

    reader.onerror = (error) => {
      reject(new Error('Failed to read PDF file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

const parseNigerianBankStatement = (text: string): any[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const transactions: any[] = [];
  
  // Enhanced patterns for Nigerian banks and international formats
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
    /(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/gi,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g
  ];
  
  // More comprehensive amount pattern
  const amountPattern = /(?:₦|NGN|USD|\$|£|€)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  
  // Skip header and footer lines
  const relevantLines = lines.filter(line => {
    const lower = line.toLowerCase();
    return !lower.includes('account number') && 
           !lower.includes('statement period') && 
           !lower.includes('opening balance') && 
           !lower.includes('closing balance') &&
           !lower.includes('page ') &&
           !lower.includes('continued') &&
           !lower.includes('brought forward') &&
           line.trim().length > 20; // Increased minimum length
  });
  
  console.log(`Processing ${relevantLines.length} relevant lines from PDF`);
  
  for (let i = 0; i < relevantLines.length; i++) {
    const line = relevantLines[i].trim();
    
    // Try to find date in the line
    let dateMatch = null;
    let matchedPattern = null;
    
    for (const pattern of datePatterns) {
      pattern.lastIndex = 0; // Reset regex
      dateMatch = pattern.exec(line);
      if (dateMatch) {
        matchedPattern = pattern;
        break;
      }
    }
    
    if (dateMatch) {
      const dateStr = dateMatch[1];
      
      // Reset and find all amounts in the line
      amountPattern.lastIndex = 0;
      const amountMatches = Array.from(line.matchAll(amountPattern));
      
      if (amountMatches && amountMatches.length > 0) {
        // Remove date and amounts to get description
        let description = line
          .replace(new RegExp(dateStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
          .replace(/(?:₦|NGN|USD|\$|£|€)?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g, '')
          .trim()
          .replace(/\s+/g, ' ');
        
        // Clean up description further
        description = description
          .replace(/^[\/\-\s]+|[\/\-\s]+$/g, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        
        if (description && amountMatches.length > 0) {
          // Extract transaction amount (usually the first significant amount)
          const amounts = amountMatches.map(match => parseFloat(match[1].replace(/,/g, '')));
          let transactionAmount = amounts[0];
          
          // If multiple amounts, the larger one is usually the transaction amount
          if (amounts.length > 1) {
            transactionAmount = Math.max(...amounts.slice(0, -1)); // Exclude last (usually balance)
          }
          
          const balance = amounts.length > 1 ? amounts[amounts.length - 1] : null;
          
          // Enhanced transaction type detection
          let type = 'expense';
          const upperDescription = description.toUpperCase();
          const creditKeywords = [
            'CREDIT', 'SALARY', 'TRANSFER IN', 'DEPOSIT', 'PAYMENT RECEIVED', 
            'INWARD', 'REVERSAL', 'REFUND', 'DIVIDEND', 'INTEREST', 'BONUS'
          ];
          const debitKeywords = [
            'DEBIT', 'WITHDRAWAL', 'TRANSFER OUT', 'PAYMENT', 'CHARGE', 
            'FEE', 'PURCHASE', 'ATM', 'POS', 'OUTWARD'
          ];
          
          if (creditKeywords.some(keyword => upperDescription.includes(keyword))) {
            type = 'income';
          } else if (debitKeywords.some(keyword => upperDescription.includes(keyword))) {
            type = 'expense';
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
  
  // Sort by date and remove duplicates
  const uniqueTransactions = transactions
    .filter((t, index, self) => 
      index === self.findIndex(other => 
        other.date === t.date && 
        other.description === t.description && 
        other.amount === t.amount
      )
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  console.log(`Extracted ${uniqueTransactions.length} unique transactions from PDF`);
  return uniqueTransactions;
};

const categorizeTransaction = (description: string): string => {
  const desc = description.toUpperCase();
  
  // Income categories
  if (desc.includes('SALARY') || desc.includes('PAY') || desc.includes('WAGE')) return 'Salary';
  if (desc.includes('TRANSFER IN') || desc.includes('PAYMENT RECEIVED') || desc.includes('CREDIT TRANSFER')) return 'Business Income';
  if (desc.includes('DIVIDEND') || desc.includes('INTEREST') || desc.includes('INVESTMENT')) return 'Investment Income';
  
  // Expense categories
  if (desc.includes('GROCERY') || desc.includes('SUPERMARKET') || desc.includes('FOOD') || desc.includes('RESTAURANT')) return 'Food & Groceries';
  if (desc.includes('FUEL') || desc.includes('TRANSPORT') || desc.includes('UBER') || desc.includes('TAXI') || desc.includes('BUS')) return 'Transportation';
  if (desc.includes('ELECTRIC') || desc.includes('WATER') || desc.includes('UTILITY') || desc.includes('BILL')) return 'Utilities';
  if (desc.includes('RENT') || desc.includes('MORTGAGE') || desc.includes('ACCOMMODATION')) return 'Housing';
  if (desc.includes('HOSPITAL') || desc.includes('MEDICAL') || desc.includes('PHARMACY') || desc.includes('HEALTH')) return 'Healthcare';
  if (desc.includes('SCHOOL') || desc.includes('EDUCATION') || desc.includes('TUITION') || desc.includes('COURSE')) return 'Education';
  if (desc.includes('BANK CHARGE') || desc.includes('FEE') || desc.includes('COMMISSION') || desc.includes('SERVICE CHARGE')) return 'Bank Charges';
  if (desc.includes('SAVINGS') || desc.includes('INVESTMENT') || desc.includes('FIXED DEPOSIT')) return 'Savings & Investment';
  if (desc.includes('ENTERTAINMENT') || desc.includes('MOVIE') || desc.includes('GAME') || desc.includes('LEISURE')) return 'Entertainment';
  if (desc.includes('SHOPPING') || desc.includes('STORE') || desc.includes('PURCHASE')) return 'Shopping';
  if (desc.includes('ATM') || desc.includes('WITHDRAWAL') || desc.includes('CASH')) return 'Cash Withdrawal';
  
  return 'Uncategorized';
};

export const parseFile = async (file: File): Promise<any[]> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  console.log('Parsing file:', file.name, 'Extension:', fileExtension, 'Size:', file.size);
  
  if (file.size === 0) {
    throw new Error('File is empty. Please select a valid file.');
  }
  
  if (file.size > 50 * 1024 * 1024) { // 50MB limit
    throw new Error('File is too large. Please select a file smaller than 50MB.');
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
