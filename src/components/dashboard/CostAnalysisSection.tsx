
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target,
  Calculator,
  PieChart
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';

const CostAnalysisSection: React.FC = () => {
  const { transactions } = useTransactions();

  // Calculate cost behavior analysis
  const costBehaviorData = useMemo(() => {
    const monthlyData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, fixed: 0, variable: 0, mixed: 0 };
      }

      if (transaction.type === 'expense') {
        const classification = transaction.classification;
        if (classification) {
          acc[monthKey][classification.cost_type] += Number(transaction.amount);
        } else {
          acc[monthKey].variable += Number(transaction.amount);
        }
      }

      return acc;
    }, {} as Record<string, { month: string; fixed: number; variable: number; mixed: number }>);

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(item => ({
        ...item,
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' })
      }));
  }, [transactions]);

  // Calculate break-even analysis
  const breakEvenData = useMemo(() => {
    const totalRevenue = transactions
      .filter(t => t.type === 'income' || t.type === 'refund')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const fixedCosts = transactions
      .filter(t => t.type === 'expense' && t.classification?.cost_type === 'fixed')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const variableCosts = transactions
      .filter(t => t.type === 'expense' && t.classification?.cost_type === 'variable')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const contributionMargin = totalRevenue > 0 ? ((totalRevenue - variableCosts) / totalRevenue) * 100 : 0;
    const breakEvenPoint = contributionMargin > 0 ? fixedCosts / (contributionMargin / 100) : 0;

    return {
      totalRevenue,
      fixedCosts,
      variableCosts,
      contributionMargin,
      breakEvenPoint
    };
  }, [transactions]);

  // Cost distribution
  const costDistribution = useMemo(() => {
    const directCosts = transactions
      .filter(t => t.type === 'expense' && t.classification?.cost_nature === 'direct')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const indirectCosts = transactions
      .filter(t => t.type === 'expense' && t.classification?.cost_nature === 'indirect')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalCosts = directCosts + indirectCosts;

    return [
      { name: 'Direct Costs', value: directCosts, percentage: totalCosts > 0 ? (directCosts / totalCosts) * 100 : 0 },
      { name: 'Indirect Costs', value: indirectCosts, percentage: totalCosts > 0 ? (indirectCosts / totalCosts) * 100 : 0 }
    ];
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cost & Profit Analysis</h2>
        <div className="flex space-x-3">
          <Select defaultValue="current-month">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">This Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="year-to-date">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-orange-500 hover:bg-orange-600">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contribution Margin</p>
                <p className="text-2xl font-bold text-gray-900">{breakEvenData.contributionMargin.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Break-even Point</p>
                <p className="text-2xl font-bold text-gray-900">₦{breakEvenData.breakEvenPoint.toLocaleString()}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fixed Costs</p>
                <p className="text-2xl font-bold text-gray-900">₦{breakEvenData.fixedCosts.toLocaleString()}</p>
              </div>
              <Calculator className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Variable Costs</p>
                <p className="text-2xl font-bold text-gray-900">₦{breakEvenData.variableCosts.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Behavior Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costBehaviorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="fixed" fill="#3B82F6" name="Fixed Costs" />
                <Bar dataKey="variable" fill="#EF4444" name="Variable Costs" />
                <Bar dataKey="mixed" fill="#F59E0B" name="Mixed Costs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Direct vs Indirect Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-gray-600">₦{item.value.toLocaleString()} ({item.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-orange-500'}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            AI-Powered Cost Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
              <h4 className="font-semibold text-blue-900">Cost Structure Analysis</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your business has a {breakEvenData.contributionMargin > 60 ? 'healthy' : breakEvenData.contributionMargin > 30 ? 'moderate' : 'concerning'} contribution margin of {breakEvenData.contributionMargin.toFixed(1)}%. 
                {breakEvenData.contributionMargin < 30 && ' Consider reviewing your pricing strategy or reducing variable costs.'}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-l-green-500">
              <h4 className="font-semibold text-green-900">Break-even Insights</h4>
              <p className="text-sm text-green-700 mt-1">
                You need ₦{breakEvenData.breakEvenPoint.toLocaleString()} in revenue to break even. 
                Focus on increasing sales volume or improving your contribution margin to reach profitability faster.
              </p>
            </div>

            {costDistribution[0].percentage > 70 && (
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-l-yellow-500">
                <h4 className="font-semibold text-yellow-900">Cost Distribution Warning</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Your direct costs represent {costDistribution[0].percentage.toFixed(1)}% of total costs. 
                  Consider optimizing direct cost efficiency or reviewing supplier relationships.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostAnalysisSection;
