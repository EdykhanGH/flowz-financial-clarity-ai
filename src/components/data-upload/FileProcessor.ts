
import * as XLSX from 'xlsx';
import { BankStatementExtractor } from './PDFExtractor';
import { TransactionSummaryCalculator } from './TransactionSummaryCalculator';

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

export const parseFile = async (file: File): Promise<any[]> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  console.log('Parsing file:', file.name, 'Extension:', fileExtension, 'Size:', file.size);
  
  if (file.size === 0) {
    throw new Error('File is empty. Please select a valid file.');
  }
  
  if (file.size > 100 * 1024 * 1024) {
    throw new Error('File is too large. Please select a file smaller than 100MB.');
  }
  
  switch (fileExtension) {
    case 'pdf':
      return BankStatementExtractor.extractFromPDF(file);
    case 'csv':
    case 'xls':
    case 'xlsx':
      return parseExcel(file);
    default:
      throw new Error('Unsupported file format. Please upload PDF, CSV, XLS, or XLSX files.');
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
      if (['CREDIT', 'DEPOSIT', 'TRANSFER IN', 'SALARY', 'PAYMENT RECEIVED'].some(keyword => upperDescription.includes(keyword))) {
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
  
  try {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
  } catch (e) {
    // Continue with other parsing methods
  }
  
  return new Date().toISOString().split('T')[0];
};

const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase();
  
  const categories = {
    'Food & Groceries': ['grocery', 'food', 'restaurant', 'supermarket'],
    'Transportation': ['fuel', 'transport', 'uber', 'taxi', 'bus'],
    'Utilities': ['electric', 'water', 'internet', 'phone', 'airtime', 'data'],
    'Bank Charges': ['charge', 'fee', 'commission', 'levy', 'service'],
    'Cash Withdrawal': ['atm', 'withdrawal', 'cash'],
    'Salary': ['salary', 'wage', 'pay'],
    'Business Income': ['transfer', 'payment received', 'deposit']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return category;
    }
  }
  
  return 'Uncategorized';
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

export const calculateSummary = TransactionSummaryCalculator.calculate;

export const exportToCSV = (transactions: Transaction[]): string => {
  const headers = 'Date,Description,Amount,Category,Type,Balance';
  const rows = transactions.map(tx => 
    `"${tx.date}","${tx.description}",${tx.amount},${tx.category},${tx.type},${tx.balance || ''}`
  );
  return [headers, ...rows].join('\n');
};
