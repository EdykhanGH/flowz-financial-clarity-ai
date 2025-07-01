
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
      // Use CDN as primary source
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js';
      console.log('PDF worker initialized successfully with CDN worker');
      this.workerInitialized = true;
    } catch (error) {
      console.warn('CDN worker failed, trying alternative');
      
      // Fallback to alternative CDN
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
        console.log('PDF worker initialized with alternative CDN');
        this.workerInitialized = true;
      } catch (fallbackError) {
        console.error('All worker initialization methods failed');
        throw new Error('Failed to initialize PDF worker');
      }
    }
  }
}

// Enhanced transaction extraction with better parsing
export class BankStatementExtractor {
  // Nigerian bank statement patterns
  private static readonly NIGERIAN_PATTERNS = [
    // Main pattern: "2025 Jun 12 14:25:32 12 Jun 2025 Airtime -100.00 12,220.40 E-Channel 250612100100217741337727"
    /(\d{4}\s+[A-Za-z]{3}\s+\d{1,2})\s+(\d{1,2}:\d{2}:\d{2})\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([A-Za-z-]+)\s+(\d+)/g,
    
    // Alternative patterns
    /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)\s+([\d,]+\.?\d*)/g,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)/g
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
          
          // Filter and sort text items with proper type checking
          const textItems = textContent.items
            .filter((item: any) => {
              // Type guard to check if item is TextItem
              return 'str' in item && item.str && item.str.trim().length > 0;
            })
            .sort((a: any, b: any) => {
              // Sort by Y position (top to bottom) then X position (left to right)
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
      const transactions = this.parseTransactionsFromText(allText);
      
      console.log(`Successfully extracted ${transactions.length} clean transactions`);
      return transactions;
      
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error(`Failed to extract PDF: ${error.message}`);
    }
  }

  private static parseTransactionsFromText(text: string): any[] {
    const transactions: any[] = [];
    console.log('Starting transaction parsing from extracted text');
    
    // Split text into lines and process each line
    const lines = text.split('\n').filter(line => line.trim().length > 20);
    console.log(`Processing ${lines.length} lines for transactions`);
    
    for (const line of lines) {
      const cleanLine = line.trim();
      
      // Skip header lines and irrelevant content
      if (this.isHeaderOrIrrelevant(cleanLine)) {
        continue;
      }
      
      // Try Nigerian bank statement pattern first
      const nigerianMatch = this.extractNigerianTransaction(cleanLine);
      if (nigerianMatch) {
        transactions.push(nigerianMatch);
        continue;
      }
      
      // Try other patterns
      const genericMatch = this.extractGenericTransaction(cleanLine);
      if (genericMatch) {
        transactions.push(genericMatch);
      }
    }
    
    // Clean and deduplicate transactions
    return this.cleanAndDeduplicateTransactions(transactions);
  }

  private static extractNigerianTransaction(line: string): any | null {
    // Pattern: "2025 Jun 12 14:25:32 12 Jun 2025 Airtime -100.00 12,220.40 E-Channel 250612100100217741337727"
    const pattern = /(\d{4}\s+[A-Za-z]{3}\s+\d{1,2})\s+\d{1,2}:\d{2}:\d{2}\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([A-Za-z-]+)\s+(\d+)/;
    
    const match = line.match(pattern);
    if (!match) return null;
    
    const [, , dateStr, description, amountStr, balanceStr, channel, reference] = match;
    
    return {
      date: this.formatDate(dateStr),
      description: this.cleanDescription(description),
      amount: Math.abs(this.parseAmount(amountStr)),
      type: this.determineTransactionType(description, amountStr),
      category: this.categorizeTransaction(description),
      balance: this.parseAmount(balanceStr),
      channel: channel || 'Unknown',
      reference: reference || ''
    };
  }

  private static extractGenericTransaction(line: string): any | null {
    // Try simpler patterns for other bank formats
    const patterns = [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)/,
      /([A-Za-z]{3}\s+\d{1,2})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)/
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
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
  }

  private static isHeaderOrIrrelevant(line: string): boolean {
    const lowerLine = line.toLowerCase();
    const irrelevantPatterns = [
      'statement', 'account', 'balance', 'period', 'opening', 'closing',
      'total', 'summary', 'page', 'continued', 'bank', 'address', 'phone',
      'email', 'website', 'branch', 'sort code', 'bvn', 'customer', 'name'
    ];
    
    return irrelevantPatterns.some(pattern => lowerLine.includes(pattern)) ||
           line.length < 20 ||
           !/\d/.test(line) ||
           line.split(' ').length < 3;
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

  private static cleanAndDeduplicateTransactions(transactions: any[]): any[] {
    // Filter out invalid transactions
    const validTransactions = transactions.filter(tx => 
      tx && 
      tx.date && 
      tx.description && 
      tx.description.length > 2 &&
      tx.amount > 0 &&
      !tx.description.toLowerCase().includes('balance') &&
      !tx.description.toLowerCase().includes('total')
    );
    
    // Remove duplicates based on date, amount, and description
    const unique = validTransactions.filter((transaction, index, self) => {
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
