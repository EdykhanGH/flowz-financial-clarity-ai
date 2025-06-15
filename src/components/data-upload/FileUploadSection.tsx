
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, BarChart } from 'lucide-react';
import DataSummary from './DataSummary';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
}

interface FileData {
  transactions: Transaction[];
  summary: {
    totalTransactions: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
}

interface FileUploadSectionProps {
  fileData: FileData | null;
  isLoading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveData: () => void;
  onAnalyze: () => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  fileData,
  isLoading,
  onFileUpload,
  onSaveData,
  onAnalyze
}) => {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Upload className="w-5 h-5 mr-2 text-orange-400" />
          Upload Financial Statement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="file-upload" className="text-gray-300">
            Choose File (CSV, XLS, XLSX)
          </Label>
          <Input
            id="file-upload"
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={onFileUpload}
            className="mt-1"
          />
        </div>

        {fileData && (
          <div className="space-y-4">
            <DataSummary summary={fileData.summary} />

            <div className="flex gap-3">
              <Button 
                onClick={onSaveData}
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isLoading ? 'Saving...' : 'Save to Database'}
              </Button>
              <Button 
                onClick={onAnalyze}
                variant="outline"
                className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
              >
                <BarChart className="w-4 h-4 mr-2" />
                Analyze Financial Data
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploadSection;
