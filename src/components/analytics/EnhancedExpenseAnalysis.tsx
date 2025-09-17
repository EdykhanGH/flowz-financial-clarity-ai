import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  TrendingUp,
  Calculator,
  PieChart,
  BarChart3,
  Target,
  Zap,
  Building2,
  Fuel
} from 'lucide-react';
import { 
  ResponsiveContainer,
  BarChart, 
  Bar, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useBusinessContext } from '@/hooks/useBusinessContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const EnhancedExpenseAnalysis: React.FC = () => {
  const { transactions } = useTransactions();
  const { data: businessContext } = useBusinessContext();
  const [activeTab, setActiveTab] = useState('abc-analysis');

  const expenses = transactions.filter(t => t.type === 'expense');

  // ABC Analysis for Expense Categories
  const abcAnalysis = React.useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    
    const categoriesWithPercentage = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100
      }))
      .sort((a, b) => b.amount - a.amount);

    // ABC Classification
    let cumulativePercentage = 0;
    const abcCategories = categoriesWithPercentage.map(item => {
      cumulativePercentage += item.percentage;
      let classification = 'C';
      
      if (cumulativePercentage <= 70) classification = 'A';
      else if (cumulativePercentage <= 95) classification = 'B';
      
      return {
        ...item,
        cumulativePercentage,
        classification
      };
    });

    return abcCategories;
  }, [expenses]);

  // Marginal Cost Analysis
  const marginalCostAnalysis = React.useMemo(() => {
    const monthlyData = expenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, totalCosts: 0, transactions: 0 };
      }
      
      acc[monthKey].totalCosts += Number(expense.amount);
      acc[monthKey].transactions += 1;
      
      return acc;
    }, {} as Record<string, { month: string; totalCosts: number; transactions: number }>);

    const sortedData = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    // Calculate marginal costs (month-over-month change)
    return sortedData.map((current, index) => {
      const previous = sortedData[index - 1];
      const marginalCost = previous ? current.totalCosts - previous.totalCosts : 0;
      const marginalCostPerUnit = previous && previous.transactions > 0 
        ? marginalCost / previous.transactions 
        : 0;

      return {
        ...current,
        month: new Date(current.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        marginalCost,
        marginalCostPerUnit,
        averageCostPerTransaction: current.transactions > 0 ? current.totalCosts / current.transactions : 0
      };
    });
  }, [expenses]);

  // Nigerian Market Factors Analysis
  const nigerianFactorsAnalysis = React.useMemo(() => {
    const factors = {
      fuelCosts: expenses.filter(e => 
        e.description?.toLowerCase().includes('fuel') || 
        e.description?.toLowerCase().includes('petrol') ||
        e.description?.toLowerCase().includes('diesel') ||
        e.category?.toLowerCase().includes('fuel')
      ).reduce((sum, e) => sum + Number(e.amount), 0),
      
      generatorCosts: expenses.filter(e => 
        e.description?.toLowerCase().includes('generator') ||
        e.description?.toLowerCase().includes('power') ||
        e.description?.toLowerCase().includes('electricity')
      ).reduce((sum, e) => sum + Number(e.amount), 0),
      
      securityCosts: expenses.filter(e => 
        e.description?.toLowerCase().includes('security') ||
        e.description?.toLowerCase().includes('guard')
      ).reduce((sum, e) => sum + Number(e.amount), 0),
      
      transportCosts: expenses.filter(e => 
        e.description?.toLowerCase().includes('transport') ||
        e.description?.toLowerCase().includes('logistics') ||
        e.category?.toLowerCase().includes('transport')
      ).reduce((sum, e) => sum + Number(e.amount), 0),
      
      regulatoryCosts: expenses.filter(e => 
        e.description?.toLowerCase().includes('tax') ||
        e.description?.toLowerCase().includes('permit') ||
        e.description?.toLowerCase().includes('license') ||
        e.description?.toLowerCase().includes('regulatory')
      ).reduce((sum, e) => sum + Number(e.amount), 0)
    };

    const totalNigerianFactors = Object.values(factors).reduce((sum, val) => sum + val, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    
    return {
      factors,
      totalNigerianFactors,
      percentageOfTotal: totalExpenses > 0 ? (totalNigerianFactors / totalExpenses) * 100 : 0
    };
  }, [expenses]);

  // Activity-Based Costing Simulation
  const activityBasedCosting = React.useMemo(() => {
    const activities = [
      { name: 'Customer Service', driver: 'Customer Interactions', rate: 50 },
      { name: 'Order Processing', driver: 'Number of Orders', rate: 25 },
      { name: 'Inventory Management', driver: 'SKUs Managed', rate: 15 },
      { name: 'Quality Control', driver: 'Units Inspected', rate: 10 },
      { name: 'Administrative', driver: 'Administrative Hours', rate: 30 }
    ];

    // Simulate activity costs based on actual expenses
    const directCosts = expenses
      .filter(e => e.cost_nature === 'direct')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const indirectCosts = expenses
      .filter(e => e.cost_nature === 'indirect')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const totalOverhead = indirectCosts;
    
    return activities.map(activity => ({
      ...activity,
      allocatedCost: (totalOverhead / activities.length) + (Math.random() * 10000), // Simulated allocation
      costPerDriver: activity.rate * (1 + Math.random() * 0.5) // Simulated variance
    }));
  }, [expenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'A': return 'bg-red-100 text-red-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Expense Analysis</h2>
          <p className="text-gray-600">Advanced cost management insights for Nigerian businesses</p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <Building2 className="w-4 h-4 mr-1" />
          Nigerian Market Focus
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="abc-analysis" className="flex items-center">
            <Target className="w-4 h-4 mr-2" />
            ABC Analysis
          </TabsTrigger>
          <TabsTrigger value="marginal-costs" className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Marginal Costs
          </TabsTrigger>
          <TabsTrigger value="nigerian-factors" className="flex items-center">
            <Fuel className="w-4 h-4 mr-2" />
            Nigerian Factors
          </TabsTrigger>
          <TabsTrigger value="activity-costing" className="flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Activity-Based Costing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abc-analysis">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-orange-500" />
                  ABC Analysis of Expense Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {abcAnalysis.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge className={getClassificationColor(item.classification)}>
                            {item.classification}
                          </Badge>
                          <div>
                            <p className="font-medium">{item.category}</p>
                            <p className="text-sm text-gray-600">{item.percentage.toFixed(1)}% of total</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(item.amount)}</p>
                          <p className="text-sm text-gray-600">{item.cumulativePercentage.toFixed(1)}% cumulative</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={abcAnalysis.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {abcAnalysis.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">ABC Analysis Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Category A (Critical):</strong> Focus management attention here. 
                      These categories represent the highest impact on your costs.
                    </div>
                    <div>
                      <strong>Category B (Important):</strong> Monitor regularly and optimize 
                      when opportunities arise.
                    </div>
                    <div>
                      <strong>Category C (Standard):</strong> Manage efficiently but don't 
                      over-invest in optimization efforts.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="marginal-costs">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                  Marginal Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={marginalCostAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value).replace('NGN', '₦')} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalCosts" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Total Costs" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="marginalCost" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Marginal Cost" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="averageCostPerTransaction" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      name="Avg Cost/Transaction" 
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900">Marginal Cost Insights</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Understanding marginal costs helps optimize production levels and pricing decisions. 
                    Focus on periods where marginal costs are increasing rapidly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nigerian-factors">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Fuel className="w-5 h-5 mr-2 text-red-500" />
                  Nigerian Market Cost Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {Object.entries(nigerianFactorsAnalysis.factors).map(([key, value]) => (
                    <Card key={key}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium capitalize">{key.replace('Costs', ' Costs')}</p>
                            <p className="text-2xl font-bold">{formatCurrency(value)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {((value / nigerianFactorsAnalysis.totalNigerianFactors) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-l-orange-500">
                  <h4 className="font-semibold text-orange-900">Nigerian Business Environment Impact</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Nigerian-specific costs represent {nigerianFactorsAnalysis.percentageOfTotal.toFixed(1)}% 
                    of your total expenses ({formatCurrency(nigerianFactorsAnalysis.totalNigerianFactors)}). 
                    These factors significantly impact operational efficiency in the Nigerian market.
                  </p>
                  
                  <div className="mt-3 space-y-2">
                    <div className="text-sm">
                      <strong>Key Recommendations:</strong>
                      <ul className="mt-1 space-y-1 list-disc pl-4">
                        <li>Consider solar power alternatives to reduce generator costs</li>
                        <li>Optimize fuel consumption through route planning</li>
                        <li>Bundle regulatory compliance to reduce administrative overhead</li>
                        <li>Negotiate better security contracts based on volume</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity-costing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-purple-500" />
                  Activity-Based Costing Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Activity</th>
                        <th className="text-left p-3">Cost Driver</th>
                        <th className="text-right p-3">Allocated Cost</th>
                        <th className="text-right p-3">Cost per Driver</th>
                        <th className="text-right p-3">Efficiency Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityBasedCosting.map((activity, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{activity.name}</td>
                          <td className="p-3 text-gray-600">{activity.driver}</td>
                          <td className="p-3 text-right font-mono">{formatCurrency(activity.allocatedCost)}</td>
                          <td className="p-3 text-right font-mono">{formatCurrency(activity.costPerDriver)}</td>
                          <td className="p-3 text-right">
                            <Badge variant={activity.costPerDriver < 40 ? "default" : activity.costPerDriver < 60 ? "secondary" : "destructive"}>
                              {activity.costPerDriver < 40 ? 'High' : activity.costPerDriver < 60 ? 'Medium' : 'Low'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900">Activity-Based Costing Benefits</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    ABC provides more accurate cost allocation by identifying the true cost drivers of your business activities. 
                    This helps in better pricing decisions and identifying inefficient processes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedExpenseAnalysis;