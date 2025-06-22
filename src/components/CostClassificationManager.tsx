
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactions } from '@/hooks/useTransactions';
import { useCostClassification } from '@/hooks/useCostClassification';
import { Brain, TrendingUp, TrendingDown, Zap, Target } from 'lucide-react';

const CostClassificationManager: React.FC = () => {
  const { transactions, classifyAllTransactions } = useTransactions();
  const { addCustomRule, isClassifying } = useCostClassification();
  const [customKeyword, setCustomKeyword] = useState('');
  const [customCostType, setCustomCostType] = useState<'fixed' | 'variable' | 'mixed'>('variable');
  const [customCostNature, setCustomCostNature] = useState<'direct' | 'indirect'>('direct');

  // Calculate classification statistics
  const classificationStats = React.useMemo(() => {
    const classified = transactions.filter(t => t.classification);
    const total = transactions.length;
    
    const fixedCosts = classified.filter(t => t.classification?.cost_type === 'fixed');
    const variableCosts = classified.filter(t => t.classification?.cost_type === 'variable');
    const mixedCosts = classified.filter(t => t.classification?.cost_type === 'mixed');
    const directCosts = classified.filter(t => t.classification?.cost_nature === 'direct');
    const indirectCosts = classified.filter(t => t.classification?.cost_nature === 'indirect');

    return {
      total,
      classified: classified.length,
      unclassified: total - classified.length,
      fixedCount: fixedCosts.length,
      variableCount: variableCosts.length,
      mixedCount: mixedCosts.length,
      directCount: directCosts.length,
      indirectCount: indirectCosts.length,
      fixedAmount: fixedCosts.reduce((sum, t) => sum + t.amount, 0),
      variableAmount: variableCosts.reduce((sum, t) => sum + t.amount, 0),
      mixedAmount: mixedCosts.reduce((sum, t) => sum + t.amount, 0),
      directAmount: directCosts.reduce((sum, t) => sum + t.amount, 0),
      indirectAmount: indirectCosts.reduce((sum, t) => sum + t.amount, 0),
    };
  }, [transactions]);

  const handleAddCustomRule = async () => {
    if (!customKeyword.trim()) return;

    const success = await addCustomRule(
      customKeyword.trim(),
      customCostType,
      customCostNature
    );

    if (success) {
      setCustomKeyword('');
      alert('Custom rule added successfully!');
    } else {
      alert('Failed to add custom rule. Please try again.');
    }
  };

  const getCostTypeIcon = (type: string) => {
    switch (type) {
      case 'fixed': return <Target className="w-4 h-4" />;
      case 'variable': return <TrendingUp className="w-4 h-4" />;
      case 'mixed': return <Zap className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCostNatureIcon = (nature: string) => {
    switch (nature) {
      case 'direct': return <TrendingUp className="w-4 h-4" />;
      case 'indirect': return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-orange-500" />
            AI Cost Classification System
          </CardTitle>
          <CardDescription className="text-gray-400">
            Automatically classify your business costs using AI-powered analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">{classificationStats.classified}</div>
              <div className="text-sm text-gray-400">Classified Transactions</div>
              <div className="text-xs text-orange-400">
                {classificationStats.total > 0 
                  ? `${Math.round(classificationStats.classified / classificationStats.total * 100)}% complete`
                  : '0% complete'
                }
              </div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">{classificationStats.unclassified}</div>
              <div className="text-sm text-gray-400">Pending Classification</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <Button 
                onClick={classifyAllTransactions}
                disabled={isClassifying || classificationStats.unclassified === 0}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isClassifying ? 'Classifying...' : 'Classify All'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500">
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-orange-500">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-orange-500">
            Custom Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cost Type Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">Fixed Costs</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">${classificationStats.fixedAmount.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">{classificationStats.fixedCount} transactions</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Variable Costs</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">${classificationStats.variableAmount.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">{classificationStats.variableCount} transactions</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">Mixed Costs</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">${classificationStats.mixedAmount.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">{classificationStats.mixedCount} transactions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Cost Nature Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Direct Costs</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">${classificationStats.directAmount.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">{classificationStats.directCount} transactions</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-gray-300">Indirect Costs</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">${classificationStats.indirectAmount.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">{classificationStats.indirectCount} transactions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Classified Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions
                  .filter(t => t.classification)
                  .slice(0, 20)
                  .map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="text-white font-medium">{transaction.description}</div>
                        <div className="text-sm text-gray-400">{transaction.category} • ${transaction.amount}</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {getCostTypeIcon(transaction.classification?.cost_type || '')}
                          {transaction.classification?.cost_type}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getCostNatureIcon(transaction.classification?.cost_nature || '')}
                          {transaction.classification?.cost_nature}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round((transaction.classification?.ai_confidence || 0) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Add Custom Classification Rule</CardTitle>
              <CardDescription className="text-gray-400">
                Teach the AI how to classify specific keywords or patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="keyword" className="text-gray-300">Keyword</Label>
                  <Input
                    id="keyword"
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    placeholder="e.g., 'office supplies'"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cost-type" className="text-gray-300">Cost Type</Label>
                  <Select value={customCostType} onValueChange={(value) => setCustomCostType(value as any)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cost-nature" className="text-gray-300">Cost Nature</Label>
                  <Select value={customCostNature} onValueChange={(value) => setCustomCostNature(value as any)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="indirect">Indirect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleAddCustomRule}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={!customKeyword.trim()}
                  >
                    Add Rule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CostClassificationManager;
