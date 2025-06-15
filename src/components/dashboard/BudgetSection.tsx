
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingDown,
  Target,
  FileText,
  Plus,
  Filter,
  AlertTriangle,
  Lightbulb,
  Users,
  Lock,
  Clock,
  Edit,
  X
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { budgetAlerts, budgetTemplates, budgetData, departmentSpending } from '@/data/budgetData';

const BudgetSection: React.FC = () => {
  const [showBudgetWizard, setShowBudgetWizard] = useState(false);
  const [budgetWizardStep, setBudgetWizardStep] = useState(1);
  const [selectedBudgetType, setSelectedBudgetType] = useState('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('');

  const renderBudgetWizard = () => (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Budget Setup Wizard</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowBudgetWizard(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                step <= budgetWizardStep ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 4 && <div className={`w-12 h-0.5 ${step < budgetWizardStep ? 'bg-orange-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgetWizardStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Budget Type & Time Period</h3>
            <div className="space-y-3">
              <div>
                <Label>Budget Type</Label>
                <Select value={selectedBudgetType} onValueChange={setSelectedBudgetType}>
                  <SelectTrigger>
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
              <div>
                <Label>Time Period</Label>
                <Select value={selectedTimePeriod} onValueChange={setSelectedTimePeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {budgetWizardStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Revenue Projections</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Sales</Label>
                <Input placeholder="₹500,000" />
              </div>
              <div>
                <Label>Service Revenue</Label>
                <Input placeholder="₹300,000" />
              </div>
              <div>
                <Label>Other Income</Label>
                <Input placeholder="₹50,000" />
              </div>
              <div>
                <Label>Total Projected Revenue</Label>
                <Input placeholder="₹850,000" disabled />
              </div>
            </div>
          </div>
        )}

        {budgetWizardStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3: Expense Allocations</h3>
            <div className="space-y-3">
              {['Sales', 'Marketing', 'Operations', 'IT', 'HR'].map((dept) => (
                <div key={dept} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{dept}</span>
                  <div className="flex items-center space-x-2">
                    <Input className="w-24" placeholder="₹100,000" />
                    <span className="text-sm text-gray-500">15%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {budgetWizardStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 4: Review & Approval</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Budget Summary</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{selectedBudgetType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span>{selectedTimePeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span>₹8,50,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Expenses:</span>
                    <span>₹6,10,000</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Net Profit:</span>
                    <span>₹2,40,000</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="approval" />
                <Label htmlFor="approval">I approve this budget for implementation</Label>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={() => setBudgetWizardStep(Math.max(1, budgetWizardStep - 1))}
            disabled={budgetWizardStep === 1}
          >
            Previous
          </Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => {
              if (budgetWizardStep === 4) {
                setShowBudgetWizard(false);
                setBudgetWizardStep(1);
              } else {
                setBudgetWizardStep(Math.min(4, budgetWizardStep + 1));
              }
            }}
          >
            {budgetWizardStep === 4 ? 'Create Budget' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Budget Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Budget Management</h2>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => setShowBudgetWizard(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Budget
          </Button>
        </div>
      </div>

      {/* Budget Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budget Utilization</p>
                <p className="text-2xl font-bold">78%</p>
                <Progress value={78} className="w-full mt-2" />
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Variance</p>
                <p className="text-2xl font-bold text-green-600">-₹50K</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">Under Budget</Badge>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold">₹2.2L</p>
                <Badge className="mt-1">22% Left</Badge>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Budgets</p>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-gray-500 mt-1">2 pending approval</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Budget Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {budgetAlerts.map((alert, index) => (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
                alert.severity === 'high' ? 'border-l-red-500 bg-red-50' :
                alert.severity === 'medium' ? 'border-l-orange-500 bg-orange-50' :
                'border-l-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    alert.severity === 'high' ? 'bg-red-100' :
                    alert.severity === 'medium' ? 'bg-orange-100' :
                    'bg-blue-100'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      alert.severity === 'high' ? 'text-red-600' :
                      alert.severity === 'medium' ? 'text-orange-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">{alert.department}: {alert.message}</p>
                    <p className="text-sm text-gray-600">{alert.action}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Review
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Templates</CardTitle>
          <CardDescription>Choose a template to get started quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {budgetTemplates.map((template) => (
              <Card key={template.name} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${template.color}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="font-medium mb-1">{template.name}</p>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <Button 
                    className="w-full mt-3 bg-orange-500 hover:bg-orange-600"
                    size="sm"
                    onClick={() => setShowBudgetWizard(true)}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget vs Actual Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual Performance</CardTitle>
            <CardDescription>Monthly comparison analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="budgeted" fill="#FF6B35" name="Budgeted" />
                <Bar dataKey="actual" fill="#F7931E" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department-wise Spending</CardTitle>
            <CardDescription>Budget utilization by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentSpending.map((dept) => (
                <div key={dept.department} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{dept.department}</span>
                    <span className={dept.utilization > 100 ? 'text-red-600' : 'text-green-600'}>
                      {dept.utilization}%
                    </span>
                  </div>
                  <Progress value={dept.utilization} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>₹{(dept.actual / 1000).toFixed(0)}K / ₹{(dept.budgeted / 1000).toFixed(0)}K</span>
                    <span className={dept.utilization > 100 ? 'text-red-600' : 'text-green-600'}>
                      {dept.utilization > 100 ? '+' : ''}₹{((dept.actual - dept.budgeted) / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Controls & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Controls</CardTitle>
            <CardDescription>Approval workflow and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Approval Workflow</p>
                  <p className="text-sm text-gray-600">3-step approval process</p>
                </div>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Budget Locking</p>
                  <p className="text-sm text-gray-600">Prevent unauthorized changes</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-1" />
                Configure
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium">Revision History</p>
                  <p className="text-sm text-gray-600">Track all budget changes</p>
                </div>
              </div>
              <Button variant="outline" size="sm">View History</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-orange-500" />
              AI Budget Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
              <p className="font-medium text-blue-900">Seasonal Adjustment</p>
              <p className="text-sm text-blue-700">Consider increasing Q4 marketing budget by 15% based on historical trends</p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-l-green-500">
              <p className="font-medium text-green-900">Cost Optimization</p>
              <p className="text-sm text-green-700">IT department consistently under budget - consider reallocating ₹20K to Marketing</p>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-l-orange-500">
              <p className="font-medium text-orange-900">Industry Benchmark</p>
              <p className="text-sm text-orange-700">Your R&D spending is 5% below industry average - potential growth opportunity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Wizard Modal */}
      {showBudgetWizard && renderBudgetWizard()}
    </div>
  );
};

export default BudgetSection;
