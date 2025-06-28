
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';

const ForecastingSection: React.FC = () => {
  const { transactions } = useTransactions();
  const [forecastPeriod, setForecastPeriod] = useState<'3-months' | '6-months' | '12-months'>('6-months');
  const [growthRate, setGrowthRate] = useState('5');
  const [seasonalFactor, setSeasonalFactor] = useState('1');

  // Generate historical data for forecasting
  const historicalData = useMemo(() => {
    const monthlyData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, revenue: 0, costs: 0, profit: 0 };
      }

      if (transaction.type === 'income' || transaction.type === 'refund') {
        acc[monthKey].revenue += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        acc[monthKey].costs += Number(transaction.amount);
      }

      acc[monthKey].profit = acc[monthKey].revenue - acc[monthKey].costs;
      
      return acc;
    }, {} as Record<string, { month: string; revenue: number; costs: number; profit: number }>);

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12) // Last 12 months
      .map((item, index) => ({
        ...item,
        monthName: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        period: index + 1
      }));
  }, [transactions]);

  // Generate forecast data
  const forecastData = useMemo(() => {
    if (historicalData.length < 3) return [];

    const periods = forecastPeriod === '3-months' ? 3 : forecastPeriod === '6-months' ? 6 : 12;
    const lastData = historicalData[historicalData.length - 1];
    const avgRevenue = historicalData.reduce((sum, item) => sum + item.revenue, 0) / historicalData.length;
    const avgCosts = historicalData.reduce((sum, item) => sum + item.costs, 0) / historicalData.length;
    const growth = parseFloat(growthRate) / 100;
    const seasonal = parseFloat(seasonalFactor);

    const forecast = [];
    for (let i = 1; i <= periods; i++) {
      const projectedRevenue = avgRevenue * (1 + growth * i) * seasonal;
      const projectedCosts = avgCosts * (1 + (growth * 0.7) * i); // Assume costs grow slower
      
      forecast.push({
        month: `Forecast ${i}`,
        monthName: `F${i}`,
        revenue: Math.round(projectedRevenue),
        costs: Math.round(projectedCosts),
        profit: Math.round(projectedRevenue - projectedCosts),
        period: historicalData.length + i,
        isForecast: true
      });
    }

    return [...historicalData, ...forecast];
  }, [historicalData, forecastPeriod, growthRate, seasonalFactor]);

  // Calculate forecast metrics
  const forecastMetrics = useMemo(() => {
    const forecastOnly = forecastData.filter(item => item.isForecast);
    if (forecastOnly.length === 0) return null;

    const totalForecastRevenue = forecastOnly.reduce((sum, item) => sum + item.revenue, 0);
    const totalForecastCosts = forecastOnly.reduce((sum, item) => sum + item.costs, 0);
    const totalForecastProfit = totalForecastRevenue - totalForecastCosts;
    const avgMonthlyProfit = totalForecastProfit / forecastOnly.length;

    return {
      totalRevenue: totalForecastRevenue,
      totalCosts: totalForecastCosts,
      totalProfit: totalForecastProfit,
      avgMonthlyProfit,
      profitMargin: totalForecastRevenue > 0 ? (totalForecastProfit / totalForecastRevenue) * 100 : 0
    };
  }, [forecastData]);

  // Risk assessment
  const riskAssessment = useMemo(() => {
    if (!forecastMetrics) return [];

    const risks = [];
    
    if (forecastMetrics.profitMargin < 10) {
      risks.push({ type: 'high', message: 'Low profit margin forecasted - review pricing strategy' });
    }
    
    if (forecastMetrics.avgMonthlyProfit < 0) {
      risks.push({ type: 'critical', message: 'Negative profit forecasted - immediate action required' });
    }

    const lastMonthProfit = historicalData[historicalData.length - 1]?.profit || 0;
    if (forecastMetrics.avgMonthlyProfit < lastMonthProfit * 0.8) {
      risks.push({ type: 'medium', message: 'Declining profit trend - monitor closely' });
    }

    if (risks.length === 0) {
      risks.push({ type: 'low', message: 'Forecast shows positive trends - maintain current strategy' });
    }

    return risks;
  }, [forecastMetrics, historicalData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Forecasting</h2>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Export Forecast
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="forecast" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-6">
          {/* Forecast Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Forecast Period</Label>
                  <Select value={forecastPeriod} onValueChange={(value: '3-months' | '6-months' | '12-months') => setForecastPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3-months">3 Months</SelectItem>
                      <SelectItem value="6-months">6 Months</SelectItem>
                      <SelectItem value="12-months">12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Expected Growth Rate (%)</Label>
                  <Input
                    type="number"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(e.target.value)}
                    placeholder="5"
                  />
                </div>
                
                <div>
                  <Label>Seasonal Factor</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={seasonalFactor}
                    onChange={(e) => setSeasonalFactor(e.target.value)}
                    placeholder="1.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forecast Metrics */}
          {forecastMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Projected Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₦{forecastMetrics.totalRevenue.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Projected Costs</p>
                    <p className="text-2xl font-bold text-gray-900">₦{forecastMetrics.totalCosts.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Projected Profit</p>
                    <p className="text-2xl font-bold text-gray-900">₦{forecastMetrics.totalProfit.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                    <p className="text-2xl font-bold text-gray-900">{forecastMetrics.profitMargin.toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Profit Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, '']} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#4ECDC4"
                    fill="#4ECDC4"
                    fillOpacity={0.6}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stackId="2"
                    stroke="#FF6B35"
                    fill="#FF6B35"
                    fillOpacity={0.6}
                    name="Profit"
                  />
                  <Line
                    type="monotone"
                    dataKey="costs"
                    stroke="#F7931E"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Costs"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Scenario planning features coming soon!</p>
                <p className="text-sm">Build multiple forecasts with different assumptions.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskAssessment.map((risk, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      risk.type === 'critical'
                        ? 'bg-red-50 border-l-red-500'
                        : risk.type === 'high'
                        ? 'bg-orange-50 border-l-orange-500'
                        : risk.type === 'medium'
                        ? 'bg-yellow-50 border-l-yellow-500'
                        : 'bg-green-50 border-l-green-500'
                    }`}
                  >
                    <div className="flex items-center">
                      <Badge
                        variant={risk.type === 'low' ? 'default' : 'destructive'}
                        className={
                          risk.type === 'low'
                            ? 'bg-green-100 text-green-800'
                            : risk.type === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : ''
                        }
                      >
                        {risk.type.toUpperCase()}
                      </Badge>
                      <span className="ml-3 text-sm font-medium">{risk.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Short-term Actions (1-3 months)</h4>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Monitor cash flow closely during high-growth periods</li>
                    <li>• Review and optimize high-cost categories</li>
                    <li>• Consider seasonal adjustments to inventory</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900">Long-term Strategy (6-12 months)</h4>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Invest in revenue diversification</li>
                    <li>• Build cash reserves for growth opportunities</li>
                    <li>• Consider scaling operations based on forecast</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ForecastingSection;
