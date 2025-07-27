import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Package,
  Filter,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BarChart3,
  PieChart
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
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useProducts } from '@/hooks/useProducts';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ProductAnalysisSection: React.FC = () => {
  const { transactions } = useTransactions();
  const { products } = useProducts();
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [productFilter, setProductFilter] = useState<string | undefined>(undefined);
  
  // Filter transactions based on current filters
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => {
      // Filter by date if selected
      if (filterDate) {
        const transactionDate = new Date(transaction.date);
        if (
          transactionDate.getDate() !== filterDate.getDate() ||
          transactionDate.getMonth() !== filterDate.getMonth() ||
          transactionDate.getFullYear() !== filterDate.getFullYear()
        ) {
          return false;
        }
      }
      
      // Filter by product if selected (disabled due to missing field)
      // if (productFilter && transaction.product_name !== productFilter) {
      //   return false;
      // }
      
      return true;
    });
  }, [transactions, filterDate, productFilter]);

  // Product performance analysis
  const productPerformance = React.useMemo(() => {
    const productData: Record<string, {
      name: string;
      revenue: number;
      costs: number;
      profit: number;
      units: number;
      unitPrice: number;
      unitCost: number;
    }> = {};

    filteredTransactions.forEach(transaction => {
      const productName = transaction.product_name || 'Other';
      
      if (!productData[productName]) {
        productData[productName] = {
          name: productName,
          revenue: 0,
          costs: 0,
          profit: 0,
          units: 0,
          unitPrice: 0,
          unitCost: 0
        };
      }

      if (transaction.type === 'income') {
        productData[productName].revenue += Number(transaction.amount);
        if (transaction.quantity) {
          productData[productName].units += transaction.quantity;
          productData[productName].unitPrice = transaction.unit_price || 0;
        }
      } else if (transaction.type === 'expense' && ((transaction.cost_nature === 'direct') || (transaction.classification?.cost_nature === 'direct'))) {
        productData[productName].costs += Number(transaction.amount);
        if (transaction.quantity) {
          productData[productName].unitCost = transaction.unit_cost || 0;
        }
      }
    });

    // Calculate profit for each product
    Object.values(productData).forEach(product => {
      product.profit = product.revenue - product.costs;
    });

    return Object.values(productData)
      .filter(product => product.revenue > 0 || product.costs > 0)
      .sort((a, b) => b.profit - a.profit);
  }, [filteredTransactions]);

  // Unit price trends analysis
  const unitPriceTrends = React.useMemo(() => {
    const monthlyPrices: Record<string, Record<string, { total: number; count: number; avgPrice: number }>> = {};

    filteredTransactions
      .filter(t => t.type === 'income' && t.product_name && t.unit_price)
      .forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const productName = transaction.product_name!;

        if (!monthlyPrices[monthKey]) {
          monthlyPrices[monthKey] = {};
        }

        if (!monthlyPrices[monthKey][productName]) {
          monthlyPrices[monthKey][productName] = { total: 0, count: 0, avgPrice: 0 };
        }

        monthlyPrices[monthKey][productName].total += transaction.unit_price!;
        monthlyPrices[monthKey][productName].count += 1;
        monthlyPrices[monthKey][productName].avgPrice = 
          monthlyPrices[monthKey][productName].total / monthlyPrices[monthKey][productName].count;
      });

    // Get top 3 products by revenue for trend analysis
    const topProducts = productPerformance.slice(0, 3);
    
    return Object.entries(monthlyPrices)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, products]) => {
        const result: any = {
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' })
        };
        
        topProducts.forEach(product => {
          if (products[product.name]) {
            result[product.name] = products[product.name].avgPrice;
          }
        });
        
        return result;
      });
  }, [filteredTransactions, productPerformance]);

  // Inventory analysis (based on stock levels from products)
  const inventoryAnalysis = React.useMemo(() => {
    return products.map(product => {
      // Calculate units sold in current period
      const unitsSold = filteredTransactions
        .filter(t => t.type === 'income' && t.product_name === product.name)
        .reduce((sum, t) => sum + (t.quantity || 0), 0);

      // Estimate current stock (this would typically come from inventory management)
      // For demo purposes, using a placeholder calculation
      const estimatedStock = Math.max(0, 100 - unitsSold); // Assuming starting stock of 100
      
      // Calculate turnover rate (simplified)
      const turnoverRate = unitsSold > 0 ? unitsSold / 30 : 0; // Units per day

      return {
        name: product.name,
        category: product.category,
        standardPrice: product.standard_price || 0,
        standardCost: product.standard_cost || 0,
        unitsSold,
        estimatedStock,
        turnoverRate,
        stockValue: estimatedStock * (product.standard_cost || 0)
      };
    });
  }, [products, filteredTransactions]);

  // Reset filters
  const resetFilters = () => {
    setFilterDate(undefined);
    setProductFilter(undefined);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Product Analysis</h2>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <h4 className="font-medium mb-2">Date Filter</h4>
              <DatePicker
                date={filterDate}
                setDate={setFilterDate}
                label=""
                placeholder="Select filter date"
                className="mb-4"
              />
              
              <h4 className="font-medium mb-2">Product</h4>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Products</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.name}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button className="bg-orange-500 hover:bg-orange-600">
            Export Report
          </Button>
        </div>
      </div>

      {/* Product Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2 text-orange-500" />
            Product Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Direct Costs</th>
                  <th className="text-right p-2">Profit</th>
                  <th className="text-right p-2">Units Sold</th>
                  <th className="text-right p-2">Unit Price</th>
                  <th className="text-right p-2">Unit Cost</th>
                  <th className="text-right p-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.map((product, index) => {
                  const margin = product.revenue > 0 ? ((product.profit / product.revenue) * 100) : 0;
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{product.name}</td>
                      <td className="p-2 text-right">{formatCurrency(product.revenue)}</td>
                      <td className="p-2 text-right">{formatCurrency(product.costs)}</td>
                      <td className="p-2 text-right">
                        <span className={product.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(product.profit)}
                        </span>
                      </td>
                      <td className="p-2 text-right">{product.units}</td>
                      <td className="p-2 text-right">{formatCurrency(product.unitPrice)}</td>
                      <td className="p-2 text-right">{formatCurrency(product.unitCost)}</td>
                      <td className="p-2 text-right">
                        <Badge variant={margin >= 20 ? 'default' : margin >= 10 ? 'secondary' : 'destructive'}>
                          {margin.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Unit Price Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Unit Price Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={unitPriceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value).replace('NGN', '₦')} />
              <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
              <Legend />
              {productPerformance.slice(0, 3).map((product, index) => (
                <Line 
                  key={product.name}
                  type="monotone" 
                  dataKey={product.name} 
                  stroke={COLORS[index % COLORS.length]} 
                  strokeWidth={2}
                  name={product.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Inventory Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-green-500" />
              Inventory Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryAnalysis.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Stock: {item.estimatedStock} units | Turnover: {item.turnoverRate.toFixed(1)}/day
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(item.stockValue)}</p>
                    <p className="text-sm text-gray-600">{item.unitsSold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-purple-500" />
              Product Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={productPerformance.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="revenue"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {productPerformance.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            AI-Powered Product Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
              <h4 className="font-semibold text-blue-900">Product Performance Analysis</h4>
              <p className="text-sm text-blue-700 mt-1">
                {productPerformance.length > 0 && (
                  <>Your top-performing product is {productPerformance[0].name} with {formatCurrency(productPerformance[0].profit)} profit. 
                  Consider increasing inventory or promoting this product to maximize returns.</>
                )}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-l-green-500">
              <h4 className="font-semibold text-green-900">Pricing Strategy Insights</h4>
              <p className="text-sm text-green-700 mt-1">
                Monitor unit price trends to identify optimal pricing opportunities. 
                Products with consistent price increases may indicate strong market demand.
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-l-orange-500">
              <h4 className="font-semibold text-orange-900">Recommended Actions</h4>
              <ul className="text-sm text-orange-700 mt-1 space-y-1 list-disc pl-4">
                <li>Focus marketing efforts on high-margin products</li>
                <li>Review pricing strategy for underperforming products</li>
                <li>Optimize inventory levels based on turnover rates</li>
                <li>Consider discontinuing products with negative margins</li>
                <li>Analyze seasonal trends to improve demand forecasting</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductAnalysisSection;