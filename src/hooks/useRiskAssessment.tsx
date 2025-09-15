import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useCustomers } from './useCustomers';
import { useSuppliers } from './useSuppliers';
import { useBusinessContext } from './useBusinessContext';

export interface RiskMetric {
  score: number; // 0-100, higher is riskier
  level: 'low' | 'medium' | 'high' | 'critical';
  trend: 'improving' | 'stable' | 'deteriorating';
  description: string;
  impact: string;
  recommendations: string[];
}

export interface RiskAssessment {
  overallScore: number;
  creditRisk: RiskMetric;
  liquidityRisk: RiskMetric;
  operationalRisk: RiskMetric;
  marketRisk: RiskMetric;
  complianceRisk: RiskMetric;
  alerts: RiskAlert[];
  lastUpdated: Date;
}

export interface RiskAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'credit' | 'liquidity' | 'operational' | 'market' | 'compliance';
  title: string;
  description: string;
  impact: string;
  urgency: 'immediate' | 'this_week' | 'this_month' | 'monitor';
  actions: string[];
  estimatedCost?: number;
  createdAt: Date;
}

export const useRiskAssessment = () => {
  const { transactions } = useTransactions();
  const { customers } = useCustomers();
  const { suppliers } = useSuppliers();
  const { data: businessProfile } = useBusinessContext();

  const riskAssessment = useMemo((): RiskAssessment => {
    const now = new Date();
    const last30Days = transactions.filter(t => 
      new Date(t.date) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    );
    const last90Days = transactions.filter(t => 
      new Date(t.date) >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    );

    // Credit Risk Assessment
    const creditRisk = calculateCreditRisk(transactions, customers);
    
    // Liquidity Risk Assessment
    const liquidityRisk = calculateLiquidityRisk(last30Days, last90Days);
    
    // Operational Risk Assessment
    const operationalRisk = calculateOperationalRisk(transactions, suppliers, businessProfile);
    
    // Market Risk Assessment
    const marketRisk = calculateMarketRisk(last90Days, businessProfile);
    
    // Compliance Risk Assessment
    const complianceRisk = calculateComplianceRisk(transactions, businessProfile);

    // Generate risk alerts
    const alerts = generateRiskAlerts({
      creditRisk,
      liquidityRisk,
      operationalRisk,
      marketRisk,
      complianceRisk
    });

    // Calculate overall risk score (weighted average)
    const overallScore = Math.round(
      (creditRisk.score * 0.25) +
      (liquidityRisk.score * 0.3) +
      (operationalRisk.score * 0.2) +
      (marketRisk.score * 0.15) +
      (complianceRisk.score * 0.1)
    );

    return {
      overallScore,
      creditRisk,
      liquidityRisk,
      operationalRisk,
      marketRisk,
      complianceRisk,
      alerts,
      lastUpdated: now
    };
  }, [transactions, customers, suppliers, businessProfile]);

  return riskAssessment;
};

// Credit Risk Calculation
function calculateCreditRisk(transactions: any[], customers: any[]): RiskMetric {
  const revenues = transactions.filter(t => t.type === 'income');
  const totalRevenue = revenues.reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Customer concentration risk
  const customerRevenue = revenues.reduce((acc, t) => {
    const customerId = t.customer_id || 'unknown';
    acc[customerId] = (acc[customerId] || 0) + Number(t.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const sortedCustomers = Object.values(customerRevenue).sort((a, b) => b - a);
  const top3Revenue = sortedCustomers.slice(0, 3).reduce((sum, val) => sum + val, 0);
  const concentrationRatio = totalRevenue > 0 ? (top3Revenue / totalRevenue) * 100 : 0;
  
  // Payment delay analysis (simplified)
  const avgPaymentDelay = 15; // This would be calculated from actual payment data
  
  let score = 0;
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Score based on concentration and payment patterns
  if (concentrationRatio > 70) score += 40;
  else if (concentrationRatio > 50) score += 25;
  else if (concentrationRatio > 30) score += 10;
  
  if (avgPaymentDelay > 45) score += 30;
  else if (avgPaymentDelay > 30) score += 20;
  else if (avgPaymentDelay > 15) score += 10;

  if (score >= 60) level = 'critical';
  else if (score >= 40) level = 'high';
  else if (score >= 20) level = 'medium';

  return {
    score,
    level,
    trend: score > 30 ? 'deteriorating' : 'stable',
    description: `Customer concentration: ${concentrationRatio.toFixed(1)}%, Avg payment delay: ${avgPaymentDelay} days`,
    impact: `High customer concentration increases revenue volatility risk`,
    recommendations: [
      'Diversify customer base to reduce concentration risk',
      'Implement credit terms and follow-up procedures',
      'Consider credit insurance for large customers',
      'Monitor customer financial health regularly'
    ]
  };
}

// Liquidity Risk Calculation
function calculateLiquidityRisk(last30Days: any[], last90Days: any[]): RiskMetric {
  const monthlyRevenue = last30Days
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const monthlyExpenses = last30Days
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const netCashFlow = monthlyRevenue - monthlyExpenses;
  const burnRate = monthlyExpenses;
  
  // Calculate current ratio (simplified - would need balance sheet data)
  const estimatedCurrentAssets = monthlyRevenue * 2; // Approximation
  const estimatedCurrentLiabilities = monthlyExpenses * 1.5; // Approximation
  const currentRatio = estimatedCurrentLiabilities > 0 ? estimatedCurrentAssets / estimatedCurrentLiabilities : 2;
  
  let score = 0;
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Negative cash flow
  if (netCashFlow < 0) score += 35;
  
  // Low current ratio
  if (currentRatio < 1) score += 40;
  else if (currentRatio < 1.5) score += 20;
  
  // High burn rate relative to revenue
  if (burnRate > monthlyRevenue * 0.9) score += 25;
  else if (burnRate > monthlyRevenue * 0.7) score += 10;

  if (score >= 70) level = 'critical';
  else if (score >= 45) level = 'high';
  else if (score >= 25) level = 'medium';

  return {
    score,
    level,
    trend: netCashFlow < 0 ? 'deteriorating' : 'stable',
    description: `Net cash flow: ₦${netCashFlow.toLocaleString()}, Current ratio: ${currentRatio.toFixed(2)}`,
    impact: `Cash flow challenges may affect operational capacity`,
    recommendations: [
      'Improve accounts receivable collection',
      'Optimize inventory levels',
      'Negotiate better payment terms with suppliers',
      'Establish emergency credit facilities',
      'Monitor daily cash position'
    ]
  };
}

// Operational Risk Calculation
function calculateOperationalRisk(transactions: any[], suppliers: any[], businessProfile: any): RiskMetric {
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Supplier concentration
  const supplierExpenses = expenses.reduce((acc, t) => {
    const supplierId = t.supplier_id || 'unknown';
    acc[supplierId] = (acc[supplierId] || 0) + Number(t.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const sortedSuppliers = Object.values(supplierExpenses).sort((a, b) => b - a);
  const topSupplierShare = totalExpenses > 0 ? (sortedSuppliers[0] || 0) / totalExpenses * 100 : 0;
  
  // Key person dependency (based on business profile)
  const isSmallBusiness = businessProfile?.business_size_employees === 'Micro (1-10)' || 
                         businessProfile?.business_size_employees === 'Small (11-50)';
  
  let score = 0;
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Supplier concentration risk
  if (topSupplierShare > 50) score += 30;
  else if (topSupplierShare > 30) score += 15;
  
  // Small business key person risk
  if (isSmallBusiness) score += 20;
  
  // Seasonal business operational risk
  if (businessProfile?.seasonalBusiness) score += 15;

  if (score >= 50) level = 'high';
  else if (score >= 30) level = 'medium';

  return {
    score,
    level,
    trend: 'stable',
    description: `Top supplier dependency: ${topSupplierShare.toFixed(1)}%`,
    impact: `Operational disruptions could affect business continuity`,
    recommendations: [
      'Diversify supplier base',
      'Develop key person succession plans',
      'Create operational documentation',
      'Implement backup processes',
      'Consider business continuity insurance'
    ]
  };
}

// Market Risk Calculation
function calculateMarketRisk(last90Days: any[], businessProfile: any): RiskMetric {
  const revenues = last90Days.filter(t => t.type === 'income');
  const monthlyRevenues = [0, 1, 2].map(monthsBack => {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - monthsBack);
    monthStart.setDate(1);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    
    return revenues
      .filter(t => {
        const date = new Date(t.date);
        return date >= monthStart && date < monthEnd;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  });

  // Revenue volatility
  const avgRevenue = monthlyRevenues.reduce((sum, r) => sum + r, 0) / monthlyRevenues.length;
  const variance = monthlyRevenues.reduce((sum, r) => sum + Math.pow(r - avgRevenue, 2), 0) / monthlyRevenues.length;
  const volatility = avgRevenue > 0 ? Math.sqrt(variance) / avgRevenue : 0;
  
  let score = 0;
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // High revenue volatility
  if (volatility > 0.4) score += 35;
  else if (volatility > 0.25) score += 20;
  else if (volatility > 0.15) score += 10;
  
  // Sector-specific risks (Nigerian context)
  const riskySectors = ['Manufacturing', 'Import/Export', 'Agriculture'];
  if (riskySectors.includes(businessProfile?.category)) score += 15;
  
  // Single market dependency (Nigeria-specific)
  score += 10; // Base score for Nigerian market risks

  if (score >= 50) level = 'high';
  else if (score >= 30) level = 'medium';

  return {
    score,
    level,
    trend: volatility > 0.3 ? 'deteriorating' : 'stable',
    description: `Revenue volatility: ${(volatility * 100).toFixed(1)}%`,
    impact: `Market fluctuations affect revenue predictability`,
    recommendations: [
      'Diversify revenue streams',
      'Monitor economic indicators',
      'Develop recession-resistant services',
      'Consider export opportunities',
      'Build strategic partnerships'
    ]
  };
}

// Compliance Risk Calculation
function calculateComplianceRisk(transactions: any[], businessProfile: any): RiskMetric {
  let score = 0;
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Basic compliance checks (would be more sophisticated with real data)
  const annualRevenue = transactions
    .filter(t => t.type === 'income' && new Date(t.date) >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  // VAT registration threshold (₦25M in Nigeria)
  if (annualRevenue > 25000000) score += 15; // Higher compliance requirements
  
  // Industry-specific compliance risks
  const highComplianceIndustries = ['Financial Services', 'Healthcare', 'Food', 'Manufacturing'];
  if (highComplianceIndustries.includes(businessProfile?.category)) score += 20;
  
  // Base compliance risk for Nigerian businesses
  score += 10;

  if (score >= 40) level = 'high';
  else if (score >= 25) level = 'medium';

  return {
    score,
    level,
    trend: 'stable',
    description: `Annual revenue: ₦${annualRevenue.toLocaleString()}`,
    impact: `Compliance gaps could result in penalties and operational disruption`,
    recommendations: [
      'Regular compliance audit',
      'VAT and tax filing compliance',
      'Maintain proper financial records',
      'Engage professional tax consultants',
      'Monitor regulatory changes'
    ]
  };
}

// Generate Risk Alerts
function generateRiskAlerts(risks: Omit<RiskAssessment, 'overallScore' | 'alerts' | 'lastUpdated'>): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const now = new Date();

  Object.entries(risks).forEach(([category, risk]) => {
    if (risk.level === 'critical' || risk.level === 'high') {
      alerts.push({
        id: `${category}-${Date.now()}`,
        type: risk.level,
        category: category.replace('Risk', '').toLowerCase() as any,
        title: `${category.replace('Risk', '')} Risk Alert`,
        description: risk.description,
        impact: risk.impact,
        urgency: risk.level === 'critical' ? 'immediate' : 'this_week',
        actions: risk.recommendations.slice(0, 3),
        createdAt: now
      });
    }
  });

  return alerts;
}