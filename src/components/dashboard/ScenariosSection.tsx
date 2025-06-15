
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Plus, Share } from 'lucide-react';

const ScenariosSection: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState('');
  const [revenueChange, setRevenueChange] = useState([0]);
  const [costChange, setCostChange] = useState([0]);

  return (
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
};

export default ScenariosSection;
