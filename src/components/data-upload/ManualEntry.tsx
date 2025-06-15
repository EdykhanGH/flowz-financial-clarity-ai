import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, Calculator, List } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';

interface ManualTransaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  type: 'income' | 'expense' | 'transfer' | 'investment' | 'refund';
  category: string;
}

const ManualEntry: React.FC = () => {
  const [transactions, setTransactions] = useState<ManualTransaction[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      type: 'expense',
      category: 'Uncategorized'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { transactions: savedTransactions, loading, addTransaction } = useTransactions();
  const { toast } = useToast();

  const addRow = () => {
    const newTransaction: ManualTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      type: 'expense',
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
    const totalIncome = validTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = validTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
      totalTransactions: validTransactions.length,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses
    };
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
          type: transaction.type,
          category: transaction.category
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
        type: 'expense',
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
                <p className="text-sm text-gray-300">Total Income</p>
                <p className="text-lg font-bold text-green-400">₦{summary.totalIncome.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-300">Total Expenses</p>
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
                        <SelectTrigger className="min-w-[120px] h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="refund">Refund</SelectItem>
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

      {/* Saved Transactions Display */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <List className="w-5 h-5 mr-2 text-orange-400" />
            Saved Transactions ({savedTransactions.length})
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
            <div className="overflow-x-auto border border-gray-600 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-700 hover:bg-gray-700">
                    <TableHead className="text-gray-300 font-semibold">Date</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Description</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Amount (₦)</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Type</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="bg-gray-800 hover:bg-gray-750">
                      <TableCell className="text-gray-300">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {transaction.description || 'No description'}
                      </TableCell>
                      <TableCell className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}₦{Math.abs(transaction.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-300 capitalize">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.type === 'income' ? 'bg-green-900/30 text-green-400' :
                          transaction.type === 'expense' ? 'bg-red-900/30 text-red-400' :
                          'bg-blue-900/30 text-blue-400'
                        }`}>
                          {transaction.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300">
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
