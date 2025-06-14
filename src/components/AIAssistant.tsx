
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Mic, Paperclip, Plus, HelpCircle, BarChart3, FileText, TrendingUp, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastMessage: Date;
}

export const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Q3 Cost Analysis',
      messages: [],
      lastMessage: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      title: 'Break-even Analysis',
      messages: [],
      lastMessage: new Date(Date.now() - 5 * 60 * 60 * 1000)
    }
  ]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sampleQueries = [
    "Analyze my cost structure for Q3",
    "What's my break-even point if I reduce costs by 10%?",
    "Compare my performance to industry benchmarks",
    "Generate a monthly financial report"
  ];

  const quickActions = [
    { icon: BarChart3, label: "Analyze Current Data", color: "bg-blue-500" },
    { icon: FileText, label: "Generate Report", color: "bg-green-500" },
    { icon: TrendingUp, label: "Explain Variance", color: "bg-purple-500" },
    { icon: Lightbulb, label: "Suggest Improvements", color: "bg-orange-500" }
  ];

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I've analyzed your request. Based on your current data, I can see several key insights that might help with your financial planning. Would you like me to generate a detailed report or focus on specific metrics?",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleQuickAction = (action: string) => {
    setInputText(action);
  };

  const handleSampleQuery = (query: string) => {
    setInputText(query);
  };

  const startNewConversation = () => {
    setMessages([]);
    setActiveConversation(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Chat History Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <Button 
            onClick={startNewConversation}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Recent Conversations</h3>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Card 
                key={conv.id}
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  activeConversation === conv.id ? 'border-orange-200 bg-orange-50' : ''
                }`}
                onClick={() => setActiveConversation(conv.id)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm text-gray-900 truncate">{conv.title}</h4>
                    <span className="text-xs text-gray-500 ml-2">{formatDate(conv.lastMessage)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            onClick={() => setShowHelp(!showHelp)}
            className="w-full justify-start text-gray-600"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Help & Tips
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Financial Assistant</h2>
              <div className="flex items-center mt-1 space-x-2">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Data Connected
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  Financial Context
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 && !showHelp && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome to your AI Financial Assistant
                </h3>
                <p className="text-gray-600 mb-6">
                  Ask me anything about your financial data, get insights, or generate reports
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-2xl">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleQuickAction(action.label)}
                    className="h-16 flex flex-col items-center justify-center hover:bg-gray-50"
                  >
                    <action.icon className={`w-6 h-6 mb-1 text-white p-1 rounded ${action.color}`} />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>

              {/* Sample Queries */}
              <div className="w-full max-w-2xl">
                <h4 className="font-medium text-gray-900 mb-3">Try asking:</h4>
                <div className="grid gap-2">
                  {sampleQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={() => handleSampleQuery(query)}
                      className="text-left justify-start h-auto p-3 text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                    >
                      "{query}"
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showHelp && (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Help & Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Sample Questions</h4>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>What are my top 3 expense categories this month?</li>
                    <li>How does my current performance compare to last quarter?</li>
                    <li>What would happen if I increase prices by 5%?</li>
                    <li>Generate a cash flow forecast for next quarter</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl + Enter</kbd> - Send message</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl + N</kbd> - New conversation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-orange-500 text-white'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-gray-500' : 'text-orange-100'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-orange-500 text-white px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Mic className="w-4 h-4" />
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me anything about your finances..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!inputText.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Ctrl + Enter to send • Connected to your financial data
          </p>
        </div>
      </div>
    </div>
  );
};
