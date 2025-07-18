import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from 'date-fns';

export interface ExpenseAnalysisResult {
  totalCosts: number;
  costsByCategory: Array<{ category: string; amount: number; percentage: number }>;
  costTypeBreakdown: Array<{ type: string; amount: number; percentage: number }>;
  costNatureBreakdown: Array<{ nature: string; amount: number; percentage: number }>;
  trends: Array<{ date: string; amount: number }>;
  insights: string[];
}

export interface ProfitAnalysisResult {
  totalProfit: number;
  grossProfit: number;
  netProfit: number;
  grossProfitMargin: number;
  netProfitMargin: number;
  breakEvenDays: number;
  marginOfSafety: number;
  contributionMargin: number;
  trends: Array<{ date: string; revenue: number; expenses: number; profit: number }>;
  insights: string[];
}

export interface ProductAnalysisResult {
  productPerformance: Array<{
    name: string;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
    units: number;
    avgPrice: number;
  }>;
  inventoryTurnover: Array<{
    name: string;
    turnoverRate: number;
    stockValue: number;
    daysInStock: number;
  }>;
  priceTrends: Array<{ date: string; [productName: string]: any }>;
  insights: string[];
}

class AnalyticsService {
  async calculateExpenseAnalysis(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    filters: { costCenterId?: string; category?: string } = {}
  ): Promise<ExpenseAnalysisResult> {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          transaction_classifications(cost_type, cost_nature)
        `)
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (filters.costCenterId) {
        query = query.eq('cost_center_id', filters.costCenterId);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data: transactions, error } = await query;
      if (error) throw error;

      const totalCosts = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Calculate costs by category
      const categoryMap = new Map<string, number>();
      transactions?.forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Number(t.amount));
      });

      const costsByCategory = Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalCosts > 0 ? (amount / totalCosts) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);

      // Calculate cost type breakdown
      const costTypeMap = new Map<string, number>();
      transactions?.forEach(t => {
        const costType = t.transaction_classifications?.[0]?.cost_type || 'unclassified';
        const current = costTypeMap.get(costType) || 0;
        costTypeMap.set(costType, current + Number(t.amount));
      });

      const costTypeBreakdown = Array.from(costTypeMap.entries()).map(([type, amount]) => ({
        type,
        amount,
        percentage: totalCosts > 0 ? (amount / totalCosts) * 100 : 0
      }));

      // Calculate cost nature breakdown
      const costNatureMap = new Map<string, number>();
      transactions?.forEach(t => {
        const costNature = t.transaction_classifications?.[0]?.cost_nature || 'unclassified';
        const current = costNatureMap.get(costNature) || 0;
        costNatureMap.set(costNature, current + Number(t.amount));
      });

      const costNatureBreakdown = Array.from(costNatureMap.entries()).map(([nature, amount]) => ({
        nature,
        amount,
        percentage: totalCosts > 0 ? (amount / totalCosts) * 100 : 0
      }));

      // Calculate daily trends
      const dailyTrends = new Map<string, number>();
      transactions?.forEach(t => {
        const date = t.date;
        const current = dailyTrends.get(date) || 0;
        dailyTrends.set(date, current + Number(t.amount));
      });

      const trends = Array.from(dailyTrends.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Generate insights
      const insights = this.generateExpenseInsights(costsByCategory, costTypeBreakdown, totalCosts);

      return {
        totalCosts,
        costsByCategory,
        costTypeBreakdown,
        costNatureBreakdown,
        trends,
        insights
      };
    } catch (error) {
      console.error('Error calculating expense analysis:', error);
      throw error;
    }
  }

  async calculateProfitAnalysis(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ProfitAnalysisResult> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_classifications(cost_type, cost_nature)
        `)
        .eq('user_id', userId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      const revenue = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const expenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const directCosts = transactions?.filter(t => 
        t.type === 'expense' && t.transaction_classifications?.[0]?.cost_nature === 'direct'
      ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const fixedCosts = transactions?.filter(t => 
        t.type === 'expense' && t.transaction_classifications?.[0]?.cost_type === 'fixed'
      ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const variableCosts = transactions?.filter(t => 
        t.type === 'expense' && t.transaction_classifications?.[0]?.cost_type === 'variable'
      ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const grossProfit = revenue - directCosts;
      const netProfit = revenue - expenses;
      const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      const contributionMargin = revenue - variableCosts;

      // Break-even analysis
      const avgDailyRevenue = revenue / Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const breakEvenDays = avgDailyRevenue > 0 ? fixedCosts / avgDailyRevenue : 0;
      const marginOfSafety = revenue - fixedCosts;

      // Calculate trends
      const dailyData = new Map<string, { revenue: number; expenses: number }>();
      transactions?.forEach(t => {
        const date = t.date;
        const current = dailyData.get(date) || { revenue: 0, expenses: 0 };
        if (t.type === 'income') {
          current.revenue += Number(t.amount);
        } else {
          current.expenses += Number(t.amount);
        }
        dailyData.set(date, current);
      });

      const trends = Array.from(dailyData.entries())
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          expenses: data.expenses,
          profit: data.revenue - data.expenses
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const insights = this.generateProfitInsights(grossProfitMargin, netProfitMargin, breakEvenDays);

      return {
        totalProfit: netProfit,
        grossProfit,
        netProfit,
        grossProfitMargin,
        netProfitMargin,
        breakEvenDays,
        marginOfSafety,
        contributionMargin,
        trends,
        insights
      };
    } catch (error) {
      console.error('Error calculating profit analysis:', error);
      throw error;
    }
  }

  async calculateProductAnalysis(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ProductAnalysisResult> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_classifications(cost_type, cost_nature)
        `)
        .eq('user_id', userId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .not('product_name', 'is', null);

      if (error) throw error;

      // Group by product
      const productMap = new Map<string, {
        revenue: number;
        costs: number;
        units: number;
        totalPrice: number;
        priceCount: number;
      }>();

      transactions?.forEach(t => {
        const productName = t.product_name!;
        const current = productMap.get(productName) || {
          revenue: 0,
          costs: 0,
          units: 0,
          totalPrice: 0,
          priceCount: 0
        };

        if (t.type === 'income') {
          current.revenue += Number(t.amount);
          current.units += t.quantity || 0;
          if (t.unit_price) {
            current.totalPrice += t.unit_price;
            current.priceCount += 1;
          }
        } else if (t.type === 'expense' && t.transaction_classifications?.[0]?.cost_nature === 'direct') {
          current.costs += Number(t.amount);
        }

        productMap.set(productName, current);
      });

      const productPerformance = Array.from(productMap.entries()).map(([name, data]) => ({
        name,
        revenue: data.revenue,
        costs: data.costs,
        profit: data.revenue - data.costs,
        margin: data.revenue > 0 ? ((data.revenue - data.costs) / data.revenue) * 100 : 0,
        units: data.units,
        avgPrice: data.priceCount > 0 ? data.totalPrice / data.priceCount : 0
      })).sort((a, b) => b.profit - a.profit);

      // Calculate inventory turnover (simplified)
      const inventoryTurnover = productPerformance.map(product => ({
        name: product.name,
        turnoverRate: product.units / 30, // Daily average
        stockValue: product.costs,
        daysInStock: product.units > 0 ? 30 : 0 // Simplified calculation
      }));

      // Price trends (simplified)
      const priceTrends: Array<{ date: string; [productName: string]: any }> = [];

      const insights = this.generateProductInsights(productPerformance);

      return {
        productPerformance,
        inventoryTurnover,
        priceTrends,
        insights
      };
    } catch (error) {
      console.error('Error calculating product analysis:', error);
      throw error;
    }
  }

  private generateExpenseInsights(
    costsByCategory: Array<{ category: string; amount: number; percentage: number }>,
    costTypeBreakdown: Array<{ type: string; amount: number; percentage: number }>,
    totalCosts: number
  ): string[] {
    const insights: string[] = [];

    if (costsByCategory.length > 0) {
      const topCategory = costsByCategory[0];
      if (topCategory.percentage > 40) {
        insights.push(`Your highest expense category (${topCategory.category}) represents ${topCategory.percentage.toFixed(1)}% of total costs. Consider reviewing this area for potential savings.`);
      }
    }

    const fixedCosts = costTypeBreakdown.find(c => c.type === 'fixed');
    if (fixedCosts && fixedCosts.percentage > 70) {
      insights.push(`High fixed costs (${fixedCosts.percentage.toFixed(1)}%) may reduce flexibility. Consider strategies to convert some fixed costs to variable.`);
    }

    if (totalCosts > 0) {
      insights.push('Regular expense monitoring and categorization helps identify cost optimization opportunities.');
    }

    return insights;
  }

  private generateProfitInsights(
    grossProfitMargin: number,
    netProfitMargin: number,
    breakEvenDays: number
  ): string[] {
    const insights: string[] = [];

    if (netProfitMargin > 15) {
      insights.push('Excellent profit margins! Your business is performing well above industry standards.');
    } else if (netProfitMargin > 5) {
      insights.push('Healthy profit margins with room for improvement. Focus on cost optimization and revenue growth.');
    } else {
      insights.push('Profit margins are below recommended levels. Urgent attention needed for cost reduction and revenue optimization.');
    }

    if (breakEvenDays > 0) {
      if (breakEvenDays <= 15) {
        insights.push(`Quick break-even period (${Math.round(breakEvenDays)} days) indicates strong cash flow.`);
      } else if (breakEvenDays <= 30) {
        insights.push(`Moderate break-even period (${Math.round(breakEvenDays)} days). Monitor cash flow carefully.`);
      } else {
        insights.push(`Extended break-even period (${Math.round(breakEvenDays)} days) may indicate cash flow challenges.`);
      }
    }

    return insights;
  }

  private generateProductInsights(
    productPerformance: Array<{
      name: string;
      profit: number;
      margin: number;
      revenue: number;
    }>
  ): string[] {
    const insights: string[] = [];

    if (productPerformance.length > 0) {
      const topProduct = productPerformance[0];
      insights.push(`${topProduct.name} is your top-performing product with ${topProduct.margin.toFixed(1)}% margin.`);
      
      const unprofitableProducts = productPerformance.filter(p => p.profit < 0);
      if (unprofitableProducts.length > 0) {
        insights.push(`${unprofitableProducts.length} product(s) showing losses. Consider pricing review or discontinuation.`);
      }
    }

    return insights;
  }

  async refreshAnalyticsData(userId: string): Promise<void> {
    // This would trigger recalculation of analytics metrics
    const endDate = new Date();
    const startDate = subMonths(endDate, 3); // Last 3 months

    try {
      // Generate analytics for missing days
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd');
        
        // Check if analytics already exist
        const { data: existing } = await supabase
          .from('analytics_metrics')
          .select('id')
          .eq('user_id', userId)
          .eq('metric_date', dateStr)
          .maybeSingle();

        if (!existing) {
          // Calculate and insert analytics for this date
          await this.calculateAndInsertDailyAnalytics(userId, dateStr);
        }
      }
    } catch (error) {
      console.error('Error refreshing analytics data:', error);
      throw error;
    }
  }

  private async calculateAndInsertDailyAnalytics(userId: string, date: string): Promise<void> {
    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_classifications(cost_type, cost_nature)
      `)
      .eq('user_id', userId)
      .eq('date', date);

    if (!transactions || transactions.length === 0) return;

    const revenue = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const directCosts = transactions.filter(t => 
      t.type === 'expense' && t.transaction_classifications?.[0]?.cost_nature === 'direct'
    ).reduce((sum, t) => sum + Number(t.amount), 0);
    const fixedCosts = transactions.filter(t => 
      t.type === 'expense' && t.transaction_classifications?.[0]?.cost_type === 'fixed'
    ).reduce((sum, t) => sum + Number(t.amount), 0);
    const variableCosts = transactions.filter(t => 
      t.type === 'expense' && t.transaction_classifications?.[0]?.cost_type === 'variable'
    ).reduce((sum, t) => sum + Number(t.amount), 0);
    const indirectCosts = transactions.filter(t => 
      t.type === 'expense' && t.transaction_classifications?.[0]?.cost_nature === 'indirect'
    ).reduce((sum, t) => sum + Number(t.amount), 0);

    await supabase
      .from('analytics_metrics')
      .insert({
        user_id: userId,
        metric_date: date,
        total_revenue: revenue,
        total_expenses: expenses,
        gross_profit: revenue - directCosts,
        net_profit: revenue - expenses,
        fixed_costs: fixedCosts,
        variable_costs: variableCosts,
        direct_costs: directCosts,
        indirect_costs: indirectCosts,
        transaction_count: transactions.length
      });
  }
}

export const analyticsService = new AnalyticsService();