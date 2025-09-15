import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';

const AdvancedAnalyticsPage: React.FC = () => {
  const analytics = useAdvancedAnalytics();
  const [selectedScenario, setSelectedScenario] = useState<'optimistic' | 'realistic' | 'pessimistic'>('realistic');
  const [forecastPeriod, setForecastPeriod] = useState<'6' | '12'>('12');

  const scenarioColors = {
    optimistic: '#22c55e',
    realistic: '#3b82f6',
    pessimistic: '#ef4444'
  };

  const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

  const KPICard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ElementType;
    description?: string;
  }> = ({ title, value, change, trend, icon: Icon, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            ) : null}
            <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''}>
              {change}
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  const OptimizationOpportunityCard: React.FC<{
    optimization: any;
  }> = ({ optimization }) => (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{optimization.category}</CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {optimization.savingsPercentage.toFixed(1)}% Savings
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Current Cost</div>
            <div className="font-medium">{formatCurrency(optimization.currentCost)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Potential Savings</div>
            <div className="font-medium text-green-600">{formatCurrency(optimization.savings)}</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {optimization.difficulty}
                </Badge>
            <span className="text-xs text-muted-foreground">{optimization.timeframe}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Action Items:</div>
          {optimization.actions.slice(0, 2).map((action: string, index: number) => (
            <div key={index} className="text-xs text-muted-foreground flex items-start gap-2">
              <div className="h-1 w-1 rounded-full bg-primary mt-2 flex-shrink-0" />
              {action}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const ProfitabilityInsightCard: React.FC<{
    insight: any;
  }> = ({ insight }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{insight.segment}</CardTitle>
          <Badge variant="outline" className={
            insight.trend === 'growing' ? 'bg-green-50 text-green-700' :
            insight.trend === 'declining' ? 'bg-red-50 text-red-700' :
            'bg-gray-50 text-gray-700'
          }>
            {insight.trend}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Revenue</div>
            <div className="font-medium">{formatCurrency(insight.revenue)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Costs</div>
            <div className="font-medium">{formatCurrency(insight.costs)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Margin</div>
            <div className="font-medium">{insight.margin.toFixed(1)}%</div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Recommendations:</div>
          {insight.recommendations.slice(0, 2).map((rec: string, index: number) => (
            <div key={index} className="text-xs text-muted-foreground flex items-start gap-2">
              <div className="h-1 w-1 rounded-full bg-primary mt-2 flex-shrink-0" />
              {rec}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const forecastData = analytics.forecast[selectedScenario].slice(0, parseInt(forecastPeriod));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights, forecasting, and optimization opportunities
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="kpis" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="optimization">Cost Optimization</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-6">
          {/* Advanced KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Customer Acquisition Cost"
              value={formatCurrency(analytics.kpis.customerAcquisitionCost)}
              icon={Users}
              description="Average cost to acquire a new customer"
            />
            <KPICard
              title="Customer Lifetime Value"
              value={formatCurrency(analytics.kpis.customerLifetimeValue)}
              icon={TrendingUp}
              description="Projected value per customer over time"
            />
            <KPICard
              title="Monthly Recurring Revenue"
              value={formatCurrency(analytics.kpis.monthlyRecurringRevenue)}
              icon={DollarSign}
              description="Predictable monthly revenue stream"
            />
            <KPICard
              title="Churn Rate"
              value={`${analytics.kpis.churnRate}%`}
              icon={Users}
              description="Percentage of customers lost monthly"
            />
            <KPICard
              title="Gross Margin"
              value={`${analytics.kpis.grossMargin.toFixed(1)}%`}
              icon={PieChart}
              description="Revenue minus direct costs"
            />
            <KPICard
              title="Operating Margin"
              value={`${analytics.kpis.operatingMargin.toFixed(1)}%`}
              icon={BarChart3}
              description="Operating profit as % of revenue"
            />
            <KPICard
              title="Return on Investment"
              value={`${analytics.kpis.returnOnInvestment.toFixed(1)}%`}
              icon={Target}
              description="Profit relative to investment"
            />
            <KPICard
              title="Cash Conversion Cycle"
              value={`${analytics.kpis.cashConversionCycle} days`}
              icon={TrendingUp}
              description="Time to convert investments to cash"
            />
          </div>

          {/* Analytics Alerts */}
          {analytics.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Analytics Insights
                </CardTitle>
                <CardDescription>
                  Key opportunities and warnings based on your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'opportunity' ? 'border-l-green-500 bg-green-50' :
                      alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                      'border-l-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-muted-foreground">{alert.description}</div>
                        <div className="text-sm">{alert.impact}</div>
                        {alert.potentialValue && (
                          <div className="text-sm font-medium text-green-600">
                            Potential Value: {formatCurrency(alert.potentialValue)}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className={
                        alert.priority === 'high' ? 'border-red-500 text-red-700' :
                        alert.priority === 'medium' ? 'border-yellow-500 text-yellow-700' :
                        'border-blue-500 text-blue-700'
                      }>
                        {alert.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          {/* Forecast Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Configuration</CardTitle>
              <CardDescription>
                Adjust parameters to explore different scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Scenario</label>
                <Select value={selectedScenario} onValueChange={(value: any) => setSelectedScenario(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="optimistic">Optimistic</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="pessimistic">Pessimistic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Period</label>
                <Select value={forecastPeriod} onValueChange={(value: any) => setForecastPeriod(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Profit Forecast</CardTitle>
              <CardDescription>
                Projected financial performance based on {selectedScenario} scenario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Profit"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="costs" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Costs"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Scenario Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Summary</CardTitle>
              <CardDescription>
                Compare outcomes across different scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(analytics.forecast).map(([scenario, data]) => {
                  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
                  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
                  const avgConfidence = data.reduce((sum, item) => sum + item.confidence, 0) / data.length;
                  
                  return (
                    <div key={scenario} className="p-4 border rounded-lg">
                      <div className="font-medium capitalize mb-2">{scenario}</div>
                      <div className="space-y-1 text-sm">
                        <div>Total Revenue: {formatCurrency(totalRevenue)}</div>
                        <div>Total Profit: {formatCurrency(totalProfit)}</div>
                        <div>Avg Confidence: {avgConfidence.toFixed(0)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Cost Optimization Opportunities</h2>
              <p className="text-muted-foreground">
                Identified areas where you can reduce costs and improve efficiency
              </p>
            </div>
            <Badge variant="outline">
              {analytics.costOptimizations.length} Opportunities
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analytics.costOptimizations.map((optimization, index) => (
              <OptimizationOpportunityCard key={index} optimization={optimization} />
            ))}
          </div>

          {analytics.costOptimizations.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="text-lg font-medium">No Major Optimization Opportunities</div>
                  <div className="text-muted-foreground">
                    Your cost structure appears to be well-optimized
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profitability" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Profitability Analysis</h2>
              <p className="text-muted-foreground">
                Analyze profit margins and performance across different segments
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.profitabilityInsights.map((insight, index) => (
              <ProfitabilityInsightCard key={index} insight={insight} />
            ))}
          </div>

          {analytics.profitabilityInsights.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="text-lg font-medium">No Profitability Data Available</div>
                  <div className="text-muted-foreground">
                    Add more transaction data to see profitability insights
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Industry Benchmarking</CardTitle>
              <CardDescription>
                Compare your performance against {analytics.benchmarks.industry} industry standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Gross Margin</span>
                      <Badge variant="outline" className={
                        analytics.benchmarks.performance === 'above' ? 'bg-green-50 text-green-700' :
                        analytics.benchmarks.performance === 'below' ? 'bg-red-50 text-red-700' :
                        'bg-gray-50 text-gray-700'
                      }>
                        {analytics.benchmarks.performance === 'above' ? 'Above Average' :
                         analytics.benchmarks.performance === 'below' ? 'Below Average' : 'Average'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Your Performance</span>
                        <span className="font-medium">{analytics.benchmarks.yourGrossMargin.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Industry Average</span>
                        <span>{analytics.benchmarks.grossMarginBenchmark}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Operating Margin</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Your Performance</span>
                        <span className="font-medium">{analytics.benchmarks.yourOperatingMargin.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Industry Average</span>
                        <span>{analytics.benchmarks.operatingMarginBenchmark}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium mb-2">Performance Summary</div>
                    <div className="text-sm text-muted-foreground">
                      {analytics.benchmarks.performance === 'above' 
                        ? 'Your business is performing above industry standards. Continue current strategies and explore expansion opportunities.'
                        : analytics.benchmarks.performance === 'below'
                        ? 'There is room for improvement. Focus on cost optimization and revenue enhancement strategies.'
                        : 'Your performance is in line with industry standards. Look for opportunities to gain competitive advantage.'
                      }
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Improvement Opportunities:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-start gap-2">
                        <div className="h-1 w-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                        Review pricing strategy alignment with market standards
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1 w-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                        Optimize operational efficiency to reduce costs
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1 w-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                        Explore value-added services to improve margins
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsPage;