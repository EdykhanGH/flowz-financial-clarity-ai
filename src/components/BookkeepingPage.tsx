import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FileText, 
  Calculator, 
  BarChart3,
  Building,
  Wallet,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import ChartOfAccountsManager from './bookkeeping/ChartOfAccountsManager';
import JournalEntryManager from './bookkeeping/JournalEntryManager';
import GeneralLedger from './bookkeeping/GeneralLedger';
import TrialBalance from './bookkeeping/TrialBalance';
import { useChartOfAccounts } from '@/hooks/useChartOfAccounts';
import { useJournalEntries } from '@/hooks/useJournalEntries';

const BookkeepingPage: React.FC = () => {
  const { data: accounts = [] } = useChartOfAccounts();
  const { data: journalEntries = [] } = useJournalEntries();

  // Calculate summary statistics
  const accountsByCategory = accounts.reduce((acc, account) => {
    const category = account.account_type?.category || 'Other';
    if (!acc[category]) acc[category] = { count: 0, balance: 0 };
    acc[category].count++;
    acc[category].balance += account.current_balance;
    return acc;
  }, {} as Record<string, { count: number; balance: number }>);

  const totalAssets = accountsByCategory.Assets?.balance || 0;
  const totalLiabilities = accountsByCategory.Liabilities?.balance || 0;
  const totalEquity = accountsByCategory.Equity?.balance || 0;
  const totalRevenue = accountsByCategory.Revenue?.balance || 0;
  const totalExpenses = accountsByCategory.Expenses?.balance || 0;

  const draftEntries = journalEntries.filter(entry => entry.status === 'draft').length;
  const postedEntries = journalEntries.filter(entry => entry.status === 'posted').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Assets': return <Building className="w-5 h-5 text-blue-500" />;
      case 'Liabilities': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'Equity': return <Wallet className="w-5 h-5 text-purple-500" />;
      case 'Revenue': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'Expenses': return <Calculator className="w-5 h-5 text-red-500" />;
      default: return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookkeeping & Accounting</h1>
          <p className="text-gray-600">Complete double-entry bookkeeping system for your business</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1" />
          Nigerian Accounting Standards
        </Badge>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(accountsByCategory).map(([category, data]) => (
          <Card key={category} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                {getCategoryIcon(category)}
                <Badge variant="outline">{data.count}</Badge>
              </div>
              <h3 className="font-semibold text-sm text-gray-600">{category}</h3>
              <p className="text-xl font-bold mt-1">{formatCurrency(data.balance)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Net Worth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalAssets - totalLiabilities)}</p>
            <p className="text-sm text-blue-100">Assets - Liabilities</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue - totalExpenses)}</p>
            <p className="text-sm text-green-100">Revenue - Expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Journal Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{journalEntries.length}</p>
            <p className="text-sm text-purple-100">
              {postedEntries} posted • {draftEntries} draft
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounting Balance Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
            Accounting Equation Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Assets</h4>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAssets)}</p>
            </div>
            
            <div className="text-center text-2xl font-bold flex items-center justify-center">
              =
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">Liabilities + Equity</h4>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalLiabilities + totalEquity)}
              </p>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Badge 
              variant={Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? "default" : "destructive"}
              className="text-sm"
            >
              {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? 
                "✓ Books are balanced" : 
                `⚠ Out of balance by ${formatCurrency(Math.abs(totalAssets - (totalLiabilities + totalEquity)))}`
              }
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Bookkeeping Interface */}
      <Tabs defaultValue="chart-of-accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chart-of-accounts" className="flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            Chart of Accounts
          </TabsTrigger>
          <TabsTrigger value="journal-entries" className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Journal Entries
          </TabsTrigger>
          <TabsTrigger value="general-ledger" className="flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            General Ledger
          </TabsTrigger>
          <TabsTrigger value="trial-balance" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Trial Balance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart-of-accounts">
          <ChartOfAccountsManager />
        </TabsContent>

        <TabsContent value="journal-entries">
          <JournalEntryManager />
        </TabsContent>

        <TabsContent value="general-ledger">
          <GeneralLedger />
        </TabsContent>

        <TabsContent value="trial-balance">
          <TrialBalance />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookkeepingPage;
