import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Home,
  Database,
  BarChart3, 
  TrendingUp, 
  Calculator, 
  Bot,
  Bell,
  Settings,
  User,
  Upload,
  FileText,
  Download,
  Plus,
  Filter,
  Share,
  Menu,
  X,
  AlertTriangle,
  Target,
  Lightbulb,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { AIAssistant } from '@/components/AIAssistant';
import DataUpload from '@/components/DataUpload';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [revenueChange, setRevenueChange] = useState([0]);
  const [costChange, setCostChange] = useState([0]);

  // Mock data
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

  const mockTransactions = [
    { id: 1, date: '2024-06-10', description: 'Office Supplies', category: 'Administrative', amount: -25000, type: 'expense' },
    { id: 2, date: '2024-06-09', description: 'Client Payment', category: 'Revenue', amount: 450000, type: 'income' },
    { id: 3, date: '2024-06-08', description: 'Software License', category: 'IT', amount: -120000, type: 'expense' },
    { id: 4, date: '2024-06-07', description: 'Marketing Campaign', category: 'Marketing', amount: -75000, type: 'expense' },
    { id: 5, date: '2024-06-06', description: 'Product Sales', category: 'Revenue', amount: 320000, type: 'income' }
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

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'scenarios', label: 'What-If Scenarios', icon: TrendingUp },
    { id: 'budgets', label: 'Budgets', icon: Calculator },
    { id: 'assistant', label: 'AI Assistant', icon: Bot }
  ];

  const renderDashboardOverview = () => (
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

  const renderAnalysis = () => (
    <div className="space-y-6">
      {/* Analysis Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Analytics</h2>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
        </div>
      </div>

      {/* Analysis Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Behavior Analysis</CardTitle>
            <CardDescription>Track how costs change with business activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="costs" stroke="#FF6B35" strokeWidth={2} />
                <Line type="monotone" dataKey="revenue" stroke="#F7931E" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Break-even Analysis</CardTitle>
            <CardDescription>Monitor your break-even point trends</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">15</div>
              <div className="text-lg text-gray-600">Days to Break-even</div>
              <div className="text-sm text-green-600 mt-2">↓ 3 days improvement</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ABC Costing Analysis</CardTitle>
            <CardDescription>Activity-based cost distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
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

        <Card>
          <CardHeader>
            <CardTitle>Variance Analysis</CardTitle>
            <CardDescription>Budget vs actual performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#FF6B35" />
                <Bar dataKey="costs" fill="#F7931E" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-orange-500" />
            AI-Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Your variable costs increased 12% this month</p>
                <p className="text-sm text-blue-700">Consider reviewing supplier contracts and operational efficiency</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <Target className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Break-even point improved by 3 days</p>
                <p className="text-sm text-green-700">Your cost optimization efforts are showing positive results</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Product Line A shows highest profitability</p>
                <p className="text-sm text-orange-700">Consider allocating more resources to this segment</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderScenarios = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">What-If Scenario Planning</h2>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Create New Scenario
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scenario Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Scenario Template</Label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a scenario template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-increase">Price Increase Impact</SelectItem>
                  <SelectItem value="cost-reduction">Cost Reduction Analysis</SelectItem>
                  <SelectItem value="volume-change">Volume Change Assessment</SelectItem>
                  <SelectItem value="new-product">New Product Launch</SelectItem>
                  <SelectItem value="market-expansion">Market Expansion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Revenue Change (%)</Label>
              <Slider
                value={revenueChange}
                onValueChange={setRevenueChange}
                max={50}
                min={-50}
                step={1}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">Current: {revenueChange[0]}%</p>
            </div>

            <div>
              <Label>Cost Change (%)</Label>
              <Slider
                value={costChange}
                onValueChange={setCostChange}
                max={50}
                min={-50}
                step={1}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">Current: {costChange[0]}%</p>
            </div>

            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              Run Scenario Analysis
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scenario Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">New Break-even</p>
                  <p className="text-xl font-bold">12 days</p>
                  <p className="text-sm text-green-600">-3 days</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Profit Impact</p>
                  <p className="text-xl font-bold">+₹2.5L</p>
                  <p className="text-sm text-green-600">+15.2%</p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">AI Recommendation</h4>
                <p className="text-sm text-blue-700">
                  This scenario shows promising results. The 5% revenue increase with current cost structure 
                  would significantly improve your break-even timeline and overall profitability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saved Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Q4 Price Optimization', 'Cost Reduction Plan', 'Market Expansion'].map((scenario, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{scenario}</p>
                  <p className="text-sm text-gray-500">Last modified 2 days ago</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">View</Button>
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBudgets = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Budget Management</h2>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Create New Budget
        </Button>
      </div>

      {/* Budget Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budget Utilization</p>
                <p className="text-2xl font-bold">78%</p>
              </div>
              <Progress value={78} className="w-16" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Variance</p>
                <p className="text-2xl font-bold text-green-600">-₹50K</p>
              </div>
              <Badge variant="secondary">Under Budget</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold">₹2.2L</p>
              </div>
              <Badge>22% Left</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Templates</CardTitle>
          <CardDescription>Choose a template to get started quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Operating Budget', 'Capital Budget', 'Cash Flow Budget', 'Project Budget'].map((template) => (
              <Card key={template} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Calculator className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="font-medium">{template}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget vs Actual */}
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#FF6B35" name="Actual Revenue" />
              <Bar dataKey="costs" fill="#F7931E" name="Actual Costs" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardOverview();
      case 'data':
        return (
          <div className="bg-gray-900 min-h-full p-6 rounded-lg">
            <DataUpload />
          </div>
        );
      case 'analysis':
        return renderAnalysis();
      case 'scenarios':
        return renderScenarios();
      case 'budgets':
        return renderBudgets();
      case 'assistant':
        return <AIAssistant />;
      default:
        return renderDashboardOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-[#1A1A1A] text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className={`text-xl font-bold text-orange-500 ${sidebarOpen ? 'block' : 'hidden'}`}>
              Flowz
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-gray-700"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <nav className="mt-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left text-sm transition-colors ${
                activeTab === item.id
                  ? 'bg-orange-500 text-white border-r-4 border-orange-300'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3 text-white" />
              <span className={sidebarOpen ? 'block' : 'hidden'}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 md:hidden"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold capitalize text-gray-900">
              {activeTab === 'scenarios' ? 'What-If Scenarios' : activeTab}
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-white">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
