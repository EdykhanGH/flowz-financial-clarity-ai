import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowUpRight,
  Filter,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  PieChart,
  Clipboard,
  Wallet,
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
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ExpenseAnalysisSection: React.FC = () => {
  const { transactions } = useTransactions();
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [costCenterFilter, setCostCenterFilter] = useState<string | undefined>(undefined);
  
  // Filter transactions based on current filters
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => {
      // Filter by transaction type (only expenses)
      if (transaction.type !== 'expense') return false;
      
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
      
      // Filter by cost center if selected (temporarily disabled as field doesn't exist)
      // if (costCenterFilter && transaction.cost_center_id !== costCenterFilter) {
      //   return false;
      // }
      
      return true;
    });
  }, [transactions, filterDate, costCenterFilter]);

  // Total cost calculation
  const totalCost = React.useMemo(() => {
    return filteredTransactions.reduce((acc, transaction) => {
      return acc + Number(transaction.amount);
    }, 0);
  }, [filteredTransactions]);

  // Cost by category
  const costByCategory = React.useMemo(() => {
    const categoryCosts: Record<string, number> = {};
    
    filteredTransactions.forEach(transaction => {
      if (!categoryCosts[transaction.category]) {
        categoryCosts[transaction.category] = 0;
      }
      categoryCosts[transaction.category] += Number(transaction.amount);
    });
    
    return Object.entries(categoryCosts)
      .map(([category, amount]) => ({
        category,
        amount
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);
  
  // Cost type breakdown (fixed, variable, mixed) based on cost_type field
  const costTypeBreakdown = React.useMemo(() => {
    // Use cost_type field for fixed/variable classification
    const fixed = filteredTransactions
      .filter(t => (t.cost_type === 'fixed') || (t.classification?.cost_type === 'fixed'))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const variable = filteredTransactions
      .filter(t => (t.cost_type === 'variable') || (t.classification?.cost_type === 'variable'))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const mixed = filteredTransactions
      .filter(t => !t.cost_type || (!t.classification?.cost_type && !t.cost_type))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    return [
      { name: 'Fixed Costs', value: fixed, percentage: totalCost > 0 ? (fixed / totalCost) * 100 : 0 },
      { name: 'Variable Costs', value: variable, percentage: totalCost > 0 ? (variable / totalCost) * 100 : 0 },
      { name: 'Mixed/Unclassified Costs', value: mixed, percentage: totalCost > 0 ? (mixed / totalCost) * 100 : 0 }
    ];
  }, [filteredTransactions, totalCost]);

  // Cost nature breakdown (direct vs indirect)
  const costNatureBreakdown = React.useMemo(() => {
    // Use cost_nature field for direct/indirect classification
    const direct = filteredTransactions
      .filter(t => (t.cost_nature === 'direct') || (t.classification?.cost_nature === 'direct'))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const indirect = filteredTransactions
      .filter(t => (t.cost_nature === 'indirect') || (t.classification?.cost_nature === 'indirect'))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const unclassified = filteredTransactions
      .filter(t => !t.cost_nature && !t.classification?.cost_nature)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    return [
      { name: 'Direct Business Costs', value: direct, percentage: totalCost > 0 ? (direct / totalCost) * 100 : 0 },
      { name: 'Indirect Business Costs', value: indirect, percentage: totalCost > 0 ? (indirect / totalCost) * 100 : 0 },
      { name: 'Unclassified Costs', value: unclassified, percentage: totalCost > 0 ? (unclassified / totalCost) * 100 : 0 }
    ];
  }, [filteredTransactions, totalCost]);

  // Reset filters
  const resetFilters = () => {
    setFilterDate(undefined);
    setCostCenterFilter(undefined);
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
        <h2 className="text-2xl font-bold">Expense Analysis</h2>
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
              
              <h4 className="font-medium mb-2">Cost Center</h4>
              <Select value={costCenterFilter} onValueChange={setCostCenterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cost center" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Cost Centers</SelectItem>
                  {/* Cost center options would be dynamically loaded here */}
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

      {/* Total Cost Card */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-700 text-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-300">Total Expenses</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalCost)}</p>
              <p className="text-sm text-slate-300 mt-1">
                {filteredTransactions.length} expense transactions
                {filterDate && ` on ${format(filterDate, 'MMM d, yyyy')}`}
              </p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-full">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Categories Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-orange-500" />
            Cost by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={costByCategory} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                angle={-45} 
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value).replace('NGN', '₦')}
                width={80}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value as number), 'Amount']} 
                labelFormatter={(value) => `Category: ${value}`}
              />
              <Legend />
              <Bar dataKey="amount" fill="#f97316" name="Amount" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost Type Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Cost Type Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={costTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {costTypeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-4">
              {costTypeBreakdown.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clipboard className="w-5 h-5 mr-2 text-green-500" />
              Business Cost Nature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={costNatureBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {costNatureBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-4">
              {costNatureBreakdown.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            AI-Powered Expense Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-l-orange-500">
              <h4 className="font-semibold text-orange-900">Risk Detection</h4>
              <p className="text-sm text-orange-700 mt-1">
                {costTypeBreakdown[0].percentage > 70 ? (
                  <>Your {costTypeBreakdown[0].name} represent {costTypeBreakdown[0].percentage.toFixed(1)}% of total costs, which creates a potential risk of inflexible cost structure. Consider diversifying your cost base.</>
                ) : (
                  <>Your cost structure appears balanced between different cost types. Continue monitoring to maintain this balance.</>
                )}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
              <h4 className="font-semibold text-blue-900">Expense Optimization</h4>
              <p className="text-sm text-blue-700 mt-1">
                {costByCategory.length > 0 && (
                  <>Your highest expense category is {costByCategory[0].category} at {formatCurrency(costByCategory[0].amount)} ({((costByCategory[0].amount / totalCost) * 100).toFixed(1)}% of total). Consider reviewing this area for potential cost savings.</>
                )}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-l-green-500">
              <h4 className="font-semibold text-green-900">Recommended Actions</h4>
              <ul className="text-sm text-green-700 mt-1 space-y-1 list-disc pl-4">
                <li>Review your top expense categories for potential cost reduction opportunities</li>
                <li>Consider renegotiating contracts for recurring fixed costs</li>
                <li>Implement a cost approval process for expenses exceeding certain thresholds</li>
                <li>Compare your cost structure against industry benchmarks to identify outliers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseAnalysisSection;