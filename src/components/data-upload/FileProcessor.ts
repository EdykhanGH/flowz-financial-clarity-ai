
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
}

export const parseExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
      resolve(jsonData);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
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
        
        // Parse Nigerian bank statement text format
        const transactions = parseNigerianBankStatement(fullText);
        resolve(transactions);
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

const parseNigerianBankStatement = (text: string): any[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const transactions: any[] = [];
  
  // Common Nigerian bank statement patterns
  const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/;
  const amountPattern = /₦?([\d,]+\.?\d*)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip header lines and empty lines
    if (line.includes('Date') || line.includes('Description') || line.includes('Amount') || line.length < 10) {
      continue;
    }
    
    const dateMatch = line.match(datePattern);
    const amountMatches = line.match(new RegExp(amountPattern.source, 'g'));
    
    if (dateMatch && amountMatches) {
      const date = dateMatch[1];
      const description = line.replace(datePattern, '').replace(/₦?[\d,]+\.?\d*/g, '').trim();
      
      // Get the last amount match (usually the balance) and second to last (transaction amount)
      const transactionAmount = amountMatches.length > 1 ? 
        parseFloat(amountMatches[amountMatches.length - 2].replace(/[₦,]/g, '')) :
        parseFloat(amountMatches[0].replace(/[₦,]/g, ''));
      
      // Determine transaction type based on common Nigerian banking terms
      let type = 'expense';
      const upperDescription = description.toUpperCase();
      
      if (upperDescription.includes('CREDIT') || 
          upperDescription.includes('SALARY') || 
          upperDescription.includes('TRANSFER IN') ||
          upperDescription.includes('DEPOSIT')) {
        type = 'income';
      } else if (upperDescription.includes('DEBIT') || 
                 upperDescription.includes('WITHDRAWAL') || 
                 upperDescription.includes('TRANSFER OUT') ||
                 upperDescription.includes('PAYMENT')) {
        type = 'expense';
      }
      
      transactions.push({
        date: date,
        description: description,
        amount: transactionAmount,
        type: type,
        category: 'Uncategorized'
      });
    }
  }
  
  return transactions;
};

export const parseFile = async (file: File): Promise<any[]> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
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
