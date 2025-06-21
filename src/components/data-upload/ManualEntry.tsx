
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, Calculator, DollarSign, CreditCard, Calendar as CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTransactions } from '@/hooks/useTransactions';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';
import { useToast } from '@/hooks/use-toast';
import CategoryManager from '@/components/CategoryManager';

interface ManualTransaction {
  id: string;
  date: Date | undefined;
  category: string;
  description: string;
  quantity: string;
  unitCost: string;
  totalAmount: string;
  businessCategory: string;
}

const ManualEntry: React.FC = () => {
  const [incomeTransactions, setIncomeTransactions] = useState<ManualTransaction[]>([
    {
      id: '1',
      date: new Date(),
      category: '',
      description: '',
      quantity: '1',
      unitCost: '',
      totalAmount: '',
      businessCategory: 'Uncategorized'
    }
  ]);
  
  const [costTransactions, setCostTransactions] = useState<ManualTransaction[]>([
    {
      id: '1',
      date: new Date(),
      category: '',
      description: '',
      quantity: '1',
      unitCost: '',
      totalAmount: '',
      businessCategory: 'Uncategorized'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [showQuantityIncome, setShowQuantityIncome] = useState(false);
  const [showQuantityCost, setShowQuantityCost] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [customIncomeCategory, setCustomIncomeCategory] = useState('');
  const [customCostCategory, setCustomCostCategory] = useState('');
  const [incomeCategories, setIncomeCategories] = useState([
    'Product Sales',
    'Service Fees',
    'Subscription Revenue',
    'Consulting Fees',
    'Rental Income',
    'Commission Revenue',
    'Licensing Revenue',
    'Interest Income',
    'Dividend Income',
    'Other Income'
  ]);
  const [costCategories, setCostCategories] = useState([
    'Payroll and Benefits',
    'Rent and Facilities',
    'Marketing and Advertising',
    'Raw Materials/Inventory',
    'Technology and Software',
    'Professional Services',
    'Utilities and Operations',
    'Transportation',
    'Insurance',
    'Office Supplies',
    'Other Costs'
  ]);

  const { addTransaction } = useTransactions();
  const { categories, loading: categoriesLoading } = useBusinessCategories();
  const { toast } = useToast();

  const addIncomeRow = () => {
    const newTransaction: ManualTransaction = {
      id: Date.now().toString(),
      date: new Date(),
      category: '',
      description: '',
      quantity: '1',
      unitCost: '',
      totalAmount: '',
      businessCategory: 'Uncategorized'
    };
    setIncomeTransactions([...incomeTransactions, newTransaction]);
  };

  const addCostRow = () => {
    const newTransaction: ManualTransaction = {
      id: Date.now().toString(),
      date: new Date(),
      category: '',
      description: '',
      quantity: '1',
      unitCost: '',
      totalAmount: '',
      businessCategory: 'Uncategorized'
    };
    setCostTransactions([...costTransactions, newTransaction]);
  };

  const removeIncomeRow = (id: string) => {
    setIncomeTransactions(incomeTransactions.filter(t => t.id !== id));
  };

  const removeCostRow = (id: string) => {
    setCostTransactions(costTransactions.filter(t => t.id !== id));
  };

  const updateIncomeTransaction = (id: string, field: keyof ManualTransaction, value: any) => {
    setIncomeTransactions(incomeTransactions.map(t => {
      if (t.id === id) {
        const updated = { ...t, [field]: value };
        
        // Auto-calculate total amount when quantity or unit cost changes
        if (field === 'quantity' || field === 'unitCost') {
          const qty = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
          const unit = parseFloat(field === 'unitCost' ? value : updated.unitCost) || 0;
          updated.totalAmount = (qty * unit).toFixed(2);
        }

        return updated;
      }
      return t;
    }));
  };

  const updateCostTransaction = (id: string, field: keyof ManualTransaction, value: any) => {
    setCostTransactions(costTransactions.map(t => {
      if (t.id === id) {
        const updated = { ...t, [field]: value };
        
        // Auto-calculate total amount when quantity or unit cost changes
        if (field === 'quantity' || field === 'unitCost') {
          const qty = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
          const unit = parseFloat(field === 'unitCost' ? value : updated.unitCost) || 0;
          updated.totalAmount = (qty * unit).toFixed(2);
        }

        return updated;
      }
      return t;
    }));
  };

  const addCustomIncomeCategory = () => {
    if (customIncomeCategory.trim() && !incomeCategories.includes(customIncomeCategory.trim())) {
      setIncomeCategories([...incomeCategories, customIncomeCategory.trim()]);
      setCustomIncomeCategory('');
      toast({
        title: "Category Added",
        description: `"${customIncomeCategory.trim()}" has been added to income categories.`,
      });
    }
  };

  const addCustomCostCategory = () => {
    if (customCostCategory.trim() && !costCategories.includes(customCostCategory.trim())) {
      setCostCategories([...costCategories, customCostCategory.trim()]);
      setCustomCostCategory('');
      toast({
        title: "Category Added",
        description: `"${customCostCategory.trim()}" has been added to cost categories.`,
      });
    }
  };

  // Get available business categories including user's custom categories
  const availableBusinessCategories = [
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

  const renderCategorySelect = (categories: string[], value: string, onChange: (value: string) => void, type: 'income' | 'cost') => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="min-w-[150px] h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category} value={category}>{category}</SelectItem>
        ))}
        <SelectItem value="__add_new__">
          <div className="flex items-center gap-2 text-orange-500">
            <Plus className="w-4 h-4" />
            Add {type === 'income' ? 'Income' : 'Cost'} Category
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );

  const renderBusinessCategorySelect = (value: string, onChange: (value: string) => void) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="min-w-[120px] h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableBusinessCategories.map((category) => (
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

  const handleCategoryChange = (transactionId: string, value: string, type: 'income' | 'cost', categoryType: 'main' | 'business') => {
    if (value === '__add_new__') {
      if (categoryType === 'business') {
        setShowCategoryDialog(true);
      } else {
        // Handle adding new income/cost category inline
        const newCategory = prompt(`Enter new ${type} category:`);
        if (newCategory && newCategory.trim()) {
          if (type === 'income') {
            setIncomeCategories([...incomeCategories, newCategory.trim()]);
            updateIncomeTransaction(transactionId, 'category', newCategory.trim());
          } else {
            setCostCategories([...costCategories, newCategory.trim()]);
            updateCostTransaction(transactionId, 'category', newCategory.trim());
          }
        }
      }
    } else {
      if (type === 'income') {
        updateIncomeTransaction(transactionId, categoryType === 'main' ? 'category' : 'businessCategory', value);
      } else {
        updateCostTransaction(transactionId, categoryType === 'main' ? 'category' : 'businessCategory', value);
      }
    }
  };

  const calculateSummary = () => {
    const validIncomeTransactions = incomeTransactions.filter(t => t.totalAmount && !isNaN(parseFloat(t.totalAmount)));
    const validCostTransactions = costTransactions.filter(t => t.totalAmount && !isNaN(parseFloat(t.totalAmount)));
    
    const totalIncome = validIncomeTransactions.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    const totalCosts = validCostTransactions.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    const netIncome = totalIncome - totalCosts;
    
    return {
      totalTransactions: validIncomeTransactions.length + validCostTransactions.length,
      totalIncome,
      totalCosts,
      netIncome
    };
  };

  const handleSave = async () => {
    const validIncomeTransactions = incomeTransactions.filter(t => 
      t.date && t.category && t.totalAmount && !isNaN(parseFloat(t.totalAmount))
    );
    
    const validCostTransactions = costTransactions.filter(t => 
      t.date && t.category && t.totalAmount && !isNaN(parseFloat(t.totalAmount))
    );

    const totalValid = validIncomeTransactions.length + validCostTransactions.length;

    if (totalValid === 0) {
      toast({
        title: "No valid transactions",
        description: "Please add at least one complete transaction",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Save income transactions
      for (const transaction of validIncomeTransactions) {
        await addTransaction({
          date: format(transaction.date!, 'yyyy-MM-dd'),
          description: `${transaction.category} - ${transaction.description || 'No description'}`,
          amount: parseFloat(transaction.totalAmount),
          type: 'income',
          category: transaction.businessCategory
        });
      }

      // Save cost transactions
      for (const transaction of validCostTransactions) {
        await addTransaction({
          date: format(transaction.date!, 'yyyy-MM-dd'),
          description: `${transaction.category} - ${transaction.description || 'No description'}`,
          amount: parseFloat(transaction.totalAmount),
          type: 'expense',
          category: transaction.businessCategory
        });
      }

      toast({
        title: "Success",
        description: `${totalValid} transactions saved successfully`
      });

      // Reset to single empty rows
      setIncomeTransactions([{
        id: Date.now().toString(),
        date: new Date(),
        category: '',
        description: '',
        quantity: '1',
        unitCost: '',
        totalAmount: '',
        businessCategory: 'Uncategorized'
      }]);

      setCostTransactions([{
        id: (Date.now() + 1).toString(),
        date: new Date(),
        category: '',
        description: '',
        quantity: '1',
        unitCost: '',
        totalAmount: '',
        businessCategory: 'Uncategorized'
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
      {/* Summary Cards */}
      {summary.totalTransactions > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-700 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-300">Total Transactions</p>
            <p className="text-lg font-bold text-white">{summary.totalTransactions}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-300">Total Income</p>
            <p className="text-lg font-bold text-green-400">₦{summary.totalIncome.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-300">Total Costs</p>
            <p className="text-lg font-bold text-red-400">₦{summary.totalCosts.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-300">Net Income</p>
            <p className={`text-lg font-bold ${summary.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₦{summary.netIncome.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Income Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-400" />
              Income Transactions
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-quantity-income"
                  checked={showQuantityIncome}
                  onCheckedChange={setShowQuantityIncome}
                />
                <Label htmlFor="show-quantity-income" className="text-sm text-gray-300">
                  {showQuantityIncome ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Show Quantity & Unit Cost
                </Label>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto border border-gray-600 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-700 hover:bg-gray-700">
                  <TableHead className="text-gray-300 font-semibold">Date *</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Income Category *</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Description</TableHead>
                  {showQuantityIncome && <TableHead className="text-gray-300 font-semibold">Quantity</TableHead>}
                  {showQuantityIncome && <TableHead className="text-gray-300 font-semibold">Unit Cost (₦)</TableHead>}
                  <TableHead className="text-gray-300 font-semibold">Total Amount (₦) *</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Business Category</TableHead>
                  <TableHead className="text-gray-300 font-semibold w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="bg-gray-800 hover:bg-gray-750">
                    <TableCell className="p-2">
                      {renderDatePicker(
                        transaction.date,
                        (date) => updateIncomeTransaction(transaction.id, 'date', date)
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      {renderCategorySelect(
                        incomeCategories,
                        transaction.category,
                        (value) => handleCategoryChange(transaction.id, value, 'income', 'main'),
                        'income'
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        placeholder="Enter description..."
                        value={transaction.description}
                        onChange={(e) => updateIncomeTransaction(transaction.id, 'description', e.target.value)}
                        className="min-w-[150px] h-8 text-sm"
                      />
                    </TableCell>
                    {showQuantityIncome && (
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          value={transaction.quantity}
                          onChange={(e) => updateIncomeTransaction(transaction.id, 'quantity', e.target.value)}
                          className="min-w-[80px] h-8 text-sm"
                          step="0.01"
                          min="0"
                        />
                      </TableCell>
                    )}
                    {showQuantityIncome && (
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={transaction.unitCost}
                          onChange={(e) => updateIncomeTransaction(transaction.id, 'unitCost', e.target.value)}
                          className="min-w-[100px] h-8 text-sm"
                          step="0.01"
                          min="0"
                        />
                      </TableCell>
                    )}
                    <TableCell className="p-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={transaction.totalAmount}
                        onChange={(e) => updateIncomeTransaction(transaction.id, 'totalAmount', e.target.value)}
                        className="min-w-[120px] h-8 text-sm"
                        step="0.01"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      {renderBusinessCategorySelect(
                        transaction.businessCategory,
                        (value) => handleCategoryChange(transaction.id, value, 'income', 'business')
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      {incomeTransactions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIncomeRow(transaction.id)}
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
          <Button
            onClick={addIncomeRow}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Income Row
          </Button>
        </CardContent>
      </Card>

      {/* Cost Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-red-400" />
              Cost Transactions
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-quantity-cost"
                  checked={showQuantityCost}
                  onCheckedChange={setShowQuantityCost}
                />
                <Label htmlFor="show-quantity-cost" className="text-sm text-gray-300">
                  {showQuantityCost ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Show Quantity & Unit Cost
                </Label>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto border border-gray-600 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-700 hover:bg-gray-700">
                  <TableHead className="text-gray-300 font-semibold">Date *</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Cost Category *</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Description</TableHead>
                  {showQuantityCost && <TableHead className="text-gray-300 font-semibold">Quantity</TableHead>}
                  {showQuantityCost && <TableHead className="text-gray-300 font-semibold">Unit Cost (₦)</TableHead>}
                  <TableHead className="text-gray-300 font-semibold">Total Amount (₦) *</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Business Category</TableHead>
                  <TableHead className="text-gray-300 font-semibold w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="bg-gray-800 hover:bg-gray-750">
                    <TableCell className="p-2">
                      {renderDatePicker(
                        transaction.date,
                        (date) => updateCostTransaction(transaction.id, 'date', date)
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      {renderCategorySelect(
                        costCategories,
                        transaction.category,
                        (value) => handleCategoryChange(transaction.id, value, 'cost', 'main'),
                        'cost'
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        placeholder="Enter description..."
                        value={transaction.description}
                        onChange={(e) => updateCostTransaction(transaction.id, 'description', e.target.value)}
                        className="min-w-[150px] h-8 text-sm"
                      />
                    </TableCell>
                    {showQuantityCost && (
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          value={transaction.quantity}
                          onChange={(e) => updateCostTransaction(transaction.id, 'quantity', e.target.value)}
                          className="min-w-[80px] h-8 text-sm"
                          step="0.01"
                          min="0"
                        />
                      </TableCell>
                    )}
                    {showQuantityCost && (
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={transaction.unitCost}
                          onChange={(e) => updateCostTransaction(transaction.id, 'unitCost', e.target.value)}
                          className="min-w-[100px] h-8 text-sm"
                          step="0.01"
                          min="0"
                        />
                      </TableCell>
                    )}
                    <TableCell className="p-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={transaction.totalAmount}
                        onChange={(e) => updateCostTransaction(transaction.id, 'totalAmount', e.target.value)}
                        className="min-w-[120px] h-8 text-sm"
                        step="0.01"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      {renderBusinessCategorySelect(
                        transaction.businessCategory,
                        (value) => handleCategoryChange(transaction.id, value, 'cost', 'business')
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      {costTransactions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCostRow(transaction.id)}
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
          <Button
            onClick={addCostRow}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Cost Row
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save All Transactions'}
        </Button>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Business Category</DialogTitle>
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
