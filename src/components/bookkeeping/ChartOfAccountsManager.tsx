import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen,
  Building,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { useChartOfAccounts, useAccountTypes, useCreateAccount, useUpdateAccount, useDeleteAccount, type ChartOfAccount } from '@/hooks/useChartOfAccounts';

const ChartOfAccountsManager: React.FC = () => {
  const { data: accounts = [], isLoading: accountsLoading } = useChartOfAccounts();
  const { data: accountTypes = [] } = useAccountTypes();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type_id: '',
    parent_account_id: '',
    description: '',
    opening_balance: 0,
  });

  const resetForm = () => {
    setFormData({
      account_code: '',
      account_name: '',
      account_type_id: '',
      parent_account_id: '',
      description: '',
      opening_balance: 0,
    });
    setEditingAccount(null);
  };

  const handleCreateAccount = () => {
    setIsDialogOpen(true);
    resetForm();
  };

  const handleEditAccount = (account: ChartOfAccount) => {
    setEditingAccount(account);
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type_id: account.account_type_id,
      parent_account_id: account.parent_account_id || '',
      description: account.description || '',
      opening_balance: account.opening_balance,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({
          id: editingAccount.id,
          ...formData,
          parent_account_id: formData.parent_account_id || null,
        });
      } else {
        await createAccount.mutateAsync({
          ...formData,
          parent_account_id: formData.parent_account_id || null,
          is_active: true,
          current_balance: formData.opening_balance,
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save account:', error);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this account?')) {
      await deleteAccount.mutateAsync(id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Assets': return <Building className="w-4 h-4 text-blue-500" />;
      case 'Liabilities': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'Equity': return <Wallet className="w-4 h-4 text-purple-500" />;
      case 'Revenue': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'Expenses': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Group accounts by category
  const groupedAccounts = accounts.reduce((acc, account) => {
    const category = account.account_type?.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(account);
    return acc;
  }, {} as Record<string, ChartOfAccount[]>);

  // Calculate category totals
  const categoryTotals = Object.entries(groupedAccounts).map(([category, accounts]) => ({
    category,
    count: accounts.length,
    totalBalance: accounts.reduce((sum, acc) => sum + acc.current_balance, 0),
    accounts,
  }));

  if (accountsLoading) {
    return <div className="flex items-center justify-center h-64">Loading chart of accounts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chart of Accounts</h2>
          <p className="text-gray-600">Manage your accounting structure and account balances</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateAccount} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Edit Account' : 'Create New Account'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account_code">Account Code</Label>
                  <Input
                    id="account_code"
                    value={formData.account_code}
                    onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                    placeholder="e.g., 1000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="account_name">Account Name</Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    placeholder="e.g., Cash"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="account_type_id">Account Type</Label>
                <Select value={formData.account_type_id} onValueChange={(value) => setFormData({ ...formData, account_type_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center">
                          {getCategoryIcon(type.category)}
                          <span className="ml-2">{type.name} ({type.category})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="parent_account_id">Parent Account (Optional)</Label>
                <Select value={formData.parent_account_id} onValueChange={(value) => setFormData({ ...formData, parent_account_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {accounts
                      .filter(acc => acc.id !== editingAccount?.id)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_code} - {account.account_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="opening_balance">Opening Balance</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  step="0.01"
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Account description..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAccount.isPending || updateAccount.isPending}>
                  {editingAccount ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categoryTotals.map(({ category, count, totalBalance }) => (
          <Card key={category}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getCategoryIcon(category)}
                  <div className="ml-2">
                    <p className="font-medium text-sm">{category}</p>
                    <p className="text-xs text-gray-600">{count} accounts</p>
                  </div>
                </div>
              </div>
              <p className="text-lg font-bold mt-2">{formatCurrency(totalBalance)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-orange-500" />
            All Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedAccounts).map(([category, categoryAccounts]) => (
              <div key={category}>
                <div className="flex items-center mb-3">
                  {getCategoryIcon(category)}
                  <h3 className="ml-2 text-lg font-semibold">{category}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {categoryAccounts.length} accounts
                  </Badge>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Current Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono">{account.account_code}</TableCell>
                        <TableCell className="font-medium">{account.account_name}</TableCell>
                        <TableCell>{account.account_type?.name}</TableCell>
                        <TableCell className={`font-mono ${account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(account.current_balance)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAccount(account)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAccount(account.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {category !== Object.keys(groupedAccounts)[Object.keys(groupedAccounts).length - 1] && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartOfAccountsManager;