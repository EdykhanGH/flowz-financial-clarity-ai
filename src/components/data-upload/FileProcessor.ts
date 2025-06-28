
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  
  // Find header row
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (row && Array.isArray(row)) {
      const rowStr = row.join('').toLowerCase();
      if (rowStr.includes('date') && (rowStr.includes('description') || rowStr.includes('narration') || rowStr.includes('details'))) {
        headerRow = i;
        break;
      }
    }
  }
  
  if (headerRow === -1) return transactions;
  
  const headers = rawData[headerRow].map(h => String(h || '').toLowerCase().trim());
  const dateCol = findColumnIndex(headers, ['date', 'transaction date', 'value date']);
  const descCol = findColumnIndex(headers, ['description', 'narration', 'details', 'transaction details']);
  const debitCol = findColumnIndex(headers, ['debit', 'withdrawal', 'out', 'amount out']);
  const creditCol = findColumnIndex(headers, ['credit', 'deposit', 'in', 'amount in']);
  const balanceCol = findColumnIndex(headers, ['balance', 'running balance', 'available balance']);
  
  // Process data rows
  for (let i = headerRow + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !Array.isArray(row)) continue;
    
    const dateStr = row[dateCol];
    const description = row[descCol];
    const debitAmount = parseAmount(row[debitCol]);
    const creditAmount = parseAmount(row[creditCol]);
    const balance = parseAmount(row[balanceCol]);
    
    if (dateStr && description && (debitAmount > 0 || creditAmount > 0)) {
      const amount = debitAmount > 0 ? debitAmount : creditAmount;
      const type = debitAmount > 0 ? 'expense' : 'income';
      
      transactions.push({
        date: formatDate(dateStr),
        description: String(description).trim(),
        amount: amount,
        type: type,
        balance: balance,
        category: categorizeTransaction(String(description))
      });
    }
  }
  
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
  const str = String(value).replace(/[₦,\s]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const formatDate = (dateValue: any): string => {
  if (!dateValue) return '';
  
  // Handle Excel serial dates
  if (typeof dateValue === 'number' && dateValue > 1000) {
    const date = new Date((dateValue - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  // Handle string dates
  const dateStr = String(dateValue);
  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const match = dateStr.match(datePattern);
  
  if (match) {
    let [, day, month, year] = match;
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateStr;
};

export const parsePDF = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e: any) => {
      try {
        const arrayBuffer = e.target.result;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        console.log('Extracted PDF text:', fullText.substring(0, 500) + '...');
        
        // Parse Nigerian bank statement text format
        const transactions = parseNigerianBankStatement(fullText);
        console.log('Parsed transactions:', transactions);
        resolve(transactions);
      } catch (error) {
        console.error('PDF parsing error:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};

const parseNigerianBankStatement = (text: string): any[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const transactions: any[] = [];
  
  // Enhanced patterns for Nigerian banks
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/i,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/
  ];
  
  const amountPattern = /₦?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  
  // Skip header and account info lines
  const relevantLines = lines.filter(line => {
    const lower = line.toLowerCase();
    return !lower.includes('account number') && 
           !lower.includes('statement period') && 
           !lower.includes('opening balance') && 
           !lower.includes('closing balance') &&
           !lower.includes('page ') &&
           line.trim().length > 15; // Skip very short lines
  });
  
  console.log('Relevant lines:', relevantLines.slice(0, 10));
  
  for (let i = 0; i < relevantLines.length; i++) {
    const line = relevantLines[i].trim();
    
    // Try to find date in the line
    let dateMatch = null;
    let matchedPattern = null;
    
    for (const pattern of datePatterns) {
      dateMatch = line.match(pattern);
      if (dateMatch) {
        matchedPattern = pattern;
        break;
      }
    }
    
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const amountMatches = Array.from(line.matchAll(amountPattern));
      
      if (amountMatches && amountMatches.length > 0) {
        // Remove date and amounts to get description
        let description = line
          .replace(matchedPattern, '')
          .replace(/₦?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, '')
          .trim()
          .replace(/\s+/g, ' ');
        
        // Clean up description
        description = description
          .replace(/^[\/\-\s]+|[\/\-\s]+$/g, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        
        if (description && amountMatches.length > 0) {
          // Usually the transaction amount is the first or second amount
          // The last amount is typically the balance
          const transactionAmount = parseFloat(
            amountMatches[0][1].replace(/,/g, '')
          );
          
          const balance = amountMatches.length > 1 ? 
            parseFloat(amountMatches[amountMatches.length - 1][1].replace(/,/g, '')) : 
            null;
          
          // Determine transaction type
          let type = 'expense';
          const upperDescription = description.toUpperCase();
          const creditKeywords = ['CREDIT', 'SALARY', 'TRANSFER IN', 'DEPOSIT', 'PAYMENT RECEIVED', 'INWARD'];
          const debitKeywords = ['DEBIT', 'WITHDRAWAL', 'TRANSFER OUT', 'PAYMENT', 'CHARGE', 'FEE'];
          
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
  
  // Sort by date
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return transactions;
};

const categorizeTransaction = (description: string): string => {
  const desc = description.toUpperCase();
  
  // Income categories
  if (desc.includes('SALARY') || desc.includes('PAY')) return 'Salary';
  if (desc.includes('TRANSFER IN') || desc.includes('PAYMENT RECEIVED')) return 'Business Income';
  
  // Expense categories
  if (desc.includes('GROCERY') || desc.includes('SUPERMARKET') || desc.includes('FOOD')) return 'Food & Groceries';
  if (desc.includes('FUEL') || desc.includes('TRANSPORT') || desc.includes('UBER') || desc.includes('TAXI')) return 'Transportation';
  if (desc.includes('ELECTRIC') || desc.includes('WATER') || desc.includes('UTILITY')) return 'Utilities';
  if (desc.includes('RENT') || desc.includes('MORTGAGE')) return 'Housing';
  if (desc.includes('HOSPITAL') || desc.includes('MEDICAL') || desc.includes('PHARMACY')) return 'Healthcare';
  if (desc.includes('SCHOOL') || desc.includes('EDUCATION') || desc.includes('TUITION')) return 'Education';
  if (desc.includes('BANK CHARGE') || desc.includes('FEE') || desc.includes('COMMISSION')) return 'Bank Charges';
  if (desc.includes('SAVINGS') || desc.includes('INVESTMENT')) return 'Savings & Investment';
  
  return 'Uncategorized';
};

export const parseFile = async (file: File): Promise<any[]> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  console.log('Parsing file:', file.name, 'Extension:', fileExtension);
  
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
