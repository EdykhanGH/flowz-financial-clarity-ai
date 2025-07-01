
export interface TransactionSummary {
  totalTransactions: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  profit: number;
  cost: number;
  avgTransactionAmount: number;
  largestTransaction: number;
  smallestTransaction: number;
  transactionsByCategory: Record<string, number>;
  transactionsByType: Record<string, number>;
  monthlyBreakdown: Record<string, { income: number; expenses: number; net: number }>;
}

export class TransactionSummaryCalculator {
  static calculate(transactions: any[]): TransactionSummary {
    if (!transactions || transactions.length === 0) {
      return this.getEmptySummary();
    }

    // Separate income and expense transactions more accurately
    const incomeTransactions = transactions.filter(tx => {
      const type = tx.type?.toLowerCase() || '';
      const desc = (tx.description?.toLowerCase() || '').trim();
      
      // Check explicit type first
      if (type === 'income') return true;
      if (type === 'expense') return false;
      
      // Check description keywords for income indicators
      const incomeKeywords = [
        'credit', 'deposit', 'salary', 'payment received', 'transfer in',
        'interest', 'dividend', 'bonus', 'refund', 'reversal', 'inward',
        'received', 'incoming', 'credit alert', 'pay', 'wage', 'receipt'
      ];
      
      return incomeKeywords.some(keyword => desc.includes(keyword));
    });

    const expenseTransactions = transactions.filter(tx => {
      const type = tx.type?.toLowerCase() || '';
      const desc = (tx.description?.toLowerCase() || '').trim();
      
      // Check explicit type first
      if (type === 'expense') return true;
      if (type === 'income') return false;
      
      // Check description keywords for expense indicators
      const expenseKeywords = [
        'debit', 'withdrawal', 'payment', 'charge', 'fee', 'purchase',
        'atm', 'pos', 'outward', 'airtime', 'bill', 'fuel', 'grocery',
        'shopping', 'commission', 'levy', 'debit alert', 'transfer out'
      ];
      
      return expenseKeywords.some(keyword => desc.includes(keyword));
    });

    // Calculate totals with proper absolute values
    const totalIncome = incomeTransactions.reduce((sum, tx) => {
      const amount = parseFloat(tx.amount) || 0;
      return sum + Math.abs(amount);
    }, 0);

    const totalExpenses = expenseTransactions.reduce((sum, tx) => {
      const amount = parseFloat(tx.amount) || 0;
      return sum + Math.abs(amount);
    }, 0);

    // Calculate other metrics
    const amounts = transactions.map(tx => Math.abs(parseFloat(tx.amount) || 0)).filter(amt => amt > 0);
    const avgAmount = amounts.length > 0 ? amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length : 0;

    // Enhanced category breakdown
    const categoryBreakdown: Record<string, number> = {};
    transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      const amount = Math.abs(parseFloat(tx.amount) || 0);
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + amount;
    });

    // Enhanced type breakdown
    const typeBreakdown: Record<string, number> = {};
    transactions.forEach(tx => {
      const type = tx.type || 'Unknown';
      const amount = Math.abs(parseFloat(tx.amount) || 0);
      typeBreakdown[type] = (typeBreakdown[type] || 0) + amount;
    });

    // Monthly breakdown with proper date parsing
    const monthlyBreakdown: Record<string, { income: number; expenses: number; net: number }> = {};
    transactions.forEach(tx => {
      try {
        const date = new Date(tx.date);
        if (isNaN(date.getTime())) return;
        
        const month = date.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyBreakdown[month]) {
          monthlyBreakdown[month] = { income: 0, expenses: 0, net: 0 };
        }
        
        const amount = Math.abs(parseFloat(tx.amount) || 0);
        const type = tx.type?.toLowerCase() || '';
        
        if (type === 'income' || incomeTransactions.includes(tx)) {
          monthlyBreakdown[month].income += amount;
        } else {
          monthlyBreakdown[month].expenses += amount;
        }
        
        monthlyBreakdown[month].net = monthlyBreakdown[month].income - monthlyBreakdown[month].expenses;
      } catch (error) {
        console.warn('Error processing transaction date:', error);
      }
    });

    return {
      totalTransactions: transactions.length,
      totalRevenue: totalIncome,
      totalExpenses: totalExpenses,
      netIncome: totalIncome - totalExpenses,
      profit: totalIncome,
      cost: totalExpenses,
      avgTransactionAmount: avgAmount,
      largestTransaction: amounts.length > 0 ? Math.max(...amounts) : 0,
      smallestTransaction: amounts.length > 0 ? Math.min(...amounts) : 0,
      transactionsByCategory: categoryBreakdown,
      transactionsByType: typeBreakdown,
      monthlyBreakdown
    };
  }

  private static getEmptySummary(): TransactionSummary {
    return {
      totalTransactions: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      profit: 0,
      cost: 0,
      avgTransactionAmount: 0,
      largestTransaction: 0,
      smallestTransaction: 0,
      transactionsByCategory: {},
      transactionsByType: {},
      monthlyBreakdown: {}
    };
  }
}
