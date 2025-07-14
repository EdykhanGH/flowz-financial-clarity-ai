
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { useProfitCenters } from '@/hooks/useProfitCenters';

interface RevenueStreamManagerProps {
  businessCategory: string;
  suggestedStreams?: string[];
}

const RevenueStreamManager: React.FC<RevenueStreamManagerProps> = ({ 
  businessCategory,
  suggestedStreams = []
}) => {
  const [newStream, setNewStream] = useState('');
  const [newFrequency, setNewFrequency] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { profitCenters, loading, addProfitCenter, deleteProfitCenter } = useProfitCenters();

  const frequencyOptions = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Per Sale'];

  // Default revenue streams based on business category
  const getDefaultStreams = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('manufacturing')) {
      return ['Product Sales', 'Wholesale Revenue', 'Export Sales', 'Licensing Fees'];
    } else if (categoryLower.includes('services')) {
      return ['Service Fees', 'Consultation Revenue', 'Subscription Revenue', 'Maintenance Contracts'];
    } else if (categoryLower.includes('retail') || categoryLower.includes('trade')) {
      return ['Product Sales', 'Online Sales', 'Wholesale Revenue', 'Commission'];
    } else {
      return ['Sales Revenue', 'Service Revenue', 'Subscription Revenue', 'Commission'];
    }
  };

  const defaultStreams = suggestedStreams.length > 0 ? suggestedStreams : getDefaultStreams(businessCategory);

  const handleAddStream = async () => {
    if (!newStream.trim() || !newFrequency) return;

    setIsAdding(true);
    try {
      await addProfitCenter(newStream.trim(), 'service_revenue');
      setNewStream('');
      setNewFrequency('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddSuggested = async (stream: string) => {
    if (!newFrequency) {
      alert('Please select a frequency first');
      return;
    }
    
    setIsAdding(true);
    try {
      await addProfitCenter(stream, 'service_revenue');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-white">Primary Revenue Streams</CardTitle>
        <p className="text-gray-400 text-sm">Add your main sources of revenue and their frequency</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Label htmlFor="revenue-stream" className="text-white">Revenue Stream</Label>
            <Input
              id="revenue-stream"
              value={newStream}
              onChange={(e) => setNewStream(e.target.value)}
              placeholder="Enter revenue stream..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="frequency" className="text-white">Frequency</Label>
            <Select value={newFrequency} onValueChange={setNewFrequency}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((freq) => (
                  <SelectItem key={freq} value={freq.toLowerCase()}>{freq}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAddStream}
              disabled={!newStream.trim() || !newFrequency || isAdding}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>

        {defaultStreams.length > 0 && (
          <div className="space-y-2">
            <Label className="text-white">Suggested Revenue Streams (click to add)</Label>
            <div className="flex flex-wrap gap-2">
              {defaultStreams.map((stream) => (
                <Badge
                  key={stream}
                  variant="outline"
                  className="cursor-pointer hover:bg-orange-500 hover:text-white transition-colors"
                  onClick={() => handleAddSuggested(stream)}
                >
                  {stream}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500">Note: Select frequency above before clicking suggested streams</p>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Loading revenue streams...</p>
        ) : (
          <div className="space-y-2">
            <Label className="text-white">Your Profit Centers ({profitCenters.length})</Label>
            <div className="space-y-2">
              {profitCenters.length === 0 ? (
                <p className="text-gray-400 text-sm">No profit centers added yet</p>
              ) : (
                profitCenters.map((center) => (
                  <div
                    key={center.id}
                    className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
                  >
                    <div>
                      <span className="text-white font-medium">{center.name}</span>
                      <span className="text-gray-400 text-sm ml-2">({center.category_type})</span>
                    </div>
                    <button
                      onClick={() => deleteProfitCenter(center.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueStreamManager;
