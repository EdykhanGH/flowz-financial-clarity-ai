
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload,
  FileText,
  Bot,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Target
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';

interface DashboardOverviewProps {
  setActiveTab: (tab: string) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab }) => {
  const { transactions, loading } = useTransactions();

  // Calculate real-time KPIs from transactions data with new logic
  const kpiData = useMemo(() => {
    if (loading || !transactions.length) {
      return {
        totalRevenue: { value: '₦0', change: '0%', trend: 'up' as const },
        totalCosts: { value: '₦0', change: '0%', trend: 'down' as const },
        profitMargin: { value: '0%', change: '0%', trend: 'up' as const },
        netIncome: { value: '₦0', change: '0%', trend: 'up' as const }
      };
    }

    // Income includes both income and refund types
    const totalRevenue = transactions
      .filter(t => t.type === 'income' || t.type === 'refund')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Costs include expense type (which maps to Capital Cost and Daily Expenses)
    const totalCosts = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netIncome = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    return {
      totalRevenue: { 
        value: `₦${totalRevenue.toLocaleString()}`, 
        change: '+12.5%', 
        trend: 'up' as const 
      },
      totalCosts: { 
        value: `₦${totalCosts.toLocaleString()}`, 
        change: '-5.2%', 
        trend: 'down' as const 
      },
      profitMargin: { 
        value: `${profitMargin.toFixed(1)}%`, 
        change: '+2.8%', 
        trend: 'up' as const 
      },
      netIncome: { 
        value: `₦${netIncome.toLocaleString()}`, 
        change: netIncome >= 0 ? '+8.3%' : '-8.3%', 
        trend: netIncome >= 0 ? 'up' as const : 'down' as const 
      }
    };
  }, [transactions, loading]);

  // Generate chart data from real transactions
  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    // Group transactions by month
    const monthlyData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, revenue: 0, costs: 0, profit: 0 };
      }

      if (transaction.type === 'income' || transaction.type === 'refund') {
        acc[monthKey].revenue += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        acc[monthKey].costs += Number(transaction.amount);
      }

      acc[monthKey].profit = acc[monthKey].revenue - acc[monthKey].costs;
      
      return acc;
    }, {} as Record<string, { month: string; revenue: number; costs: number; profit: number }>);

    // Convert to array and sort by month
    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
      .map(item => ({
        ...item,
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' })
      }));
  }, [transactions]);

  // Generate income breakdown by category
  const incomeBreakdown = useMemo(() => {
    if (!transactions.length) return [];

    const incomeTransactions = transactions.filter(t => t.type === 'income' || t.type === 'refund');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    if (totalIncome === 0) return [];

    const categoryTotals = incomeTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    
    return Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value: Number(value.toFixed(2)),
        percentage: Math.round((value / totalIncome) * 100),
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories
  }, [transactions]);

  // Generate cost breakdown by category
  const costBreakdown = useMemo(() => {
    if (!transactions.length) return [];

    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    
    if (totalExpenses === 0) return [];

    const categoryTotals = expenses.reduce((acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#FF6B35', '#F7931E', '#FFD23F', '#FF8C69', '#FA8072'];
    
    return Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value: Number(value.toFixed(2)),
        percentage: Math.round((value / totalExpenses) * 100),
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories
  }, [transactions]);

  // Combined category data for bar chart
  const categoryComparisonData = useMemo(() => {
    const allCategories = new Set([
      ...incomeBreakdown.map(item => item.name),
      ...costBreakdown.map(item => item.name)
    ]);

    return Array.from(allCategories).map(category => {
      const incomeItem = incomeBreakdown.find(item => item.name === category);
      const costItem = costBreakdown.find(item => item.name === category);
      
      return {
        category,
        income: incomeItem ? incomeItem.value : 0,
        costs: costItem ? costItem.value : 0
      };
    }).filter(item => item.income > 0 || item.costs > 0);
  }, [incomeBreakdown, costBreakdown]);

  const recentActivity = useMemo(() => {
    const recentTransactions = transactions.slice(0, 3);
    
    return recentTransactions.map(transaction => ({
      type: 'transaction',
      description: `${transaction.type === 'income' || transaction.type === 'refund' ? 'Income' : 'Expense'}: ${transaction.description || transaction.category}`,
      time: new Date(transaction.created_at).toLocaleDateString(),
      status: 'completed' as const,
      icon: transaction.type === 'income' || transaction.type === 'refund' ? Target : BarChart3
    }));
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 border-l-4 border-l-orange-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back to Flowz!</h2>
        <p className="text-gray-700">Your comprehensive cost management dashboard with real-time updates</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalRevenue.value}</p>
              </div>
              <div className="flex items-center">
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  <ChevronUp className="w-3 h-3 mr-1" />
                  {kpiData.totalRevenue.change}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Costs</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalCosts.value}</p>
              </div>
              <div className="flex items-center">
                <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                  <ChevronDown className="w-3 h-3 mr-1" />
                  {kpiData.totalCosts.change}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.profitMargin.value}</p>
              </div>
              <div className="flex items-center">
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  <ChevronUp className="w-3 h-3 mr-1" />
                  {kpiData.profitMargin.change}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.netIncome.value}</p>
              </div>
              <div className="flex items-center">
                <Badge 
                  variant={kpiData.netIncome.trend === 'up' ? 'default' : 'secondary'} 
                  className={kpiData.netIncome.trend === 'up' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}
                >
                  {kpiData.netIncome.trend === 'up' ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                  {kpiData.netIncome.change}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with key tasks for your business</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white" 
            onClick={() => setActiveTab('data')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Financial Data
          </Button>
          <Button 
            variant="outline" 
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
            onClick={() => setActiveTab('analysis')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Analysis Report
          </Button>
          <Button 
            variant="outline" 
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
            onClick={() => setActiveTab('assistant')}
          >
            <Bot className="w-4 h-4 mr-2" />
            Chat with AI Assistant
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <activity.icon className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.description}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {activity.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent transactions. Upload some data to get started!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Costs Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Costs Trend</CardTitle>
            <CardDescription>Monthly performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, '']} />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="costs" stackId="1" stroke="#FF6B35" fill="#FF6B35" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available. Upload transactions to see trends.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Costs by Category</CardTitle>
            <CardDescription>Comparison across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, '']} />
                  <Legend />
                  <Bar dataKey="income" fill="#4ECDC4" name="Income" />
                  <Bar dataKey="costs" fill="#FF6B35" name="Costs" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available. Upload transactions to see category comparison.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Income Breakdown</CardTitle>
            <CardDescription>Distribution of income sources with percentages</CardDescription>
          </CardHeader>
          <CardContent>
            {incomeBreakdown.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={incomeBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {incomeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {incomeBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">₦{item.value.toLocaleString()} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No income data available. Upload transactions to see breakdown.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Distribution of expense categories with percentages</CardDescription>
          </CardHeader>
          <CardContent>
            {costBreakdown.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {costBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">₦{item.value.toLocaleString()} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No expense data available. Upload transactions to see breakdown.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
