import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target, BarChart } from 'lucide-react';
import { useCostCenters } from '@/hooks/useCostCenters';
import { useBusinessAnalytics } from '@/hooks/useBusinessAnalytics';
import { useBudgets } from '@/hooks/useBudgets';
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const BudgetCreationPage: React.FC = () => {
  const [budgetName, setBudgetName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetVariance, setBudgetVariance] = useState<any[]>([]);
  
  const { costCenters } = useCostCenters();
  const { analytics } = useBusinessAnalytics();
  const { budgets, createBudget, isCreating, calculateBudgetVariance, updateBudgetSpending } = useBudgets();
  const { analyticsData } = useEnhancedAnalytics({ period: 'month' });
  const { toast } = useToast();

  // Update budget spending and calculate variance on component mount
  useEffect(() => {
    const loadVarianceData = async () => {
      await updateBudgetSpending();
      const variance = await calculateBudgetVariance('current-month');
      setBudgetVariance(variance);
    };
    
    loadVarianceData();
  }, [budgets.length]);

  const handleCreateBudget = async () => {
    if (!budgetName || !amount || !category || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    createBudget({
      name: budgetName,
      category,
      allocated_amount: Number(amount),
      spent_amount: 0,
      start_date: startDate,
      end_date: endDate,
      period,
      budget_type: 'expense'
    });

    // Reset form
    setBudgetName('');
    setAmount('');
    setCategory('');
    setStartDate('');
    setEndDate('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Management</h1>
        <p className="text-gray-600">Create and track budgets based on your business categories</p>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Creation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Budget</CardTitle>
            <CardDescription>Set up budgets based on your cost categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budgetName">Budget Name</Label>
                <Input
                  id="budgetName"
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="e.g., Marketing Q1 Budget"
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Budget Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cost category" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters?.map((center) => (
                    <SelectItem key={center.id} value={center.name}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="period">Period</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleCreateBudget} 
              disabled={isCreating}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Budget'}
            </Button>
          </CardContent>
        </Card>

        {/* Budget Variance Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Variance Analysis</CardTitle>
            <CardDescription>Compare budgets vs actual spending</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetVariance.length > 0 ? (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <DollarSign className="w-6 h-6 mx-auto text-green-600 mb-1" />
                    <p className="text-sm text-green-800">Total Budget</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(budgetVariance.reduce((sum, item) => sum + item.budgeted, 0))}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <Target className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                    <p className="text-sm text-blue-800">Actual Spent</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(budgetVariance.reduce((sum, item) => sum + item.actual, 0))}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <BarChart className="w-6 h-6 mx-auto text-orange-600 mb-1" />
                    <p className="text-sm text-orange-800">Variance</p>
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(Math.abs(budgetVariance.reduce((sum, item) => sum + item.variance, 0)))}
                    </p>
                  </div>
                </div>

                {/* Variance Chart */}
                <div className="mt-6">
                  <h4 className="font-medium mb-4">Budget vs Actual by Category</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsBarChart data={budgetVariance.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={60} />
                      <YAxis tickFormatter={(value) => formatCurrency(value).replace('NGN', '₦')} />
                      <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                      <Legend />
                      <Bar dataKey="budgeted" fill="#3B82F6" name="Budgeted" />
                      <Bar dataKey="actual" fill="#EF4444" name="Actual" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>

                {/* Variance Table */}
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Variance Details</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Category</th>
                          <th className="text-right p-2">Budget</th>
                          <th className="text-right p-2">Actual</th>
                          <th className="text-right p-2">Variance</th>
                          <th className="text-center p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgetVariance.slice(0, 5).map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">{item.category}</td>
                            <td className="p-2 text-right">{formatCurrency(item.budgeted)}</td>
                            <td className="p-2 text-right">{formatCurrency(item.actual)}</td>
                            <td className={`p-2 text-right ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                            </td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${
                                item.status === 'favorable' ? 'bg-green-100 text-green-800' :
                                item.status === 'on-track' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Create your first budget to see variance analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Budget Recommendations</CardTitle>
          <CardDescription>Insights based on your business data and variance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold text-blue-800 mb-2">Cost Optimization</h3>
              <p className="text-sm text-blue-700">
                {analyticsData ? (
                  `Your expense analysis shows ${analyticsData.expenseByCategory[0]?.category || 'certain categories'} as your highest cost area. Consider reviewing this for optimization opportunities.`
                ) : (
                  'Based on your spending patterns, consider allocating 15% less to administrative costs.'
                )}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-green-50">
              <h3 className="font-semibold text-green-800 mb-2">Revenue Growth</h3>
              <p className="text-sm text-green-700">
                {analyticsData?.netProfitMargin ? (
                  `With a ${analyticsData.netProfitMargin.toFixed(1)}% profit margin, ${
                    analyticsData.netProfitMargin > 15 ? 'consider investing more in marketing to scale your successful model.' :
                    'focus on improving margins before increasing marketing spend.'
                  }`
                ) : (
                  'Increase marketing budget by 20% to capitalize on profitable product categories.'
                )}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-yellow-50">
              <h3 className="font-semibold text-yellow-800 mb-2">Risk Management</h3>
              <p className="text-sm text-yellow-700">
                {budgetVariance.length > 0 ? (
                  `${budgetVariance.filter(v => v.status === 'unfavorable').length} categories are over budget. Set aside emergency funds and tighten controls.`
                ) : (
                  'Set aside 10% contingency fund based on your business volatility patterns.'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetCreationPage;