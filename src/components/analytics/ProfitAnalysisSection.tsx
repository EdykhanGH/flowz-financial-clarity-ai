import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowUpRight,
  Filter,
  TrendingDown,
  TrendingUp,
  Target,
  Calculator,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer,
  LineChart, 
  Line, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useBusinessAnalytics } from '@/hooks/useBusinessAnalytics';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

const ProfitAnalysisSection: React.FC = () => {
  const { transactions } = useTransactions();
  const { analytics } = useBusinessAnalytics();
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  
  // Filter transactions based on current filters
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => {
      // Filter by date if selected
      if (filterDate) {
        const transactionDate = new Date(transaction.date);
        if (
          transactionDate.getDate() !== filterDate.getDate() ||
          transactionDate.getMonth() !== filterDate.getMonth() ||
          transactionDate.getFullYear() !== filterDate.getFullYear()
        ) {
          return false;
        }
      }
      
      return true;
    });
  }, [transactions, filterDate]);

  // Calculate profit metrics
  const profitMetrics = React.useMemo(() => {
    const revenue = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Calculate Cost of Goods Sold (COGS) - direct costs using cost_type field
    const cogs = filteredTransactions
      .filter(t => t.type === 'expense' && ((t.cost_type === 'direct') || (t.classification?.cost_type === 'direct')))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const grossProfit = revenue - cogs;
    const netProfit = revenue - expenses;
    const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    
    return {
      totalProfit: netProfit,
      grossProfit,
      netProfit,
      grossProfitMargin,
      netProfitMargin,
      revenue,
      expenses,
      cogs
    };
  }, [filteredTransactions]);

  // Break-even analysis
  const breakEvenAnalysis = React.useMemo(() => {
    // Use cost_nature field for fixed/variable classification
    const fixedCosts = filteredTransactions
      .filter(t => t.type === 'expense' && ((t.cost_nature === 'fixed') || (t.classification?.cost_nature === 'fixed')))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const variableCosts = filteredTransactions
      .filter(t => t.type === 'expense' && ((t.cost_nature === 'variable') || (t.classification?.cost_nature === 'variable')))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const revenue = profitMetrics.revenue;
    const contributionMargin = revenue > 0 ? ((revenue - variableCosts) / revenue) : 0;
    const breakEvenRevenue = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;
    
    // Assuming average daily revenue for break-even days calculation
    const dailyRevenue = revenue / 30; // Assuming monthly data
    const breakEvenDays = dailyRevenue > 0 ? breakEvenRevenue / dailyRevenue : 0;
    
    // Margin of safety
    const marginOfSafetyAmount = revenue - breakEvenRevenue;
    const marginOfSafetyDays = dailyRevenue > 0 ? marginOfSafetyAmount / dailyRevenue : 0;
    
    return {
      breakEvenRevenue,
      breakEvenDays,
      marginOfSafetyAmount,
      marginOfSafetyDays,
      contributionMargin: contributionMargin * 100
    };
  }, [filteredTransactions, profitMetrics]);

  // Revenue vs Profit comparison over time
  const revenueVsProfitData = React.useMemo(() => {
    const monthlyData = filteredTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, revenue: 0, expenses: 0, profit: 0 };
      }

      if (transaction.type === 'income') {
        acc[monthKey].revenue += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        acc[monthKey].expenses += Number(transaction.amount);
      }
      
      acc[monthKey].profit = acc[monthKey].revenue - acc[monthKey].expenses;

      return acc;
    }, {} as Record<string, { month: string; revenue: number; expenses: number; profit: number }>);

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(item => ({
        ...item,
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' })
      }));
  }, [filteredTransactions]);

  // Reset filters
  const resetFilters = () => {
    setFilterDate(undefined);
    setPeriodFilter('all');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Profit Analysis</h2>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <h4 className="font-medium mb-2">Date Filter</h4>
              <DatePicker
                date={filterDate}
                setDate={setFilterDate}
                label=""
                placeholder="Select filter date"
                className="mb-4"
              />
              
              <h4 className="font-medium mb-2">Period</h4>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button className="bg-orange-500 hover:bg-orange-600">
            Export Report
          </Button>
        </div>
      </div>

      {/* Profit Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-600 to-green-500 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-green-100">Total Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(profitMetrics.totalProfit)}</p>
              </div>
              <div className="bg-green-500/50 p-2 rounded-full">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-blue-500 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-100">Gross Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(profitMetrics.grossProfit)}</p>
              </div>
              <div className="bg-blue-500/50 p-2 rounded-full">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-500 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-purple-100">Net Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(profitMetrics.netProfit)}</p>
              </div>
              <div className="bg-purple-500/50 p-2 rounded-full">
                <Calculator className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-500 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-orange-100">Profit Margin</p>
                <p className="text-2xl font-bold">{profitMetrics.netProfitMargin.toFixed(1)}%</p>
              </div>
              <div className="bg-orange-500/50 p-2 rounded-full">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit Margin Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profit Margin Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Gross Profit Margin</span>
                <span className="text-lg font-bold text-green-600">
                  {profitMetrics.grossProfitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Net Profit Margin</span>
                <span className="text-lg font-bold text-blue-600">
                  {profitMetrics.netProfitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-4">
                <p><strong>Gross Profit:</strong> Revenue - Cost of Goods Sold</p>
                <p><strong>Net Profit:</strong> Revenue - All Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Break-even Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Break-even Revenue</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(breakEvenAnalysis.breakEvenRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">Break-even Days</p>
                  <p className="text-lg font-bold text-orange-600">
                    {Math.round(breakEvenAnalysis.breakEvenDays)} days
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Margin of Safety</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(breakEvenAnalysis.marginOfSafetyAmount)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Safety Days</p>
                  <p className="text-lg font-bold text-blue-600">
                    {Math.round(breakEvenAnalysis.marginOfSafetyDays)} days
                  </p>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-800">Contribution Margin</p>
                <p className="text-lg font-bold text-purple-600">
                  {breakEvenAnalysis.contributionMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Profit Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Profit Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={revenueVsProfitData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value).replace('NGN', '₦')} />
              <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6}
                name="Revenue" 
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stackId="2" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
                name="Profit" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            AI-Powered Profit Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-l-green-500">
              <h4 className="font-semibold text-green-900">Profitability Analysis</h4>
              <p className="text-sm text-green-700 mt-1">
                Your net profit margin of {profitMetrics.netProfitMargin.toFixed(1)}% is 
                {profitMetrics.netProfitMargin > 15 ? ' excellent and above industry standards.' : 
                 profitMetrics.netProfitMargin > 5 ? ' healthy but has room for improvement.' : 
                 ' below recommended levels. Focus on cost reduction and revenue optimization.'}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
              <h4 className="font-semibold text-blue-900">Break-even Insights</h4>
              <p className="text-sm text-blue-700 mt-1">
                You need {Math.round(breakEvenAnalysis.breakEvenDays)} days of current revenue to break even. 
                Your margin of safety of {Math.round(breakEvenAnalysis.marginOfSafetyDays)} days provides 
                {breakEvenAnalysis.marginOfSafetyDays > 30 ? ' excellent' : 
                 breakEvenAnalysis.marginOfSafetyDays > 15 ? ' good' : ' limited'} protection against revenue fluctuations.
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-l-orange-500">
              <h4 className="font-semibold text-orange-900">Recommended Actions</h4>
              <ul className="text-sm text-orange-700 mt-1 space-y-1 list-disc pl-4">
                <li>Monitor gross profit margin to ensure sustainable pricing</li>
                <li>Focus on increasing contribution margin to improve break-even position</li>
                <li>Consider strategies to reduce fixed costs and improve margin of safety</li>
                <li>Analyze revenue trends to identify growth opportunities</li>
                <li>Review pricing strategy to optimize profit margins</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitAnalysisSection;