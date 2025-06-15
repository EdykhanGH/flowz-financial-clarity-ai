
import React from 'react';
import { Hash, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Summary {
  totalTransactions: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface DataSummaryProps {
  summary: Summary;
}

const DataSummary: React.FC<DataSummaryProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gray-700 p-3 rounded-lg text-center">
        <Hash className="w-5 h-5 mx-auto text-blue-400 mb-1" />
        <p className="text-sm text-gray-300">Transactions</p>
        <p className="text-lg font-bold text-white">{summary.totalTransactions}</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg text-center">
        <TrendingUp className="w-5 h-5 mx-auto text-green-400 mb-1" />
        <p className="text-sm text-gray-300">Total Revenue</p>
        <p className="text-lg font-bold text-green-400">₦{summary.totalRevenue.toLocaleString()}</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg text-center">
        <TrendingDown className="w-5 h-5 mx-auto text-red-400 mb-1" />
        <p className="text-sm text-gray-300">Total Expenses</p>
        <p className="text-lg font-bold text-red-400">₦{summary.totalExpenses.toLocaleString()}</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg text-center">
        <DollarSign className="w-5 h-5 mx-auto text-orange-400 mb-1" />
        <p className="text-sm text-gray-300">Net Income</p>
        <p className={`text-lg font-bold ${summary.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          ₦{summary.netIncome.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default DataSummary;
