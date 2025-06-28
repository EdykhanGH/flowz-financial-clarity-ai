
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactions } from '@/hooks/useTransactions';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit } from 'lucide-react';

interface TransactionEntry {
  id: string;
  amount: string;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'refund';
  date: string;
  tags?: string[];
  notes?: string;
}

const EnhancedManualEntry: React.FC = () => {
  const [entries, setEntries] = useState<TransactionEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<TransactionEntry>({
    id: '',
    amount: '',
    description: '',
    category: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    notes: ''
  });

  const { addTransaction, isAddingTransaction } = useTransactions();
  const { categories, loading: categoriesLoading } = useBusinessCategories();
  const { toast } = useToast();

  const handleAddEntry = () => {
    if (!currentEntry.amount || !currentEntry.category) {
      toast({
        title: "Error",
        description: "Please fill in amount and category",
        variant: "destructive"
      });
      return;
    }

    const newEntry: TransactionEntry = {
      ...currentEntry,
      id: Date.now().toString(),
    };

    setEntries(prev => [...prev, newEntry]);
    
    // Reset current entry
    setCurrentEntry({
      id: '',
      amount: '',
      description: '',
      category: '',
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      tags: [],
      notes: ''
    });

    toast({
      title: "Success",
      description: "Transaction added to batch",
    });
  };

  const handleRemoveEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const handleSaveAll = async () => {
    if (entries.length === 0) {
      toast({
        title: "Error",
        description: "No transactions to save",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const entry of entries) {
        await addTransaction({
          amount: parseFloat(entry.amount),
          description: entry.description || entry.category,
          category: entry.category,
          type: entry.type,
          date: entry.date
        });
      }

      toast({
        title: "Success",
        description: `${entries.length} transactions saved successfully`,
      });

      setEntries([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transactions",
        variant: "destructive"
      });
    }
  };

  const predefinedCategories = [
    { name: 'Revenue', type: 'income', color: 'bg-green-500' },
    { name: 'Sales', type: 'income', color: 'bg-green-600' },
    { name: 'Service Income', type: 'income', color: 'bg-green-700' },
    { name: 'Cost of Goods Sold', type: 'expense', color: 'bg-red-500' },
    { name: 'Marketing', type: 'expense', color: 'bg-blue-500' },
    { name: 'Office Supplies', type: 'expense', color: 'bg-purple-500' },
    { name: 'Utilities', type: 'expense', color: 'bg-yellow-500' },
    { name: 'Travel', type: 'expense', color: 'bg-indigo-500' },
    { name: 'Professional Services', type: 'expense', color: 'bg-pink-500' },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="single" className="data-[state=active]:bg-orange-500">
            Single Entry
          </TabsTrigger>
          <TabsTrigger value="batch" className="data-[state=active]:bg-orange-500">
            Batch Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-white">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={currentEntry.amount}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type" className="text-white">Type *</Label>
                  <Select 
                    value={currentEntry.type} 
                    onValueChange={(value: 'income' | 'expense' | 'refund') => 
                      setCurrentEntry(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="category" className="text-white">Category *</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {predefinedCategories
                    .filter(cat => cat.type === currentEntry.type || currentEntry.type === 'refund')
                    .map((cat) => (
                    <Badge 
                      key={cat.name}
                      className={`${cat.color} cursor-pointer hover:opacity-80`}
                      onClick={() => setCurrentEntry(prev => ({ ...prev, category: cat.name }))}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
                <Select 
                  value={currentEntry.category} 
                  onValueChange={(value) => setCurrentEntry(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select or type a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : (
                      <>
                        {predefinedCategories.map((cat) => (
                          <SelectItem key={cat.name} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.category_name}>
                            {cat.category_name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Input
                    id="description"
                    value={currentEntry.description}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Transaction description"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="date" className="text-white">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={currentEntry.date}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-white">Notes</Label>
                <Textarea
                  id="notes"
                  value={currentEntry.notes}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleAddEntry}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Batch
                </Button>
                
                <Button 
                  onClick={async () => {
                    await handleAddEntry();
                    await handleSaveAll();
                  }}
                  disabled={isAddingTransaction}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save Immediately
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          {entries.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">
                    Batch Transactions ({entries.length})
                  </CardTitle>
                  <Button 
                    onClick={handleSaveAll}
                    disabled={isAddingTransaction}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Save All ({entries.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={entry.type === 'income' ? 'default' : 'destructive'}>
                            {entry.type}
                          </Badge>
                          <span className="text-white font-semibold">
                            ₦{parseFloat(entry.amount).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          {entry.description || entry.category} • {entry.date}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveEntry(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedManualEntry;
