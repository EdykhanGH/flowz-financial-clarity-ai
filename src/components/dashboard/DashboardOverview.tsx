
import React from 'react';
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

interface DashboardOverviewProps {
  setActiveTab: (tab: string) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab }) => {
  const kpiData = {
    totalRevenue: { value: '₹45,32,000', change: '+12.5%', trend: 'up' },
    totalCosts: { value: '₹28,15,000', change: '-5.2%', trend: 'down' },
    profitMargin: { value: '38.2%', change: '+2.8%', trend: 'up' },
    breakEven: { value: '15 days', change: '-3 days', trend: 'up' }
  };

  const recentActivity = [
    { 
      type: 'upload', 
      description: 'Monthly expenses uploaded', 
      time: '2 hours ago', 
      status: 'completed',
      icon: Upload 
    },
    { 
      type: 'analysis', 
      description: 'Q3 cost analysis generated', 
      time: '1 day ago', 
      status: 'completed',
      icon: BarChart3 
    },
    { 
      type: 'insight', 
      description: 'Break-even point improved', 
      time: '2 days ago', 
      status: 'new',
      icon: Target 
    }
  ];

  const chartData = [
    { month: 'Jan', revenue: 400000, costs: 250000, profit: 150000 },
    { month: 'Feb', revenue: 380000, costs: 240000, profit: 140000 },
    { month: 'Mar', revenue: 420000, costs: 260000, profit: 160000 },
    { month: 'Apr', revenue: 450000, costs: 270000, profit: 180000 },
    { month: 'May', revenue: 480000, costs: 285000, profit: 195000 },
    { month: 'Jun', revenue: 510000, costs: 300000, profit: 210000 }
  ];

  const costBreakdown = [
    { name: 'Direct Costs', value: 45, color: '#FF6B35' },
    { name: 'Indirect Costs', value: 30, color: '#F7931E' },
    { name: 'Fixed Costs', value: 25, color: '#FFD23F' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 border-l-4 border-l-orange-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back to Flowz!</h2>
        <p className="text-gray-700">Your comprehensive cost management dashboard for TechCorp Solutions</p>
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
                <p className="text-sm font-medium text-gray-600">Break-even Point</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.breakEven.value}</p>
              </div>
              <div className="flex items-center">
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  <ChevronUp className="w-3 h-3 mr-1" />
                  {kpiData.breakEven.change}
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
          <CardDescription>Latest updates and insights for your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
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
                <Badge 
                  variant={activity.status === 'new' ? 'default' : 'secondary'}
                  className={activity.status === 'new' ? 'bg-orange-500 text-white' : ''}
                >
                  {activity.status}
                </Badge>
              </div>
            ))}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Distribution of cost categories</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
