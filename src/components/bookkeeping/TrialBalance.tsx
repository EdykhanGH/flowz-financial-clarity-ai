import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Download, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useChartOfAccounts } from '@/hooks/useChartOfAccounts';

const TrialBalance: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: accounts = [] } = useChartOfAccounts();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  // Group accounts by category and calculate totals
  const accountsByCategory = accounts.reduce((acc, account) => {
    const category = account.account_type?.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

  // Calculate totals
  const totalDebits = accounts.reduce((sum, account) => {
    const normalBalance = account.account_type?.normal_balance;
    const balance = account.current_balance || 0;
    
    if (normalBalance === 'Debit' && balance >= 0) {
      return sum + balance;
    } else if (normalBalance === 'Credit' && balance < 0) {
      return sum + Math.abs(balance);
    }
    return sum;
  }, 0);

  const totalCredits = accounts.reduce((sum, account) => {
    const normalBalance = account.account_type?.normal_balance;
    const balance = account.current_balance || 0;
    
    if (normalBalance === 'Credit' && balance >= 0) {
      return sum + balance;
    } else if (normalBalance === 'Debit' && balance < 0) {
      return sum + Math.abs(balance);
    }
    return sum;
  }, 0);

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const getDebitAmount = (account: any) => {
    const normalBalance = account.account_type?.normal_balance;
    const balance = account.current_balance || 0;
    
    if (normalBalance === 'Debit' && balance >= 0) {
      return balance;
    } else if (normalBalance === 'Credit' && balance < 0) {
      return Math.abs(balance);
    }
    return 0;
  };

  const getCreditAmount = (account: any) => {
    const normalBalance = account.account_type?.normal_balance;
    const balance = account.current_balance || 0;
    
    if (normalBalance === 'Credit' && balance >= 0) {
      return balance;
    } else if (normalBalance === 'Debit' && balance < 0) {
      return Math.abs(balance);
    }
    return 0;
  };

  const categoryOrder = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                Trial Balance Report
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Summary of all account balances to verify the books are balanced
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={isBalanced ? "default" : "destructive"}
                className="flex items-center"
              >
                {isBalanced ? (
                  <CheckCircle className="w-4 h-4 mr-1" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-1" />
                )}
                {isBalanced ? 'Balanced' : 'Out of Balance'}
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium">As of Date:</label>
              <Input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryOrder.map(category => (
                  accountsByCategory[category] && (
                    <React.Fragment key={category}>
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={5} className="font-semibold text-gray-900">
                          {category}
                        </TableCell>
                      </TableRow>
                      {accountsByCategory[category]
                        .sort((a, b) => a.account_code.localeCompare(b.account_code))
                        .map((account) => {
                          const debitAmount = getDebitAmount(account);
                          const creditAmount = getCreditAmount(account);
                          
                          return (
                            <TableRow key={account.id}>
                              <TableCell className="font-mono text-sm">
                                {account.account_code}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{account.account_name}</p>
                                  {account.description && (
                                    <p className="text-xs text-gray-500">{account.description}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {account.account_type?.name}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {debitAmount > 0 ? formatCurrency(debitAmount) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {creditAmount > 0 ? formatCurrency(creditAmount) : '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </React.Fragment>
                  )
                ))}
                
                {/* Totals Row */}
                <TableRow className="border-t-2 border-gray-300 bg-gray-100 font-semibold">
                  <TableCell colSpan={3} className="text-right">
                    <strong>TOTALS</strong>
                  </TableCell>
                  <TableCell className="text-right font-mono text-lg">
                    {formatCurrency(totalDebits)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-lg">
                    {formatCurrency(totalCredits)}
                  </TableCell>
                </TableRow>
                
                {/* Balance Check Row */}
                <TableRow className={`border-t ${isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
                  <TableCell colSpan={3} className="text-right">
                    <strong>Difference</strong>
                  </TableCell>
                  <TableCell colSpan={2} className="text-center font-mono text-lg">
                    {isBalanced ? (
                      <span className="text-green-600 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Books are balanced
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {formatCurrency(Math.abs(totalDebits - totalCredits))} difference
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Debits</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDebits)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCredits)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accounts</p>
                <p className="text-2xl font-bold text-gray-600">{accounts.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrialBalance;