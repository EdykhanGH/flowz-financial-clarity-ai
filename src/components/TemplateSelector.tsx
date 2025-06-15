
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: string[];
  sampleData: Record<string, any>[];
}

const templates: Template[] = [
  {
    id: 'basic-pnl',
    name: 'Basic Profit & Loss',
    description: 'Simple income statement template',
    category: 'Income Statement',
    fields: ['Date', 'Description', 'Category', 'Revenue', 'Expenses', 'Net Income'],
    sampleData: [
      { Date: '2024-01-01', Description: 'Product Sales', Category: 'Revenue', Revenue: 50000, Expenses: 0, 'Net Income': 50000 },
      { Date: '2024-01-01', Description: 'Office Rent', Category: 'Operating Expense', Revenue: 0, Expenses: 5000, 'Net Income': -5000 },
      { Date: '2024-01-01', Description: 'Marketing', Category: 'Marketing Expense', Revenue: 0, Expenses: 3000, 'Net Income': -3000 }
    ]
  },
  {
    id: 'cash-flow',
    name: 'Cash Flow Statement',
    description: 'Track cash inflows and outflows',
    category: 'Cash Flow',
    fields: ['Date', 'Description', 'Type', 'Amount', 'Balance'],
    sampleData: [
      { Date: '2024-01-01', Description: 'Opening Balance', Type: 'Opening', Amount: 10000, Balance: 10000 },
      { Date: '2024-01-02', Description: 'Customer Payment', Type: 'Inflow', Amount: 15000, Balance: 25000 },
      { Date: '2024-01-03', Description: 'Supplier Payment', Type: 'Outflow', Amount: -8000, Balance: 17000 }
    ]
  },
  {
    id: 'expense-tracker',
    name: 'Expense Tracker',
    description: 'Detailed expense categorization',
    category: 'Expenses',
    fields: ['Date', 'Vendor', 'Category', 'Subcategory', 'Amount', 'Payment Method', 'Notes'],
    sampleData: [
      { Date: '2024-01-01', Vendor: 'Office Supplies Co', Category: 'Office Expenses', Subcategory: 'Stationery', Amount: 500, 'Payment Method': 'Credit Card', Notes: 'Monthly supplies' },
      { Date: '2024-01-02', Vendor: 'Tech Solutions', Category: 'Technology', Subcategory: 'Software', Amount: 1200, 'Payment Method': 'Bank Transfer', Notes: 'Annual license' }
    ]
  },
  {
    id: 'revenue-tracker',
    name: 'Revenue Tracker',
    description: 'Track different revenue streams',
    category: 'Revenue',
    fields: ['Date', 'Customer', 'Product/Service', 'Quantity', 'Unit Price', 'Total Amount', 'Payment Status'],
    sampleData: [
      { Date: '2024-01-01', Customer: 'ABC Corp', 'Product/Service': 'Consulting', Quantity: 10, 'Unit Price': 500, 'Total Amount': 5000, 'Payment Status': 'Paid' },
      { Date: '2024-01-02', Customer: 'XYZ Ltd', 'Product/Service': 'Software License', Quantity: 5, 'Unit Price': 200, 'Total Amount': 1000, 'Payment Status': 'Pending' }
    ]
  }
];

const TemplateSelector: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const downloadTemplate = (template: Template) => {
    const csvContent = [
      template.fields.join(','),
      ...template.sampleData.map(row => 
        template.fields.map(field => row[field] || '').join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Financial Statement Templates</h2>
        <p className="text-gray-400">Choose a template to get started with your financial data</p>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.filter(t => t.category === category).map(template => (
              <Card key={template.id} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                      <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                    </div>
                    <Badge variant="outline" className="text-orange-400 border-orange-400">
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-300 mb-2">Fields included:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.fields.map(field => (
                        <Badge key={field} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">{template.name} - Preview</DialogTitle>
                        </DialogHeader>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-600">
                            <thead>
                              <tr className="bg-gray-800">
                                {template.fields.map(field => (
                                  <th key={field} className="border border-gray-600 px-3 py-2 text-left text-white text-sm">
                                    {field}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {template.sampleData.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-800">
                                  {template.fields.map(field => (
                                    <td key={field} className="border border-gray-600 px-3 py-2 text-gray-300 text-sm">
                                      {row[field]}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      onClick={() => downloadTemplate(template)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-6">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-orange-400" />
          <div>
            <h4 className="text-white font-medium">How to use templates</h4>
            <p className="text-gray-400 text-sm">
              1. Choose a template that matches your needs
              2. Download the CSV template file
              3. Fill in your data using the provided format
              4. Upload the completed file using the upload section above
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
