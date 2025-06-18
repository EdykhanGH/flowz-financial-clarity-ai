import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Calculator, List, ArrowUpDown, Edit2, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTransactions } from '@/hooks/useTransactions';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';
import { useToast } from '@/hooks/use-toast';
import CategoryManager from '@/components/CategoryManager';

interface ManualTransaction {
  id: string;
  date: Date | undefined;
  transactionType: 'Sales Revenue' | 'Other Income' | 'Direct/Product Costs' | 'Indirect/Operational Costs' | 'Administrative Expenses';
  description: string;
  quantity: string;
  unitCost: string;
  totalAmount: string;
  businessCategory: string;
  costClassification: string[];
}

const ManualEntry: React.FC = () => {
  const [transactions, setTransactions] = useState<ManualTransaction[]>([
    {
      id: '1',
      date: new Date(),
      transactionType: 'Sales Revenue',
      description: '',
      quantity: '1',
      unitCost: '',
      totalAmount: '',
      businessCategory: 'Uncategorized',
      costClassification: []
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<'date' | 'description' | 'totalAmount' | 'transactionType' | 'businessCategory'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const { transactions: savedTransactions, loading, addTransaction } = useTransactions();
  const { categories, loading: categoriesLoading } = useBusinessCategories();
  const { toast } = useToast();

  const transactionTypes = [
    'Sales Revenue',
    'Other Income',
    'Direct/Product Costs',
    'Indirect/Operational Costs',
    'Administrative Expenses'
  ];

  const costClassificationOptions = [
    'Direct Cost',
    'Indirect Cost',
    'Fixed Cost',
    'Variable Cost',
    'Mixed Cost'
  ];

  // Smart cost classification suggestions based on keywords
  const getSmartClassificationSuggestions = (description: string): string[] => {
    const desc = description.toLowerCase();
    const suggestions: string[] = [];

    // Direct cost keywords
    if (desc.includes('material') || desc.includes('raw') || desc.includes('inventory') || 
        desc.includes('product') || desc.includes('manufacturing') || desc.includes('labor')) {
      suggestions.push('Direct Cost');
    }

    // Indirect cost keywords
    if (desc.includes('overhead') || desc.includes('utility') || desc.includes('maintenance') ||
        desc.includes('supervision') || desc.includes('facility')) {
      suggestions.push('Indirect Cost');
    }

    // Fixed cost keywords
    if (desc.includes('rent') || desc.includes('salary') || desc.includes('insurance') ||
        desc.includes('depreciation') || desc.includes('lease')) {
      suggestions.push('Fixed Cost');
    }

    // Variable cost keywords
    if (desc.includes('commission') || desc.includes('shipping') || desc.includes('packaging') ||
        desc.includes('per unit') || desc.includes('variable')) {
      suggestions.push('Variable Cost');
    }

    return [...new Set(suggestions)]; // Remove duplicates
  };

  const addRow = () => {
    const newTransaction: ManualTransaction = {
      id: Date.now().toString(),
      date: new Date(),
      transactionType: 'Sales Revenue',
      description: '',
      quantity: '1',
      unitCost: '',
      totalAmount: '',
      businessCategory: 'Uncategorized',
      costClassification: []
    };
    setTransactions([...transactions, newTransaction]);
  };

  const removeRow = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const updateTransaction = (id: string, field: keyof ManualTransaction, value: any) => {
    setTransactions(transactions.map(t => {
      if (t.id === id) {
        const updated = { ...t, [field]: value };
        
        // Auto-calculate total amount when quantity or unit cost changes
        if (field === 'quantity' || field === 'unitCost') {
          const qty = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
          const unit = parseFloat(field === 'unitCost' ? value : updated.unitCost) || 0;
          updated.totalAmount = (qty * unit).toFixed(2);
        }

        // Smart classification suggestions when description changes
        if (field === 'description' && value) {
          const suggestions = getSmartClassificationSuggestions(value);
          if (suggestions.length > 0 && updated.costClassification.length === 0) {
            updated.costClassification = suggestions;
          }
        }

        return updated;
      }
      return t;
    }));
  };

  const startEditing = (transaction: any) => {
    setEditingTransaction(transaction.id);
    setEditingData({
      date: new Date(transaction.date),
      description: transaction.description || '',
      totalAmount: transaction.amount.toString(),
      businessCategory: transaction.category,
      transactionType: getTransactionTypeFromDbType(transaction.type)
    });
  };

  const cancelEditing = () => {
    setEditingTransaction(null);
    setEditingData(null);
  };

  const saveEdit = async () => {
    if (!editingData || !editingTransaction) return;

    try {
      toast({
        title: "Edit functionality",
        description: "Transaction editing will be implemented with update API",
        variant: "default"
      });
      
      setEditingTransaction(null);
      setEditingData(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive"
      });
    }
  };

  const getTransactionTypeFromDbType = (dbType: string) => {
    switch (dbType) {
      case 'income':
        return 'Sales Revenue';
      case 'expense':
        return 'Direct/Product Costs';
      case 'refund':
        return 'Other Income';
      default:
        return 'Sales Revenue';
    }
  };

  const calculateSummary = () => {
    const validTransactions = transactions.filter(t => t.totalAmount && !isNaN(parseFloat(t.totalAmount)));
    
    const totalIncome = validTransactions
      .filter(t => t.transactionType === 'Sales Revenue' || t.transactionType === 'Other Income')
      .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    
    const totalExpenses = validTransactions
      .filter(t => ['Direct/Product Costs', 'Indirect/Operational Costs', 'Administrative Expenses'].includes(t.transactionType))
      .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    
    return {
      totalTransactions: validTransactions.length,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses
    };
  };

  const mapTransactionTypeToDb = (type: ManualTransaction['transactionType']) => {
    switch (type) {
      case 'Sales Revenue':
      case 'Other Income':
        return 'income';
      case 'Direct/Product Costs':
      case 'Indirect/Operational Costs':
      case 'Administrative Expenses':
        return 'expense';
      default:
        return 'expense';
    }
  };

  const handleSave = async () => {
    const validTransactions = transactions.filter(t => 
      t.date && t.description && t.totalAmount && !isNaN(parseFloat(t.totalAmount))
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
          date: format(transaction.date!, 'yyyy-MM-dd'),
          description: transaction.description,
          amount: parseFloat(transaction.totalAmount),
          type: mapTransactionTypeToDb(transaction.transactionType),
          category: transaction.businessCategory
        });
      }

      toast({
        title: "Success",
        description: `${validTransactions.length} transactions saved successfully`
      });

      // Reset to single empty row
      setTransactions([{
        id: Date.now().toString(),
        date: new Date(),
        transactionType: 'Sales Revenue',
        description: '',
        quantity: '1',
        unitCost: '',
        totalAmount: '',
        businessCategory: 'Uncategorized',
        costClassification: []
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
      case 'totalAmount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'transactionType':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'businessCategory':
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

  // Get available categories including user's custom categories
  const availableCategories = [
    'Uncategorized',
    ...categories.map(cat => cat.category_name),
  ];

  const renderDatePicker = (value: Date | undefined, onChange: (date: Date | undefined) => void) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-8 text-sm",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );

  const renderCostClassificationMultiSelect = (
    value: string[],
    onChange: (value: string[]) => void
  ) => (
    <div className="relative">
      <Select
        value=""
        onValueChange={(selectedValue) => {
          if (!value.includes(selectedValue)) {
            onChange([...value, selectedValue]);
          }
        }}
      >
        <SelectTrigger className="min-w-[150px] h-8 text-sm">
          <SelectValue placeholder="Select classifications" />
        </SelectTrigger>
        <SelectContent>
          {costClassificationOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {value.map((classification) => (
            <Badge
              key={classification}
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              {classification}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onChange(value.filter(c => c !== classification))}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  const renderCategorySelect = (value: string, onChange: (value: string) => void) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="min-w-[120px] h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableCategories.map((category) => (
          <SelectItem key={category} value={category}>{category}</SelectItem>
        ))}
        <SelectItem value="__add_new__">
          <div className="flex items-center gap-2 text-orange-500">
            <Plus className="w-4 h-4" />
            Add Category
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );

  const handleCategoryChange = (transactionId: string, value: string) => {
    if (value === '__add_new__') {
      setShowCategoryDialog(true);
    } else {
      updateTransaction(transactionId, 'businessCategory', value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Entry Form Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-orange-400" />
            Enhanced Transaction Entry
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

          {/* Enhanced Table */}
          <div className="overflow-x-auto border border-gray-600 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-700 hover:bg-gray-700">
                  <TableHead className="text-gray-300 font-semibold">Date *</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Transaction Type *</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Description *</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Qty</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Unit Cost (₦)</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Total Amount (₦) *</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Business Category</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Cost Classification</TableHead>
                  <TableHead className="text-gray-300 font-semibold w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="bg-gray-800 hover:bg-gray-750">
                    <TableCell className="p-2">
                      {renderDatePicker(
                        transaction.date,
                        (date) => updateTransaction(transaction.id, 'date', date)
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      <Select
                        value={transaction.transactionType}
                        onValueChange={(value) => updateTransaction(transaction.id, 'transactionType', value)}
                      >
                        <SelectTrigger className="min-w-[160px] h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        value={transaction.quantity}
                        onChange={(e) => updateTransaction(transaction.id, 'quantity', e.target.value)}
                        className="min-w-[80px] h-8 text-sm"
                        step="0.01"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={transaction.unitCost}
                        onChange={(e) => updateTransaction(transaction.id, 'unitCost', e.target.value)}
                        className="min-w-[100px] h-8 text-sm"
                        step="0.01"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={transaction.totalAmount}
                        onChange={(e) => updateTransaction(transaction.id, 'totalAmount', e.target.value)}
                        className="min-w-[120px] h-8 text-sm"
                        step="0.01"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      {renderCategorySelect(
                        transaction.businessCategory,
                        (value) => handleCategoryChange(transaction.id, value)
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      {renderCostClassificationMultiSelect(
                        transaction.costClassification,
                        (value) => updateTransaction(transaction.id, 'costClassification', value)
                      )}
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

      {/* Excel-like Saved Transactions Display with Edit Functionality */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <List className="w-5 h-5 mr-2 text-orange-400" />
              All Transactions ({savedTransactions.length})
            </div>
            <div className="text-sm text-gray-400">
              Excel-like View with Editing
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
                      onClick={() => handleSort('totalAmount')}
                    >
                      <div className="flex items-center">
                        Amount (₦)
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-gray-800 font-bold cursor-pointer hover:bg-gray-200 border-r border-gray-300"
                      onClick={() => handleSort('transactionType')}
                    >
                      <div className="flex items-center">
                        Type
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-gray-800 font-bold cursor-pointer hover:bg-gray-200 border-r border-gray-300"
                      onClick={() => handleSort('businessCategory')}
                    >
                      <div className="flex items-center">
                        Category
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </TableHead>
                    <TableHead className="text-gray-800 font-bold border-r border-gray-300">
                      Actions
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
                        {editingTransaction === transaction.id ? (
                          <Input
                            type="date"
                            value={editingData?.date || ''}
                            onChange={(e) => setEditingData({...editingData, date: e.target.value})}
                            className="h-8 text-sm"
                          />
                        ) : (
                          new Date(transaction.date).toLocaleDateString('en-GB')
                        )}
                      </TableCell>
                      <TableCell className="text-gray-900 border-r border-gray-200">
                        {editingTransaction === transaction.id ? (
                          <Input
                            value={editingData?.description || ''}
                            onChange={(e) => setEditingData({...editingData, description: e.target.value})}
                            className="h-8 text-sm"
                          />
                        ) : (
                          transaction.description || 'No description'
                        )}
                      </TableCell>
                      <TableCell className={`font-mono text-right border-r border-gray-200 ${
                        transaction.type === 'income' || transaction.type === 'refund' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {editingTransaction === transaction.id ? (
                          <Input
                            type="number"
                            value={editingData?.totalAmount || ''}
                            onChange={(e) => setEditingData({...editingData, totalAmount: e.target.value})}
                            className="h-8 text-sm text-right"
                            step="0.01"
                          />
                        ) : (
                          <>
                            {transaction.type === 'income' || transaction.type === 'refund' ? '+' : '-'}₦{Math.abs(transaction.amount).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-900 border-r border-gray-200">
                        {editingTransaction === transaction.id ? (
                          <Select
                            value={editingData?.transactionType || ''}
                            onValueChange={(value) => setEditingData({...editingData, transactionType: value})}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sales Revenue">Sales Revenue</SelectItem>
                              <SelectItem value="Other Income">Other Income</SelectItem>
                              <SelectItem value="Direct/Product Costs">Direct/Product Costs</SelectItem>
                              <SelectItem value="Indirect/Operational Costs">Indirect/Operational Costs</SelectItem>
                              <SelectItem value="Administrative Expenses">Administrative Expenses</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.type === 'income' ? 'bg-green-100 text-green-800' :
                            transaction.type === 'expense' ? 'bg-red-100 text-red-800' :
                            transaction.type === 'transfer' ? 'bg-blue-100 text-blue-800' :
                            transaction.type === 'investment' ? 'bg-purple-100 text-purple-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.type}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-900 border-r border-gray-200">
                        {editingTransaction === transaction.id ? (
                          <Select
                            value={editingData?.businessCategory || ''}
                            onValueChange={(value) => setEditingData({...editingData, businessCategory: value})}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCategories.map((category) => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          transaction.category
                        )}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {editingTransaction === transaction.id ? (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={saveEdit}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(transaction)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Category</DialogTitle>
          </DialogHeader>
          <CategoryManager 
            showTitle={false}
            title=""
            description=""
          />
          <div className="flex justify-end mt-4">
            <Button 
              onClick={() => setShowCategoryDialog(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManualEntry;
