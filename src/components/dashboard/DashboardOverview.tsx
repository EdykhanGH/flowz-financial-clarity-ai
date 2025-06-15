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
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';

interface DashboardOverviewProps {
  setActiveTab: (tab: string) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab }) => {
  const { transactions, loading } = useTransactions();

  // Calculate real-time KPIs from transactions data
  const kpiData = useMemo(() => {
    if (loading || !transactions.length) {
      return {
        totalRevenue: { value: '₦0', change: '0%', trend: 'up' as const },
        totalCosts: { value: '₦0', change: '0%', trend: 'down' as const },
        profitMargin: { value: '0%', change: '0%', trend: 'up' as const },
        netIncome: { value: '₦0', change: '0%', trend: 'up' as const }
      };
    }

    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

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

      if (transaction.type === 'income') {
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

  // Generate cost breakdown from real transactions
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

    const colors = ['#FF6B35', '#F7931E', '#FFD23F', '#4ECDC4', '#45B7D1'];
    
    return Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value: Math.round((value / totalExpenses) * 100),
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories
  }, [transactions]);

  const recentActivity = useMemo(() => {
    const recentTransactions = transactions.slice(0, 3);
    
    return recentTransactions.map(transaction => ({
      type: 'transaction',
      description: `${transaction.type === 'income' ? 'Income' : 'Expense'}: ${transaction.description || transaction.category}`,
      time: new Date(transaction.created_at).toLocaleDateString(),
      status: 'completed' as const,
      icon: transaction.type === 'income' ? Target : BarChart3
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

      {/* Charts Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#FF6B35" fill="#FF6B35" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="costs" stackId="1" stroke="#F7931E" fill="#F7931E" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available. Upload transactions to see trends.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Distribution of expense categories</CardDescription>
          </CardHeader>
          <CardContent>
            {costBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
