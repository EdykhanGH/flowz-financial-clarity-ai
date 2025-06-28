
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Send, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  BarChart3,
  Calculator,
  Target
} from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface BusinessInsight {
  type: 'warning' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

const EnhancedAIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { transactions } = useTransactions();
  const { categories } = useBusinessCategories();

  // Generate business insights based on transaction data
  const generateBusinessInsights = (): BusinessInsight[] => {
    const insights: BusinessInsight[] = [];
    
    // Revenue analysis
    const totalRevenue = transactions
      .filter(t => t.type === 'income' || t.type === 'refund')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalCosts = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Profit margin analysis
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;
    
    if (profitMargin < 10) {
      insights.push({
        type: 'warning',
        title: 'Low Profit Margin Detected',
        description: `Your current profit margin is ${profitMargin.toFixed(1)}%, which is below the recommended 15-20% for sustainable growth.`,
        action: 'Review pricing strategy or reduce operational costs',
        priority: 'high'
      });
    }

    // Cost trend analysis
    const recentTransactions = transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const avgRecentCost = recentTransactions.reduce((sum, t) => sum + Number(t.amount), 0) / recentTransactions.length;
    
    if (avgRecentCost > 0) {
      const highCostTransactions = recentTransactions.filter(t => Number(t.amount) > avgRecentCost * 2);
      
      if (highCostTransactions.length > 2) {
        insights.push({
          type: 'warning',
          title: 'Unusual High-Cost Transactions',
          description: `Detected ${highCostTransactions.length} transactions significantly above average spending.`,
          action: 'Review these transactions for accuracy and necessity',
          priority: 'medium'
        });
      }
    }

    // Category concentration risk
    const categorySpending = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const topCategory = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)[0];

    if (topCategory && topCategory[1] > totalCosts * 0.6) {
      insights.push({
        type: 'warning',
        title: 'High Category Concentration',
        description: `${Math.round((topCategory[1] / totalCosts) * 100)}% of your costs are in ${topCategory[0]}. This creates risk concentration.`,
        action: 'Consider diversifying cost structure',
        priority: 'medium'
      });
    }

    // Growth opportunity
    if (totalRevenue > totalCosts && profitMargin > 15) {
      insights.push({
        type: 'opportunity',
        title: 'Growth Opportunity Identified',
        description: 'Your business shows healthy profit margins. Consider reinvesting in growth initiatives.',
        action: 'Explore expansion opportunities or marketing investments',
        priority: 'low'
      });
    }

    return insights;
  };

  const businessInsights = generateBusinessInsights();

  // Predefined quick actions based on business context
  const quickActions = [
    "Analyze my profit margins",
    "Show cost breakdown by category",
    "Identify cost-saving opportunities",
    "Generate monthly financial summary",
    "Forecast next quarter revenue",
    "Compare this month vs last month",
    "Identify unusual expenses",
    "Budget recommendations"
  ];

  // Simulate AI response based on business data
  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('profit') || input.includes('margin')) {
      const totalRevenue = transactions
        .filter(t => t.type === 'income' || t.type === 'refund')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalCosts = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;
      
      return `Based on your transaction data, your current profit margin is ${profitMargin.toFixed(1)}%. 
      
Revenue: ₦${totalRevenue.toLocaleString()}
Costs: ₦${totalCosts.toLocaleString()}
Net Profit: ₦${(totalRevenue - totalCosts).toLocaleString()}

${profitMargin < 15 ? 
  '⚠️ Your profit margin is below the recommended 15-20%. Consider reviewing your pricing strategy or reducing operational costs.' :
  '✅ Your profit margin looks healthy! Consider reinvesting in growth opportunities.'
}`;
    }

    if (input.includes('cost') && (input.includes('breakdown') || input.includes('category'))) {
      const categorySpending = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const category = t.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + Number(t.amount);
          return acc;
        }, {} as Record<string, number>);

      const sortedCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      let response = "Here's your cost breakdown by top categories:\n\n";
      sortedCategories.forEach(([category, amount], index) => {
        response += `${index + 1}. ${category}: ₦${amount.toLocaleString()}\n`;
      });

      response += `\n💡 Focus on optimizing your top spending categories for maximum impact on cost reduction.`;
      
      return response;
    }

    if (input.includes('forecast') || input.includes('predict')) {
      const recentRevenue = transactions
        .filter(t => t.type === 'income' || t.type === 'refund')
        .slice(-6)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const avgMonthlyRevenue = recentRevenue / 6;
      const projectedQuarterly = avgMonthlyRevenue * 3 * 1.05; // 5% growth assumption
      
      return `Based on your recent performance trends:

Average Monthly Revenue: ₦${avgMonthlyRevenue.toLocaleString()}
Projected Quarterly Revenue: ₦${projectedQuarterly.toLocaleString()}

📈 This assumes a 5% growth rate. Actual results may vary based on market conditions, seasonal factors, and business initiatives.

Recommendations:
• Monitor key performance indicators monthly
• Adjust forecasts based on market feedback
• Plan for seasonal variations in your business`;
    }

    if (input.includes('save') || input.includes('reduce') || input.includes('optimize')) {
      return `Based on your spending patterns, here are cost optimization opportunities:

🎯 **Immediate Actions:**
• Review recurring subscriptions and services
• Negotiate better rates with top suppliers
• Consolidate purchases for bulk discounts

📊 **Medium-term Strategies:**
• Implement spend controls for discretionary expenses
• Automate routine processes to reduce labor costs
• Consider alternative suppliers for major expense categories

💡 **Long-term Planning:**
• Invest in technology to improve efficiency
• Develop strategic partnerships for better pricing
• Create detailed budgets for each cost center`;
    }

    // Default response
    return `I'm here to help you analyze your business finances and make data-driven decisions. 

I can assist you with:
📊 Financial analysis and reporting
💰 Cost optimization strategies  
📈 Revenue forecasting
⚠️ Risk identification
💡 Growth recommendations

What specific aspect of your business would you like to explore?`;
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(inputValue),
        timestamp: new Date(),
        suggestions: quickActions.slice(0, 3)
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    handleSendMessage();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: `Welcome to your AI Business Intelligence Assistant! 🤖

I've analyzed your business data and I'm ready to help you with:
• Financial analysis and insights
• Cost optimization recommendations  
• Revenue forecasting
• Budget planning and variance analysis

What would you like to explore today?`,
        timestamp: new Date(),
        suggestions: quickActions.slice(0, 4)
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Business Assistant</h2>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Powered by Business Intelligence
        </Badge>
      </div>

      {/* Business Insights Panel */}
      {businessInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-orange-500" />
              Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {businessInsights.slice(0, 3).map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'warning'
                      ? 'bg-red-50 border-l-red-500'
                      : insight.type === 'opportunity'
                      ? 'bg-green-50 border-l-green-500'
                      : 'bg-blue-50 border-l-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        {insight.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                        ) : insight.type === 'opportunity' ? (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                        ) : (
                          <Target className="w-4 h-4 text-blue-500 mr-2" />
                        )}
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                      {insight.action && (
                        <p className="text-xs text-gray-500 mt-1">💡 {insight.action}</p>
                      )}
                    </div>
                    <Badge
                      variant={insight.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center">
            <Bot className="w-5 h-5 mr-2 text-orange-500" />
            Business Intelligence Chat
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.suggestions && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Quick actions:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickAction(suggestion)}
                              className="text-xs"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                      <span className="text-sm text-gray-600">Analyzing your business data...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me about your business finances..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.slice(0, 4).map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="text-xs text-gray-600 hover:text-orange-600"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAIAssistant;
