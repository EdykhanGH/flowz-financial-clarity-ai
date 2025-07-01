
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
      // Try local worker first
      const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString();
      
      // Test with a simple PDF
      await this.testWorker();
      console.log('PDF worker initialized successfully');
      this.workerInitialized = true;
    } catch (error) {
      console.warn('Local worker failed, trying CDN fallback');
      
      // Fallback to CDN
      const cdnUrls = [
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js',
        'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js'
      ];
      
      for (const url of cdnUrls) {
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = url;
          await this.testWorker();
          console.log(`PDF worker initialized with CDN: ${url}`);
          this.workerInitialized = true;
          return;
        } catch (cdnError) {
          console.warn(`CDN ${url} failed:`, cdnError);
        }
      }
      
      throw new Error('All PDF worker initialization methods failed');
    }
  }

  private static async testWorker(): Promise<void> {
    const testPDF = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34,
      0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a
    ]);
    
    const doc = await pdfjsLib.getDocument({ 
      data: testPDF,
      verbosity: 0 
    }).promise;
    await doc.destroy();
  }
}

// Enhanced transaction extraction patterns
export class BankStatementExtractor {
  private static readonly TRANSACTION_PATTERNS = [
    // Pattern 1: DD/MM/YYYY format with description and amount
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+([^\d\-\+]{3,50}?)\s+([-+]?[\d,]+\.?\d*)/g,
    
    // Pattern 2: YYYY-MM-DD format
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\s+([^\d\-\+]{3,50}?)\s+([-+]?[\d,]+\.?\d*)/g,
    
    // Pattern 3: With time stamps
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(\d{1,2}:\d{2}:\d{2})?\s*([^\d\-\+]{3,50}?)\s+([-+]?[\d,]+\.?\d*)/g,
    
    // Pattern 4: Month name format (01 Jan 2024)
    /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+([^\d\-\+]{3,50}?)\s+([-+]?[\d,]+\.?\d*)/g,
    
    // Pattern 5: With debit/credit columns
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+([^\d\-\+]{3,80}?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/g,
    
    // Pattern 6: Nigerian bank format with reference
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\s+([^\d\-\+]{5,100}?)\s+([-+]?[\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([A-Z0-9]{6,20})/g,
    
    // Pattern 7: Table format with pipes or tabs
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[\s\|]+([^\d\-\+\|]{3,50}?)[\s\|]+([-+]?[\d,]+\.?\d*)[\s\|]*([\d,]+\.?\d*)?/g,
    
    // Pattern 8: Loose pattern for missed transactions
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[\s\S]{1,150}?([\d,]+\.\d{2})/g
  ];

  private static readonly HEADER_PATTERNS = [
    /date.*description.*amount/i,
    /trans.*date.*details/i,
    /posting.*date.*narration/i,
    /value.*date.*particulars/i,
    /date.*transaction.*balance/i,
    /serial.*date.*description/i
  ];

  private static readonly INCOME_KEYWORDS = [
    'credit', 'deposit', 'transfer in', 'salary', 'payment received',
    'interest', 'dividend', 'bonus', 'refund', 'reversal', 'inward',
    'received', 'incoming', 'credit alert', 'pay', 'wage'
  ];

  private static readonly EXPENSE_KEYWORDS = [
    'debit', 'withdrawal', 'transfer out', 'payment', 'charge', 'fee',
    'purchase', 'atm', 'pos', 'outward', 'airtime', 'bill', 'fuel',
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
      const pageTexts: string[] = [];
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Enhanced text extraction with positioning
          const textItems = textContent.items
            .filter((item: any) => item.str && item.str.trim().length > 0)
            .sort((a: any, b: any) => {
              // Sort by Y position (top to bottom), then X position (left to right)
              const yDiff = Math.abs(b.transform[5] - a.transform[5]);
              if (yDiff > 2) return b.transform[5] - a.transform[5];
              return a.transform[4] - b.transform[4];
            });
          
          const pageText = textItems
            .map((item: any) => item.str.trim())
            .join(' ')
            .replace(/\s+/g, ' ');
          
          pageTexts.push(pageText);
          allText += pageText + '\n';
          
          console.log(`Page ${pageNum} extracted: ${pageText.length} characters`);
        } catch (pageError) {
          console.warn(`Failed to extract page ${pageNum}:`, pageError);
        }
      }
      
      await pdf.destroy();
      
      if (allText.length < 100) {
        throw new Error('PDF appears to be empty or contains only scanned images. Please ensure the PDF contains selectable text.');
      }
      
      console.log(`Total text extracted: ${allText.length} characters`);
      
      // Process extracted text
      const transactions = this.parseTransactions(allText);
      
      if (transactions.length === 0) {
        // Try processing each page separately
        console.log('No transactions found in combined text, trying page-by-page extraction');
        for (const pageText of pageTexts) {
          const pageTransactions = this.parseTransactions(pageText);
          transactions.push(...pageTransactions);
        }
      }
      
      console.log(`Successfully extracted ${transactions.length} transactions`);
      return this.deduplicateAndSort(transactions);
      
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error(`Failed to extract PDF: ${error.message}`);
    }
  }

  private static parseTransactions(text: string): any[] {
    const transactions: any[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 5);
    
    console.log(`Processing ${lines.length} lines for transactions`);
    
    // Skip header lines
    const filteredLines = lines.filter(line => {
      const lowerLine = line.toLowerCase();
      return !this.HEADER_PATTERNS.some(pattern => pattern.test(lowerLine));
    });
    
    // Try each pattern on the full text
    for (let patternIndex = 0; patternIndex < this.TRANSACTION_PATTERNS.length; patternIndex++) {
      const pattern = this.TRANSACTION_PATTERNS[patternIndex];
      const matches = [...text.matchAll(pattern)];
      
      console.log(`Pattern ${patternIndex + 1} found ${matches.length} matches`);
      
      for (const match of matches) {
        try {
          const transaction = this.parseTransactionMatch(match, patternIndex);
          if (transaction && this.validateTransaction(transaction)) {
            transactions.push(transaction);
          }
        } catch (error) {
          console.warn('Failed to parse match:', error);
        }
      }
    }
    
    // Line-by-line processing for missed transactions
    for (const line of filteredLines) {
      if (line.length < 15) continue;
      
      for (let patternIndex = 0; patternIndex < this.TRANSACTION_PATTERNS.length; patternIndex++) {
        const pattern = this.TRANSACTION_PATTERNS[patternIndex];
        const match = line.match(pattern);
        
        if (match) {
          try {
            const transaction = this.parseTransactionMatch(match, patternIndex);
            if (transaction && this.validateTransaction(transaction)) {
              transactions.push(transaction);
            }
            break; // Found a match, no need to try other patterns
          } catch (error) {
            continue;
          }
        }
      }
    }
    
    return transactions;
  }

  private static parseTransactionMatch(match: RegExpMatchArray, patternIndex: number): any | null {
    try {
      let date = '';
      let description = '';
      let amount = 0;
      let balance = 0;
      let reference = '';
      
      switch (patternIndex) {
        case 0: // DD/MM/YYYY format
        case 1: // YYYY-MM-DD format
        case 3: // Month name format
          date = this.formatDate(match[1]);
          description = this.cleanDescription(match[2]);
          amount = this.parseAmount(match[3]);
          break;
          
        case 2: // With timestamps
          date = this.formatDate(match[1]);
          description = this.cleanDescription(match[3]);
          amount = this.parseAmount(match[4]);
          break;
          
        case 4: // Debit/Credit columns
          date = this.formatDate(match[1]);
          description = this.cleanDescription(match[2]);
          const debit = this.parseAmount(match[3]);
          const credit = this.parseAmount(match[4]);
          amount = credit > 0 ? credit : debit;
          break;
          
        case 5: // Nigerian format with reference
          date = this.formatDate(match[1]);
          description = this.cleanDescription(match[2]);
          amount = this.parseAmount(match[3]);
          balance = this.parseAmount(match[4]);
          reference = match[5];
          break;
          
        case 6: // Table format
          date = this.formatDate(match[1]);
          description = this.cleanDescription(match[2]);
          amount = this.parseAmount(match[3]);
          if (match[4]) balance = this.parseAmount(match[4]);
          break;
          
        case 7: // Loose pattern
          date = this.formatDate(match[1]);
          description = 'Transaction';
          amount = this.parseAmount(match[2]);
          break;
          
        default:
          return null;
      }
      
      if (!date || !amount || amount <= 0) return null;
      
      const type = this.determineTransactionType(description);
      const category = this.categorizeTransaction(description);
      
      return {
        date,
        description,
        originalDescription: match[2] || description,
        amount,
        balance,
        reference,
        type,
        category
      };
    } catch (error) {
      console.warn('Error parsing transaction match:', error);
      return null;
    }
  }

  private static validateTransaction(transaction: any): boolean {
    return transaction.date && 
           transaction.description && 
           transaction.description.length > 2 &&
           transaction.amount > 0 &&
           transaction.description !== 'Transaction';
  }

  private static formatDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    try {
      // Handle different date formats
      const cleanDate = dateStr.replace(/[^\d\/\-\.\s\w]/g, '');
      const date = new Date(cleanDate);
      
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      // Try parsing DD/MM/YYYY format
      const parts = cleanDate.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        if (year > 1900 && month <= 12 && day <= 31) {
          const parsedDate = new Date(year, month - 1, day);
          return parsedDate.toISOString().split('T')[0];
        }
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
      .substring(0, 100);
  }

  private static parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    
    const cleaned = amountStr.replace(/[^\d\.\-\+]/g, '').replace(/,/g, '');
    const amount = parseFloat(cleaned);
    
    return isNaN(amount) ? 0 : Math.abs(amount);
  }

  private static determineTransactionType(description: string): 'income' | 'expense' {
    const desc = description.toLowerCase();
    
    if (this.INCOME_KEYWORDS.some(keyword => desc.includes(keyword))) {
      return 'income';
    }
    
    if (this.EXPENSE_KEYWORDS.some(keyword => desc.includes(keyword))) {
      return 'expense';
    }
    
    return 'expense'; // Default to expense
  }

  private static categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();
    
    // Category mapping
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
  }

  private static deduplicateAndSort(transactions: any[]): any[] {
    // Remove duplicates based on date, amount, and description
    const unique = transactions.filter((transaction, index, self) => {
      return index === self.findIndex(t => 
        t.date === transaction.date &&
        t.amount === transaction.amount &&
        t.description === transaction.description
      );
    });
    
    // Sort by date (newest first)
    return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
