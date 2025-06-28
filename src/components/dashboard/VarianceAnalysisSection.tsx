
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Target,
  DollarSign
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';

interface BudgetItem {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'favorable' | 'unfavorable' | 'on-track';
}

const VarianceAnalysisSection: React.FC = () => {
  const { transactions } = useTransactions();
  const { categories } = useBusinessCategories();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  // Create sample budget data based on categories and actual spending
  const budgetVarianceData = useMemo((): BudgetItem[] => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Filter transactions for current month
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear &&
             t.type === 'expense';
    });

    // Group by category
    const actualSpending = currentMonthTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    // Create budget items (using actual spending + 20% as sample budget)
    const budgetItems: BudgetItem[] = [];
    
    // Add categories with actual spending
    Object.entries(actualSpending).forEach(([category, actual]) => {
      const budgeted = actual * 1.2; // Sample: budget 20% higher than actual
      const variance = budgeted - actual;
      const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;
      
      budgetItems.push({
        category,
        budgeted,
        actual,
        variance,
        variancePercent,
        status: variancePercent > 10 ? 'favorable' : variancePercent < -10 ? 'unfavorable' : 'on-track'
      });
    });

    // Add categories from business categories that don't have spending
    categories.forEach(cat => {
      if (!actualSpending[cat.category_name]) {
        const budgeted = 50000; // Sample budget for unused categories
        budgetItems.push({
          category: cat.category_name,
          budgeted,
          actual: 0,
          variance: budgeted,
          variancePercent: 100,
          status: 'favorable'
        });
      }
    });

    return budgetItems.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  }, [transactions, categories, selectedPeriod]);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const totalBudgeted = budgetVarianceData.reduce((sum, item) => sum + item.budgeted, 0);
    const totalActual = budgetVarianceData.reduce((sum, item) => sum + item.actual, 0);
    const totalVariance = totalBudgeted - totalActual;
    const totalVariancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

    const favorableCount = budgetVarianceData.filter(item => item.status === 'favorable').length;
    const unfavorableCount = budgetVarianceData.filter(item => item.status === 'unfavorable').length;
    const onTrackCount = budgetVarianceData.filter(item => item.status === 'on-track').length;

    return {
      totalBudgeted,
      totalActual,
      totalVariance,
      totalVariancePercent,
      favorableCount,
      unfavorableCount,
      onTrackCount,
      utilizationRate: totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0
    };
  }, [budgetVarianceData]);

  // Chart data
  const chartData = budgetVarianceData.slice(0, 10).map(item => ({
    category: item.category.length > 15 ? item.category.substring(0, 15) + '...' : item.category,
    budgeted: item.budgeted,
    actual: item.actual,
    variance: item.variance
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Budget Variance Analysis</h2>
        <div className="flex space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-orange-500 hover:bg-orange-600">
            Generate Variance Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">₦{summaryMetrics.totalBudgeted.toLocaleString()}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actual Spending</p>
                <p className="text-2xl font-bold text-gray-900">₦{summaryMetrics.totalActual.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Variance</p>
                <p className="text-2xl font-bold text-gray-900">₦{Math.abs(summaryMetrics.totalVariance).toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {summaryMetrics.totalVariance >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${summaryMetrics.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(summaryMetrics.totalVariancePercent).toFixed(1)}%
                  </span>
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budget Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.utilizationRate.toFixed(1)}%</p>
                <Progress value={summaryMetrics.utilizationRate} className="mt-2" />
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variance Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-green-800">Favorable</h3>
            <p className="text-2xl font-bold text-green-900">{summaryMetrics.favorableCount}</p>
            <p className="text-sm text-green-600">Categories under budget</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-yellow-800">On Track</h3>
            <p className="text-2xl font-bold text-yellow-900">{summaryMetrics.onTrackCount}</p>
            <p className="text-sm text-yellow-600">Categories within 10% of budget</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-red-800">Unfavorable</h3>
            <p className="text-2xl font-bold text-red-900">{summaryMetrics.unfavorableCount}</p>
            <p className="text-sm text-red-600">Categories over budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Variance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, '']} />
              <Legend />
              <Bar dataKey="budgeted" fill="#3B82F6" name="Budgeted" />
              <Bar dataKey="actual" fill="#EF4444" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Variance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Category</th>
                  <th className="text-right p-3">Budgeted</th>
                  <th className="text-right p-3">Actual</th>
                  <th className="text-right p-3">Variance</th>
                  <th className="text-right p-3">Variance %</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {budgetVarianceData.slice(0, 10).map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.category}</td>
                    <td className="p-3 text-right">₦{item.budgeted.toLocaleString()}</td>
                    <td className="p-3 text-right">₦{item.actual.toLocaleString()}</td>
                    <td className={`p-3 text-right font-medium ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.variance >= 0 ? '+' : ''}₦{item.variance.toLocaleString()}
                    </td>
                    <td className={`p-3 text-right ${item.variancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={item.status === 'favorable' ? 'default' : item.status === 'on-track' ? 'secondary' : 'destructive'}
                        className={
                          item.status === 'favorable'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'on-track'
                            ? 'bg-yellow-100 text-yellow-800'
                            : ''
                        }
                      >
                        {item.status.replace('-', ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Variance Analysis Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaryMetrics.unfavorableCount > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-l-red-500">
                <h4 className="font-semibold text-red-900">Action Required</h4>
                <p className="text-sm text-red-700 mt-1">
                  {summaryMetrics.unfavorableCount} categories are over budget. 
                  Review spending patterns and consider budget adjustments or cost reduction measures.
                </p>
              </div>
            )}

            {summaryMetrics.favorableCount > 3 && (
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-l-green-500">
                <h4 className="font-semibold text-green-900">Opportunity Identified</h4>
                <p className="text-sm text-green-700 mt-1">
                  Multiple categories are significantly under budget. 
                  Consider reallocating funds to growth initiatives or building reserves.
                </p>
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
              <h4 className="font-semibold text-blue-900">Budget Performance Summary</h4>
              <p className="text-sm text-blue-700 mt-1">
                Overall budget utilization is {summaryMetrics.utilizationRate.toFixed(1)}%. 
                {summaryMetrics.utilizationRate < 80 
                  ? 'Consider increasing investment in growth areas.'
                  : summaryMetrics.utilizationRate > 95
                  ? 'Monitor closely to avoid budget overruns.'
                  : 'Good budget discipline maintained.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VarianceAnalysisSection;
