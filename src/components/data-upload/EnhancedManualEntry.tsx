
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactions } from '@/hooks/useTransactions';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useRevenueCategories } from '@/hooks/useRevenueCategories';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

const EnhancedManualEntry = () => {
  const [expenseData, setExpenseData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [revenueData, setRevenueData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newRevenueCategory, setNewRevenueCategory] = useState('');
  
  const { addTransaction, isAddingTransaction } = useTransactions();
  const { 
    categories: expenseCategories, 
    loading: expenseCategoriesLoading,
    addCategory: addExpenseCategory 
  } = useExpenseCategories();
  const { 
    categories: revenueCategories, 
    loading: revenueCategoriesLoading,
    addCategory: addRevenueCategory 
  } = useRevenueCategories();
  const { toast } = useToast();

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseData.amount || !expenseData.category || !expenseData.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await addTransaction({
        amount: parseFloat(expenseData.amount),
        description: expenseData.description || expenseData.category,
        category: expenseData.category,
        type: 'expense',
        date: expenseData.date
      });

      // Reset form
      setExpenseData({
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
      
      // Force refresh of the page to ensure dashboard updates
      window.location.reload();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive"
      });
    }
  };

  const handleRevenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!revenueData.amount || !revenueData.category || !revenueData.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await addTransaction({
        amount: parseFloat(revenueData.amount),
        description: revenueData.description || revenueData.category,
        category: revenueData.category,
        type: 'income',
        date: revenueData.date
      });

      // Reset form
      setRevenueData({
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      toast({
        title: "Success",
        description: "Revenue added successfully",
      });
      
      // Force refresh of the page to ensure dashboard updates
      window.location.reload();
    } catch (error) {
      console.error('Error adding revenue:', error);
      toast({
        title: "Error",
        description: "Failed to add revenue",
        variant: "destructive"
      });
    }
  };

  const handleAddExpenseCategory = async () => {
    if (newExpenseCategory.trim()) {
      const success = await addExpenseCategory(newExpenseCategory.trim());
      if (success) {
        setNewExpenseCategory('');
      }
    }
  };

  const handleAddRevenueCategory = async () => {
    if (newRevenueCategory.trim()) {
      const success = await addRevenueCategory(newRevenueCategory.trim());
      if (success) {
        setNewRevenueCategory('');
      }
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Manual Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>
          
          <TabsContent value="expenses" className="space-y-4">
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expense-amount" className="text-white">Amount *</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="expense-date" className="text-white">Date *</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={expenseData.date}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expense-category" className="text-white">Category *</Label>
                <div className="flex gap-2">
                  <Select value={expenseData.category} onValueChange={(value) => setExpenseData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white flex-1">
                      <SelectValue placeholder="Select expense category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategoriesLoading ? (
                        <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                      ) : expenseCategories.length > 0 ? (
                        expenseCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.category_name}>
                            {cat.category_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-categories" disabled>
                          No categories available. Add one below.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Add new category */}
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newExpenseCategory}
                    onChange={(e) => setNewExpenseCategory(e.target.value)}
                    placeholder="Add new expense category..."
                    className="bg-gray-700 border-gray-600 text-white flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddExpenseCategory()}
                  />
                  <Button
                    type="button"
                    onClick={handleAddExpenseCategory}
                    size="sm"
                    disabled={!newExpenseCategory.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="expense-description" className="text-white">Description</Label>
                <Input
                  id="expense-description"
                  value={expenseData.description}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-500 hover:bg-red-600"
                disabled={isAddingTransaction}
              >
                {isAddingTransaction ? 'Adding...' : 'Add Expense'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="revenue" className="space-y-4">
            <form onSubmit={handleRevenueSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="revenue-amount" className="text-white">Amount *</Label>
                  <Input
                    id="revenue-amount"
                    type="number"
                    step="0.01"
                    value={revenueData.amount}
                    onChange={(e) => setRevenueData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="revenue-date" className="text-white">Date *</Label>
                  <Input
                    id="revenue-date"
                    type="date"
                    value={revenueData.date}
                    onChange={(e) => setRevenueData(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="revenue-category" className="text-white">Category *</Label>
                <div className="flex gap-2">
                  <Select value={revenueData.category} onValueChange={(value) => setRevenueData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white flex-1">
                      <SelectValue placeholder="Select revenue category" />
                    </SelectTrigger>
                    <SelectContent>
                      {revenueCategoriesLoading ? (
                        <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                      ) : revenueCategories.length > 0 ? (
                        revenueCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.category_name}>
                            {cat.category_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-categories" disabled>
                          No categories available. Add one below.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Add new category */}
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newRevenueCategory}
                    onChange={(e) => setNewRevenueCategory(e.target.value)}
                    placeholder="Add new revenue category..."
                    className="bg-gray-700 border-gray-600 text-white flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddRevenueCategory()}
                  />
                  <Button
                    type="button"
                    onClick={handleAddRevenueCategory}
                    size="sm"
                    disabled={!newRevenueCategory.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="revenue-description" className="text-white">Description</Label>
                <Input
                  id="revenue-description"
                  value={revenueData.description}
                  onChange={(e) => setRevenueData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={isAddingTransaction}
              >
                {isAddingTransaction ? 'Adding...' : 'Add Revenue'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedManualEntry;
