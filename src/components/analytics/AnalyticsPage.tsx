import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, Package, Shield, BarChart3 } from 'lucide-react';
import CostAnalysisSection from '@/components/dashboard/CostAnalysisSection';
import VarianceAnalysisSection from '@/components/dashboard/VarianceAnalysisSection';
import ExpenseAnalysisSection from '@/components/analytics/ExpenseAnalysisSection';
import ProfitAnalysisSection from '@/components/analytics/ProfitAnalysisSection';
import ProductAnalysisSection from '@/components/analytics/ProductAnalysisSection';
import RiskDashboard from '@/components/analytics/RiskDashboard';
import AdvancedAnalyticsPage from '@/components/analytics/AdvancedAnalyticsPage';

// No longer needed as we're using the actual components
// const ProfitAnalysisSection = () => (
//   <div className="p-6 bg-white rounded-lg shadow-sm">
//     <h2 className="text-2xl font-bold mb-6">Profit Analysis</h2>
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//       <div className="p-4 border rounded-lg">
//         <h3 className="font-semibold mb-2">Profit Margin Analysis</h3>
//         <p className="text-gray-600">Track profit margins by product/service category</p>
//       </div>
//       <div className="p-4 border rounded-lg">
//         <h3 className="font-semibold mb-2">Revenue vs Cost Correlation</h3>
//         <p className="text-gray-600">Analyze the relationship between revenue and costs</p>
//       </div>
//       <div className="p-4 border rounded-lg">
//         <h3 className="font-semibold mb-2">Break-even Analysis</h3>
//         <p className="text-gray-600">Calculate break-even points for your business</p>
//       </div>
//     </div>
//   </div>
// );

// const ProductAnalysisSection = () => (
//   <div className="p-6 bg-white rounded-lg shadow-sm">
//     <h2 className="text-2xl font-bold mb-6">Product Analysis</h2>
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//       <div className="p-4 border rounded-lg">
//         <h3 className="font-semibold mb-2">Inventory Turnover</h3>
//         <p className="text-gray-600">Track how quickly inventory moves</p>
//       </div>
//       <div className="p-4 border rounded-lg">
//         <h3 className="font-semibold mb-2">Stock Level Optimization</h3>
//         <p className="text-gray-600">Optimize stock levels to reduce costs</p>
//       </div>
//       <div className="p-4 border rounded-lg">
//         <h3 className="font-semibold mb-2">Seasonal Demand Patterns</h3>
//         <p className="text-gray-600">Understand seasonal trends in demand</p>
//       </div>
//     </div>
//   </div>
// );

const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive business intelligence and insights</p>
      </div>

      <Tabs defaultValue="cost" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cost">
            <Calculator className="w-4 h-4 mr-2" />
            Cost Analysis
          </TabsTrigger>
          <TabsTrigger value="profit">
            <TrendingUp className="w-4 h-4 mr-2" />
            Profit Analysis
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="w-4 h-4 mr-2" />
            Product Analysis
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <BarChart3 className="w-4 h-4 mr-2" />
            Advanced Analytics
          </TabsTrigger>
          <TabsTrigger value="risk">
            <Shield className="w-4 h-4 mr-2" />
            Risk Assessment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cost" className="space-y-6">
          <ExpenseAnalysisSection />
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          <ProfitAnalysisSection />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <ProductAnalysisSection />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <AdvancedAnalyticsPage />
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <RiskDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;