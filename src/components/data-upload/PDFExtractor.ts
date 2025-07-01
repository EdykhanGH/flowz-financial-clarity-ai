
import * as pdfjsLib from 'pdfjs-dist';

// Enhanced PDF Worker Manager with better error handling
class EnhancedPDFWorkerManager {
  private static workerInitialized = false;
  private static initializationPromise: Promise<void> | null = null;

  static async initializeWorker(): Promise<void> {
    if (this.workerInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.setupWorker();
    await this.initializationPromise;
  }

  private static async setupWorker(): Promise<void> {
    try {
      // Use the bundled worker from pdfjs-dist
      const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString();
      
      console.log('PDF worker initialized successfully with bundled worker');
      this.workerInitialized = true;
    } catch (error) {
      console.warn('Bundled worker failed, using inline worker');
      
      // Create inline worker as fallback
      const workerCode = `
        importScripts('https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js');
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      
      console.log('PDF worker initialized with inline worker');
      this.workerInitialized = true;
    }
  }
}

// Enhanced transaction extraction with better parsing
export class BankStatementExtractor {
  // More specific patterns for Nigerian bank statements
  private static readonly TRANSACTION_PATTERNS = [
    // Pattern 1: Full Nigerian bank format with timestamp
    /(\d{4}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{1,2}:\d{2}:\d{2})\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+([^+-]+?)\s+([-+]?[\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([A-Za-z-]+)\s+(\d+)/g,
    
    // Pattern 2: Date with description and amount
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)/g,
    
    // Pattern 3: Nigerian format with transfer details
    /(\d{4}\s+[A-Za-z]{3}\s+\d{1,2})\s+.*?([A-Za-z][^+-]+?)\s+([-+][\d,]+\.?\d*)\s+([\d,]+\.?\d*)/g,
    
    // Pattern 4: Simple date amount pattern
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[\s\S]*?([-+]?[\d,]+\.\d{2})/g
  ];

  private static readonly INCOME_KEYWORDS = [
    'transfer from', 'credit', 'deposit', 'salary', 'payment received',
    'interest', 'dividend', 'bonus', 'refund', 'reversal', 'inward',
    'received', 'incoming', 'credit alert', 'pay', 'wage', 'receipt'
  ];

  private static readonly EXPENSE_KEYWORDS = [
    'airtime', 'electricity', 'debit', 'withdrawal', 'transfer to', 'payment',
    'charge', 'fee', 'purchase', 'atm', 'pos', 'outward', 'bill', 'fuel',
    'grocery', 'shopping', 'commission', 'levy', 'debit alert'
  ];

  static async extractFromPDF(file: File): Promise<any[]> {
    try {
      console.log('Starting enhanced PDF extraction for:', file.name);
      
      await EnhancedPDFWorkerManager.initializeWorker();
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        verbosity: 0
      }).promise;
      
      console.log(`PDF loaded: ${pdf.numPages} pages`);
      
      let allText = '';
      
      // Extract text from all pages with better structure preservation
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Sort text items by position to maintain order
          const textItems = textContent.items
            .filter((item: any) => item.str && item.str.trim().length > 0)
            .sort((a: any, b: any) => {
              const yDiff = Math.abs(b.transform[5] - a.transform[5]);
              if (yDiff > 5) return b.transform[5] - a.transform[5];
              return a.transform[4] - b.transform[4];
            });
          
          // Group text items by lines based on Y position
          const lines: string[] = [];
          let currentLine = '';
          let lastY = -1;
          
          for (const item of textItems) {
            const y = Math.round(item.transform[5]);
            const text = item.str.trim();
            
            if (lastY !== -1 && Math.abs(y - lastY) > 5) {
              if (currentLine.trim()) {
                lines.push(currentLine.trim());
              }
              currentLine = text;
            } else {
              currentLine += (currentLine ? ' ' : '') + text;
            }
            lastY = y;
          }
          
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          
          allText += lines.join('\n') + '\n';
          console.log(`Page ${pageNum} extracted: ${lines.length} lines`);
        } catch (pageError) {
          console.warn(`Failed to extract page ${pageNum}:`, pageError);
        }
      }
      
      await pdf.destroy();
      
      if (allText.length < 50) {
        throw new Error('PDF appears to be empty or contains only scanned images. Please ensure the PDF contains selectable text.');
      }
      
      console.log(`Total text extracted: ${allText.length} characters`);
      
      // Parse transactions with enhanced cleaning
      const transactions = this.parseAndCleanTransactions(allText);
      
      console.log(`Successfully extracted ${transactions.length} clean transactions`);
      return transactions;
      
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error(`Failed to extract PDF: ${error.message}`);
    }
  }

  private static parseAndCleanTransactions(text: string): any[] {
    const transactions: any[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 10);
    
    console.log(`Processing ${lines.length} lines for clean transaction extraction`);
    
    for (const line of lines) {
      const cleanLine = line.trim();
      
      // Skip header lines and irrelevant content
      if (this.isHeaderOrIrrelevant(cleanLine)) {
        continue;
      }
      
      // Try to extract transaction from line
      const transaction = this.extractCleanTransaction(cleanLine);
      if (transaction && this.validateTransaction(transaction)) {
        transactions.push(transaction);
      }
    }
    
    // Remove duplicates and sort
    return this.deduplicateAndSort(transactions);
  }

  private static extractCleanTransaction(line: string): any | null {
    try {
      // Pattern for Nigerian bank statement format
      // Example: "2025 Jun 12 14:25:32 12 Jun 2025 Airtime -100.00 12,220.40 E-Channel 250612100100217741337727"
      const nigerianPattern = /(\d{4}\s+[A-Za-z]{3}\s+\d{1,2})\s+\d{1,2}:\d{2}:\d{2}\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([A-Za-z-]+)\s+(\d+)/;
      
      let match = line.match(nigerianPattern);
      
      if (match) {
        const [, dateStr1, dateStr2, description, amountStr, balanceStr, channel, reference] = match;
        
        return {
          date: this.formatDate(dateStr2 || dateStr1),
          description: this.cleanDescription(description),
          amount: Math.abs(this.parseAmount(amountStr)),
          type: this.determineTransactionType(description, amountStr),
          category: this.categorizeTransaction(description),
          balance: this.parseAmount(balanceStr),
          channel: channel,
          reference: reference
        };
      }
      
      // Try simpler patterns
      const simplePatterns = [
        /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)/,
        /([A-Za-z]{3}\s+\d{1,2})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)/
      ];
      
      for (const pattern of simplePatterns) {
        match = line.match(pattern);
        if (match) {
          const [, dateStr, description, amountStr] = match;
          
          return {
            date: this.formatDate(dateStr),
            description: this.cleanDescription(description),
            amount: Math.abs(this.parseAmount(amountStr)),
            type: this.determineTransactionType(description, amountStr),
            category: this.categorizeTransaction(description),
            balance: 0,
            channel: 'Unknown',
            reference: ''
          };
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error parsing transaction line:', error);
      return null;
    }
  }

  private static isHeaderOrIrrelevant(line: string): boolean {
    const lowerLine = line.toLowerCase();
    const irrelevantPatterns = [
      'statement', 'account', 'balance', 'period', 'opening', 'closing',
      'total', 'summary', 'page', 'continued', 'bank', 'address', 'phone',
      'email', 'website', 'branch', 'sort code', 'bvn', 'customer'
    ];
    
    return irrelevantPatterns.some(pattern => lowerLine.includes(pattern)) ||
           line.length < 20 ||
           !/\d/.test(line) ||
           line.split(' ').length < 3;
  }

  private static validateTransaction(transaction: any): boolean {
    return transaction.date && 
           transaction.description && 
           transaction.description.length > 2 &&
           transaction.amount > 0 &&
           !transaction.description.toLowerCase().includes('balance') &&
           !transaction.description.toLowerCase().includes('total');
  }

  private static formatDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    try {
      // Handle "12 Jun 2025" format
      if (dateStr.includes(' ')) {
        const parts = dateStr.split(' ');
        if (parts.length === 3) {
          const day = parts[0];
          const month = parts[1];
          const year = parts[2];
          
          const monthMap: { [key: string]: string } = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          
          const monthNum = monthMap[month];
          if (monthNum) {
            return `${year}-${monthNum}-${day.padStart(2, '0')}`;
          }
        }
      }
      
      // Handle DD/MM/YYYY format
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        if (year > 1900 && month <= 12 && day <= 31) {
          const fullYear = year < 100 ? 2000 + year : year;
          return `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
      
      // Try direct parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('Date parsing error:', error);
    }
    
    return new Date().toISOString().split('T')[0];
  }

  private static cleanDescription(desc: string): string {
    if (!desc) return 'Transaction';
    
    return desc
      .replace(/[^\w\s\-\.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50);
  }

  private static parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    
    const cleaned = amountStr.replace(/[^\d\.\-\+]/g, '').replace(/,/g, '');
    const amount = parseFloat(cleaned);
    
    return isNaN(amount) ? 0 : Math.abs(amount);
  }

  private static determineTransactionType(description: string, amountStr: string): 'income' | 'expense' {
    const desc = description.toLowerCase();
    const isNegative = amountStr.includes('-');
    
    // Check for income keywords
    if (this.INCOME_KEYWORDS.some(keyword => desc.includes(keyword))) {
      return 'income';
    }
    
    // Check for expense keywords
    if (this.EXPENSE_KEYWORDS.some(keyword => desc.includes(keyword))) {
      return 'expense';
    }
    
    // Use sign as fallback (negative usually means expense in bank statements)
    return isNegative ? 'expense' : 'income';
  }

  private static categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();
    
    const categories = {
      'Utilities': ['airtime', 'electricity', 'internet', 'phone', 'data', 'water'],
      'Transportation': ['fuel', 'transport', 'uber', 'taxi', 'bus'],
      'Food & Groceries': ['grocery', 'food', 'restaurant', 'supermarket'],
      'Bank Charges': ['charge', 'fee', 'commission', 'levy', 'service'],
      'Cash Withdrawal': ['atm', 'withdrawal', 'cash'],
      'Salary': ['salary', 'wage', 'pay'],
      'Business Income': ['transfer from', 'payment received', 'deposit'],
      'Shopping': ['shopping', 'store', 'purchase']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    return 'Uncategorized';
  }

  private static deduplicateAndSort(transactions: any[]): any[] {
    // Remove duplicates based on date, amount, and description
    const unique = transactions.filter((transaction, index, self) => {
      return index === self.findIndex(t => 
        t.date === transaction.date &&
        Math.abs(t.amount - transaction.amount) < 0.01 &&
        t.description.toLowerCase() === transaction.description.toLowerCase()
      );
    });
    
    // Sort by date (newest first)
    return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
