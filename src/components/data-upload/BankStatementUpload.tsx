import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Check, X, Edit, Save, AlertCircle, FileText, Info, CheckCircle } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';
import { parseFile, Transaction } from './FileProcessor';

interface BankTransaction extends Transaction {
  id: string;
  isEditing?: boolean;
  userDescription?: string;
}

const BankStatementUpload: React.FC = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
      setTransactions([]);
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
      console.log('Starting file processing:', selectedFile.name);
      setProcessingStage('Initializing PDF processor...');
      setProcessingProgress(10);
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UI feedback
      
      setProcessingStage('Loading and parsing document...');
      setProcessingProgress(30);
      
      const parsedTransactions = await parseFile(selectedFile);
      
      setProcessingStage('Extracting transaction data...');
      setProcessingProgress(60);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProcessingStage('Categorizing transactions...');
      setProcessingProgress(80);
      
      console.log('Successfully parsed transactions:', parsedTransactions.length);
      
      if (parsedTransactions.length === 0) {
        throw new Error('No transactions found in the file. This could mean:\n\n• The PDF is a scanned image (not text-based)\n• The file contains no transaction data\n• The statement format is not recognized\n• The file may be password protected\n\nTry uploading a text-based PDF or CSV/Excel file instead.');
      }

      const bankTransactions: BankTransaction[] = parsedTransactions.map((transaction, index) => ({
        ...transaction,
        id: `${Date.now()}-${index}`,
        isEditing: false
      }));

      setTransactions(bankTransactions);
      setProcessingStage('Processing complete!');
      setProcessingProgress(100);
      
      toast({
        title: "Success!",
        description: `Successfully extracted ${bankTransactions.length} transactions from your bank statement`,
      });
    } catch (error: any) {
      console.error('File processing error:', error);
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
        description: "Check the error details below and try a different file format if needed.",
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

  const handleDescriptionChange = (id: string, description: string) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, userDescription: description } : t)
    );
  };

  const handleCategoryChange = (id: string, category: string) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, category } : t)
    );
  };

  const handleTypeChange = (id: string, type: 'income' | 'expense') => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, type } : t)
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveAll = async () => {
    if (transactions.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      let savedCount = 0;
      for (const transaction of transactions) {
        await addTransaction({
          date: transaction.date,
          description: transaction.userDescription || transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category || 'Uncategorized'
        });
        savedCount++;
      }
      
      toast({
        title: "Success!",
        description: `${savedCount} transactions saved successfully to your account`,
      });
      
      setTransactions([]);
      setSelectedFile(null);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-400" />
          Enhanced Bank Statement Processing
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Advanced PDF processing with improved transaction extraction and automatic categorization
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
                <p className="font-medium mb-2">Supported Formats & Requirements:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-200">
                  <div>
                    <p className="font-medium text-blue-300 mb-1">✅ Best Results:</p>
                    <ul className="space-y-1">
                      <li>• Text-based PDF statements</li>
                      <li>• CSV files from your bank</li>
                      <li>• Excel files (.xlsx, .xls)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-300 mb-1">❌ Not Supported:</p>
                    <ul className="space-y-1">
                      <li>• Scanned PDF images</li>
                      <li>• Password-protected files</li>
                      <li>• Corrupted documents</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="bank-statement" className="text-gray-300 font-medium">
              Select Bank Statement File
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
            {isProcessing ? 'Processing Statement...' : 'Process Bank Statement'}
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
                  <p className="text-red-400 font-medium mb-2">Processing Failed</p>
                  <pre className="text-red-300 text-sm whitespace-pre-wrap font-mono bg-red-900/20 p-2 rounded border border-red-500/30">
                    {uploadError}
                  </pre>
                  <div className="mt-3 text-xs text-red-200">
                    <p className="font-medium mb-1">Troubleshooting tips:</p>
                    <ul className="space-y-1">
                      <li>• Try exporting your statement as CSV or Excel format</li>
                      <li>• Ensure the PDF is text-based (you can select text in it)</li>
                      <li>• Check that the file is not password protected</li>
                      <li>• Try refreshing the page and uploading again</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {transactions.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Extracted Transactions ({transactions.length})
                </h3>
                <p className="text-sm text-gray-400">
                  Review and edit the extracted information before saving
                </p>
              </div>
              <Button 
                onClick={handleSaveAll}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save All Transactions
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                        {transaction.type === 'income' ? 'Income' : 'Expense'}
                      </Badge>
                      <span className="text-sm text-gray-400">{transaction.date}</span>
                      {transaction.balance && (
                        <span className="text-xs text-gray-500">
                          Balance: ₦{transaction.balance.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">
                        ₦{transaction.amount.toLocaleString()}
                      </span>
                      
                      {transaction.isEditing ? (
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(transaction.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-gray-400">Original Description</Label>
                      <p className="text-sm text-gray-300 break-words">{transaction.description}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-400">Custom Description</Label>
                      {transaction.isEditing ? (
                        <Textarea
                          value={transaction.userDescription || ''}
                          onChange={(e) => handleDescriptionChange(transaction.id, e.target.value)}
                          placeholder="Add custom description..."
                          className="mt-1 h-20"
                        />
                      ) : (
                        <p className="text-sm text-white">
                          {transaction.userDescription || 'No custom description'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-400">Category</Label>
                      {transaction.isEditing ? (
                        <Select 
                          value={transaction.category} 
                          onValueChange={(value) => handleCategoryChange(transaction.id, value)}
                        >
                          <SelectTrigger className="mt-1">
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
                        <p className="text-sm text-white">{transaction.category}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">Transaction Type</Label>
                      {transaction.isEditing ? (
                        <Select 
                          value={transaction.type} 
                          onValueChange={(value: 'income' | 'expense') => handleTypeChange(transaction.id, value)}
                        >
                          <SelectTrigger className="mt-1">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BankStatementUpload;
