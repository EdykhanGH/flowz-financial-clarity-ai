import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MessageSquare, Send, Bot, User, Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const ScenarioAnalysisPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const { toast } = useToast();

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      toast({
        title: "Project Name Required",
        description: "Please enter a project name",
        variant: "destructive"
      });
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName,
      description: projectDescription,
      createdAt: new Date().toISOString()
    };

    setProjects([...projects, newProject]);
    setSelectedProject(newProject.id);
    setProjectName('');
    setProjectDescription('');
    setShowCreateProject(false);
    
    // Initialize welcome message
    setChatMessages([
      {
        id: '1',
        type: 'ai',
        content: `Welcome to scenario analysis for "${newProject.name}". I can help you analyze business scenarios, forecast outcomes, and calculate opportunity costs based on your business data. What would you like to explore?`,
        timestamp: new Date().toISOString()
      }
    ]);

    toast({
      title: "Project Created",
      description: `Project "${projectName}" created successfully`,
    });
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim() || !selectedProject) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages([...chatMessages, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(currentMessage),
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setCurrentMessage('');
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('revenue') || input.includes('sales')) {
      return "Based on your historical data, I can see several revenue optimization opportunities. Your current monthly revenue is trending upward. Would you like me to analyze a scenario where you increase marketing spend by 20% or explore expanding to new markets?";
    } else if (input.includes('cost') || input.includes('expense')) {
      return "Looking at your cost structure, I notice potential savings in operational expenses. Let me run a scenario: If we reduce administrative costs by 15% and reallocate to product development, your net profit could increase by 12%. Shall I provide detailed projections?";
    } else if (input.includes('forecast') || input.includes('prediction')) {
      return "I can create forecasts based on your business patterns. Your seasonal trends show 30% higher revenue in Q4. For 2024 projections, considering current growth rate of 8% monthly, I estimate total revenue of ₦15.6M. Would you like quarter-by-quarter breakdown?";
    } else if (input.includes('opportunity') || input.includes('investment')) {
      return "Opportunity cost analysis shows that investing ₦500K in marketing would generate ₦1.2M additional revenue over 6 months. Alternative investment in inventory expansion shows ₦800K return. The marketing option has better ROI. Need detailed comparison?";
    } else {
      return "I understand you want to explore business scenarios. I can help with: \n\n• Revenue growth projections\n• Cost optimization scenarios\n• Market expansion analysis\n• Investment opportunity comparisons\n• Risk assessment models\n\nWhat specific scenario would you like to analyze?";
    }
  };

  const selectedProjectDetails = projects.find(p => p.id === selectedProject);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scenario Analysis</h1>
        <p className="text-gray-600">AI-powered business forecasting and opportunity cost analysis</p>
      </div>

      {projects.length === 0 ? (
        // No projects state
        <Card>
          <CardContent className="text-center py-12">
            <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Create Your First Project</h3>
            <p className="text-gray-600 mb-6">Start by creating a project to organize your scenario analysis</p>
            <Button onClick={() => setShowCreateProject(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Projects Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Projects</CardTitle>
                <Button 
                  size="sm" 
                  onClick={() => setShowCreateProject(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project.id);
                    setChatMessages([
                      {
                        id: '1',
                        type: 'ai',
                        content: `Welcome back to "${project.name}". What scenario would you like to analyze today?`,
                        timestamp: new Date().toISOString()
                      }
                    ]);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedProject === project.id 
                      ? 'bg-orange-100 border-orange-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <h4 className="font-medium">{project.name}</h4>
                  <p className="text-sm text-gray-600 truncate">{project.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>
                {selectedProjectDetails ? `Analysis Chat - ${selectedProjectDetails.name}` : 'Select a Project'}
              </CardTitle>
              <CardDescription>
                Chat with AI to explore scenarios, forecasts, and opportunity costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProject ? (
                <div className="space-y-4">
                  {/* Chat Messages */}
                  <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4 bg-gray-50">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-orange-500 text-white'
                              : 'bg-white border'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {message.type === 'ai' && <Bot className="w-4 h-4 mt-1 text-gray-500" />}
                            <div className="text-sm whitespace-pre-line">{message.content}</div>
                            {message.type === 'user' && <User className="w-4 h-4 mt-1" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Ask about scenarios, forecasts, or opportunity costs..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} className="bg-orange-500 hover:bg-orange-600">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMessage("What would happen if I increase revenue by 20%?")}
                    >
                      Revenue Growth Scenario
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMessage("Analyze cost reduction opportunities")}
                    >
                      Cost Optimization
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMessage("Show me 6-month forecast")}
                    >
                      Forecast Analysis
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMessage("Compare investment opportunities")}
                    >
                      Investment Comparison
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a project to start scenario analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Set up a new scenario analysis project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Q2 Expansion Analysis"
                />
              </div>
              
              <div>
                <Label htmlFor="projectDescription">Description (Optional)</Label>
                <Textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description of what you want to analyze..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateProject(false);
                    setProjectName('');
                    setProjectDescription('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} className="flex-1 bg-orange-500 hover:bg-orange-600">
                  Create Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ScenarioAnalysisPage;