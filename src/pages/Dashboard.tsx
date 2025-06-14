
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bell,
  Home,
  LineChart,
  Package2,
  PieChart,
  Settings,
  Users,
  Database,
  Calculator,
  Bot,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Share,
  Clock,
  FileText,
  AlertTriangle,
  Target,
  Activity,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bar, BarChart as ReBarChart, ResponsiveContainer, XAxis, YAxis, LineChart as ReLineChart, Line, PieChart as RePieChart, Cell } from 'recharts';
import BusinessOnboarding from '@/components/BusinessOnboarding';
import DataUpload from '@/components/DataUpload';

const data = [
  { name: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Feb', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Apr', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'May', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Jun', total: Math.floor(Math.random() * 5000) + 1000 },
];

const lineData = [
  { month: 'Jan', fixed: 2000, variable: 1500 },
  { month: 'Feb', fixed: 2000, variable: 1800 },
  { month: 'Mar', fixed: 2000, variable: 2100 },
  { month: 'Apr', fixed: 2000, variable: 1900 },
  { month: 'May', fixed: 2000, variable: 2300 },
  { month: 'Jun', fixed: 2000, variable: 2500 },
];

const pieData = [
  { name: 'Product A', value: 35, color: '#FF6B35' },
  { name: 'Product B', value: 25, color: '#F7931E' },
  { name: 'Product C', value: 20, color: '#FFD23F' },
  { name: 'Product D', value: 20, color: '#06FFA5' },
];

const varianceData = [
  { category: 'Labor', budget: 5000, actual: 5200 },
  { category: 'Materials', budget: 3000, actual: 2800 },
  { category: 'Overhead', budget: 2000, actual: 2300 },
  { category: 'Marketing', budget: 1500, actual: 1400 },
];

const contributionData = [
  { product: 'Product A', revenue: 10000, variable: 6000, contribution: 4000 },
  { product: 'Product B', revenue: 8000, variable: 5500, contribution: 2500 },
  { product: 'Product C', revenue: 6000, variable: 4200, contribution: 1800 },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <BusinessOnboarding onComplete={() => setHasCompletedOnboarding(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'data':
        return <DataUpload />;
      case 'analysis':
        return (
          <div className="space-y-6">
            {/* Analytics Overview Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">Financial Analysis</h2>
              <div className="flex flex-wrap items-center gap-3">
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-30">Last 30 Days</SelectItem>
                    <SelectItem value="last-90">Last 90 Days</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="overhead">Overhead</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]">
                  <Download className="h-4 w-4 mr-2" />
                  Export Reports
                </Button>
              </div>
            </div>

            {/* Analysis Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Row 1 */}
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <LineChart className="h-5 w-5 mr-2 text-[#FF6B35]" />
                    Cost Behavior Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <ReLineChart data={lineData}>
                      <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} />
                      <Line type="monotone" dataKey="fixed" stroke="#06FFA5" strokeWidth={2} />
                      <Line type="monotone" dataKey="variable" stroke="#FF6B35" strokeWidth={2} />
                    </ReLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-[#06FFA5]" />
                    Break-even Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#06FFA5] mb-2">18 Days</div>
                      <div className="text-gray-400">Break-even Point</div>
                      <div className="text-sm text-gray-500 mt-2">3 days improvement</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Row 2 */}
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-[#F7931E]" />
                    ABC Costing Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RePieChart>
                      <PieChart
                        data={pieData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </PieChart>
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-[#FFD23F]" />
                    Variance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <ReBarChart data={varianceData}>
                      <XAxis dataKey="category" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} />
                      <Bar dataKey="budget" fill="#06FFA5" />
                      <Bar dataKey="actual" fill="#FF6B35" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Row 3 */}
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-[#06FFA5]" />
                    Contribution Margin Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <ReBarChart data={contributionData} layout="horizontal">
                      <XAxis type="number" stroke="#888888" fontSize={12} />
                      <YAxis dataKey="product" type="category" stroke="#888888" fontSize={12} />
                      <Bar dataKey="contribution" fill="#06FFA5" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Target className="h-5 w-5 mr-2 text-[#F7931E]" />
                    Benchmarking Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Industry Average</span>
                      <span className="text-white">85%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Your Performance</span>
                      <span className="text-[#06FFA5]">92%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Top Quartile</span>
                      <span className="text-white">95%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                      <div className="bg-[#06FFA5] h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Insights Section */}
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-[#06FFA5]" />
                  AI-Generated Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                    <div className="text-sm text-[#FF6B35] mb-2">Cost Analysis</div>
                    <div className="text-white">Your variable costs increased 12% this month</div>
                  </div>
                  <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                    <div className="text-sm text-[#06FFA5] mb-2">Break-even Point</div>
                    <div className="text-white">Break-even point improved by 3 days</div>
                  </div>
                  <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                    <div className="text-sm text-[#F7931E] mb-2">Profitability</div>
                    <div className="text-white">Product Line A shows highest profitability</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alert Notifications */}
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-[#FFD23F]" />
                  Alert Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-700 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-white">Target costing variance: 15% over budget</span>
                    </div>
                    <span className="text-red-400 text-sm">High</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
                      <span className="text-white">Budget deviation in Marketing: 8% under</span>
                    </div>
                    <span className="text-yellow-400 text-sm">Medium</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700 rounded-lg">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-white">Performance above industry benchmark</span>
                    </div>
                    <span className="text-green-400 text-sm">Good</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Actions */}
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Analysis Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Full Report
                  </Button>
                  <Button variant="outline" className="text-white border-gray-600">
                    <Share className="h-4 w-4 mr-2" />
                    Share Analysis
                  </Button>
                  <Button variant="outline" className="text-white border-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Report
                  </Button>
                  <Button variant="outline" className="text-white border-gray-600">
                    <Download className="h-4 w-4 mr-2" />
                    Download Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'scenarios':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">What-If Scenarios</h2>
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Scenario Planning</CardTitle>
                <CardDescription className="text-gray-400">
                  Create and analyze different business scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="bg-primary hover:bg-secondary">Create New Scenario</Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'budgets':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Budget Management</h2>
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Budget Overview</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage and track your budgets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="bg-primary hover:bg-secondary">Create New Budget</Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Chat with AI</CardTitle>
                <CardDescription className="text-gray-400">
                  Get insights and analysis from your AI assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center text-gray-400 border border-gray-600 rounded">
                  AI Chat Interface - Coming Soon
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Welcome to Flowz Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                  <span className="text-green-500">$</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">$45,231.89</div>
                  <p className="text-xs text-gray-500">+20.1% from last month</p>
                </CardContent>
              </Card>
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Costs</CardTitle>
                  <span className="text-red-500">$</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">$21,120.50</div>
                  <p className="text-xs text-gray-500">+12.4% from last month</p>
                </CardContent>
              </Card>
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Gross Profit</CardTitle>
                  <span className="text-primary">$</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">$24,111.39</div>
                  <p className="text-xs text-gray-500">+28.2% from last month</p>
                </CardContent>
              </Card>
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Net Profit Margin</CardTitle>
                  <span className="text-primary">%</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">53.3%</div>
                  <p className="text-xs text-gray-500">+2.5% from last month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setActiveTab('data')}
                    className="w-full bg-primary hover:bg-secondary"
                  >
                    Upload Financial Data
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('analysis')}
                    variant="outline" 
                    className="w-full text-white border-gray-600"
                  >
                    Generate Analysis Report
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('ai')}
                    variant="outline" 
                    className="w-full text-white border-gray-600"
                  >
                    Chat with AI Assistant
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#2D2D2D] border-gray-700 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <ReBarChart data={data}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                      <Bar dataKey="total" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-[#1A1A1A]">
      <div className="hidden border-r bg-[#2D2D2D] md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold text-white">
              <Package2 className="h-6 w-6 text-primary" />
              <span>Flowz Inc</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8 bg-transparent border-gray-600 text-white">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 text-gray-400">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-left ${
                  activeTab === 'dashboard' ? 'bg-primary text-white' : 'hover:text-white'
                }`}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-left ${
                  activeTab === 'data' ? 'bg-primary text-white' : 'hover:text-white'
                }`}
              >
                <Database className="h-4 w-4" />
                Data
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-left ${
                  activeTab === 'analysis' ? 'bg-primary text-white' : 'hover:text-white'
                }`}
              >
                <LineChart className="h-4 w-4" />
                Analysis
              </button>
              <button
                onClick={() => setActiveTab('scenarios')}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-left ${
                  activeTab === 'scenarios' ? 'bg-primary text-white' : 'hover:text-white'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                What-If Scenarios
              </button>
              <button
                onClick={() => setActiveTab('budgets')}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-left ${
                  activeTab === 'budgets' ? 'bg-primary text-white' : 'hover:text-white'
                }`}
              >
                <Calculator className="h-4 w-4" />
                Budgets
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-left ${
                  activeTab === 'ai' ? 'bg-primary text-white' : 'hover:text-white'
                }`}
              >
                <Bot className="h-4 w-4" />
                AI Assistant
              </button>
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card className="bg-[#1A1A1A] border-gray-700">
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle className="text-white">Upgrade to Pro</CardTitle>
                <CardDescription className="text-gray-400">
                  Unlock all features and get unlimited access to our support team.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full bg-primary hover:bg-secondary">
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-[#2D2D2D] px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold text-white">
              {activeTab === 'dashboard' ? 'Dashboard' : 
               activeTab === 'data' ? 'Data Management' :
               activeTab === 'analysis' ? 'Analysis' :
               activeTab === 'scenarios' ? 'What-If Scenarios' :
               activeTab === 'budgets' ? 'Budgets' :
               activeTab === 'ai' ? 'AI Assistant' : 'Dashboard'}
            </h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full text-white">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:px-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
