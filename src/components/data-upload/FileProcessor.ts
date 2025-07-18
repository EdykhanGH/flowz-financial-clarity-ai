import * as XLSX from 'xlsx';
import { BankStatementExtractor } from './PDFExtractor';
import { TransactionSummaryCalculator } from './TransactionSummaryCalculator';

export interface Transaction {
  id?: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  balance?: number;
  channel?: string;
  reference?: string;
  timestamp?: string;
  valueDate?: string;
  originalDescription?: string;
}

export const parseFile = async (file: File): Promise<Transaction[]> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  console.log('Parsing file:', file.name, 'Extension:', fileExtension, 'Size:', file.size);
  
  if (file.size === 0) {
    throw new Error('File is empty. Please select a valid file.');
  }
  
  if (file.size > 100 * 1024 * 1024) {
    throw new Error('File is too large. Please select a file smaller than 100MB.');
  }
  
  let transactions: Transaction[] = [];
  
  switch (fileExtension) {
    case 'pdf':
      transactions = await BankStatementExtractor.extractFromPDF(file);
      break;
    case 'csv':
    case 'xls':
    case 'xlsx':
      transactions = await parseExcel(file);
      break;
    default:
      throw new Error('Unsupported file format. Please upload PDF, CSV, XLS, or XLSX files.');
  }
  
  // Clean and validate all transactions
  const cleanedTransactions = transactions
    .filter(t => t && t.date && t.description && t.amount > 0)
    .map(t => ({
      ...t,
      description: cleanDescription(t.description),
      amount: Math.abs(t.amount),
      type: t.type || determineTransactionType(t.description, t.amount)
    }));
  
  console.log(`Successfully processed ${cleanedTransactions.length} clean transactions`);
  return cleanedTransactions;
};

const cleanDescription = (description: string): string => {
  if (!description) return 'Transaction';
  
  return description
    .replace(/[^\w\s\-\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 80);
};

const determineTransactionType = (description: string, amount: number): 'income' | 'expense' => {
  const desc = description.toLowerCase();
  
  const incomeKeywords = [
    'transfer from', 'credit', 'deposit', 'salary', 'payment received',
    'interest', 'dividend', 'bonus', 'refund', 'reversal', 'inward',
    'received', 'incoming', 'credit alert', 'pay', 'wage', 'receipt'
  ];
  
  const expenseKeywords = [
    'airtime', 'electricity', 'debit', 'withdrawal', 'transfer to', 'payment',
    'charge', 'fee', 'purchase', 'atm', 'pos', 'outward', 'bill', 'fuel',
    'grocery', 'shopping', 'commission', 'levy', 'debit alert'
  ];
  
  if (incomeKeywords.some(keyword => desc.includes(keyword))) {
    return 'income';
  }
  
  if (expenseKeywords.some(keyword => desc.includes(keyword))) {
    return 'expense';
  }
  
  return 'expense';
};

export const parseExcel = (file: File): Promise<Transaction[]> => {
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

const processExcelData = (rawData: any[][]): Transaction[] => {
  const transactions: Transaction[] = [];
  let headerRow = -1;
  
  // Enhanced header detection with more patterns
  const headerPatterns = [
    ['date', 'description', 'amount'],
    ['date', 'narration', 'debit', 'credit'],
    ['transaction date', 'description', 'amount'],
    ['value date', 'transaction details', 'withdrawal', 'deposit'],
    ['posting date', 'particulars', 'dr', 'cr'],
    ['trans date', 'details', 'debit', 'credit'],
    ['date', 'reference', 'description', 'debit', 'credit'],
    ['serial', 'date', 'description', 'amount'],
    ['transaction date', 'transaction id', 'narration', 'amount debit', 'amount credit', 'current balance']
  ];
  
  // Find header row more accurately
  for (let i = 0; i < Math.min(rawData.length, 15); i++) {
    const row = rawData[i];
    if (row && Array.isArray(row) && row.length >= 3) {
      const rowStr = row.join('|').toLowerCase().replace(/\s+/g, ' ');
      
      for (const pattern of headerPatterns) {
        const matchCount = pattern.filter(term => rowStr.includes(term)).length;
        if (matchCount >= 2) {
          headerRow = i;
          break;
        }
      }
      
      if (headerRow !== -1) break;
    }
  }
  
  if (headerRow === -1) {
    console.log('No clear header found, using first row as header');
    headerRow = 0;
  }
  
  const headers = rawData[headerRow] ? rawData[headerRow].map(h => String(h || '').toLowerCase().trim()) : [];
  console.log('Detected headers:', headers);
  
  // Enhanced column mapping
  const dateCol = findColumnIndex(headers, ['date', 'transaction date', 'value date', 'trans date', 'posting date', 'trans_date']);
  const descCol = findColumnIndex(headers, ['description', 'narration', 'details', 'transaction details', 'particulars', 'remark', 'memo']);
  const debitCol = findColumnIndex(headers, ['debit', 'withdrawal', 'out', 'amount out', 'dr', 'debits', 'withdraw', 'amount debit']);
  const creditCol = findColumnIndex(headers, ['credit', 'deposit', 'in', 'amount in', 'cr', 'credits', 'deposit', 'amount credit']);
  const amountCol = findColumnIndex(headers, ['amount', 'transaction amount', 'value', 'total']);
  const balanceCol = findColumnIndex(headers, ['balance', 'running balance', 'available balance', 'book balance', 'current balance']);
  const referenceCol = findColumnIndex(headers, ['reference', 'ref', 'transaction ref', 'txn ref']);
  
  console.log('Column mappings:', { dateCol, descCol, debitCol, creditCol, amountCol, balanceCol, referenceCol });
  
  // Process data rows
  for (let i = headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !Array.isArray(row) || row.length < 2) continue;
    
    const dateStr = row[dateCol];
    const description = row[descCol];
    const debitAmount = parseAmount(row[debitCol]);
    const creditAmount = parseAmount(row[creditCol]);
    const singleAmount = parseAmount(row[amountCol]);
    const balance = parseAmount(row[balanceCol]);
    const reference = row[referenceCol];
    
    // Skip empty rows
    if (!dateStr && !description && debitAmount === 0 && creditAmount === 0 && singleAmount === 0) continue;
    
    let amount = 0;
    let type: 'income' | 'expense' = 'expense';
    
    // STRICT debit/credit classification - ignore keywords for proper classification
    if (debitAmount > 0) {
      amount = debitAmount;
      type = 'expense'; // ALL debit transactions are expenses
    } else if (creditAmount > 0) {
      amount = creditAmount;
      type = 'income'; // ALL credit transactions are income
    } else if (singleAmount > 0) {
      // For single amount columns, check if it's negative (expense) or positive (income)
      amount = Math.abs(singleAmount);
      // Use description keywords only for single amount columns as fallback
      type = determineTransactionType(String(description || ''), singleAmount);
    }
    
    // Only add valid transactions
    if (amount > 0 && (dateStr || description)) {
      const formattedDate = formatDate(dateStr);
      const cleanDescription = String(description || 'Transaction').trim();
      
      transactions.push({
        date: formattedDate,
        description: cleanDescription,
        originalDescription: cleanDescription,
        amount: amount,
        type: type,
        balance: balance,
        category: categorizeTransaction(cleanDescription),
        reference: reference ? String(reference) : undefined
      });
    }
  }
  
  console.log(`Successfully extracted ${transactions.length} transactions from Excel`);
  return transactions;
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
  
  // Handle different number formats
  let str = String(value).replace(/[₦,\s$£€\(\)]/g, '');
  
  // Handle negative numbers in parentheses
  if (String(value).includes('(') && String(value).includes(')')) {
    str = '-' + str.replace(/[\(\)]/g, '');
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
};

const formatDate = (dateValue: any): string => {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  
  try {
    // Handle Excel serial dates
    if (typeof dateValue === 'number' && dateValue > 1000) {
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // Handle string dates
    const dateStr = String(dateValue).trim();
    
    // Try direct parsing first
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
    
    // Try DD/MM/YYYY format
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      if (year > 1900 && month <= 12 && day <= 31) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
  } catch (e) {
    console.warn('Date parsing error:', e);
  }
  
  return new Date().toISOString().split('T')[0];
};

const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase();
  
  const categories = {
    'Salary': ['salary', 'wage', 'pay', 'payroll', 'stipend'],
    'Business Income': ['transfer in', 'payment received', 'deposit', 'receipt', 'commission received'],
    'Food & Groceries': ['grocery', 'food', 'restaurant', 'supermarket', 'meal', 'dining'],
    'Transportation': ['fuel', 'transport', 'uber', 'taxi', 'bus', 'fare', 'petrol', 'diesel'],
    'Utilities': ['electric', 'electricity', 'water', 'internet', 'phone', 'airtime', 'data', 'cable'],
    'Bank Charges': ['charge', 'fee', 'commission', 'levy', 'service', 'maintenance', 'sms'],
    'Cash Withdrawal': ['atm', 'withdrawal', 'cash', 'withdraw'],
    'Shopping': ['shopping', 'store', 'mall', 'purchase', 'buy'],
    'Healthcare': ['hospital', 'medical', 'doctor', 'pharmacy', 'health'],
    'Education': ['school', 'tuition', 'education', 'training', 'course'],
    'Entertainment': ['entertainment', 'movie', 'cinema', 'game', 'fun'],
    'Insurance': ['insurance', 'policy', 'premium', 'cover'],
    'Loan & Credit': ['loan', 'credit', 'repayment', 'installment', 'emi'],
    'Investment': ['investment', 'stock', 'bond', 'mutual fund', 'saving']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return category;
    }
  }
  
  return 'Uncategorized';
};

export const mapTransactionType = (type: string): 'income' | 'expense' => {
  const normalizedType = type.toLowerCase().trim();
  
  if (['income', 'revenue', 'earning', 'profit', 'credit'].includes(normalizedType)) {
    return 'income';
  }
  
  return 'expense';
};

export const calculateSummary = TransactionSummaryCalculator.calculate;

export const exportToCSV = (transactions: Transaction[]): string => {
  const headers = 'Date,Description,Amount,Category,Type,Balance,Reference';
  const rows = transactions.map(tx => 
    `"${tx.date}","${tx.description}",${tx.amount},"${tx.category}","${tx.type}",${tx.balance || ''},"${tx.reference || ''}"`
  );
  return [headers, ...rows].join('\n');
};
