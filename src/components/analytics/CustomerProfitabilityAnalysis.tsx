import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  Heart,
  AlertTriangle,
  Star
} from 'lucide-react';
import { 
  ResponsiveContainer,
  BarChart, 
  Bar, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCustomers } from '@/hooks/useCustomers';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CustomerProfitabilityAnalysis: React.FC = () => {
  const { transactions } = useTransactions();
  const { customers } = useCustomers();
  const [activeTab, setActiveTab] = useState('profitability');

  // Customer Profitability Analysis
  const customerProfitability = React.useMemo(() => {
    const customerData = transactions.reduce((acc, transaction) => {
      const customerId = 'unknown'; // transactions don't have customer_id field yet
      const customerName = 'Unknown Customer';
      
      if (!acc[customerId]) {
        acc[customerId] = {
          id: customerId,
          name: customerName,
          revenue: 0,
          costs: 0,
          transactions: 0,
          lastTransaction: new Date(transaction.date),
          firstTransaction: new Date(transaction.date),
        };
      }

      if (transaction.type === 'income') {
        acc[customerId].revenue += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        // Generic expense allocation for now
        acc[customerId].costs += Number(transaction.amount);
      }

      acc[customerId].transactions += 1;
      
      const transactionDate = new Date(transaction.date);
      if (transactionDate > acc[customerId].lastTransaction) {
        acc[customerId].lastTransaction = transactionDate;
      }
      if (transactionDate < acc[customerId].firstTransaction) {
        acc[customerId].firstTransaction = transactionDate;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(customerData)
      .map((customer: any) => {
        const profit = customer.revenue - customer.costs;
        const profitMargin = customer.revenue > 0 ? (profit / customer.revenue) * 100 : 0;
        const daysSinceFirst = Math.floor((Date.now() - customer.firstTransaction.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLast = Math.floor((Date.now() - customer.lastTransaction.getTime()) / (1000 * 60 * 60 * 24));
        const avgTransactionValue = customer.transactions > 0 ? customer.revenue / customer.transactions : 0;
        
        // Customer Lifetime Value (simplified)
        const clv = customer.transactions > 0 ? (profit / customer.transactions) * (365 / (daysSinceFirst || 1)) * 3 : 0;
        
        return {
          ...customer,
          profit,
          profitMargin,
          daysSinceFirst,
          daysSinceLast,
          avgTransactionValue,
          clv,
          frequency: customer.transactions / Math.max(daysSinceFirst / 30, 1), // Transactions per month
        };
      })
      .filter(customer => customer.revenue > 0 || customer.costs > 0)
      .sort((a, b) => b.profit - a.profit);
  }, [transactions, customers]);

  // RFM Analysis (Recency, Frequency, Monetary)
  const rfmAnalysis = React.useMemo(() => {
    const maxRecency = Math.max(...customerProfitability.map(c => c.daysSinceLast));
    const maxFrequency = Math.max(...customerProfitability.map(c => c.frequency));
    const maxMonetary = Math.max(...customerProfitability.map(c => c.revenue));

    return customerProfitability.map(customer => {
      // Score from 1-5 (5 being best)
      const recencyScore = 5 - Math.floor((customer.daysSinceLast / maxRecency) * 4);
      const frequencyScore = Math.floor((customer.frequency / maxFrequency) * 4) + 1;
      const monetaryScore = Math.floor((customer.revenue / maxMonetary) * 4) + 1;
      
      // Customer Segment based on RFM
      let segment = 'Low Value';
      if (recencyScore >= 4 && frequencyScore >= 4 && monetaryScore >= 4) {
        segment = 'Champions';
      } else if (recencyScore >= 3 && frequencyScore >= 3 && monetaryScore >= 4) {
        segment = 'Loyal Customers';
      } else if (recencyScore >= 4 && frequencyScore <= 2 && monetaryScore >= 3) {
        segment = 'Potential Loyalists';
      } else if (recencyScore >= 4 && frequencyScore <= 2 && monetaryScore <= 2) {
        segment = 'New Customers';
      } else if (recencyScore <= 2 && frequencyScore >= 3 && monetaryScore >= 3) {
        segment = 'At Risk';
      } else if (recencyScore <= 2 && frequencyScore >= 4 && monetaryScore >= 4) {
        segment = 'Cannot Lose Them';
      }

      return {
        ...customer,
        recencyScore,
        frequencyScore,
        monetaryScore,
        rfmScore: recencyScore + frequencyScore + monetaryScore,
        segment
      };
    });
  }, [customerProfitability]);

  // Customer Acquisition Cost and Lifetime Value
  const acquisitionAnalysis = React.useMemo(() => {
    const totalMarketingCosts = transactions
      .filter(t => 
        t.type === 'expense' && 
        (t.category?.toLowerCase().includes('marketing') || 
         t.description?.toLowerCase().includes('marketing') ||
         t.description?.toLowerCase().includes('advertising'))
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const newCustomers = customerProfitability.filter(c => c.daysSinceFirst <= 90).length;
    const cac = newCustomers > 0 ? totalMarketingCosts / newCustomers : 0;
    const avgClv = customerProfitability.reduce((sum, c) => sum + c.clv, 0) / customerProfitability.length;

    return {
      totalMarketingCosts,
      newCustomers,
      cac,
      avgClv,
      clvCacRatio: cac > 0 ? avgClv / cac : 0
    };
  }, [transactions, customerProfitability]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSegmentColor = (segment: string) => {
    const colors = {
      'Champions': 'bg-green-100 text-green-800',
      'Loyal Customers': 'bg-blue-100 text-blue-800',
      'Potential Loyalists': 'bg-yellow-100 text-yellow-800',
      'New Customers': 'bg-purple-100 text-purple-800',
      'At Risk': 'bg-orange-100 text-orange-800',
      'Cannot Lose Them': 'bg-red-100 text-red-800',
      'Low Value': 'bg-gray-100 text-gray-800'
    };
    return colors[segment as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'Champions': return <Star className="w-4 h-4" />;
      case 'Loyal Customers': return <Heart className="w-4 h-4" />;
      case 'At Risk': return <AlertTriangle className="w-4 h-4" />;
      case 'Cannot Lose Them': return <Target className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Profitability Analysis</h2>
          <p className="text-gray-600">Deep insights into customer value and behavior patterns</p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Users className="w-4 h-4 mr-1" />
          {customerProfitability.length} Active Customers
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-600 to-green-500 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-green-100">Avg CLV</p>
                <p className="text-2xl font-bold">{formatCurrency(acquisitionAnalysis.avgClv)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-blue-500 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-100">CAC</p>
                <p className="text-2xl font-bold">{formatCurrency(acquisitionAnalysis.cac)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-500 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-purple-100">CLV/CAC Ratio</p>
                <p className="text-2xl font-bold">{acquisitionAnalysis.clvCacRatio.toFixed(1)}x</p>
              </div>
              <Target className="w-8 h-8 text-purple-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-500 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-orange-100">New Customers</p>
                <p className="text-2xl font-bold">{acquisitionAnalysis.newCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-orange-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profitability" className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Profitability
          </TabsTrigger>
          <TabsTrigger value="rfm-analysis" className="flex items-center">
            <Target className="w-4 h-4 mr-2" />
            RFM Analysis
          </TabsTrigger>
          <TabsTrigger value="lifetime-value" className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Lifetime Value
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profitability">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                  Customer Profitability Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Customer</th>
                        <th className="text-right p-3">Revenue</th>
                        <th className="text-right p-3">Costs</th>
                        <th className="text-right p-3">Profit</th>
                        <th className="text-right p-3">Margin</th>
                        <th className="text-right p-3">Transactions</th>
                        <th className="text-right p-3">Avg Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerProfitability.slice(0, 15).map((customer, index) => (
                        <tr key={customer.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-gray-600">
                                  Last transaction: {customer.daysSinceLast} days ago
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono">{formatCurrency(customer.revenue)}</td>
                          <td className="p-3 text-right font-mono">{formatCurrency(customer.costs)}</td>
                          <td className="p-3 text-right font-mono">
                            <span className={customer.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(customer.profit)}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant={customer.profitMargin >= 20 ? 'default' : customer.profitMargin >= 10 ? 'secondary' : 'destructive'}>
                              {customer.profitMargin.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="p-3 text-right">{customer.transactions}</td>
                          <td className="p-3 text-right font-mono">{formatCurrency(customer.avgTransactionValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={customerProfitability.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="revenue" 
                      name="Revenue"
                      tickFormatter={(value) => formatCurrency(value).replace('NGN', '₦')}
                    />
                    <YAxis 
                      dataKey="profit" 
                      name="Profit"
                      tickFormatter={(value) => formatCurrency(value).replace('NGN', '₦')}
                    />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(value as number), name]}
                      labelFormatter={() => ''}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded shadow">
                              <p className="font-medium">{data.name}</p>
                              <p>Revenue: {formatCurrency(data.revenue)}</p>
                              <p>Profit: {formatCurrency(data.profit)}</p>
                              <p>Margin: {data.profitMargin.toFixed(1)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter dataKey="profit" fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rfm-analysis">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-500" />
                  RFM Customer Segmentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {rfmAnalysis.slice(0, 10).map((customer, index) => (
                      <div key={customer.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {getSegmentIcon(customer.segment)}
                            <p className="font-medium ml-2">{customer.name}</p>
                          </div>
                          <Badge className={getSegmentColor(customer.segment)}>
                            {customer.segment}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Recency</p>
                            <p className="font-bold">{customer.recencyScore}/5</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Frequency</p>
                            <p className="font-bold">{customer.frequencyScore}/5</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Monetary</p>
                            <p className="font-bold">{customer.monetaryScore}/5</p>
                          </div>
                        </div>
                        
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm text-gray-600">
                            RFM Score: {customer.rfmScore}/15 • {formatCurrency(customer.revenue)} revenue
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Segment Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            rfmAnalysis.reduce((acc, customer) => {
                              acc[customer.segment] = (acc[customer.segment] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([segment, count]) => ({ segment, count }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({segment, percent}) => `${segment}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {Object.keys(rfmAnalysis.reduce((acc, customer) => {
                            acc[customer.segment] = true;
                            return acc;
                          }, {} as Record<string, boolean>)).map((segment, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">RFM Segment Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Champions:</strong> Reward them. They can become early adopters for new products.
                    </div>
                    <div>
                      <strong>Loyal Customers:</strong> Upsell higher value products. Ask for reviews.
                    </div>
                    <div>
                      <strong>At Risk:</strong> Send personalized emails, offer discounts, provide helpful resources.
                    </div>
                    <div>
                      <strong>Cannot Lose Them:</strong> Win them back via renewals or newer products, don't lose them to competition.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lifetime-value">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
                  Customer Lifetime Value Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">CLV/CAC Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Average Customer Lifetime Value</span>
                          <span className="font-bold">{formatCurrency(acquisitionAnalysis.avgClv)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Customer Acquisition Cost</span>
                          <span className="font-bold">{formatCurrency(acquisitionAnalysis.cac)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>CLV/CAC Ratio</span>
                          <Badge variant={acquisitionAnalysis.clvCacRatio >= 3 ? 'default' : 'destructive'}>
                            {acquisitionAnalysis.clvCacRatio.toFixed(1)}x
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Marketing Investment</span>
                          <span className="font-bold">{formatCurrency(acquisitionAnalysis.totalMarketingCosts)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top CLV Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {customerProfitability
                          .sort((a, b) => b.clv - a.clv)
                          .slice(0, 5)
                          .map((customer, index) => (
                            <div key={customer.id} className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-gray-600">
                                  {customer.transactions} transactions
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(customer.clv)}</p>
                                <p className="text-sm text-gray-600">
                                  {customer.profitMargin.toFixed(1)}% margin
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={customerProfitability.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis tickFormatter={(value) => formatCurrency(value).replace('NGN', '₦')} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="clv" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Customer Lifetime Value" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Current Profit" 
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900">CLV Optimization Strategies</h4>
                  <div className="mt-2 space-y-2 text-sm text-purple-700">
                    <p><strong>Increase Purchase Frequency:</strong> Email marketing, loyalty programs, subscription models</p>
                    <p><strong>Increase Average Order Value:</strong> Cross-selling, upselling, bundle deals</p>
                    <p><strong>Extend Customer Lifespan:</strong> Excellent customer service, regular engagement, product innovation</p>
                    <p><strong>Reduce Churn:</strong> Proactive customer success, feedback loops, retention campaigns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerProfitabilityAnalysis;