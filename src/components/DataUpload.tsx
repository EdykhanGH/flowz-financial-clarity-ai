
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Plus, Download, Edit, AlertCircle, CheckCircle } from 'lucide-react';
import { currencies, defaultExpenseTypes } from '@/data/budgetData';
import { useTransactions } from '@/hooks/useTransactions';
import * as XLSX from 'xlsx';

const DataUpload = () => {
  const { toast } = useToast();
  const { addTransaction } = useTransactions();
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[3]); // Default to INR
  const [expenseTypes, setExpenseTypes] = useState(defaultExpenseTypes);
  const [newExpenseType, setNewExpenseType] = useState('');
  const [isAddingExpenseType, setIsAddingExpenseType] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileInsights, setFileInsights] = useState<{
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
  } | null>(null);
  const [transactionData, setTransactionData] = useState({
    date: '',
    description: '',
    category: '',
    amount: '',
    type: 'expense'
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionData.date || !transactionData.description || !transactionData.category || !transactionData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addTransaction({
        date: transactionData.date,
        description: transactionData.description,
        category: transactionData.category,
        amount: parseFloat(transactionData.amount),
        type: transactionData.type as 'income' | 'expense' | 'transfer' | 'investment' | 'refund'
      });

      setTransactionData({
        date: '',
        description: '',
        category: '',
        amount: '',
        type: 'expense'
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const parseFinancialStatement = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let transactions = [];
          
          if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            // Handle CSV files
            const text = data as string;
            const lines = text.split('\n');
            
            // Skip header row and parse CSV data
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
              
              if (columns.length >= 4) {
                // Assuming CSV format: Date, Description, Category, Amount, Type
                const [date, description, category, amount, type] = columns;
                
                if (date && description && amount) {
                  transactions.push({
                    date: date,
                    description: description,
                    category: category || 'Other',
                    amount: parseFloat(amount.replace(/[^\d.-]/g, '')),
                    type: type?.toLowerCase() || (parseFloat(amount) > 0 ? 'income' : 'expense')
                  });
                }
              }
            }
          } else {
            // Handle Excel files (XLS/XLSX)
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Skip header row and parse Excel data
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i] as any[];
              if (!row || row.length < 4) continue;
              
              const [date, description, category, amount, type] = row;
              
              if (date && description && amount) {
                // Handle Excel date formats
                let formattedDate = date;
                if (typeof date === 'number') {
                  // Excel serial date
                  const excelDate = new Date((date - 25569) * 86400 * 1000);
                  formattedDate = excelDate.toISOString().split('T')[0];
                } else if (date instanceof Date) {
                  formattedDate = date.toISOString().split('T')[0];
                }
                
                transactions.push({
                  date: formattedDate,
                  description: description.toString(),
                  category: category?.toString() || 'Other',
                  amount: parseFloat(amount.toString().replace(/[^\d.-]/g, '')),
                  type: type?.toString().toLowerCase() || (parseFloat(amount) > 0 ? 'income' : 'expense')
                });
              }
            }
          }
          
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidType && !hasValidExtension) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV, XLS, or XLSX file.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessingFile(true);

    try {
      const transactions = await parseFinancialStatement(file);
      
      // Calculate insights
      let totalRevenue = 0;
      let totalExpenses = 0;
      
      transactions.forEach(transaction => {
        if (transaction.type === 'income' || transaction.amount > 0) {
          totalRevenue += Math.abs(transaction.amount);
        } else {
          totalExpenses += Math.abs(transaction.amount);
        }
      });

      setFileInsights({
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        transactionCount: transactions.length
      });

      // Add transactions to database
      for (const transaction of transactions) {
        await addTransaction({
          date: transaction.date,
          description: transaction.description,
          category: transaction.category,
          amount: Math.abs(transaction.amount),
          type: transaction.type === 'income' ? 'income' : 'expense'
        });
      }

      toast({
        title: "File Processed Successfully",
        description: `${transactions.length} transactions have been imported and analyzed.`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error Processing File",
        description: "There was an error processing your financial statement. Please check the file format.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingFile(false);
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
              Financial Statement Upload
            </CardTitle>
            <CardDescription className="text-gray-400">
              Upload CSV, XLS, or XLSX files with transaction data for automatic analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-2">Drag and drop your financial statement here, or</p>
              <Button 
                variant="outline" 
                className="text-white border-gray-600" 
                asChild
                disabled={isProcessingFile}
              >
                <label htmlFor="file-upload">
                  {isProcessingFile ? 'Processing...' : 'Browse Files'}
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessingFile}
                  />
                </label>
              </Button>
            </div>
            
            {uploadedFile && (
              <div className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-300">{uploadedFile.name}</span>
                {isProcessingFile ? (
                  <AlertCircle className="h-4 w-4 text-yellow-500 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            )}

            {fileInsights && (
              <div className="space-y-2 p-3 bg-gray-800 rounded">
                <h4 className="text-sm font-medium text-white">File Insights</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Total Revenue:</span>
                    <span className="text-green-400 ml-1">{selectedCurrency.symbol}{fileInsights.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Expenses:</span>
                    <span className="text-red-400 ml-1">{selectedCurrency.symbol}{fileInsights.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Net Income:</span>
                    <span className={`ml-1 ${fileInsights.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedCurrency.symbol}{fileInsights.netIncome.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Transactions:</span>
                    <span className="text-blue-400 ml-1">{fileInsights.transactionCount}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-400">
              <p>Supported formats: CSV, XLS, XLSX</p>
              <p>Expected columns: Date, Description, Category, Amount, Type</p>
            </div>
            <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary hover:text-white">
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
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
