import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useBusinessContext } from './useBusinessContext';

export interface ForecastData {
  period: string;
  revenue: number;
  costs: number;
  profit: number;
  confidence: number; // 0-100
}

export interface ScenarioAnalysis {
  optimistic: ForecastData[];
  realistic: ForecastData[];
  pessimistic: ForecastData[];
}

export interface CostOptimization {
  category: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeframe: string;
  actions: string[];
}

export interface ProfitabilityInsight {
  segment: string;
  type: 'customer' | 'product' | 'channel';
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  trend: 'growing' | 'stable' | 'declining';
  recommendations: string[];
}

export interface AdvancedAnalytics {
  forecast: ScenarioAnalysis;
  costOptimizations: CostOptimization[];
  profitabilityInsights: ProfitabilityInsight[];
  kpis: {
    customerAcquisitionCost: number;
    customerLifetimeValue: number;
    monthlyRecurringRevenue: number;
    churnRate: number;
    grossMargin: number;
    operatingMargin: number;
    returnOnInvestment: number;
    cashConversionCycle: number;
  };
  benchmarks: {
    industry: string;
    grossMarginBenchmark: number;
    operatingMarginBenchmark: number;
    yourGrossMargin: number;
    yourOperatingMargin: number;
    performance: 'above' | 'at' | 'below';
  };
  alerts: AnalyticsAlert[];
}

export interface AnalyticsAlert {
  id: string;
  type: 'opportunity' | 'warning' | 'insight';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actions: string[];
  potentialValue?: number;
}

export const useAdvancedAnalytics = () => {
  const { transactions } = useTransactions();
  const { data: businessProfile } = useBusinessContext();

  const analytics = useMemo((): AdvancedAnalytics => {
    const now = new Date();
    const last12Months = transactions.filter(t => 
      new Date(t.date) >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    );

    // Generate forecasts
    const forecast = generateForecastScenarios(last12Months, businessProfile);
    
    // Identify cost optimization opportunities
    const costOptimizations = identifyCostOptimizations(last12Months);
    
    // Analyze profitability by segments
    const profitabilityInsights = analyzeProfitabilitySegments(last12Months);
    
    // Calculate advanced KPIs
    const kpis = calculateAdvancedKPIs(last12Months, businessProfile);
    
    // Industry benchmarking
    const benchmarks = getBenchmarks(last12Months, businessProfile);
    
    // Generate analytics alerts
    const alerts = generateAnalyticsAlerts({
      forecast,
      costOptimizations,
      profitabilityInsights,
      kpis,
      benchmarks
    });

    return {
      forecast,
      costOptimizations,
      profitabilityInsights,
      kpis,
      benchmarks,
      alerts
    };
  }, [transactions, businessProfile]);

  return analytics;
};

// Generate Multi-Scenario Forecasts
function generateForecastScenarios(transactions: any[], businessProfile: any): ScenarioAnalysis {
  const monthlyData = generateMonthlyData(transactions);
  const trend = calculateTrend(monthlyData);
  const seasonality = calculateSeasonality(monthlyData, businessProfile?.seasonalBusiness);
  
  const forecastPeriods = 12; // 12 months ahead
  const scenarios = {
    optimistic: [] as ForecastData[],
    realistic: [] as ForecastData[],
    pessimistic: [] as ForecastData[]
  };

  const baseGrowthRate = trend.revenue;
  const baseCostGrowthRate = trend.costs;

  for (let i = 1; i <= forecastPeriods; i++) {
    const month = new Date();
    month.setMonth(month.getMonth() + i);
    const period = month.toISOString().slice(0, 7);
    
    const seasonalFactor = getSeasonalFactor(month.getMonth(), seasonality);
    const lastRevenue = monthlyData[monthlyData.length - 1]?.revenue || 0;
    const lastCosts = monthlyData[monthlyData.length - 1]?.costs || 0;

    // Optimistic scenario (20% above base growth)
    const optimisticRevenue = lastRevenue * Math.pow(1 + baseGrowthRate * 1.2, i) * seasonalFactor;
    const optimisticCosts = lastCosts * Math.pow(1 + baseCostGrowthRate * 0.8, i); // Controlled cost growth
    
    scenarios.optimistic.push({
      period,
      revenue: optimisticRevenue,
      costs: optimisticCosts,
      profit: optimisticRevenue - optimisticCosts,
      confidence: Math.max(95 - i * 5, 60) // Decreasing confidence over time
    });

    // Realistic scenario (base growth)
    const realisticRevenue = lastRevenue * Math.pow(1 + baseGrowthRate, i) * seasonalFactor;
    const realisticCosts = lastCosts * Math.pow(1 + baseCostGrowthRate, i);
    
    scenarios.realistic.push({
      period,
      revenue: realisticRevenue,
      costs: realisticCosts,
      profit: realisticRevenue - realisticCosts,
      confidence: Math.max(90 - i * 3, 70)
    });

    // Pessimistic scenario (20% below base growth)
    const pessimisticRevenue = lastRevenue * Math.pow(1 + baseGrowthRate * 0.8, i) * seasonalFactor;
    const pessimisticCosts = lastCosts * Math.pow(1 + baseCostGrowthRate * 1.1, i); // Higher cost growth
    
    scenarios.pessimistic.push({
      period,
      revenue: pessimisticRevenue,
      costs: pessimisticCosts,
      profit: pessimisticRevenue - pessimisticCosts,
      confidence: Math.max(85 - i * 4, 65)
    });
  }

  return scenarios;
}

// Identify Cost Optimization Opportunities
function identifyCostOptimizations(transactions: any[]): CostOptimization[] {
  const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals = expenses.reduce((acc, t) => {
    const category = t.category || 'Other';
    acc[category] = (acc[category] || 0) + Number(t.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const optimizations: CostOptimization[] = [];
  const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  Object.entries(categoryTotals).forEach(([category, cost]) => {
    const categoryShare = cost / totalExpenses;
    
    // Focus on categories with significant spend
    if (categoryShare > 0.05) { // More than 5% of total expenses
      let savings = 0;
      let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      let timeframe = '3-6 months';
      let actions: string[] = [];

      switch (category.toLowerCase()) {
        case 'office rent':
        case 'rent':
          savings = Number(cost) * 0.15; // 15% potential savings
          difficulty = 'hard';
          timeframe = '6-12 months';
          actions = ['Renegotiate lease terms', 'Consider relocation', 'Optimize space usage'];
          break;
        
        case 'utilities':
        case 'electricity':
          savings = Number(cost) * 0.25; // 25% potential savings
          difficulty = 'easy';
          timeframe = '1-3 months';
          actions = ['Energy audit', 'LED lighting', 'Smart power management'];
          break;
        
        case 'telecommunications':
        case 'internet':
          savings = Number(cost) * 0.20; // 20% potential savings
          difficulty = 'easy';
          timeframe = '1 month';
          actions = ['Compare providers', 'Bundle services', 'Optimize plans'];
          break;
        
        case 'office supplies':
        case 'supplies':
          savings = Number(cost) * 0.30; // 30% potential savings
          difficulty = 'easy';
          timeframe = '1 month';
          actions = ['Bulk purchasing', 'Digital alternatives', 'Inventory management'];
          break;
        
        case 'professional services':
          savings = Number(cost) * 0.20; // 20% potential savings
          difficulty = 'medium';
          timeframe = '2-4 months';
          actions = ['Service audit', 'Competitive bidding', 'In-house alternatives'];
          break;
        
        default:
          savings = Number(cost) * 0.10; // 10% general optimization
          actions = ['Review spending patterns', 'Negotiate with suppliers', 'Explore alternatives'];
      }

      if (savings > 0) {
        optimizations.push({
          category,
          currentCost: Number(cost),
          optimizedCost: Number(cost) - savings,
          savings,
          savingsPercentage: (savings / Number(cost)) * 100,
          difficulty,
          timeframe,
          actions
        });
      }
    }
  });

  return optimizations.sort((a, b) => b.savings - a.savings);
}

// Analyze Profitability by Segments
function analyzeProfitabilitySegments(transactions: any[]): ProfitabilityInsight[] {
  const insights: ProfitabilityInsight[] = [];
  
  // Product-based profitability
  const productData = transactions.reduce((acc, t) => {
    const product = t.product_name || 'General';
    if (!acc[product]) acc[product] = { revenue: 0, costs: 0 };
    
    if (t.type === 'income') acc[product].revenue += Number(t.amount);
    if (t.type === 'expense') acc[product].costs += Number(t.amount);
    
    return acc;
  }, {} as Record<string, { revenue: number; costs: number }>);

  Object.entries(productData).forEach(([product, data]) => {
    if (data.revenue > 0 || data.costs > 0) {
      const profit = data.revenue - data.costs;
      const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
      
      insights.push({
        segment: product,
        type: 'product',
        revenue: data.revenue,
        costs: data.costs,
        profit,
        margin,
        trend: profit > 0 ? 'growing' : 'declining',
        recommendations: generateProfitabilityRecommendations(product, margin, profit)
      });
    }
  });

  return insights.sort((a, b) => b.profit - a.profit);
}

// Calculate Advanced KPIs
function calculateAdvancedKPIs(transactions: any[], businessProfile: any) {
  const revenues = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');
  
  const totalRevenue = revenues.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalCosts = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const grossProfit = totalRevenue - totalCosts;
  
  // Simplified KPI calculations (would be more sophisticated with complete data)
  return {
    customerAcquisitionCost: totalCosts > 0 ? totalCosts / Math.max(revenues.length, 1) : 0,
    customerLifetimeValue: totalRevenue > 0 ? totalRevenue / Math.max(revenues.length, 1) * 12 : 0,
    monthlyRecurringRevenue: totalRevenue / 12,
    churnRate: 5, // Would calculate from customer data
    grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    operatingMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0, // Simplified
    returnOnInvestment: totalCosts > 0 ? (grossProfit / totalCosts) * 100 : 0,
    cashConversionCycle: 30 // Would calculate from working capital data
  };
}

// Industry Benchmarking
function getBenchmarks(transactions: any[], businessProfile: any) {
  const category = businessProfile?.category || 'Services';
  const revenues = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');
  
  const totalRevenue = revenues.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalCosts = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const grossProfit = totalRevenue - totalCosts;
  
  const yourGrossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const yourOperatingMargin = yourGrossMargin; // Simplified

  // Industry benchmarks for Nigerian businesses
  const benchmarks: Record<string, { gross: number; operating: number }> = {
    'Manufacturing': { gross: 25, operating: 12 },
    'Services': { gross: 50, operating: 20 },
    'Retail': { gross: 30, operating: 8 },
    'Technology': { gross: 70, operating: 25 },
    'Food': { gross: 40, operating: 15 },
    'Healthcare': { gross: 60, operating: 18 },
    'Education': { gross: 65, operating: 22 },
    'Construction': { gross: 20, operating: 8 },
    'Agriculture': { gross: 35, operating: 12 }
  };

  const benchmark = benchmarks[category] || benchmarks['Services'];
  
  const performance: 'above' | 'at' | 'below' = 
    yourGrossMargin > benchmark.gross * 1.1 ? 'above' :
    yourGrossMargin < benchmark.gross * 0.9 ? 'below' : 'at';

  return {
    industry: category,
    grossMarginBenchmark: benchmark.gross,
    operatingMarginBenchmark: benchmark.operating,
    yourGrossMargin,
    yourOperatingMargin,
    performance
  };
}

// Helper Functions
function generateMonthlyData(transactions: any[]) {
  const monthlyData: Record<string, { revenue: number; costs: number }> = {};
  
  transactions.forEach(t => {
    const month = t.date.slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) monthlyData[month] = { revenue: 0, costs: 0 };
    
    if (t.type === 'income') monthlyData[month].revenue += Number(t.amount);
    if (t.type === 'expense') monthlyData[month].costs += Number(t.amount);
  });
  
  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));
}

function calculateTrend(monthlyData: any[]) {
  if (monthlyData.length < 2) return { revenue: 0, costs: 0 };
  
  const recentMonths = monthlyData.slice(-6); // Last 6 months
  const avgRevenue = recentMonths.reduce((sum, m) => sum + m.revenue, 0) / recentMonths.length;
  const avgCosts = recentMonths.reduce((sum, m) => sum + m.costs, 0) / recentMonths.length;
  
  const firstHalf = recentMonths.slice(0, 3);
  const secondHalf = recentMonths.slice(3);
  
  const firstHalfRevenue = firstHalf.reduce((sum, m) => sum + m.revenue, 0) / firstHalf.length;
  const secondHalfRevenue = secondHalf.reduce((sum, m) => sum + m.revenue, 0) / secondHalf.length;
  
  const revenueGrowth = firstHalfRevenue > 0 ? (secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue : 0;
  const costGrowth = 0.02; // Assume 2% monthly cost inflation
  
  return { revenue: revenueGrowth, costs: costGrowth };
}

function calculateSeasonality(monthlyData: any[], isSeasonal: boolean) {
  if (!isSeasonal || monthlyData.length < 12) return [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  
  // Simple seasonality calculation (would be more sophisticated in practice)
  const seasonalFactors = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7];
  return seasonalFactors;
}

function getSeasonalFactor(month: number, seasonality: number[]) {
  return seasonality[month] || 1;
}

function generateProfitabilityRecommendations(product: string, margin: number, profit: number): string[] {
  const recommendations = [];
  
  if (margin < 10) {
    recommendations.push('Review pricing strategy');
    recommendations.push('Analyze cost structure');
    recommendations.push('Consider discontinuing if persistently unprofitable');
  } else if (margin < 20) {
    recommendations.push('Optimize operational efficiency');
    recommendations.push('Explore cost reduction opportunities');
  } else {
    recommendations.push('Maintain current strategy');
    recommendations.push('Consider expanding this profitable line');
  }
  
  if (profit < 0) {
    recommendations.push('Urgent review required');
    recommendations.push('Implement immediate cost controls');
  }
  
  return recommendations.slice(0, 3);
}

function generateAnalyticsAlerts(data: any): AnalyticsAlert[] {
  const alerts: AnalyticsAlert[] = [];
  
  // Cost optimization opportunities
  const topOptimization = data.costOptimizations[0];
  if (topOptimization && topOptimization.savings > 50000) {
    alerts.push({
      id: 'cost-optimization',
      type: 'opportunity',
      priority: 'high',
      title: 'Major Cost Optimization Opportunity',
      description: `${topOptimization.category} costs can be reduced by ${topOptimization.savingsPercentage.toFixed(1)}%`,
      impact: `Potential annual savings of ₦${(topOptimization.savings * 12).toLocaleString()}`,
      actions: topOptimization.actions.slice(0, 3),
      potentialValue: topOptimization.savings * 12
    });
  }
  
  // Benchmark performance
  if (data.benchmarks.performance === 'below') {
    alerts.push({
      id: 'benchmark-warning',
      type: 'warning',
      priority: 'medium',
      title: 'Below Industry Benchmark',
      description: `Your gross margin is below the ${data.benchmarks.industry} industry average`,
      impact: `Improving to industry standard could increase profitability`,
      actions: ['Review pricing strategy', 'Analyze cost structure', 'Benchmark against competitors']
    });
  }
  
  return alerts;
}