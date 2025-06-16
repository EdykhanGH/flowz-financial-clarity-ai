
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, Calculator, List, ArrowUpDown } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';

interface ManualTransaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  type: 'Income' | 'Capital Cost' | 'Daily Expenses' | 'Refund';
  category: string;
}

const ManualEntry: React.FC = () => {
  const [transactions, setTransactions] = useState<ManualTransaction[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      type: 'Daily Expenses',
      category: 'Uncategorized'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<'date' | 'description' | 'amount' | 'type' | 'category'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { transactions: savedTransactions, loading, addTransaction } = useTransactions();
  const { toast } = useToast();

  const addRow = () => {
    const newTransaction: ManualTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      type: 'Daily Expenses',
      category: 'Uncategorized'
    };
    setTransactions([...transactions, newTransaction]);
  };

  const removeRow = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const updateTransaction = (id: string, field: keyof ManualTransaction, value: string) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const calculateSummary = () => {
    const validTransactions = transactions.filter(t => t.amount && !isNaN(parseFloat(t.amount)));
    
    // Calculate total income (Income + Refund)
    const totalIncome = validTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalRefunds = validTransactions
      .filter(t => t.type === 'Refund')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // Calculate total costs (Capital Cost + Daily Expenses)
    const totalExpenses = validTransactions
      .filter(t => t.type === 'Capital Cost' || t.type === 'Daily Expenses')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // Net income = (Income + Refund) - (Capital Cost + Daily Expenses)
    const adjustedIncome = totalIncome + totalRefunds;
    
    return {
      totalTransactions: validTransactions.length,
      totalIncome: adjustedIncome,
      totalExpenses,
      netIncome: adjustedIncome - totalExpenses
    };
  };

  const mapTransactionType = (type: ManualTransaction['type']) => {
    switch (type) {
      case 'Income':
        return 'income';
      case 'Capital Cost':
      case 'Daily Expenses':
        return 'expense';
      case 'Refund':
        return 'refund';
      default:
        return 'expense';
    }
  };

  const handleSave = async () => {
    const validTransactions = transactions.filter(t => 
      t.date && t.description && t.amount && !isNaN(parseFloat(t.amount))
    );

    if (validTransactions.length === 0) {
      toast({
        title: "No valid transactions",
        description: "Please add at least one complete transaction",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      for (const transaction of validTransactions) {
        await addTransaction({
          date: transaction.date,
          description: transaction.description,
          amount: parseFloat(transaction.amount),
          type: mapTransactionType(transaction.type),
          category: transaction.type // Store the original type as category for better tracking
        });
      }

      toast({
        title: "Success",
        description: `${validTransactions.length} transactions saved successfully`
      });

      // Reset to single empty row
      setTransactions([{
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'Daily Expenses',
        category: 'Uncategorized'
      }]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transactions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = [...savedTransactions].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'date':
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      case 'description':
        aValue = a.description || '';
        bValue = b.description || '';
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'category':
        aValue = a.category;
        bValue = b.category;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const summary = calculateSummary();

  return (
    <div className="space-y-6">
      {/* Entry Form Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-orange-400" />
            Manual Transaction Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Cards */}
          {summary.totalTransactions > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-700 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-300">Transactions</p>
                <p className="text-lg font-bold text-white">{summary.totalTransactions}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-300">Total Income (Inc. Refunds)</p>
                <p className="text-lg font-bold text-green-400">₦{summary.totalIncome.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-300">Total Costs</p>
                <p className="text-lg font-bold text-red-400">₦{summary.totalExpenses.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-300">Net Income</p>
                <p className={`text-lg font-bold ${summary.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₦{summary.netIncome.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Excel-like Table */}
          <div className="overflow-x-auto border border-gray-600 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-700 hover:bg-gray-700">
                  <TableHead className="text-gray-300 font-semibold">Date</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Description</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Amount (₦)</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Type</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Category</TableHead>
                  <TableHead className="text-gray-300 font-semibold w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="bg-gray-800 hover:bg-gray-750">
                    <TableCell className="p-2">
                      <Input
                        type="date"
                        value={transaction.date}
                        onChange={(e) => updateTransaction(transaction.id, 'date', e.target.value)}
                        className="min-w-[140px] h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        placeholder="Enter description..."
                        value={transaction.description}
                        onChange={(e) => updateTransaction(transaction.id, 'description', e.target.value)}
                        className="min-w-[200px] h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={transaction.amount}
                        onChange={(e) => updateTransaction(transaction.id, 'amount', e.target.value)}
                        className="min-w-[120px] h-8 text-sm"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Select
                        value={transaction.type}
                        onValueChange={(value) => updateTransaction(transaction.id, 'type', value)}
                      >
                        <SelectTrigger className="min-w-[140px] h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Income">Income</SelectItem>
                          <SelectItem value="Capital Cost">Capital Cost</SelectItem>
                          <SelectItem value="Daily Expenses">Daily Expenses</SelectItem>
                          <SelectItem value="Refund">Refund</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        placeholder="Category"
                        value={transaction.category}
                        onChange={(e) => updateTransaction(transaction.id, 'category', e.target.value)}
                        className="min-w-[120px] h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      {transactions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(transaction.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              onClick={addRow}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Transactions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Excel-like Saved Transactions Display */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <List className="w-5 h-5 mr-2 text-orange-400" />
              All Transactions ({savedTransactions.length})
            </div>
            <div className="text-sm text-gray-400">
              Excel-like View
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          ) : savedTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No transactions saved yet. Add some transactions above to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-600 rounded-lg bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-300">
                    <TableHead 
                      className="text-gray-800 font-bold cursor-pointer hover:bg-gray-200 border-r border-gray-300"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-gray-800 font-bold cursor-pointer hover:bg-gray-200 border-r border-gray-300"
                      onClick={() => handleSort('description')}
                    >
                      <div className="flex items-center">
                        Description
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-gray-800 font-bold cursor-pointer hover:bg-gray-200 border-r border-gray-300"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center">
                        Amount (₦)
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-gray-800 font-bold cursor-pointer hover:bg-gray-200 border-r border-gray-300"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center">
                        Type
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-gray-800 font-bold cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center">
                        Category
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.map((transaction, index) => (
                    <TableRow 
                      key={transaction.id} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 border-b border-gray-200`}
                    >
                      <TableCell className="text-gray-900 border-r border-gray-200 font-mono text-sm">
                        {new Date(transaction.date).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="text-gray-900 border-r border-gray-200">
                        {transaction.description || 'No description'}
                      </TableCell>
                      <TableCell className={`font-mono text-right border-r border-gray-200 ${
                        transaction.type === 'income' || transaction.type === 'refund' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' || transaction.type === 'refund' ? '+' : '-'}₦{Math.abs(transaction.amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </TableCell>
                      <TableCell className="text-gray-900 border-r border-gray-200">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          transaction.type === 'income' ? 'bg-green-100 text-green-800' :
                          transaction.type === 'expense' ? 'bg-red-100 text-red-800' :
                          transaction.type === 'transfer' ? 'bg-blue-100 text-blue-800' :
                          transaction.type === 'investment' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {transaction.category}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualEntry;
