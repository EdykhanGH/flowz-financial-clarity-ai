
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
      console.log('Starting enhanced file processing:', selectedFile.name);
      setProcessingStage('Initializing enhanced PDF processor...');
      setProcessingProgress(15);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStage('Extracting text with enhanced algorithms...');
      setProcessingProgress(35);
      
      const parsedTransactions = await parseFile(selectedFile);
      
      setProcessingStage('Analyzing and categorizing all transactions...');
      setProcessingProgress(65);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setProcessingStage('Calculating comprehensive financial summary...');
      setProcessingProgress(85);
      
      console.log('Successfully parsed transactions:', parsedTransactions.length);
      
      if (parsedTransactions.length === 0) {
        throw new Error('No transactions found in the file. This could mean:\n\n• The PDF is a scanned image (not text-based)\n• The file contains no transaction data\n• The statement format is not recognized\n• The file may be password protected\n\nTry uploading a text-based PDF or CSV/Excel file instead.');
      }

      const bankTransactions: BankTransaction[] = parsedTransactions.map((transaction, index) => ({
        ...transaction,
        id: `${Date.now()}-${index}`,
        isEditing: false
      }));

      const summary = calculateSummary(bankTransactions);
      
      setTransactions(bankTransactions);
      setFinancialSummary(summary);
      setProcessingStage('Processing complete!');
      setProcessingProgress(100);
      
      toast({
        title: "Enhanced Extraction Successful!",
        description: `Successfully extracted ${bankTransactions.length} transactions with smart categorization and financial analysis`,
      });
    } catch (error: any) {
      console.error('Enhanced file processing error:', error);
      let errorMessage = 'Failed to process bank statement';
      
      if (error.message.includes('PDF')) {
        errorMessage = error.message;
      } else if (error.message.includes('worker')) {
        errorMessage = 'PDF processing failed. This might be due to:\n• Network connectivity issues\n• Browser compatibility problems\n\nTry refreshing the page and uploading again.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error occurred. Please check your internet connection and try again.';
      } else if (error.message.includes('scanned')) {
        errorMessage = 'This PDF appears to be a scanned image. Please upload a text-based PDF or export your statement as CSV/Excel format.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      setUploadError(errorMessage);
      setProcessingStage('Processing failed');
      
      toast({
        title: "Processing Failed",
        description: "Check the error details and try a different approach if needed.",
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
      const updated = prev.map(t => t.id === id ? { ...t, [field]: value } : t);
      
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
      
      // Save transactions in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        
        for (const transaction of batch) {
          try {
            await addTransaction({
              date: transaction.date,
              description: transaction.userDescription || transaction.description,
              amount: transaction.amount,
              type: transaction.type,
              category: transaction.category || 'Uncategorized'
            });
            savedCount++;
          } catch (error) {
            console.error('Failed to save transaction:', error);
            failedCount++;
          }
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (savedCount > 0) {
        toast({
          title: "Database Save Successful!",
          description: `${savedCount} transactions saved to your account${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
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
    link.setAttribute('download', `enhanced-bank-statement-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Your enhanced transaction data has been exported to CSV format",
    });
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-400" />
          Enhanced Bank Statement Processing & Database Storage
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Advanced transaction extraction with comprehensive analysis and automatic database storage
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          {/* Enhanced File Format Info */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-2">Enhanced Processing Capabilities:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-200">
                  <div>
                    <p className="font-medium text-blue-300 mb-1">✅ Advanced Features:</p>
                    <ul className="space-y-1">
                      <li>• Multiple transaction pattern recognition</li>
                      <li>• Smart categorization algorithms</li>
                      <li>• Comprehensive financial analysis</li>
                      <li>• Automatic database storage</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-300 mb-1">📊 Supported Formats:</p>
                    <ul className="space-y-1">
                      <li>• Text-based PDF statements</li>
                      <li>• CSV files from banks</li>
                      <li>• Excel files (.xlsx, .xls)</li>
                      <li>• Multiple Nigerian bank formats</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="bank-statement" className="text-gray-300 font-medium">
              Select Bank Statement File for Enhanced Processing
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
                      Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Type: {selectedFile.type || 'Unknown'}
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
            {isProcessing ? 'Processing with Enhanced Algorithms...' : 'Process Bank Statement (Enhanced)'}
          </Button>

          {/* Enhanced Processing Progress */}
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
                  <p className="text-red-400 font-medium mb-2">Enhanced Processing Failed</p>
                  <pre className="text-red-300 text-sm whitespace-pre-wrap font-mono bg-red-900/20 p-2 rounded border border-red-500/30">
                    {uploadError}
                  </pre>
                  <div className="mt-3 text-xs text-red-200">
                    <p className="font-medium mb-1">Enhanced troubleshooting suggestions:</p>
                    <ul className="space-y-1">
                      <li>• Try exporting your statement as CSV or Excel format</li>
                      <li>• Ensure the PDF contains selectable text (not scanned images)</li>
                      <li>• Check that the file is not password protected</li>
                      <li>• Try refreshing the page and uploading again</li>
                      <li>• Contact support if the issue persists</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Financial Summary */}
        {financialSummary && (
          <div className="bg-gray-700 p-6 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-green-400" />
                Comprehensive Financial Analysis
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
                  {isSaving ? 'Saving...' : 'Save to Database'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-green-900/20 p-3 rounded border border-green-500/30">
                <p className="text-xs text-green-400 mb-1">Total Income</p>
                <p className="text-lg font-bold text-green-300">
                  ₦{financialSummary.profit.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-900/20 p-3 rounded border border-red-500/30">
                <p className="text-xs text-red-400 mb-1">Total Expenses</p>
                <p className="text-lg font-bold text-red-300">
                  ₦{financialSummary.cost.toLocaleString()}
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

        {/* Enhanced Results Section */}
        {transactions.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Enhanced Transaction Extraction ({transactions.length})
                </h3>
                <p className="text-sm text-gray-400">
                  All transactions extracted, categorized, and ready for database storage
                </p>
              </div>
              <Button 
                onClick={handleSaveAll}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Database className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving to Database...' : 'Save All to Database'}
              </Button>
            </div>

            <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Description</TableHead>
                    <TableHead className="text-gray-300">Amount (₦)</TableHead>
                    <TableHead className="text-gray-300">Type</TableHead>
                    <TableHead className="text-gray-300">Category</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-gray-600">
                      <TableCell className="text-gray-300">
                        {transaction.date}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {transaction.isEditing ? (
                          <Textarea
                            value={transaction.userDescription || transaction.description}
                            onChange={(e) => updateTransaction(transaction.id, 'userDescription', e.target.value)}
                            className="min-h-[60px]"
                          />
                        ) : (
                          <div>
                            <p className="font-medium">{transaction.userDescription || transaction.description}</p>
                            {transaction.originalDescription && transaction.originalDescription !== (transaction.userDescription || transaction.description) && (
                              <p className="text-xs text-gray-500 mt-1">
                                Original: {transaction.originalDescription}
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={`font-bold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        ₦{transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {transaction.isEditing ? (
                          <Select 
                            value={transaction.type} 
                            onValueChange={(value: 'income' | 'expense') => updateTransaction(transaction.id, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                            {transaction.type === 'income' ? 'Income' : 'Expense'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {transaction.isEditing ? (
                          <Select 
                            value={transaction.category} 
                            onValueChange={(value) => updateTransaction(transaction.id, 'category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Food & Groceries">Food & Groceries</SelectItem>
                              <SelectItem value="Transportation">Transportation</SelectItem>
                              <SelectItem value="Utilities">Utilities</SelectItem>
                              <SelectItem value="Housing">Housing</SelectItem>
                              <SelectItem value="Healthcare">Healthcare</SelectItem>
                              <SelectItem value="Education">Education</SelectItem>
                              <SelectItem value="Entertainment">Entertainment</SelectItem>
                              <SelectItem value="Bank Charges">Bank Charges</SelectItem>
                              <SelectItem value="Salary">Salary</SelectItem>
                              <SelectItem value="Business Income">Business Income</SelectItem>
                              <SelectItem value="Investment Income">Investment Income</SelectItem>
                              <SelectItem value="Savings & Investment">Savings & Investment</SelectItem>
                              <SelectItem value="Shopping">Shopping</SelectItem>
                              <SelectItem value="Cash Withdrawal">Cash Withdrawal</SelectItem>
                              <SelectItem value="Card Payments">Card Payments</SelectItem>
                              <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span>{transaction.category}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.isEditing ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(transaction.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTransaction(transaction.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                            >
                              <X className="w-4 h-4" />
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
        )}
      </CardContent>
    </Card>
  );
};

export default BankStatementUpload;
