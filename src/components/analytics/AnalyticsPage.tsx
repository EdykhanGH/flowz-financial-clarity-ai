import React, { useState, Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components to prevent page blocking
const ExpenseAnalysisSection = lazy(() => import('@/components/analytics/ExpenseAnalysisSection'));
const ProfitAnalysisSection = lazy(() => import('@/components/analytics/ProfitAnalysisSection'));
const ProductAnalysisSection = lazy(() => import('@/components/analytics/ProductAnalysisSection'));

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
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger value="cost" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Calculator className="w-4 h-4 mr-2" />
            Cost Analysis
          </TabsTrigger>
          <TabsTrigger value="profit" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Profit Analysis
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-2" />
            Product Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cost" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <ExpenseAnalysisSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <ProfitAnalysisSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <ProductAnalysisSection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;