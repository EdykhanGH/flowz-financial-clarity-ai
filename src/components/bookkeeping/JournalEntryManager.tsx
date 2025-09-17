import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Trash2, 
  BookOpen,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { useJournalEntries, useCreateJournalEntry, usePostJournalEntry } from '@/hooks/useJournalEntries';
import { useChartOfAccounts } from '@/hooks/useChartOfAccounts';

interface JournalLine {
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

const JournalEntryManager: React.FC = () => {
  const { data: journalEntries = [], isLoading } = useJournalEntries();
  const { data: accounts = [] } = useChartOfAccounts();
  const createJournalEntry = useCreateJournalEntry();
  const postJournalEntry = usePostJournalEntry();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
  });
  const [lines, setLines] = useState<JournalLine[]>([
    { account_id: '', debit_amount: 0, credit_amount: 0, description: '' },
    { account_id: '', debit_amount: 0, credit_amount: 0, description: '' },
  ]);

  const resetForm = () => {
    setFormData({
      entry_date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
    });
    setLines([
      { account_id: '', debit_amount: 0, credit_amount: 0, description: '' },
      { account_id: '', debit_amount: 0, credit_amount: 0, description: '' },
    ]);
  };

  const addLine = () => {
    setLines([...lines, { account_id: '', debit_amount: 0, credit_amount: 0, description: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof JournalLine, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const totalDebits = lines.reduce((sum, line) => sum + line.debit_amount, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit_amount, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isBalanced) {
      alert('Debits must equal credits');
      return;
    }

    const validLines = lines.filter(line => 
      line.account_id && (line.debit_amount > 0 || line.credit_amount > 0)
    );

    if (validLines.length < 2) {
      alert('At least two lines with valid accounts and amounts are required');
      return;
    }

    try {
      await createJournalEntry.mutateAsync({
        ...formData,
        lines: validLines,
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create journal entry:', error);
    }
  };

  const handlePostEntry = async (entryId: string) => {
    if (window.confirm('Are you sure you want to post this journal entry? This action cannot be undone.')) {
      await postJournalEntry.mutateAsync(entryId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'posted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'reversed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading journal entries...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Journal Entries</h2>
          <p className="text-gray-600">Record and manage double-entry bookkeeping transactions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              New Journal Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Journal Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="entry_date">Date</Label>
                  <Input
                    id="entry_date"
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="e.g., Invoice #123"
                  />
                </div>
                <div className="flex items-end">
                  <div className={`px-3 py-2 rounded text-sm font-medium ${
                    isBalanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isBalanced ? 'Balanced' : 'Out of Balance'}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this journal entry..."
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Journal Lines</h3>
                  <Button type="button" variant="outline" onClick={addLine}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </Button>
                </div>

                <div className="space-y-4">
                  {lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center p-4 border rounded">
                      <div className="col-span-4">
                        <Select 
                          value={line.account_id} 
                          onValueChange={(value) => updateLine(index, 'account_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
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
                      
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Debit"
                          value={line.debit_amount || ''}
                          onChange={(e) => {
                            updateLine(index, 'debit_amount', parseFloat(e.target.value) || 0);
                            updateLine(index, 'credit_amount', 0);
                          }}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Credit"
                          value={line.credit_amount || ''}
                          onChange={(e) => {
                            updateLine(index, 'credit_amount', parseFloat(e.target.value) || 0);
                            updateLine(index, 'debit_amount', 0);
                          }}
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <Input
                          placeholder="Line description"
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(index)}
                          disabled={lines.length <= 2}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-12 gap-2 mt-2 p-2 bg-gray-50 rounded font-semibold">
                  <div className="col-span-4">Totals:</div>
                  <div className="col-span-2 text-right">{formatCurrency(totalDebits)}</div>
                  <div className="col-span-2 text-right">{formatCurrency(totalCredits)}</div>
                  <div className="col-span-4 text-right">
                    Difference: {formatCurrency(Math.abs(totalDebits - totalCredits))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createJournalEntry.isPending || !isBalanced}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Create Entry
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Journal Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-orange-500" />
            Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono">{entry.entry_number}</TableCell>
                  <TableCell>{format(new Date(entry.entry_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{entry.reference || '-'}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(entry.total_debit)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatusIcon(entry.status)}
                      <Badge 
                        variant={entry.status === 'posted' ? 'default' : entry.status === 'draft' ? 'secondary' : 'destructive'}
                        className="ml-2 capitalize"
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePostEntry(entry.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Post
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalEntryManager;