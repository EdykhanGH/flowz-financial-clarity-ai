
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Check, X, Edit, Save, AlertCircle, FileText, Info, CheckCircle, Download, Calculator, Database } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';
import { parseFile, Transaction, calculateSummary, exportToCSV } from './FileProcessor';

interface BankTransaction extends Transaction {
  id: string;
  isEditing?: boolean;
  userDescription?: string;
  userCategory?: string;
  userType?: 'income' | 'expense';
}

interface FinancialSummary {
  profit: number;
  cost: number;
  totalTransactions: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

const BankStatementUpload: React.FC = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
      setTransactions([]);
      setFinancialSummary(null);
      setProcessingProgress(0);
      setProcessingStage('');
      console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setUploadError(null);
    setProcessingProgress(0);
    
    try {
      console.log('Starting enhanced bank statement processing:', selectedFile.name);
      setProcessingStage('Initializing PDF worker and extraction algorithms...');
      setProcessingProgress(10);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStage('Analyzing document structure and format...');
      setProcessingProgress(25);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProcessingStage('Extracting and cleaning transaction data...');
      setProcessingProgress(45);
      
      const parsedTransactions = await parseFile(selectedFile);
      
      setProcessingStage('Validating and categorizing transactions...');
      setProcessingProgress(70);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setProcessingStage('Calculating comprehensive financial summary...');
      setProcessingProgress(90);
      
      console.log('Successfully extracted clean transactions:', parsedTransactions.length);
      
      if (parsedTransactions.length === 0) {
        throw new Error('No valid transactions found in the file. Please check:\n\n• File contains transaction data\n• PDF has selectable text (not scanned images)\n• File is not password protected\n• Try CSV/Excel format if PDF fails');
      }

      const bankTransactions: BankTransaction[] = parsedTransactions.map((transaction, index) => ({
        ...transaction,
        id: `${Date.now()}-${index}`,
        isEditing: false,
        userDescription: transaction.description,
        userCategory: transaction.category,
        userType: transaction.type
      }));

      const summary = calculateSummary(bankTransactions);
      
      setTransactions(bankTransactions);
      setFinancialSummary(summary);
      setProcessingStage('Extraction complete - All transactions cleaned and ready!');
      setProcessingProgress(100);
      
      toast({
        title: "Clean Extraction Successful!",
        description: `Successfully extracted ${bankTransactions.length} clean transactions ready for editing and saving`,
      });
    } catch (error: any) {
      console.error('Enhanced bank statement processing error:', error);
      setUploadError(error.message || 'Failed to process bank statement');
      setProcessingStage('Processing failed');
      
      toast({
        title: "Processing Failed",
        description: "Please check the error details and try uploading a different format if needed.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      if (processingProgress !== 100) {
        setProcessingProgress(0);
        setProcessingStage('');
      }
    }
  };

  const updateTransaction = (id: string, field: keyof BankTransaction, value: any) => {
    setTransactions(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          const updatedTransaction = { ...t, [field]: value };
          
          // Update the main transaction fields when user fields change
          if (field === 'userDescription') {
            updatedTransaction.description = value;
          } else if (field === 'userCategory') {
            updatedTransaction.category = value;
          } else if (field === 'userType') {
            updatedTransaction.type = value;
          }
          
          return updatedTransaction;
        }
        return t;
      });
      
      // Recalculate summary when transactions change
      const newSummary = calculateSummary(updated);
      setFinancialSummary(newSummary);
      
      return updated;
    });
  };

  const handleEditTransaction = (id: string) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, isEditing: true } : t)
    );
  };

  const handleSaveEdit = (id: string) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, isEditing: false } : t)
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => {
      const filtered = prev.filter(t => t.id !== id);
      const newSummary = calculateSummary(filtered);
      setFinancialSummary(newSummary);
      return filtered;
    });
  };

  const handleSaveAll = async () => {
    if (transactions.length === 0) return;
    
    setIsSaving(true);
    
    try {
      let savedCount = 0;
      let failedCount = 0;
      
      // Save transactions in batches
      const batchSize = 10;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        
        for (const transaction of batch) {
          try {
            await addTransaction({
              date: transaction.date,
              description: transaction.userDescription || transaction.description,
              amount: transaction.amount,
              type: transaction.userType || transaction.type,
              category: transaction.userCategory || transaction.category || 'Uncategorized'
            });
            savedCount++;
          } catch (error) {
            console.error('Failed to save transaction:', error);
            failedCount++;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (savedCount > 0) {
        toast({
          title: "Successfully Saved to Dashboard!",
          description: `${savedCount} transactions saved and will appear in your dashboard${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
        });
        
        // Clear the form after successful save
        setTransactions([]);
        setSelectedFile(null);
        setFinancialSummary(null);
      } else {
        throw new Error('No transactions were saved successfully');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save transactions to database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    const csvContent = exportToCSV(transactions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clean-bank-statement-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Your clean transaction data has been exported to CSV format",
    });
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-400" />
          Enhanced Bank Statement Processing - Clean Data Extraction
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Advanced algorithm that extracts and cleans transaction data into proper columns for easy editing and saving
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-2">Clean Data Extraction Features:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-200">
                  <div>
                    <p className="font-medium text-blue-300 mb-1">✨ Enhanced Features:</p>
                    <ul className="space-y-1">
                      <li>• Clean column-based data extraction</li>
                      <li>• Accurate transaction categorization</li>
                      <li>• Fixed PDF worker errors</li>
                      <li>• Proper income/expense detection</li>
                      <li>• Real-time editing capabilities</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-300 mb-1">📊 Data Quality:</p>
                    <ul className="space-y-1">
                      <li>• Clean Date format (YYYY-MM-DD)</li>
                      <li>• Readable descriptions</li>
                      <li>• Accurate amounts</li>
                      <li>• Smart categorization</li>
                      <li>• Dashboard integration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="bank-statement" className="text-gray-300 font-medium">
              Upload Bank Statement for Clean Data Extraction
            </Label>
            <Input
              id="bank-statement"
              type="file"
              accept=".pdf,.csv,.xls,.xlsx"
              onChange={handleFileSelect}
              className="mt-2"
              disabled={isProcessing}
            />
            {selectedFile && (
              <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <div>
                    <p className="text-sm text-green-400 font-medium">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-green-300">
                      Ready for clean data extraction
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleFileUpload}
            disabled={!selectedFile || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 w-full py-3 font-medium"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isProcessing ? 'Extracting Clean Data...' : 'Extract Clean Transaction Data'}
          </Button>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${processingProgress}%` }}
                >
                  {processingProgress > 20 && (
                    <span className="text-xs text-white font-medium">
                      {processingProgress}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <p className="text-sm text-gray-300 font-medium">
                    {processingStage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium mb-2">Processing Failed</p>
                  <pre className="text-red-300 text-sm whitespace-pre-wrap font-mono bg-red-900/20 p-2 rounded border border-red-500/30">
                    {uploadError}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        {financialSummary && (
          <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-green-400" />
                Financial Summary - Clean Data
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Database className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save All to Dashboard'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-green-900/20 p-3 rounded border border-green-500/30">
                <p className="text-xs text-green-400 mb-1">Total Income</p>
                <p className="text-lg font-bold text-green-300">
                  ₦{financialSummary.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-900/20 p-3 rounded border border-red-500/30">
                <p className="text-xs text-red-400 mb-1">Total Expenses</p>
                <p className="text-lg font-bold text-red-300">
                  ₦{financialSummary.totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                <p className="text-xs text-blue-400 mb-1">Net Balance</p>
                <p className={`text-lg font-bold ${financialSummary.netIncome >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  ₦{financialSummary.netIncome.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-600/20 p-3 rounded border border-gray-500/30">
                <p className="text-xs text-gray-400 mb-1">Total Transactions</p>
                <p className="text-lg font-bold text-gray-300">
                  {financialSummary.totalTransactions}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Clean Transaction Table */}
        {transactions.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Clean Transaction Data ({transactions.length})
                </h3>
                <p className="text-sm text-gray-400">
                  Extracted data organized in clean columns - Date | Description | Amount | Type | Category | Actions
                </p>
              </div>
              <Button 
                onClick={handleSaveAll}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Database className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving to Dashboard...' : 'Save All to Dashboard'}
              </Button>
            </div>

            <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-700 z-10">
                    <TableRow className="border-gray-600">
                      <TableHead className="text-gray-300 font-semibold">Date</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Description</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Amount (₦)</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Type</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Category</TableHead>
                      <TableHead className="text-gray-300 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-gray-600 hover:bg-gray-600/30">
                        <TableCell className="text-gray-300 font-mono text-sm">
                          {transaction.date}
                        </TableCell>
                        <TableCell className="text-gray-300 max-w-xs">
                          {transaction.isEditing ? (
                            <Textarea
                              value={transaction.userDescription || transaction.description}
                              onChange={(e) => updateTransaction(transaction.id, 'userDescription', e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                          ) : (
                            <div className="space-y-1">
                              <p className="text-sm">{transaction.userDescription || transaction.description}</p>
                              {transaction.originalDescription && transaction.originalDescription !== (transaction.userDescription || transaction.description) && (
                                <p className="text-xs text-gray-500">
                                  Original: {transaction.originalDescription}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={`font-bold text-right ${(transaction.userType || transaction.type) === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          ₦{transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {transaction.isEditing ? (
                            <Select 
                              value={transaction.userType || transaction.type} 
                              onValueChange={(value: 'income' | 'expense') => updateTransaction(transaction.id, 'userType', value)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={(transaction.userType || transaction.type) === 'income' ? 'default' : 'destructive'} className="text-xs">
                              {(transaction.userType || transaction.type) === 'income' ? 'Income' : 'Expense'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {transaction.isEditing ? (
                            <Select 
                              value={transaction.userCategory || transaction.category} 
                              onValueChange={(value) => updateTransaction(transaction.id, 'userCategory', value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Salary">Salary</SelectItem>
                                <SelectItem value="Business Income">Business Income</SelectItem>
                                <SelectItem value="Food & Groceries">Food & Groceries</SelectItem>
                                <SelectItem value="Transportation">Transportation</SelectItem>
                                <SelectItem value="Utilities">Utilities</SelectItem>
                                <SelectItem value="Housing">Housing</SelectItem>
                                <SelectItem value="Healthcare">Healthcare</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Entertainment">Entertainment</SelectItem>
                                <SelectItem value="Bank Charges">Bank Charges</SelectItem>
                                <SelectItem value="Investment Income">Investment Income</SelectItem>
                                <SelectItem value="Shopping">Shopping</SelectItem>
                                <SelectItem value="Cash Withdrawal">Cash Withdrawal</SelectItem>
                                <SelectItem value="Insurance">Insurance</SelectItem>
                                <SelectItem value="Loan & Credit">Loan & Credit</SelectItem>
                                <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                              {transaction.userCategory || transaction.category}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.isEditing ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(transaction.id)}
                                className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTransaction(transaction.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BankStatementUpload;
