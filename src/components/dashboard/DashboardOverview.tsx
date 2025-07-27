import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Target,
  Zap,
  Shield,
  Eye
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface DashboardOverviewProps {
  setActiveTab: (tab: string) => void;
}

interface Alert {
  id: string;
  type: 'critical' | 'high' | 'medium';
  icon: React.ElementType;
  title: string;
  impact: string;
  timestamp: string;
  actions: string[];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab }) => {
  const { transactions, isLoading } = useTransactions();
  const { categories } = useBusinessCategories();
  const { data: businessProfile } = useBusinessContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('month');

  // Function to refresh transaction data
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
  };

  // Auto-refresh transactions when component mounts to ensure latest data is shown
  React.useEffect(() => {
    refreshData();
  }, []);

  // Calculate metrics based on selected period
  const periodData = useMemo(() => {
    if (!transactions.length) return { current: [], previous: [] };

    const now = new Date();
    let periodStart: Date;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    switch (selectedPeriod) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const weekStart = now.getDate() - now.getDay();
        periodStart = new Date(now.getFullYear(), now.getMonth(), weekStart);
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), weekStart - 7);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), weekStart);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        periodStart = new Date(now.getFullYear(), quarterStart, 1);
        previousPeriodStart = new Date(now.getFullYear(), quarterStart - 3, 1);
        previousPeriodEnd = new Date(now.getFullYear(), quarterStart, 1);
        break;
      default: // month
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const current = transactions.filter(t => new Date(t.date) >= periodStart);
    const previous = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= previousPeriodStart && date < previousPeriodEnd;
    });

    return { current, previous };
  }, [transactions, selectedPeriod]);

  // Calculate KPIs
  const kpiData = useMemo(() => {
    const { current, previous } = periodData;

    const currentRevenue = current
      .filter(t => t.type === 'income' || t.type === 'refund')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentCosts = current
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousRevenue = previous
      .filter(t => t.type === 'income' || t.type === 'refund')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousCosts = previous
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentProfit = currentRevenue - currentCosts;
    const previousProfit = previousRevenue - previousCosts;
    const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
    const previousMargin = previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    return {
      totalRevenue: {
        value: currentRevenue,
        change: calculateChange(currentRevenue, previousRevenue),
        trend: currentRevenue >= previousRevenue ? 'up' : 'down'
      },
      totalCost: {
        value: currentCosts,
        change: calculateChange(currentCosts, previousCosts),
        trend: currentCosts <= previousCosts ? 'up' : 'down' // Lower costs are better
      },
      totalProfit: {
        value: currentProfit,
        change: calculateChange(currentProfit, previousProfit),
        trend: currentProfit >= previousProfit ? 'up' : 'down'
      },
      profitMargin: {
        value: currentMargin,
        change: calculateChange(currentMargin, previousMargin),
        trend: currentMargin >= previousMargin ? 'up' : 'down'
      }
    };
  }, [periodData]);

  // Generate trend data for sparklines
  const trendData = useMemo(() => {
    if (!transactions.length) return [];

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayTransactions = transactions.filter(t => t.date === date);
      const revenue = dayTransactions
        .filter(t => t.type === 'income' || t.type === 'refund')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const costs = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return {
        date,
        revenue,
        costs,
        profit: revenue - costs
      };
    });
  }, [transactions]);

  // Generate contextual alerts based on business profile
  const riskAlerts = useMemo((): Alert[] => {
    const alerts: Alert[] = [];
    const { totalCost, totalRevenue, profitMargin } = kpiData;

    // Industry-specific thresholds
    const industryThresholds = {
      'Manufacturing': { costRatio: 0.7, marginThreshold: 15 },
      'Services': { costRatio: 0.6, marginThreshold: 20 },
      'Retail': { costRatio: 0.75, marginThreshold: 12 },
      'Food': { costRatio: 0.65, marginThreshold: 18 },
      'Technology': { costRatio: 0.5, marginThreshold: 25 }
    };

    const businessCategory = businessProfile?.category || 'Services';
    const threshold = industryThresholds[businessCategory as keyof typeof industryThresholds] || industryThresholds.Services;

    // Cost ratio alert
    if (totalRevenue.value > 0) {
      const costRatio = totalCost.value / totalRevenue.value;
      if (costRatio > threshold.costRatio) {
        alerts.push({
          id: 'high-cost-ratio',
          type: 'critical',
          icon: AlertTriangle,
          title: 'Rising Cost-to-Revenue Ratio',
          impact: `Your costs are ${(costRatio * 100).toFixed(1)}% of revenue (above ${(threshold.costRatio * 100)}% industry benchmark). This affects profitability by ₦${((costRatio - threshold.costRatio) * totalRevenue.value).toLocaleString()} per transaction cycle.`,
          timestamp: new Date().toLocaleDateString(),
          actions: ['Review cost categories', 'Optimize operations', 'Renegotiate supplier terms']
        });
      }
    }

    // Profit margin alert
    if (profitMargin.value < threshold.marginThreshold) {
      const marginGap = threshold.marginThreshold - profitMargin.value;
      alerts.push({
        id: 'low-margin',
        type: profitMargin.value < 5 ? 'critical' : 'high',
        icon: TrendingDown,
        title: 'Profit Margin Below Industry Standard',
        impact: `Your ${profitMargin.value.toFixed(1)}% margin is ${marginGap.toFixed(1)}% below the ${threshold.marginThreshold}% ${businessCategory?.toLowerCase()} industry standard. Improving to benchmark could add ₦${((marginGap / 100) * totalRevenue.value).toLocaleString()} monthly profit.`,
        timestamp: new Date().toLocaleDateString(),
        actions: ['Price optimization', 'Cost reduction review', 'Value proposition enhancement']
      });
    }

    // Declining revenue trend
    if (kpiData.totalRevenue.trend === 'down') {
      alerts.push({
        id: 'revenue-decline',
        type: 'high',
        icon: TrendingDown,
        title: 'Revenue Decline Detected',
        impact: `Revenue decreased by ${kpiData.totalRevenue.change} compared to previous period. For ${businessProfile?.businessName || 'your business'}, this trend could impact cash flow and growth targets.`,
        timestamp: new Date().toLocaleDateString(),
        actions: ['Review sales pipeline', 'Market analysis', 'Customer retention check']
      });
    }

    // Seasonal business pattern alert (if applicable)
    if (businessProfile?.seasonalBusiness) {
      alerts.push({
        id: 'seasonal-planning',
        type: 'medium',
        icon: Info,
        title: 'Seasonal Business Planning',
        impact: 'As a seasonal business, consider cash flow planning for off-peak periods and inventory management for peak seasons.',
        timestamp: new Date().toLocaleDateString(),
        actions: ['Cash flow forecasting', 'Seasonal budget planning', 'Inventory optimization']
      });
    }

    return alerts.slice(0, 5); // Limit to 5 alerts
  }, [kpiData, businessProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{businessProfile?.businessName ? `, ${businessProfile.businessName}` : ''}!
          </h1>
          <p className="text-gray-600">Here's your business performance overview</p>
        </div>
        
        {/* Period Selector with Refresh */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Refresh Data
          </Button>
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)} className="mt-4 sm:mt-0">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Top Section: Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₦{kpiData.totalRevenue.value.toLocaleString()}
                </p>
                <div className="flex items-center space-x-2">
                  {kpiData.totalRevenue.trend === 'up' ? (
                    <ChevronUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    kpiData.totalRevenue.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpiData.totalRevenue.change}
                  </span>
                </div>
              </div>
              <div className="h-16 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.slice(-7)}>
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost Card */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₦{kpiData.totalCost.value.toLocaleString()}
                </p>
                <div className="flex items-center space-x-2">
                  {kpiData.totalCost.trend === 'up' ? (
                    <ChevronUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    kpiData.totalCost.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpiData.totalCost.change}
                  </span>
                </div>
              </div>
              <div className="h-16 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.slice(-7)}>
                    <Line 
                      type="monotone" 
                      dataKey="costs" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Profit Card */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Profit</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₦{kpiData.totalProfit.value.toLocaleString()}
                </p>
                <div className="flex items-center space-x-2">
                  {kpiData.totalProfit.trend === 'up' ? (
                    <ChevronUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    kpiData.totalProfit.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpiData.totalProfit.change}
                  </span>
                </div>
              </div>
              <div className="h-16 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.slice(-7)}>
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin Card */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-3xl font-bold text-gray-900">
                  {kpiData.profitMargin.value.toFixed(1)}%
                </p>
                <div className="flex items-center space-x-2">
                  {kpiData.profitMargin.trend === 'up' ? (
                    <ChevronUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    kpiData.profitMargin.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpiData.profitMargin.change}
                  </span>
                </div>
              </div>
              {/* Industry benchmark bar */}
              <div className="flex flex-col items-end space-y-1">
                <div className="text-xs text-gray-500">Industry</div>
                <div className="w-20 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-blue-500 rounded-full" 
                    style={{ width: `${Math.min(kpiData.profitMargin.value / 25 * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">25%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Risk Detection Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-500" />
              <CardTitle>AI Risk Detection</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('analysis')}>
              <Eye className="h-4 w-4 mr-2" />
              View All Alerts
            </Button>
          </div>
          <CardDescription>
            Intelligent alerts based on your business patterns and industry benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {riskAlerts.length > 0 ? (
              riskAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.type === 'critical' 
                      ? 'border-red-500 bg-red-50' 
                      : alert.type === 'high'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <alert.icon className={`h-5 w-5 mt-0.5 ${
                        alert.type === 'critical' 
                          ? 'text-red-600' 
                          : alert.type === 'high'
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                          <Badge 
                            variant="secondary" 
                            className={
                              alert.type === 'critical' 
                                ? 'bg-red-100 text-red-800' 
                                : alert.type === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {alert.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                          {alert.impact}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">{alert.timestamp}</span>
                          <Button size="sm" variant="outline" className="h-8">
                            View Recommendations
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">All Clear!</p>
                <p className="text-sm">No critical risks detected in your business metrics.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;