import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Search, FileText, Filter } from 'lucide-react';
import { useChartOfAccounts } from '@/hooks/useChartOfAccounts';
import { useJournalEntries } from '@/hooks/useJournalEntries';

const GeneralLedger: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: accounts = [] } = useChartOfAccounts();
  const { data: journalEntries = [] } = useJournalEntries();

  // Get transactions for selected account
  const getAccountTransactions = (accountId: string) => {
    const transactions: Array<{
      date: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }> = [];
    
    let runningBalance = 0;
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      runningBalance = account.opening_balance || 0;
    }

    journalEntries
      .filter(entry => entry.status === 'posted')
      .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())
      .forEach(entry => {
        entry.journal_entry_lines?.forEach(line => {
          if (line.account_id === accountId) {
            const isDebit = (line.debit_amount || 0) > 0;
            const amount = isDebit ? (line.debit_amount || 0) : (line.credit_amount || 0);
            
            // Update running balance based on account's normal balance
            const accountType = account?.account_type?.normal_balance;
            if (accountType === 'Debit') {
              runningBalance += isDebit ? amount : -amount;
            } else {
              runningBalance += isDebit ? -amount : amount;
            }

            transactions.push({
              date: entry.entry_date,
              reference: entry.entry_number,
              description: line.description || entry.description,
              debit: line.debit_amount || 0,
              credit: line.credit_amount || 0,
              balance: runningBalance
            });
          }
        });
      });

    return transactions;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG');
  };

  const selectedAccountData = accounts.find(acc => acc.id === selectedAccount);
  const transactions = selectedAccount ? getAccountTransactions(selectedAccount) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-500" />
            General Ledger
          </CardTitle>
          <p className="text-sm text-gray-600">
            View detailed account activity and running balances
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Account</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">From Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedAccountData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedAccountData.account_code} - {selectedAccountData.account_name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedAccountData.account_type?.name} • {selectedAccountData.account_type?.category}
                </p>
              </div>
              <Badge variant="secondary">
                Current Balance: {formatCurrency(selectedAccountData.current_balance || 0)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-gray-50">
                      <TableCell className="font-medium">Opening Balance</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>Beginning balance</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(selectedAccountData.opening_balance || 0)}
                      </TableCell>
                    </TableRow>
                    {transactions.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{transaction.reference}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="text-right">
                          {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
                <p className="text-gray-600">
                  {selectedAccount ? 'This account has no posted transactions yet.' : 'Select an account to view its transaction history.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GeneralLedger;