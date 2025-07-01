
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

    const income = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const expenses = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const amounts = transactions.map(tx => Math.abs(tx.amount));
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(tx.amount);
    });

    // Type breakdown
    const typeBreakdown: Record<string, number> = {};
    transactions.forEach(tx => {
      typeBreakdown[tx.type] = (typeBreakdown[tx.type] || 0) + Math.abs(tx.amount);
    });

    // Monthly breakdown
    const monthlyBreakdown: Record<string, { income: number; expenses: number; net: number }> = {};
    transactions.forEach(tx => {
      const month = new Date(tx.date).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = { income: 0, expenses: 0, net: 0 };
      }
      
      if (tx.type === 'income') {
        monthlyBreakdown[month].income += Math.abs(tx.amount);
      } else {
        monthlyBreakdown[month].expenses += Math.abs(tx.amount);
      }
      
      monthlyBreakdown[month].net = monthlyBreakdown[month].income - monthlyBreakdown[month].expenses;
    });

    return {
      totalTransactions: transactions.length,
      totalRevenue: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      profit: income,
      cost: expenses,
      avgTransactionAmount: avgAmount,
      largestTransaction: Math.max(...amounts),
      smallestTransaction: Math.min(...amounts),
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
