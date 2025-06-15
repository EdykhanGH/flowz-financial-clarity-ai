
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, Download, Lightbulb, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const AnalysisSection: React.FC = () => {
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
};

export default AnalysisSection;
