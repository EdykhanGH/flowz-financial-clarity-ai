
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Edit, Link, Banknote } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import TemplateSelector from './TemplateSelector';
import FileUploadSection from './data-upload/FileUploadSection';
import FinancialAnalysisModal from './data-upload/FinancialAnalysisModal';
import EnhancedManualEntry from './data-upload/EnhancedManualEntry';
import BankStatementUpload from './data-upload/BankStatementUpload';
import APIConnections from './data-upload/APIConnections';
import { parseFile, mapTransactionType, calculateSummary, Transaction } from './data-upload/FileProcessor';

interface FileData {
  transactions: Transaction[];
  summary: {
    totalTransactions: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
}

const DataUpload: React.FC = () => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { addTransaction } = useTransactions();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    console.log('Uploading file:', file.name, 'Type:', file.type);

    try {
      const jsonData = await parseFile(file);
      console.log('Parsed data:', jsonData);

      const transactions: Transaction[] = jsonData.map((item: any) => ({
        date: item.Date || item.date || '',
        description: item.Description || item.description || '',
        amount: item.Amount || item.amount || 0,
        type: item.Type || item.type || 'expense',
        category: item.Category || item.category
      }));

      const summary = calculateSummary(transactions);

      setFileData({ transactions, summary });
    } catch (error) {
      console.error('Error reading file:', error);
      alert(`Error reading file: ${error.message}. Please ensure it is a valid PDF, CSV or Excel file.`);
    }
  };

  const handleSaveData = async () => {
    if (!fileData) {
      return;
    }

    setIsLoading(true);

    try {
      for (const transaction of fileData.transactions) {
        const mappedTransaction = {
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: mapTransactionType(transaction.type),
          category: transaction.category || 'Uncategorized'
        };
        
        await addTransaction(mappedTransaction);
      }
      alert('Data saved successfully!');
      setFileData(null);
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Comprehensive Data Collection</h1>
        <p className="text-gray-400">Multiple ways to capture your financial data - Analytics Ready</p>
      </div>

      <Tabs defaultValue="bank" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800">
          <TabsTrigger value="bank" className="data-[state=active]:bg-orange-500">
            <Banknote className="w-4 h-4 mr-2" />
            Bank Statements
          </TabsTrigger>
          <TabsTrigger value="manual" className="data-[state=active]:bg-orange-500">
            <Edit className="w-4 h-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="upload" className="data-[state=active]:bg-orange-500">
            <Upload className="w-4 h-4 mr-2" />
            Document Upload
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-orange-500">
            <Link className="w-4 h-4 mr-2" />
            API Connections
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-orange-500">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="space-y-6">
          <BankStatementUpload />
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <EnhancedManualEntry />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <FileUploadSection
            fileData={fileData}
            isLoading={isLoading}
            onFileUpload={handleFileUpload}
            onSaveData={handleSaveData}
            onAnalyze={() => setShowAnalysis(true)}
          />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <APIConnections />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateSelector />
        </TabsContent>
      </Tabs>

      <FinancialAnalysisModal
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        fileData={fileData}
      />
    </div>
  );
};

export default DataUpload;
