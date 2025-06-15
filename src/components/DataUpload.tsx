
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, TrendingUp, TrendingDown, DollarSign, Hash, BarChart } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import * as XLSX from 'xlsx';
import TemplateSelector from './TemplateSelector';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
}

interface FileData {
  transactions: Transaction[];
  summary: {
    totalTransactions: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
}

const parseExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
      resolve(jsonData);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};

// Helper function to map transaction types to valid enum values
const mapTransactionType = (type: string): 'income' | 'expense' | 'transfer' | 'investment' | 'refund' => {
  const normalizedType = type.toLowerCase().trim();
  
  switch (normalizedType) {
    case 'income':
    case 'revenue':
    case 'earning':
      return 'income';
    case 'expense':
    case 'spending':
    case 'cost':
      return 'expense';
    case 'transfer':
      return 'transfer';
    case 'investment':
      return 'investment';
    case 'refund':
      return 'refund';
    default:
      // Default to expense if type is not recognized
      return 'expense';
  }
};

const DataUpload: React.FC = () => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { addTransaction } = useTransactions();

  const calculateSummary = (transactions: Transaction[]) => {
    const totalRevenue = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netIncome = totalRevenue - totalExpenses;

    return {
      totalTransactions: transactions.length,
      totalRevenue,
      totalExpenses,
      netIncome,
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const jsonData = await parseExcel(file);

      const transactions: Transaction[] = jsonData.map((item: any) => ({
        date: item.Date || item.date || '',
        description: item.Description || item.description || '',
        amount: item.Amount || item.amount || 0,
        type: item.Type || item.type || 'expense',
        category: item.Category || item.category
      }));

      const summary = calculateSummary(transactions);

      setFileData({ transactions, summary });
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please ensure it is a valid CSV or Excel file.');
    }
  };

  const handleSaveData = async () => {
    if (!fileData) {
      return;
    }

    setIsLoading(true);

    try {
      for (const transaction of fileData.transactions) {
        // Map the transaction data to match the expected type structure
        const mappedTransaction = {
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: mapTransactionType(transaction.type),
          category: transaction.category || 'Uncategorized'
        };
        
        await addTransaction(mappedTransaction);
      }
      alert('Data saved successfully!');
      setFileData(null);
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Financial Data Management</h1>
        <p className="text-gray-400">Upload your financial statements or use our templates to get started</p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="upload" className="data-[state=active]:bg-orange-500">
            <Upload className="w-4 h-4 mr-2" />
            Upload Data
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-orange-500">
            <FileText className="w-4 h-4 mr-2" />
            Use Template
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Upload className="w-5 h-5 mr-2 text-orange-400" />
                Upload Financial Statement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload" className="text-gray-300">
                  Choose File (CSV, XLS, XLSX)
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>

              {fileData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <Hash className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                      <p className="text-sm text-gray-300">Transactions</p>
                      <p className="text-lg font-bold text-white">{fileData.summary.totalTransactions}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <TrendingUp className="w-5 h-5 mx-auto text-green-400 mb-1" />
                      <p className="text-sm text-gray-300">Total Revenue</p>
                      <p className="text-lg font-bold text-green-400">₦{fileData.summary.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <TrendingDown className="w-5 h-5 mx-auto text-red-400 mb-1" />
                      <p className="text-sm text-gray-300">Total Expenses</p>
                      <p className="text-lg font-bold text-red-400">₦{fileData.summary.totalExpenses.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <DollarSign className="w-5 h-5 mx-auto text-orange-400 mb-1" />
                      <p className="text-sm text-gray-300">Net Income</p>
                      <p className={`text-lg font-bold ${fileData.summary.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ₦{fileData.summary.netIncome.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSaveData}
                      disabled={isLoading}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {isLoading ? 'Saving...' : 'Save to Database'}
                    </Button>
                    <Button 
                      onClick={() => setShowAnalysis(true)}
                      variant="outline"
                      className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                    >
                      <BarChart className="w-4 h-4 mr-2" />
                      Analyze Financial Data
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <TemplateSelector />
        </TabsContent>
      </Tabs>

      {/* Analysis Modal */}
      <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
        <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-orange-400" />
              Financial Analysis Results
            </DialogTitle>
          </DialogHeader>
          
          {fileData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Key Financial Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <Hash className="w-6 h-6 mx-auto text-blue-400 mb-2" />
                    <p className="text-sm text-gray-300">Total Transactions</p>
                    <p className="text-xl font-bold text-white">{fileData.summary.totalTransactions}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <TrendingUp className="w-6 h-6 mx-auto text-green-400 mb-2" />
                    <p className="text-sm text-gray-300">Total Revenue</p>
                    <p className="text-xl font-bold text-green-400">₦{fileData.summary.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <TrendingDown className="w-6 h-6 mx-auto text-red-400 mb-2" />
                    <p className="text-sm text-gray-300">Total Expenses</p>
                    <p className="text-xl font-bold text-red-400">₦{fileData.summary.totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <DollarSign className="w-6 h-6 mx-auto text-orange-400 mb-2" />
                    <p className="text-sm text-gray-300">Net Income</p>
                    <p className={`text-xl font-bold ${fileData.summary.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ₦{fileData.summary.netIncome.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Ratios */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Financial Ratios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-300 mb-1">Profit Margin</p>
                    <p className="text-2xl font-bold text-white">
                      {fileData.summary.totalRevenue > 0 
                        ? ((fileData.summary.netIncome / fileData.summary.totalRevenue) * 100).toFixed(2) + '%'
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-300 mb-1">Expense Ratio</p>
                    <p className="text-2xl font-bold text-white">
                      {fileData.summary.totalRevenue > 0 
                        ? ((fileData.summary.totalExpenses / fileData.summary.totalRevenue) * 100).toFixed(2) + '%'
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Key Insights</h3>
                <div className="space-y-3">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Badge variant={fileData.summary.netIncome >= 0 ? "default" : "destructive"} className="mr-2">
                        {fileData.summary.netIncome >= 0 ? "Profitable" : "Loss Making"}
                      </Badge>
                      <span className="text-white font-medium">Profitability Status</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      {fileData.summary.netIncome >= 0 
                        ? "Your business is generating positive returns. Focus on maintaining and growing this profitability."
                        : "Your business is currently operating at a loss. Consider reviewing expenses and increasing revenue streams."
                      }
                    </p>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Badge variant="outline" className="mr-2">Cash Flow</Badge>
                      <span className="text-white font-medium">Financial Health</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Based on your transaction data, you have {fileData.summary.totalTransactions} transactions. 
                      {fileData.summary.totalRevenue > fileData.summary.totalExpenses 
                        ? " Your revenue exceeds expenses, indicating healthy cash flow."
                        : " Your expenses exceed revenue, which may indicate cash flow challenges."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataUpload;
