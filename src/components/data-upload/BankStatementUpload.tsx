
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Check, X, Edit, Save, AlertCircle, FileText } from 'lucide-react';
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
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setUploadError(null);
    
    try {
      console.log('Processing file:', selectedFile.name);
      const parsedTransactions = await parseFile(selectedFile);
      console.log('Parsed transactions:', parsedTransactions);
      
      if (parsedTransactions.length === 0) {
        throw new Error('No transactions found in the file. Please check the file format and content.');
      }

      const bankTransactions: BankTransaction[] = parsedTransactions.map((transaction, index) => ({
        ...transaction,
        id: `${Date.now()}-${index}`,
        isEditing: false
      }));

      setTransactions(bankTransactions);
      toast({
        title: "Success",
        description: `${bankTransactions.length} transactions extracted successfully`,
      });
    } catch (error: any) {
      console.error('File processing error:', error);
      const errorMessage = error.message || 'Failed to process bank statement';
      setUploadError(errorMessage);
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
      for (const transaction of transactions) {
        await addTransaction({
          date: transaction.date,
          description: transaction.userDescription || transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category || 'Uncategorized'
        });
      }
      
      toast({
        title: "Success",
        description: `${transactions.length} transactions saved successfully`,
      });
      
      setTransactions([]);
      setSelectedFile(null);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save transactions",
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
          Bank Statement Upload & Processing
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Upload your bank statement (PDF, CSV, Excel) to automatically extract and categorize transactions
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="bank-statement" className="text-gray-300">
              Select Bank Statement File
            </Label>
            <Input
              id="bank-statement"
              type="file"
              accept=".pdf,.csv,.xls,.xlsx"
              onChange={handleFileSelect}
              className="mt-1"
            />
            {selectedFile && (
              <p className="text-sm text-green-400 mt-1">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <Button 
            onClick={handleFileUpload}
            disabled={!selectedFile || isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Process Statement'}
          </Button>

          {uploadError && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-400">{uploadError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-300 mt-4">Processing bank statement...</p>
            <p className="text-gray-500 text-sm">This may take a few moments</p>
          </div>
        )}

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
                            <SelectItem value="Savings & Investment">Savings & Investment</SelectItem>
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
