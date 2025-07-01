import * as pdfjsLib from 'pdfjs-dist';

// Enhanced type definitions for better PDF processing
interface TextItem {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
  fontName?: string;
  dir?: string;
  hasEOL?: boolean;
}

interface TextMarkedContent {
  type: string;
}

// Enhanced type guard with additional validation
function isTextItem(item: any): item is TextItem {
  return item && 
         typeof item.str === 'string' && 
         Array.isArray(item.transform) && 
         item.transform.length >= 6 &&
         item.str.trim().length > 0;
}

// Enhanced PDF Worker Manager with better error handling and fallbacks
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
    const workerSources = [
      // Primary CDN sources
      'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js',
      // Alternative version fallback
      'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
      // JSDeliver fallback
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js'
    ];

    for (const workerSrc of workerSources) {
      try {
        console.log(`Attempting to initialize PDF worker with: ${workerSrc}`);
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        
        // Test the worker by creating a simple document
        const testBuffer = new Uint8Array([
          0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3
        ]);
        
        await pdfjsLib.getDocument({ data: testBuffer }).promise;
        console.log(`PDF worker initialized successfully with: ${workerSrc}`);
        this.workerInitialized = true;
        return;
      } catch (error) {
        console.warn(`Failed to initialize worker with ${workerSrc}:`, error);
        continue;
      }
    }
    
    throw new Error('All PDF worker initialization methods failed. Please check your internet connection and try again.');
  }
}

// Enhanced transaction extraction with improved cleaning and validation
export class BankStatementExtractor {
  // Enhanced Nigerian bank statement patterns with more comprehensive regex
  private static readonly TRANSACTION_PATTERNS = [
    // Pattern 1: "2025 Jun 12 14:25:32 12 Jun 2025 Airtime -100.00 12,220.40 E-Channel 250612100100217741337727"
    /(\d{4}\s+[A-Za-z]{3}\s+\d{1,2})\s+(\d{1,2}:\d{2}:\d{2})\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([A-Za-z-]+)\s+(\d+)/g,
    
    // Pattern 2: Date Transaction Description Amount Balance
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)\s+([\d,]+\.?\d*)/g,
    
    // Pattern 3: DD MMM YYYY Transaction Amount
    /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)/g,
    
    // Pattern 4: Timestamp Transaction Amount Balance Channel
    /(\d{2}:\d{2}:\d{2})\s+([^+-\d]+?)\s+([-+]?[\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([A-Za-z-]+)/g
  ];

  private static readonly INCOME_KEYWORDS = [
    'transfer from', 'credit', 'deposit', 'salary', 'payment received',
    'interest', 'dividend', 'bonus', 'refund', 'reversal', 'inward',
    'received', 'incoming', 'credit alert', 'pay', 'wage', 'receipt',
    'income', 'earning', 'profit', 'revenue', 'commission received'
  ];

  private static readonly EXPENSE_KEYWORDS = [
    'airtime', 'electricity', 'debit', 'withdrawal', 'transfer to', 'payment',
    'charge', 'fee', 'purchase', 'atm', 'pos', 'outward', 'bill', 'fuel',
    'grocery', 'shopping', 'commission', 'levy', 'debit alert', 'subscription',
    'insurance', 'loan', 'rent', 'utilities', 'transport', 'medical'
  ];

  static async extractFromPDF(file: File): Promise<any[]> {
    try {
      console.log('Starting enhanced PDF extraction pipeline for:', file.name);
      
      // Initialize PDF worker with multiple fallbacks
      await EnhancedPDFWorkerManager.initializeWorker();
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Enhanced PDF loading options
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        verbosity: 0,
        cMapPacked: true,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/cmaps/',
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/standard_fonts/'
      });
      
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded successfully: ${pdf.numPages} pages`);
      
      let allExtractedText = '';
      const extractedData = [];
      
      // Enhanced text extraction from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`Processing page ${pageNum}/${pdf.numPages}`);
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Enhanced filtering with proper type guards - filter first, then assert type
          const validTextItems: TextItem[] = textContent.items
            .filter(isTextItem)
            .filter((item: TextItem) => item.str.trim().length > 0);
          
          // Sort by position (top to bottom, left to right)
          const sortedItems = validTextItems.sort((a: TextItem, b: TextItem) => {
            const yDiff = Math.abs(b.transform[5] - a.transform[5]);
            if (yDiff > 5) return b.transform[5] - a.transform[5];
            return a.transform[4] - b.transform[4];
          });
          
          // Group text items by lines based on Y position
          const lines = this.groupTextIntoLines(sortedItems);
          
          // Add to overall text extraction
          allExtractedText += lines.join('\n') + '\n';
          
          console.log(`Page ${pageNum} extracted: ${lines.length} lines`);
        } catch (pageError) {
          console.warn(`Failed to extract page ${pageNum}:`, pageError);
        }
      }
      
      await pdf.destroy();
      
      if (allExtractedText.length < 50) {
        throw new Error('PDF appears to be empty or contains only scanned images. Please ensure the PDF contains selectable text or try converting to Excel/CSV format.');
      }
      
      console.log(`Total text extracted: ${allExtractedText.length} characters`);
      
      // Enhanced transaction parsing pipeline
      const cleanedTransactions = this.processExtractedText(allExtractedText);
      
      console.log(`Successfully extracted and cleaned ${cleanedTransactions.length} transactions`);
      return cleanedTransactions;
      
    } catch (error) {
      console.error('PDF extraction pipeline failed:', error);
      throw new Error(`Failed to extract PDF: ${error.message}`);
    }
  }

  private static groupTextIntoLines(sortedItems: TextItem[]): string[] {
    const lines: string[] = [];
    let currentLine = '';
    let lastY = -1;
    
    for (const item of sortedItems) {
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
    
    return lines;
  }

  private static processExtractedText(text: string): any[] {
    console.log('Starting enhanced transaction processing pipeline');
    
    // Split text into lines and clean
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10); // Filter out very short lines
    
    console.log(`Processing ${lines.length} lines for transaction extraction`);
    
    const extractedTransactions = [];
    
    // Process each line for transaction patterns
    for (const line of lines) {
      // Skip header lines and irrelevant content
      if (this.isHeaderOrIrrelevantLine(line)) {
        continue;
      }
      
      // Try each pattern to extract transaction
      const transaction = this.extractTransactionFromLine(line);
      if (transaction) {
        extractedTransactions.push(transaction);
      }
    }
    
    // Clean, validate and deduplicate transactions
    return this.cleanAndValidateTransactions(extractedTransactions);
  }

  private static extractTransactionFromLine(line: string): any | null {
    // Try each transaction pattern
    for (const pattern of this.TRANSACTION_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex state
      const match = pattern.exec(line);
      
      if (match) {
        return this.parseTransactionMatch(match, line);
      }
    }
    
    return null;
  }

  private static parseTransactionMatch(match: RegExpExecArray, originalLine: string): any {
    // Parse based on match groups - adapt based on pattern matched
    let date = '';
    let description = '';
    let amountStr = '';
    let balanceStr = '';
    let channel = '';
    let reference = '';
    
    if (match.length >= 8) {
      // Full pattern match
      date = match[3] || match[1]; // Use value date or transaction date
      description = match[4] || '';
      amountStr = match[5] || '';
      balanceStr = match[6] || '';
      channel = match[7] || 'Unknown';
      reference = match[8] || '';
    } else if (match.length >= 4) {
      // Basic pattern match
      date = match[1] || '';
      description = match[2] || '';
      amountStr = match[3] || '';
      balanceStr = match[4] || '';
    }
    
    const amount = this.parseAmount(amountStr);
    if (amount === 0) return null; // Skip zero amount transactions
    
    return {
      date: this.formatDate(date),
      description: this.cleanDescription(description),
      originalDescription: description,
      amount: amount,
      type: this.determineTransactionType(description, amountStr),
      category: this.categorizeTransaction(description),
      balance: this.parseAmount(balanceStr),
      channel: channel || 'Unknown',
      reference: reference || '',
      originalLine: originalLine
    };
  }

  private static isHeaderOrIrrelevantLine(line: string): boolean {
    const lowerLine = line.toLowerCase();
    
    // Skip common header patterns
    const headerPatterns = [
      'statement', 'account', 'balance', 'period', 'opening', 'closing',
      'total', 'summary', 'page', 'continued', 'bank', 'address', 'phone',
      'email', 'website', 'branch', 'sort code', 'bvn', 'customer', 'name',
      'transaction date', 'value date', 'description', 'debit', 'credit',
      'running balance', 'brought forward', 'carried forward'
    ];
    
    const hasHeaderPattern = headerPatterns.some(pattern => lowerLine.includes(pattern));
    const tooShort = line.length < 15;
    const noNumbers = !/\d/.test(line);
    const tooFewWords = line.split(' ').length < 3;
    
    return hasHeaderPattern || tooShort || noNumbers || tooFewWords;
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
      .substring(0, 100); // Increased length for better descriptions
  }

  private static parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    
    // Remove currency symbols and formatting
    const cleaned = amountStr
      .replace(/[₦$£€,\s]/g, '')
      .replace(/[()]/g, '')
      .trim();
    
    if (!cleaned) return 0;
    
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : Math.abs(amount);
  }

  private static determineTransactionType(description: string, amountStr: string): 'income' | 'expense' {
    const desc = description.toLowerCase();
    const isNegative = amountStr.includes('-');
    
    // Check for explicit income keywords
    if (this.INCOME_KEYWORDS.some(keyword => desc.includes(keyword))) {
      return 'income';
    }
    
    // Check for explicit expense keywords
    if (this.EXPENSE_KEYWORDS.some(keyword => desc.includes(keyword))) {
      return 'expense';
    }
    
    // Use sign as fallback (negative usually means expense in bank statements)
    return isNegative ? 'expense' : 'income';
  }

  private static categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();
    
    const categories = {
      'Salary': ['salary', 'wage', 'pay', 'payroll', 'stipend', 'allowance'],
      'Business Income': ['transfer from', 'payment received', 'deposit', 'receipt', 'commission received', 'invoice'],
      'Food & Groceries': ['grocery', 'food', 'restaurant', 'supermarket', 'meal', 'dining', 'cafe'],
      'Transportation': ['fuel', 'transport', 'uber', 'taxi', 'bus', 'fare', 'petrol', 'diesel', 'parking'],
      'Utilities': ['electric', 'electricity', 'water', 'internet', 'phone', 'airtime', 'data', 'cable', 'gas'],
      'Bank Charges': ['charge', 'fee', 'commission', 'levy', 'service', 'maintenance', 'sms', 'interest'],
      'Cash Withdrawal': ['atm', 'withdrawal', 'cash', 'withdraw', 'cash out'],
      'Shopping': ['shopping', 'store', 'mall', 'purchase', 'buy', 'retail'],
      'Healthcare': ['hospital', 'medical', 'doctor', 'pharmacy', 'health', 'clinic'],
      'Education': ['school', 'tuition', 'education', 'training', 'course', 'university'],
      'Entertainment': ['entertainment', 'movie', 'cinema', 'game', 'fun', 'recreation'],
      'Insurance': ['insurance', 'policy', 'premium', 'cover', 'assurance'],
      'Loan & Credit': ['loan', 'credit', 'repayment', 'installment', 'emi', 'mortgage'],
      'Investment': ['investment', 'stock', 'bond', 'mutual fund', 'saving', 'dividend']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    return 'Uncategorized';
  }

  private static cleanAndValidateTransactions(transactions: any[]): any[] {
    console.log(`Starting validation of ${transactions.length} extracted transactions`);
    
    // Filter out invalid transactions
    const validTransactions = transactions.filter(tx => {
      if (!tx || !tx.date || !tx.description || tx.amount <= 0) return false;
      if (tx.description.length < 3) return false;
      if (tx.description.toLowerCase().includes('balance')) return false;
      if (tx.description.toLowerCase().includes('total')) return false;
      if (tx.description.toLowerCase().includes('summary')) return false;
      return true;
    });
    
    console.log(`${validTransactions.length} transactions passed validation`);
    
    // Remove duplicates based on date, amount, and description similarity
    const uniqueTransactions = validTransactions.filter((transaction, index, self) => {
      return index === self.findIndex(t => 
        t.date === transaction.date &&
        Math.abs(t.amount - transaction.amount) < 0.01 &&
        this.calculateStringSimilarity(t.description.toLowerCase(), transaction.description.toLowerCase()) > 0.8
      );
    });
    
    console.log(`${uniqueTransactions.length} unique transactions after deduplication`);
    
    // Sort by date (newest first)
    const sortedTransactions = uniqueTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Add transaction IDs
    return sortedTransactions.map((tx, index) => ({
      ...tx,
      id: `extracted_${Date.now()}_${index}`
    }));
  }

  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.calculateEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static calculateEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}
