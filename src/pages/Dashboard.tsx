import { useState, useEffect } from 'react';
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
  Send,
  MessageSquare,
  Plus,
  Edit3,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingDown,
  Zap,
  Lock,
  Unlock,
  UserCheck,
  BarChart3,
  PlusCircle,
  Eye,
  History,
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
import { Textarea } from '@/components/ui/textarea';
import { Bar, BarChart as ReBarChart, ResponsiveContainer, XAxis, YAxis, LineChart as ReLineChart, Line, PieChart as RePieChart, Cell, Pie } from 'recharts';
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

const budgetData = [
  { category: 'Marketing', budgeted: 15000, actual: 12500, variance: -2500 },
  { category: 'Operations', budgeted: 25000, actual: 27000, variance: 2000 },
  { category: 'Sales', budgeted: 20000, actual: 18500, variance: -1500 },
  { category: 'IT', budgeted: 12000, actual: 11200, variance: -800 },
  { category: 'HR', budgeted: 8000, actual: 8500, variance: 500 },
];

const budgetPerformanceData = [
  { month: 'Jan', budget: 50000, actual: 47500 },
  { month: 'Feb', budget: 52000, actual: 49800 },
  { month: 'Mar', budget: 48000, actual: 51200 },
  { month: 'Apr', budget: 55000, actual: 53100 },
  { month: 'May', budget: 51000, actual: 48900 },
  { month: 'Jun', budget: 53000, actual: 55300 },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    // Check localStorage for onboarding completion
    const completed = localStorage.getItem('onboardingCompleted');
    return completed === 'true';
  });
  const [scenarioMode, setScenarioMode] = useState<'builder' | 'chat'>('builder');
  const [chatMessages, setChatMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string}>>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you analyze different business scenarios. You can ask me questions like "What would happen if we increase prices by 10%?" or "How would reducing labor costs by 15% affect our break-even point?"'
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [budgetWizardStep, setBudgetWizardStep] = useState(1);
  const [selectedBudgetType, setSelectedBudgetType] = useState('');
  const [budgetTimePeriod, setBudgetTimePeriod] = useState('');

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboardingCompleted', 'true');
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: currentMessage
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: generateAIResponse(currentMessage)
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const generateAIResponse = (message: string) => {
    // Simple response logic (replace with actual AI)
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('price') && lowerMessage.includes('increase')) {
      return "Based on your current data, a 10% price increase could improve your profit margin by approximately 18%. However, you might see a 5-8% decrease in volume. Your new break-even point would be around 14 days (improvement of 4 days). Would you like me to create a detailed scenario analysis?";
    } else if (lowerMessage.includes('cost') && lowerMessage.includes('reduce')) {
      return "Reducing costs by 15% could significantly improve your profitability. Based on your cost structure, this could increase your net profit by $18,500 monthly and reduce your break-even point to 12 days. The main areas to focus on would be labor efficiency and material sourcing. Shall I break this down by cost category?";
    } else if (lowerMessage.includes('break-even')) {
      return "Your current break-even point is 18 days. To improve this, you could: 1) Increase prices by 8-12%, 2) Reduce variable costs by 10-15%, or 3) Improve your product mix to focus on higher-margin items. Which approach interests you most?";
    } else {
      return "I can help you analyze various scenarios including price changes, cost reductions, volume adjustments, and new product launches. Could you be more specific about what scenario you'd like to explore? For example, you could ask about the impact of changing prices, reducing costs, or launching new products.";
    }
  };

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <BusinessOnboarding onComplete={handleOnboardingComplete} />;
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
                      <Pie
                        data={pieData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
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
            {/* Scenario Builder Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">What-If Scenarios</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-[#1A1A1A] rounded-lg p-1">
                  <Button
                    onClick={() => setScenarioMode('builder')}
                    variant={scenarioMode === 'builder' ? 'default' : 'ghost'}
                    size="sm"
                    className={scenarioMode === 'builder' ? 'bg-[#FF6B35] hover:bg-[#e55a2b]' : 'text-gray-400 hover:text-white'}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Builder Mode
                  </Button>
                  <Button
                    onClick={() => setScenarioMode('chat')}
                    variant={scenarioMode === 'chat' ? 'default' : 'ghost'}
                    size="sm"
                    className={scenarioMode === 'chat' ? 'bg-[#FF6B35] hover:bg-[#e55a2b]' : 'text-gray-400 hover:text-white'}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    AI Chat
                  </Button>
                </div>
                {scenarioMode === 'builder' && (
                  <>
                    <Select>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Scenario Templates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price-increase">Price Increase Impact</SelectItem>
                        <SelectItem value="cost-reduction">Cost Reduction Analysis</SelectItem>
                        <SelectItem value="volume-change">Volume Change Assessment</SelectItem>
                        <SelectItem value="new-product">New Product Launch</SelectItem>
                        <SelectItem value="market-expansion">Market Expansion</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]">
                      Create New Scenario
                    </Button>
                  </>
                )}
              </div>
            </div>

            {scenarioMode === 'chat' ? (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* AI Chat Interface */}
                <Card className="bg-[#2D2D2D] border-gray-700 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Bot className="h-5 w-5 mr-2 text-[#06FFA5]" />
                      AI Scenario Assistant
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Ask questions about different business scenarios and get instant analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Chat Messages */}
                    <div className="h-96 overflow-y-auto space-y-4 p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-[#FF6B35] text-white'
                                : 'bg-[#2D2D2D] text-white border border-gray-600'
                            }`}
                          >
                            <div className="text-sm">{message.content}</div>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-[#2D2D2D] text-white border border-gray-600 p-3 rounded-lg">
                            <div className="flex items-center space-x-1">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              </div>
                              <span className="text-xs text-gray-400 ml-2">AI is typing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Textarea
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="Ask about scenarios like 'What if we increase prices by 10%?' or 'How would reducing costs affect profitability?'"
                        className="flex-1 min-h-[60px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim() || isTyping}
                        className="bg-[#FF6B35] hover:bg-[#e55a2b] px-4"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quick Suggestions */}
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Quick suggestions:</div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "What if we increase prices by 15%?",
                          "How would reducing labor costs by 20% affect profitability?",
                          "What's the impact of launching a new product line?",
                          "How would a 25% volume increase affect our break-even?"
                        ].map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs text-gray-300 border-gray-600 hover:bg-[#2D2D2D]"
                            onClick={() => setCurrentMessage(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Live Results Panel */}
                <Card className="bg-[#2D2D2D] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-[#06FFA5]" />
                      Live Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-[#1A1A1A] rounded-lg border border-gray-600">
                        <div className="text-sm text-[#06FFA5] mb-1">Current Break-even</div>
                        <div className="text-lg font-bold text-white">18 Days</div>
                      </div>
                      <div className="p-3 bg-[#1A1A1A] rounded-lg border border-gray-600">
                        <div className="text-sm text-[#F7931E] mb-1">Profit Impact</div>
                        <div className="text-lg font-bold text-white">+$24,500</div>
                      </div>
                      <div className="p-3 bg-[#1A1A1A] rounded-lg border border-gray-600">
                        <div className="text-sm text-[#FFD23F] mb-1">Risk Level</div>
                        <div className="text-lg font-bold text-white">Medium</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">AI Confidence</div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-[#06FFA5] h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <div className="text-xs text-gray-500">85% confidence</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                {/* Scenario Input Form */}
                <Card className="bg-[#2D2D2D] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Scenario Builder</CardTitle>
                    <CardDescription className="text-gray-400">
                      Create and analyze different business scenarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Scenario Name</label>
                        <input 
                          type="text" 
                          placeholder="Enter scenario name..."
                          className="w-full px-3 py-2 bg-[#1A1A1A] border border-gray-600 rounded-md text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Base Period</label>
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select base period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="current-month">Current Month</SelectItem>
                            <SelectItem value="last-quarter">Last Quarter</SelectItem>
                            <SelectItem value="last-year">Last Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Variable Adjustment Sliders */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Variable Adjustments</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium text-gray-400">Revenue Change</label>
                            <span className="text-[#06FFA5]">+15%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-[#06FFA5] h-2 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium text-gray-400">Labor Costs</label>
                            <span className="text-[#FF6B35]">-8%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-[#FF6B35] h-2 rounded-full" style={{ width: '42%' }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium text-gray-400">Material Costs</label>
                            <span className="text-[#F7931E]">+5%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-[#F7931E] h-2 rounded-full" style={{ width: '55%' }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium text-gray-400">Volume Change</label>
                            <span className="text-[#FFD23F]">+12%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-[#FFD23F] h-2 rounded-full" style={{ width: '62%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Time Period</label>
                      <Select>
                        <SelectTrigger className="w-full md:w-[200px]">
                          <SelectValue placeholder="Select time period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-month">1 Month</SelectItem>
                          <SelectItem value="3-months">3 Months</SelectItem>
                          <SelectItem value="6-months">6 Months</SelectItem>
                          <SelectItem value="1-year">1 Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* CVP Analysis Section */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="bg-[#2D2D2D] border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Calculator className="h-5 w-5 mr-2 text-[#06FFA5]" />
                        CVP Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Break-even Point</span>
                          <span className="text-[#06FFA5] font-bold">16 Days</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Profit Impact</span>
                          <span className="text-[#06FFA5] font-bold">+$24,500</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Risk Level</span>
                          <span className="text-[#FFD23F]">Medium</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 mt-4">
                          <div className="bg-gradient-to-r from-[#06FFA5] to-[#FF6B35] h-3 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                        <div className="text-xs text-gray-500 text-center">Scenario Confidence: 78%</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#2D2D2D] border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-[#F7931E]" />
                        Profit Impact Visualization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={150}>
                        <ReBarChart data={[
                          { period: 'Current', profit: 20000 },
                          { period: 'Scenario', profit: 44500 },
                        ]}>
                          <XAxis dataKey="period" stroke="#888888" fontSize={12} />
                          <YAxis stroke="#888888" fontSize={12} />
                          <Bar dataKey="profit" fill="#06FFA5" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Comparison View */}
                <Card className="bg-[#2D2D2D] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Scenario Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left py-3 text-gray-400">Metric</th>
                            <th className="text-left py-3 text-gray-400">Current</th>
                            <th className="text-left py-3 text-gray-400">Scenario A</th>
                            <th className="text-left py-3 text-gray-400">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="py-3 text-white">Revenue</td>
                            <td className="py-3 text-white">$45,231</td>
                            <td className="py-3 text-white">$52,016</td>
                            <td className="py-3 text-[#06FFA5]">+15%</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="py-3 text-white">Total Costs</td>
                            <td className="py-3 text-white">$21,120</td>
                            <td className="py-3 text-white">$19,516</td>
                            <td className="py-3 text-[#06FFA5]">-7.6%</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="py-3 text-white">Net Profit</td>
                            <td className="py-3 text-white">$24,111</td>
                            <td className="py-3 text-white">$32,500</td>
                            <td className="py-3 text-[#06FFA5]">+34.8%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Time Horizon Analysis */}
                <Card className="bg-[#2D2D2D] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-[#FFD23F]" />
                      Time Horizon Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                        <div className="text-sm text-[#06FFA5] mb-2">Short-term (1-3 months)</div>
                        <div className="text-white text-lg font-bold">+$8,500</div>
                        <div className="text-xs text-gray-400">Risk: Low (85%)</div>
                      </div>
                      <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                        <div className="text-sm text-[#F7931E] mb-2">Medium-term (3-12 months)</div>
                        <div className="text-white text-lg font-bold">+$24,500</div>
                        <div className="text-xs text-gray-400">Risk: Medium (70%)</div>
                      </div>
                      <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                        <div className="text-sm text-[#FFD23F] mb-2">Long-term (1+ years)</div>
                        <div className="text-white text-lg font-bold">+$95,000</div>
                        <div className="text-xs text-gray-400">Risk: High (55%)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Scenario Management */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="bg-[#2D2D2D] border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Saved Scenarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                          <div>
                            <div className="text-white">Price Increase 10%</div>
                            <div className="text-xs text-gray-400">Created 2 days ago</div>
                          </div>
                          <Button variant="outline" size="sm" className="text-white border-gray-600">
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                          <div>
                            <div className="text-white">Cost Reduction Plan</div>
                            <div className="text-xs text-gray-400">Created 1 week ago</div>
                          </div>
                          <Button variant="outline" size="sm" className="text-white border-gray-600">
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#2D2D2D] border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">AI Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                          <div className="text-green-400 text-sm mb-1">High Confidence</div>
                          <div className="text-white text-sm">Consider implementing the cost reduction scenario first</div>
                        </div>
                        <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                          <div className="text-yellow-400 text-sm mb-1">Medium Risk</div>
                          <div className="text-white text-sm">Monitor market conditions before price increases</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Scenario Actions */}
                <Card className="bg-[#2D2D2D] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Scenario Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]">
                        <FileText className="h-4 w-4 mr-2" />
                        Export Scenario Report
                      </Button>
                      <Button variant="outline" className="text-white border-gray-600">
                        <Share className="h-4 w-4 mr-2" />
                        Share Scenario
                      </Button>
                      <Button variant="outline" className="text-white border-gray-600">
                        <Download className="h-4 w-4 mr-2" />
                        Download Analysis
                      </Button>
                      <Button variant="outline" className="text-white border-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        View History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        );
      case 'budgets':
        return (
          <div className="space-y-6">
            {/* Budget Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">Budget Management</h2>
              <div className="flex flex-wrap items-center gap-3">
                <Select>
                  <SelectTrigger className="w-[150px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-month">Current Month</SelectItem>
                    <SelectItem value="current-quarter">Current Quarter</SelectItem>
                    <SelectItem value="current-year">Current Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Budget
                </Button>
              </div>
            </div>

            {/* Budget Status Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Budget</CardTitle>
                  <DollarSign className="h-4 w-4 text-[#06FFA5]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">$2,450,000</div>
                  <p className="text-xs text-gray-500">Annual allocation</p>
                </CardContent>
              </Card>

              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Spent to Date</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#F7931E]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">$1,247,500</div>
                  <p className="text-xs text-gray-500">51% of total budget</p>
                </CardContent>
              </Card>

              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Remaining</CardTitle>
                  <Target className="h-4 w-4 text-[#06FFA5]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">$1,202,500</div>
                  <p className="text-xs text-gray-500">49% remaining</p>
                </CardContent>
              </Card>

              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Variance</CardTitle>
                  <TrendingDown className="h-4 w-4 text-[#FFD23F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">-$23,400</div>
                  <p className="text-xs text-gray-500">2.1% under budget</p>
                </CardContent>
              </Card>
            </div>

            {/* Budget vs Actual Comparison */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-[#FF6B35]" />
                    Budget vs Actual by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <ReBarChart data={budgetData}>
                      <XAxis dataKey="category" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} />
                      <Bar dataKey="budgeted" fill="#06FFA5" name="Budgeted" />
                      <Bar dataKey="actual" fill="#FF6B35" name="Actual" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <LineChart className="h-5 w-5 mr-2 text-[#06FFA5]" />
                    Budget Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <ReLineChart data={budgetPerformanceData}>
                      <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} />
                      <Line type="monotone" dataKey="budget" stroke="#06FFA5" strokeWidth={2} />
                      <Line type="monotone" dataKey="actual" stroke="#FF6B35" strokeWidth={2} />
                    </ReLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Variance Alerts Section */}
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-[#FFD23F]" />
                  Variance Alerts & Budget Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-700 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-white">Operations budget exceeded by 8%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 text-sm">$2,000 over</span>
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
                      <span className="text-white">Marketing spending 83% of monthly allocation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 text-sm">$2,500 remaining</span>
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-white">Sales department under budget by $1,500</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-sm">Good performance</span>
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Templates Section */}
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Budget Creation Templates</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose from pre-built budget templates based on your business needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-[#1A1A1A] border-gray-600 cursor-pointer hover:border-[#FF6B35] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <Calculator className="h-6 w-6 text-[#06FFA5] mr-2" />
                        <h3 className="text-white font-semibold">Operating Budget</h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">Day-to-day operational expenses and revenue projections</p>
                      <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-sm">
                        Create Budget
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1A1A1A] border-gray-600 cursor-pointer hover:border-[#FF6B35] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <TrendingUp className="h-6 w-6 text-[#F7931E] mr-2" />
                        <h3 className="text-white font-semibold">Capital Budget</h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">Long-term investments and capital expenditures</p>
                      <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-sm">
                        Create Budget
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1A1A1A] border-gray-600 cursor-pointer hover:border-[#FF6B35] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <Activity className="h-6 w-6 text-[#FFD23F] mr-2" />
                        <h3 className="text-white font-semibold">Cash Flow Budget</h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">Cash inflows and outflows management</p>
                      <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-sm">
                        Create Budget
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1A1A1A] border-gray-600 cursor-pointer hover:border-[#FF6B35] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <Target className="h-6 w-6 text-[#06FFA5] mr-2" />
                        <h3 className="text-white font-semibold">Project Budget</h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">Specific project cost allocation and tracking</p>
                      <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-sm">
                        Create Budget
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Budget Setup Wizard (shown when creating budget) */}
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-[#FF6B35]" />
                  Budget Setup Wizard - Step {budgetWizardStep} of 4
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Set up your budget in 4 simple steps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Indicator */}
                <div className="flex items-center justify-between">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step <= budgetWizardStep ? 'bg-[#FF6B35] text-white' : 'bg-gray-600 text-gray-400'
                      }`}>
                        {step}
                      </div>
                      {step < 4 && (
                        <div className={`w-16 h-1 ${
                          step < budgetWizardStep ? 'bg-[#FF6B35]' : 'bg-gray-600'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step Content */}
                {budgetWizardStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Step 1: Budget Type & Time Period</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Budget Type</label>
                        <Select value={selectedBudgetType} onValueChange={setSelectedBudgetType}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select budget type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="operating">Operating Budget</SelectItem>
                            <SelectItem value="capital">Capital Budget</SelectItem>
                            <SelectItem value="cashflow">Cash Flow Budget</SelectItem>
                            <SelectItem value="project">Project Budget</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Time Period</label>
                        <Select value={budgetTimePeriod} onValueChange={setBudgetTimePeriod}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select time period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {budgetWizardStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Step 2: Revenue Projections by Category</h3>
                    <div className="space-y-3">
                      {['Product Sales', 'Service Revenue', 'Consulting', 'Other Revenue'].map((category) => (
                        <div key={category} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                          <span className="text-white">{category}</span>
                          <input 
                            type="number" 
                            placeholder="Amount"
                            className="w-32 px-3 py-1 bg-[#2D2D2D] border border-gray-600 rounded text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {budgetWizardStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Step 3: Expense Allocations by Department</h3>
                    <div className="space-y-3">
                      {['Marketing', 'Sales', 'Operations', 'IT', 'HR', 'Finance'].map((dept) => (
                        <div key={dept} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                          <span className="text-white">{dept}</span>
                          <input 
                            type="number" 
                            placeholder="Budget allocation"
                            className="w-32 px-3 py-1 bg-[#2D2D2D] border border-gray-600 rounded text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {budgetWizardStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Step 4: Review & Approval Workflow</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                        <h4 className="text-white font-medium mb-2">Budget Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Revenue:</span>
                            <span className="text-white">$2,450,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Expenses:</span>
                            <span className="text-white">$1,890,000</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-400">Net Profit:</span>
                            <span className="text-[#06FFA5]">$560,000</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Approval Workflow</label>
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select approvers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager">Department Manager</SelectItem>
                            <SelectItem value="finance">Finance Director</SelectItem>
                            <SelectItem value="cfo">CFO</SelectItem>
                            <SelectItem value="ceo">CEO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    className="text-white border-gray-600"
                    onClick={() => setBudgetWizardStep(Math.max(1, budgetWizardStep - 1))}
                    disabled={budgetWizardStep === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    className="bg-[#FF6B35] hover:bg-[#e55a2b]"
                    onClick={() => setBudgetWizardStep(Math.min(4, budgetWizardStep + 1))}
                  >
                    {budgetWizardStep === 4 ? 'Create Budget' : 'Next'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Budget Monitoring & Controls */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-[#06FFA5]" />
                    Real-time Budget Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Monthly Progress</span>
                      <span className="text-white">67%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-[#06FFA5] h-2 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Department Spending</div>
                    {budgetData.slice(0, 3).map((dept) => (
                      <div key={dept.category} className="flex justify-between items-center">
                        <span className="text-white text-sm">{dept.category}</span>
                        <span className={`text-sm ${dept.variance < 0 ? 'text-[#06FFA5]' : 'text-[#FF6B35]'}`}>
                          {((dept.actual / dept.budgeted) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lock className="h-5 w-5 mr-2 text-[#FFD23F]" />
                    Budget Controls & Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                      <div className="flex items-center">
                        <UserCheck className="h-4 w-4 text-[#06FFA5] mr-2" />
                        <span className="text-white">Budget Approval</span>
                      </div>
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                      <div className="flex items-center">
                        <Lock className="h-4 w-4 text-[#FFD23F] mr-2" />
                        <span className="text-white">Budget Locked</span>
                      </div>
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <Unlock className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                      <div className="flex items-center">
                        <History className="h-4 w-4 text-[#F7931E] mr-2" />
                        <span className="text-white">Revision History</span>
                      </div>
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Alert Thresholds</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">Warning at</span>
                        <span className="text-[#FFD23F]">80%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">Critical at</span>
                        <span className="text-[#FF6B35]">95%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights Panel */}
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-[#06FFA5]" />
                  AI-Powered Budget Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                    <div className="text-sm text-[#06FFA5] mb-2">Budget Recommendation</div>
                    <div className="text-white text-sm">Increase marketing budget by 15% for Q4 to capitalize on seasonal trends</div>
                    <div className="text-xs text-gray-400 mt-2">Confidence: 87%</div>
                  </div>
                  
                  <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                    <div className="text-sm text-[#F7931E] mb-2">Spending Pattern</div>
                    <div className="text-white text-sm">Operations spending peaks mid-month. Consider spreading costs more evenly</div>
                    <div className="text-xs text-gray-400 mt-2">Savings: $3,200/month</div>
                  </div>
                  
                  <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                    <div className="text-sm text-[#FFD23F] mb-2">Seasonal Adjustment</div>
                    <div className="text-white text-sm">Historical data suggests 20% increase in sales during holiday season</div>
                    <div className="text-xs text-gray-400 mt-2">Based on 3-year trend</div>
                  </div>
                  
                  <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
                    <div className="text-sm text-[#06FFA5] mb-2">Industry Benchmark</div>
                    <div className="text-white text-sm">Your IT spending is 12% below industry average. Consider technology investments</div>
                    <div className="text-xs text-gray-400 mt-2">Industry avg: 8.5%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Actions */}
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Budget Management Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Budget Report
                  </Button>
                  <Button variant="outline" className="text-white border-gray-600">
                    <Download className="h-4 w-4 mr-2" />
                    Export Budget Data
                  </Button>
                  <Button variant="outline" className="text-white border-gray-600">
                    <Share className="h-4 w-4 mr-2" />
                    Share with Team
                  </Button>
                  <Button variant="outline" className="text-white border-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Review
                  </Button>
                  <Button variant="outline" className="text-white border-gray-600">
                    <Zap className="h-4 w-4 mr-2" />
                    Set Alerts
                  </Button>
                </div>
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
