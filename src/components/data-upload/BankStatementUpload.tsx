
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Check, X, Edit, Save } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  isEditing?: boolean;
  userDescription?: string;
}

const BankStatementUpload: React.FC = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      // Simulate bank statement processing
      const mockTransactions: BankTransaction[] = [
        {
          id: '1',
          date: '2024-01-15',
          description: 'POS PAYMENT - GROCERY STORE',
          amount: 25000,
          type: 'expense',
          category: 'Food & Groceries'
        },
        {
          id: '2',
          date: '2024-01-14',
          description: 'SALARY CREDIT',
          amount: 150000,
          type: 'income',
          category: 'Salary'
        },
        {
          id: '3',
          date: '2024-01-13',
          description: 'TRANSFER TO SAVINGS',
          amount: 50000,
          type: 'expense',
          category: 'Savings'
        }
      ];

      setTransactions(mockTransactions);
      toast({
        title: "Success",
        description: "Bank statement processed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process bank statement",
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

  const handleSaveAll = async () => {
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
    } catch (error) {
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
          <Upload className="w-5 h-5 mr-2 text-blue-400" />
          Bank Statement Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="bank-statement" className="text-gray-300">
            Upload Bank Statement (PDF, CSV)
          </Label>
          <Input
            id="bank-statement"
            type="file"
            accept=".pdf,.csv"
            onChange={handleFileUpload}
            className="mt-1"
          />
        </div>

        {isProcessing && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-300 mt-2">Processing bank statement...</p>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                Processed Transactions ({transactions.length})
              </h3>
              <Button 
                onClick={handleSaveAll}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                Save All Transactions
              </Button>
            </div>

            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </Badge>
                        <span className="text-sm text-gray-400">{transaction.date}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-gray-400">Original Description</Label>
                          <p className="text-sm text-gray-300">{transaction.description}</p>
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
                                <SelectItem value="Entertainment">Entertainment</SelectItem>
                                <SelectItem value="Salary">Salary</SelectItem>
                                <SelectItem value="Business Income">Business Income</SelectItem>
                                <SelectItem value="Savings">Savings</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm text-white">{transaction.category}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTransaction(transaction.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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
