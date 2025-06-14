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
  BarChart3, 
  FileText, 
  TrendingUp, 
  Settings, 
  DollarSign, 
  Users, 
  MessageCircle,
  Download,
  Share,
  RefreshCw,
  Database
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { AIAssistant } from '@/components/AIAssistant';
import DataUpload from '@/components/DataUpload';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sliderValue, setSliderValue] = useState(50);
  const [selectValue, setSelectValue] = useState('option1');
  const [inputValue, setInputValue] = useState('');

  const data = [
    { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
    { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
    { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
    { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
    { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
    { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
    { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
  ];

  const barChartData = [
    { name: 'A', value: 50 },
    { name: 'B', value: 30 },
    { name: 'C', value: 20 },
    { name: 'D', value: 70 },
  ];

  const pieChartData = [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total Revenue</CardTitle>
                  <CardDescription>Monthly revenue overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">$45,321</div>
                  <Progress value={75} className="mt-2" />
                  <div className="text-sm text-gray-500 mt-1">75% of target</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>Monthly expenses breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">$22,150</div>
                  <Progress value={45} className="mt-2" />
                  <div className="text-sm text-gray-500 mt-1">45% of budget</div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle>Website Visits</CardTitle>
                  <CardDescription>Last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>New Users</CardTitle>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-blue-500" />
                    <div className="text-xl font-semibold">325</div>
                  </div>
                  <div className="text-sm text-green-500">+12% from last month</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sales Performance</CardTitle>
                  <CardDescription>Compared to target</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Demographics</CardTitle>
                  <CardDescription>Based on region</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                        {
                          pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))
                        }
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Reports</h2>
              <div className="space-x-2">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Financial Report</CardTitle>
                <CardDescription>Detailed financial overview</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is a sample financial report. You can customize the content here.</p>
                <ul className="list-disc list-inside mt-4">
                  <li>Revenue: $120,000</li>
                  <li>Expenses: $80,000</li>
                  <li>Profit: $40,000</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        );
      case 'what-if':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">What-If Analysis</h2>
            <Card>
              <CardHeader>
                <CardTitle>Scenario Planning</CardTitle>
                <CardDescription>Explore different scenarios and their impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="scenario">Select Scenario</Label>
                  <Select value={selectValue} onValueChange={setSelectValue}>
                    <SelectTrigger id="scenario">
                      <SelectValue placeholder="Select a scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Optimistic</SelectItem>
                      <SelectItem value="option2">Pessimistic</SelectItem>
                      <SelectItem value="option3">Realistic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="growth">Growth Rate (%)</Label>
                  <Slider
                    id="growth"
                    defaultValue={[sliderValue]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setSliderValue(value[0])}
                  />
                  <p className="text-sm text-gray-500 mt-1">Current value: {sliderValue}%</p>
                </div>
                <div>
                  <Label htmlFor="input">Enter Custom Value</Label>
                  <Input type="number" id="input" placeholder="Enter a value" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                </div>
                <Button>Run Analysis</Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'budgets':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Budget Management</h2>
            <Card>
              <CardHeader>
                <CardTitle>Create and Manage Budgets</CardTitle>
                <CardDescription>Track your income and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This section allows you to create and manage your budgets.</p>
                <Button className="mt-4">Create New Budget</Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'data':
        return (
          <div className="p-6 bg-gray-900 min-h-full">
            <DataUpload />
          </div>
        );
      case 'assistant':
        return <AIAssistant />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold">Welcome to the Dashboard</h2>
            <p>Select a tab to view its content.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md h-16 flex items-center justify-between px-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button variant="ghost">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Navigation Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('data')}
                  className={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'data'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Database className="mr-3 h-5 w-5" />
                  Data
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'reports'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <FileText className="mr-3 h-5 w-5" />
                  Reports
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('what-if')}
                  className={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'what-if'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <TrendingUp className="mr-3 h-5 w-5" />
                  What-If Analysis
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('budgets')}
                  className={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'budgets'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <DollarSign className="mr-3 h-5 w-5" />
                  Budgets
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('assistant')}
                  className={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'assistant'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <MessageCircle className="mr-3 h-5 w-5" />
                  AI Assistant
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
