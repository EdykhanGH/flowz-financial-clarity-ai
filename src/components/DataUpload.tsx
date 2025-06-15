import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Plus, Download, Edit } from 'lucide-react';
import { currencies, defaultExpenseTypes } from '@/data/budgetData';

const DataUpload = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[3]); // Default to INR
  const [expenseTypes, setExpenseTypes] = useState(defaultExpenseTypes);
  const [newExpenseType, setNewExpenseType] = useState('');
  const [isAddingExpenseType, setIsAddingExpenseType] = useState(false);
  const [transactionData, setTransactionData] = useState({
    date: '',
    description: '',
    category: '',
    amount: '',
    type: 'expense'
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Transaction Added",
      description: "Your transaction has been recorded successfully.",
    });
    setTransactionData({
      date: '',
      description: '',
      category: '',
      amount: '',
      type: 'expense'
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({
        title: "File Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  const handleAddExpenseType = () => {
    if (newExpenseType.trim() && !expenseTypes.includes(newExpenseType.trim().toLowerCase())) {
      setExpenseTypes([...expenseTypes, newExpenseType.trim().toLowerCase()]);
      setNewExpenseType('');
      setIsAddingExpenseType(false);
      toast({
        title: "Expense Type Added",
        description: `"${newExpenseType}" has been added to your expense types.`,
      });
    }
  };

  const mockTransactions = [
    { id: 1, date: '2024-06-10', description: 'Office Supplies', category: 'Administrative', amount: -2500, type: 'expense' },
    { id: 2, date: '2024-06-09', description: 'Client Payment', category: 'Revenue', amount: 45000, type: 'income' },
    { id: 3, date: '2024-06-08', description: 'Software License', category: 'IT', amount: -12000, type: 'expense' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Data Management</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-white">Currency:</Label>
            <Select value={selectedCurrency.code} onValueChange={(value) => setSelectedCurrency(currencies.find(c => c.code === value) || currencies[0])}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="text-white border-gray-600">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-[#2D2D2D] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Manual Entry
            </CardTitle>
            <CardDescription className="text-gray-400">
              Add transactions manually with smart categorization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="date" className="text-gray-300">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={transactionData.date}
                  onChange={(e) => setTransactionData({...transactionData, date: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Input
                  id="description"
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
                  placeholder="Transaction description"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-gray-300">Category</Label>
                <Select value={transactionData.category} onValueChange={(value) => setTransactionData({...transactionData, category: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="it">IT</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount" className="text-gray-300">Amount ({selectedCurrency.symbol})</Label>
                <Input
                  id="amount"
                  type="number"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="type" className="text-gray-300">Type</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingExpenseType(true)}
                    className="text-primary hover:text-primary-dark"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Add Type
                  </Button>
                </div>
                {isAddingExpenseType ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newExpenseType}
                      onChange={(e) => setNewExpenseType(e.target.value)}
                      placeholder="New expense type"
                      className="flex-1"
                    />
                    <Button type="button" size="sm" onClick={handleAddExpenseType}>Add</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsAddingExpenseType(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Select value={transactionData.type} onValueChange={(value) => setTransactionData({...transactionData, type: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-secondary">
                Add Transaction
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-[#2D2D2D] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              File Upload
            </CardTitle>
            <CardDescription className="text-gray-400">
              Upload CSV or Excel files with transaction data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-2">Drag and drop your file here, or</p>
              <Button variant="outline" className="text-white border-gray-600" asChild>
                <label htmlFor="file-upload">
                  Browse Files
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
            <div className="text-xs text-gray-400">
              Supported formats: CSV, Excel (.xlsx, .xls)
            </div>
            <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary hover:text-white">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#2D2D2D] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              API Integration
            </CardTitle>
            <CardDescription className="text-gray-400">
              Connect your accounting software
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button disabled className="w-full" variant="outline">
              QuickBooks (Coming Soon)
            </Button>
            <Button disabled className="w-full" variant="outline">
              Xero (Coming Soon)
            </Button>
            <Button disabled className="w-full" variant="outline">
              Tally (Coming Soon)
            </Button>
            <div className="pt-4 border-t border-gray-600">
              <p className="text-xs text-gray-400 mb-2">Manual API Setup</p>
              <Button variant="outline" className="w-full text-white border-gray-600">
                Configure API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#2D2D2D] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Transactions</CardTitle>
          <CardDescription className="text-gray-400">
            Your latest transaction entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 text-gray-400">Date</th>
                  <th className="text-left py-2 text-gray-400">Description</th>
                  <th className="text-left py-2 text-gray-400">Category</th>
                  <th className="text-right py-2 text-gray-400">Amount</th>
                  <th className="text-left py-2 text-gray-400">Type</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-700">
                    <td className="py-2 text-gray-300">{transaction.date}</td>
                    <td className="py-2 text-gray-300">{transaction.description}</td>
                    <td className="py-2 text-gray-300">{transaction.category}</td>
                    <td className={`py-2 text-right ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedCurrency.symbol}{Math.abs(transaction.amount).toLocaleString()}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.type === 'income' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataUpload;
