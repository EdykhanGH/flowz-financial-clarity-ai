
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Hash, TrendingUp, TrendingDown, DollarSign, BarChart } from 'lucide-react';

interface FileData {
  transactions: any[];
  summary: {
    totalTransactions: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
}

interface FinancialAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileData: FileData | null;
}

const FinancialAnalysisModal: React.FC<FinancialAnalysisModalProps> = ({
  isOpen,
  onClose,
  fileData
}) => {
  if (!fileData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <BarChart className="w-5 h-5 mr-2 text-orange-400" />
            Financial Analysis Results
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Key Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Key Financial Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <Hash className="w-6 h-6 mx-auto text-blue-400 mb-2" />
                <p className="text-sm text-gray-300">Total Transactions</p>
                <p className="text-xl font-bold text-white">{fileData.summary.totalTransactions}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <TrendingUp className="w-6 h-6 mx-auto text-green-400 mb-2" />
                <p className="text-sm text-gray-300">Total Revenue</p>
                <p className="text-xl font-bold text-green-400">₦{fileData.summary.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <TrendingDown className="w-6 h-6 mx-auto text-red-400 mb-2" />
                <p className="text-sm text-gray-300">Total Expenses</p>
                <p className="text-xl font-bold text-red-400">₦{fileData.summary.totalExpenses.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <DollarSign className="w-6 h-6 mx-auto text-orange-400 mb-2" />
                <p className="text-sm text-gray-300">Net Income</p>
                <p className={`text-xl font-bold ${fileData.summary.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₦{fileData.summary.netIncome.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Ratios */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Financial Ratios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-300 mb-1">Profit Margin</p>
                <p className="text-2xl font-bold text-white">
                  {fileData.summary.totalRevenue > 0 
                    ? ((fileData.summary.netIncome / fileData.summary.totalRevenue) * 100).toFixed(2) + '%'
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-300 mb-1">Expense Ratio</p>
                <p className="text-2xl font-bold text-white">
                  {fileData.summary.totalRevenue > 0 
                    ? ((fileData.summary.totalExpenses / fileData.summary.totalRevenue) * 100).toFixed(2) + '%'
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Key Insights</h3>
            <div className="space-y-3">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Badge variant={fileData.summary.netIncome >= 0 ? "default" : "destructive"} className="mr-2">
                    {fileData.summary.netIncome >= 0 ? "Profitable" : "Loss Making"}
                  </Badge>
                  <span className="text-white font-medium">Profitability Status</span>
                </div>
                <p className="text-gray-300 text-sm">
                  {fileData.summary.netIncome >= 0 
                    ? "Your business is generating positive returns. Focus on maintaining and growing this profitability."
                    : "Your business is currently operating at a loss. Consider reviewing expenses and increasing revenue streams."
                  }
                </p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Badge variant="outline" className="mr-2">Cash Flow</Badge>
                  <span className="text-white font-medium">Financial Health</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Based on your transaction data, you have {fileData.summary.totalTransactions} transactions. 
                  {fileData.summary.totalRevenue > fileData.summary.totalExpenses 
                    ? " Your revenue exceeds expenses, indicating healthy cash flow."
                    : " Your expenses exceed revenue, which may indicate cash flow challenges."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialAnalysisModal;
