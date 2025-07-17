import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, AlertCircle, Download } from 'lucide-react';

const WhatIfAnalysisPage: React.FC = () => {
  const [revenueChange, setRevenueChange] = useState([0]);
  const [costChange, setCostChange] = useState([0]);
  const [scenario, setScenario] = useState('current');

  const baseRevenue = 1500000; // ₦1.5M
  const baseCost = 1200000; // ₦1.2M
  const baseProfit = baseRevenue - baseCost;

  const newRevenue = baseRevenue * (1 + revenueChange[0] / 100);
  const newCost = baseCost * (1 + costChange[0] / 100);
  const newProfit = newRevenue - newCost;
  const profitChange = ((newProfit - baseProfit) / baseProfit) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">What-If Analysis</h1>
        <p className="text-gray-600">Explore different business scenarios and their potential impact</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Builder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scenario Builder</CardTitle>
            <CardDescription>Adjust variables to see potential outcomes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Scenario Type</label>
                <Select value={scenario} onValueChange={setScenario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Trends</SelectItem>
                    <SelectItem value="optimistic">Optimistic Growth</SelectItem>
                    <SelectItem value="pessimistic">Economic Downturn</SelectItem>
                    <SelectItem value="expansion">Business Expansion</SelectItem>
                    <SelectItem value="custom">Custom Scenario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Revenue Change: {revenueChange[0] > 0 ? '+' : ''}{revenueChange[0]}%
                  </label>
                  <Slider
                    value={revenueChange}
                    onValueChange={setRevenueChange}
                    max={100}
                    min={-50}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cost Change: {costChange[0] > 0 ? '+' : ''}{costChange[0]}%
                  </label>
                  <Slider
                    value={costChange}
                    onValueChange={setCostChange}
                    max={100}
                    min={-30}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline">Reset to Base</Button>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Impact Summary</CardTitle>
            <CardDescription>Projected financial outcomes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Revenue</span>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(newRevenue)}</div>
                  <div className={`text-xs ${revenueChange[0] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueChange[0] > 0 ? '+' : ''}{revenueChange[0]}%
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Costs</span>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(newCost)}</div>
                  <div className={`text-xs ${costChange[0] >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {costChange[0] > 0 ? '+' : ''}{costChange[0]}%
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Net Profit</span>
                  <div className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(newProfit)}</div>
                    <div className={`text-sm flex items-center ${profitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {profitChange > 0 ? '+' : ''}{profitChange.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {Math.abs(profitChange) > 20 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">Significant impact detected</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scenario Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Comparison</CardTitle>
          <CardDescription>Compare multiple scenarios side by side</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Base Case</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Revenue:</span>
                  <span className="text-sm font-medium">{formatCurrency(baseRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Costs:</span>
                  <span className="text-sm font-medium">{formatCurrency(baseCost)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-sm">Profit:</span>
                  <span className="text-sm">{formatCurrency(baseProfit)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-green-50">
              <h3 className="font-semibold mb-2 text-green-800">Best Case</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Revenue:</span>
                  <span className="text-sm font-medium">{formatCurrency(baseRevenue * 1.3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Costs:</span>
                  <span className="text-sm font-medium">{formatCurrency(baseCost * 1.1)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-sm">Profit:</span>
                  <span className="text-sm">{formatCurrency(baseRevenue * 1.3 - baseCost * 1.1)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-red-50">
              <h3 className="font-semibold mb-2 text-red-800">Worst Case</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Revenue:</span>
                  <span className="text-sm font-medium">{formatCurrency(baseRevenue * 0.7)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Costs:</span>
                  <span className="text-sm font-medium">{formatCurrency(baseCost * 1.2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-sm">Profit:</span>
                  <span className="text-sm">{formatCurrency(baseRevenue * 0.7 - baseCost * 1.2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatIfAnalysisPage;