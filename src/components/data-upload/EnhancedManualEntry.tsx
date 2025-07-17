
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useCostCenters } from '@/hooks/useCostCenters';
import { useProfitCenters } from '@/hooks/useProfitCenters';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

const EnhancedManualEntry = () => {
  const [expenseData, setExpenseData] = useState({
    amount: '',
    description: '',
    category: '',
    product: '',
    quantity: '',
    unitCost: '',
    useQuantity: false,
    date: new Date().toISOString().split('T')[0]
  });

  const [revenueData, setRevenueData] = useState({
    amount: '',
    description: '',
    category: '',
    product: '',
    quantity: '',
    unitPrice: '',
    useQuantity: false,
    date: new Date().toISOString().split('T')[0]
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [categoryType, setCategoryType] = useState<'expense' | 'revenue'>('expense');
  
  const { addTransaction, isAddingTransaction } = useTransactions();
  const { costCenters, loading: costCentersLoading, addCostCenter } = useCostCenters();
  const { profitCenters, loading: profitCentersLoading, addProfitCenter } = useProfitCenters();
  const { products, loading: productsLoading, addProduct } = useProducts();
  const { toast } = useToast();

  // Handle adding new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive"
      });
      return;
    }

    setIsAddingCategory(true);
    try {
      if (categoryType === 'expense') {
        await addCostCenter(newCategoryName, 'expense');
      } else {
        await addProfitCenter(newCategoryName, 'revenue');
      }
      setNewCategoryName('');
      setShowCategoryDialog(false);
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Handle adding new product
  const handleAddProduct = async () => {
    if (!newProductName.trim() || !newProductCategory.trim()) {
      toast({
        title: "Error",
        description: "Please enter product name and category",
        variant: "destructive"
      });
      return;
    }

    setIsAddingProduct(true);
    try {
      await addProduct({
        name: newProductName,
        category: newProductCategory
      });
      setNewProductName('');
      setNewProductCategory('');
      setShowProductDialog(false);
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Calculate unit cost when quantity changes
  useEffect(() => {
    if (expenseData.useQuantity && expenseData.amount && expenseData.quantity) {
      const unitCost = (parseFloat(expenseData.amount) / parseFloat(expenseData.quantity)).toFixed(2);
      setExpenseData(prev => ({ ...prev, unitCost }));
    }
  }, [expenseData.amount, expenseData.quantity, expenseData.useQuantity]);

  // Calculate unit price when quantity changes
  useEffect(() => {
    if (revenueData.useQuantity && revenueData.amount && revenueData.quantity) {
      const unitPrice = (parseFloat(revenueData.amount) / parseFloat(revenueData.quantity)).toFixed(2);
      setRevenueData(prev => ({ ...prev, unitPrice }));
    }
  }, [revenueData.amount, revenueData.quantity, revenueData.useQuantity]);

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

    if (expenseData.category === 'Product Cost' && !expenseData.product) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive"
      });
      return;
    }

    try {
      const transactionData: any = {
        amount: parseFloat(expenseData.amount),
        description: expenseData.description || expenseData.category,
        category: expenseData.category,
        type: 'expense',
        date: expenseData.date
      };

      if (expenseData.product) {
        transactionData.product_name = expenseData.product;
      }

      if (expenseData.useQuantity && expenseData.quantity) {
        transactionData.quantity = parseInt(expenseData.quantity);
        transactionData.unit_cost = parseFloat(expenseData.unitCost);
      }

      await addTransaction(transactionData);

      // Reset form
      setExpenseData({
        amount: '',
        description: '',
        category: '',
        product: '',
        quantity: '',
        unitCost: '',
        useQuantity: false,
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

    if (revenueData.category === 'Product Sales' && !revenueData.product) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive"
      });
      return;
    }

    try {
      const transactionData: any = {
        amount: parseFloat(revenueData.amount),
        description: revenueData.description || revenueData.category,
        category: revenueData.category,
        type: 'income',
        date: revenueData.date
      };

      if (revenueData.product) {
        transactionData.product_name = revenueData.product;
      }

      if (revenueData.useQuantity && revenueData.quantity) {
        transactionData.quantity = parseInt(revenueData.quantity);
        transactionData.unit_price = parseFloat(revenueData.unitPrice);
      }

      await addTransaction(transactionData);

      // Reset form
      setRevenueData({
        amount: '',
        description: '',
        category: '',
        product: '',
        quantity: '',
        unitPrice: '',
        useQuantity: false,
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="expense-category" className="text-white">Category *</Label>
                  <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCategoryType('expense')}
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add New Expense Category</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-category" className="text-white">Category Name</Label>
                          <Input
                            id="new-category"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Enter category name"
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleAddCategory}
                            disabled={isAddingCategory}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            {isAddingCategory ? 'Adding...' : 'Add Category'}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setShowCategoryDialog(false)}
                            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select value={expenseData.category} onValueChange={(value) => setExpenseData(prev => ({ ...prev, category: value, product: '' }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCentersLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : costCenters.length > 0 ? (
                      costCenters.map((center) => (
                        <SelectItem key={center.id} value={center.name}>
                          {center.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>
                        No categories available. Complete onboarding first.
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {(expenseData.category === 'Product Cost' || expenseData.category === 'Product Sales') && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="expense-product" className="text-white">Product *</Label>
                    <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add New
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add New Product</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="new-product-name" className="text-white">Product Name</Label>
                            <Input
                              id="new-product-name"
                              value={newProductName}
                              onChange={(e) => setNewProductName(e.target.value)}
                              placeholder="Enter product name"
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-product-category" className="text-white">Product Category</Label>
                            <Input
                              id="new-product-category"
                              value={newProductCategory}
                              onChange={(e) => setNewProductCategory(e.target.value)}
                              placeholder="Enter product category"
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleAddProduct}
                              disabled={isAddingProduct}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              {isAddingProduct ? 'Adding...' : 'Add Product'}
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => setShowProductDialog(false)}
                              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select value={expenseData.product} onValueChange={(value) => setExpenseData(prev => ({ ...prev, product: value }))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsLoading ? (
                        <SelectItem value="loading" disabled>Loading products...</SelectItem>
                      ) : products.length > 0 ? (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.name}>
                            {product.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-products" disabled>
                          No products available. Add products above.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="expense-quantity-toggle"
                  checked={expenseData.useQuantity}
                  onCheckedChange={(checked) => setExpenseData(prev => ({ ...prev, useQuantity: checked, quantity: '', unitCost: '' }))}
                />
                <Label htmlFor="expense-quantity-toggle" className="text-white">Use Quantity & Unit Cost</Label>
              </div>

              {expenseData.useQuantity && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expense-quantity" className="text-white">Quantity *</Label>
                    <Input
                      id="expense-quantity"
                      type="number"
                      value={expenseData.quantity}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expense-unit-cost" className="text-white">Unit Cost</Label>
                    <Input
                      id="expense-unit-cost"
                      type="number"
                      step="0.01"
                      value={expenseData.unitCost}
                      placeholder="Auto-calculated"
                      className="bg-gray-700 border-gray-600 text-white"
                      readOnly
                    />
                  </div>
                </div>
              )}

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
                <div className="flex items-center justify-between">
                  <Label htmlFor="revenue-category" className="text-white">Category *</Label>
                  <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCategoryType('revenue')}
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add New Revenue Category</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-category" className="text-white">Category Name</Label>
                          <Input
                            id="new-category"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Enter category name"
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleAddCategory}
                            disabled={isAddingCategory}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            {isAddingCategory ? 'Adding...' : 'Add Category'}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setShowCategoryDialog(false)}
                            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select value={revenueData.category} onValueChange={(value) => setRevenueData(prev => ({ ...prev, category: value, product: '' }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select revenue category" />
                  </SelectTrigger>
                  <SelectContent>
                    {profitCentersLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : profitCenters.length > 0 ? (
                      profitCenters.map((center) => (
                        <SelectItem key={center.id} value={center.name}>
                          {center.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>
                        No categories available. Complete onboarding first.
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {(revenueData.category === 'Product Sales' || revenueData.category === 'Product Cost') && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="revenue-product" className="text-white">Product *</Label>
                    <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add New
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add New Product</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="new-product-name" className="text-white">Product Name</Label>
                            <Input
                              id="new-product-name"
                              value={newProductName}
                              onChange={(e) => setNewProductName(e.target.value)}
                              placeholder="Enter product name"
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-product-category" className="text-white">Product Category</Label>
                            <Input
                              id="new-product-category"
                              value={newProductCategory}
                              onChange={(e) => setNewProductCategory(e.target.value)}
                              placeholder="Enter product category"
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleAddProduct}
                              disabled={isAddingProduct}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              {isAddingProduct ? 'Adding...' : 'Add Product'}
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => setShowProductDialog(false)}
                              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select value={revenueData.product} onValueChange={(value) => setRevenueData(prev => ({ ...prev, product: value }))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsLoading ? (
                        <SelectItem value="loading" disabled>Loading products...</SelectItem>
                      ) : products.length > 0 ? (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.name}>
                            {product.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-products" disabled>
                          No products available. Add products above.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="revenue-quantity-toggle"
                  checked={revenueData.useQuantity}
                  onCheckedChange={(checked) => setRevenueData(prev => ({ ...prev, useQuantity: checked, quantity: '', unitPrice: '' }))}
                />
                <Label htmlFor="revenue-quantity-toggle" className="text-white">Use Quantity & Unit Price</Label>
              </div>

              {revenueData.useQuantity && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="revenue-quantity" className="text-white">Quantity *</Label>
                    <Input
                      id="revenue-quantity"
                      type="number"
                      value={revenueData.quantity}
                      onChange={(e) => setRevenueData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="0"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="revenue-unit-price" className="text-white">Unit Price</Label>
                    <Input
                      id="revenue-unit-price"
                      type="number"
                      step="0.01"
                      value={revenueData.unitPrice}
                      placeholder="Auto-calculated"
                      className="bg-gray-700 border-gray-600 text-white"
                      readOnly
                    />
                  </div>
                </div>
              )}

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
