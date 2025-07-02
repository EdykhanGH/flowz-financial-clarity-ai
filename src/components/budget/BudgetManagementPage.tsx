import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import BudgetSection from '@/components/dashboard/BudgetSection';
import VarianceAnalysisSection from '@/components/dashboard/VarianceAnalysisSection';

const BudgetCreation = () => {
  const [budgets, setBudgets] = useState([
    { id: 1, name: 'Marketing Budget Q1', category: 'Marketing', allocated: 500000, spent: 320000, period: 'Q1 2024' },
    { id: 2, name: 'Operations Budget', category: 'Operations', allocated: 800000, spent: 720000, period: 'Q1 2024' },
    { id: 3, name: 'Inventory Purchase', category: 'Inventory', allocated: 1200000, spent: 980000, period: 'Q1 2024' },
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getVarianceColor = (allocated: number, spent: number) => {
    const variance = ((spent - allocated) / allocated) * 100;
    if (variance > 10) return 'text-red-600';
    if (variance > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getVarianceIcon = (allocated: number, spent: number) => {
    const variance = ((spent - allocated) / allocated) * 100;
    if (variance > 10) return <AlertTriangle className="w-4 h-4" />;
    if (variance > 0) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Budget Management</h2>
          <p className="text-gray-600">Create and track your business budgets</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(2500000)}</div>
            <p className="text-xs text-gray-500">Across all budgets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(2020000)}</div>
            <p className="text-xs text-green-600">80.8% utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Remaining Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(480000)}</div>
            <p className="text-xs text-gray-500">19.2% remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Active Budgets</CardTitle>
          <CardDescription>Monitor your current budget performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{budget.name}</h3>
                  <p className="text-sm text-gray-600">{budget.category} • {budget.period}</p>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Allocated</p>
                    <p className="font-semibold">{formatCurrency(budget.allocated)}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Spent</p>
                    <p className="font-semibold">{formatCurrency(budget.spent)}</p>
                  </div>
                  
                  <div className={`text-right ${getVarianceColor(budget.allocated, budget.spent)}`}>
                    <p className="text-sm">Variance</p>
                    <div className="flex items-center">
                      {getVarianceIcon(budget.allocated, budget.spent)}
                      <span className="font-semibold ml-1">
                        {(((budget.spent - budget.allocated) / budget.allocated) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <BudgetSection />
    </div>
  );
};

const BudgetManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Management</h1>
        <p className="text-gray-600">Plan, track, and analyze your business budgets</p>
      </div>

      <Tabs defaultValue="budgets" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger value="budgets" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Budget Creation & Tracking
          </TabsTrigger>
          <TabsTrigger value="variance" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Variance Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-6">
          <BudgetCreation />
        </TabsContent>

        <TabsContent value="variance" className="space-y-6">
          <VarianceAnalysisSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BudgetManagementPage;