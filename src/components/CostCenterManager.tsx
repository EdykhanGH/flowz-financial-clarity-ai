
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { useCostCenters } from '@/hooks/useCostCenters';

interface CostCenterManagerProps {
  businessCategory: string;
  suggestedCenters?: string[];
}

const CostCenterManager: React.FC<CostCenterManagerProps> = ({ 
  businessCategory,
  suggestedCenters = []
}) => {
  const [newCenter, setNewCenter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { costCenters, loading, addCostCenter, deleteCostCenter } = useCostCenters();

  // Default cost centers based on business category
  const getDefaultCenters = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('manufacturing')) {
      return ['Production', 'Raw Materials', 'Quality Control', 'Maintenance', 'Sales & Marketing', 'Administration'];
    } else if (categoryLower.includes('services')) {
      return ['Service Delivery', 'Sales & Marketing', 'Administration', 'IT', 'HR', 'Office Operations'];
    } else if (categoryLower.includes('retail') || categoryLower.includes('trade')) {
      return ['Inventory/Stock', 'Sales & Marketing', 'Store Operations', 'Administration', 'Logistics', 'Customer Service'];
    } else {
      return ['Operations', 'Sales & Marketing', 'Administration', 'IT', 'HR', 'Finance'];
    }
  };

  const defaultCenters = suggestedCenters.length > 0 ? suggestedCenters : getDefaultCenters(businessCategory);

  const handleAddCenter = async () => {
    if (!newCenter.trim()) return;

    setIsAdding(true);
    try {
      await addCostCenter(newCenter.trim());
      setNewCenter('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddSuggested = async (center: string) => {
    setIsAdding(true);
    try {
      await addCostCenter(center);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-white">Main Cost Centers</CardTitle>
        <p className="text-gray-400 text-sm">Add your main cost centers or expense categories</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="cost-center" className="text-white">Cost Center</Label>
            <Input
              id="cost-center"
              value={newCenter}
              onChange={(e) => setNewCenter(e.target.value)}
              placeholder="Enter cost center..."
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAddCenter}
              disabled={!newCenter.trim() || isAdding}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>

        {defaultCenters.length > 0 && (
          <div className="space-y-2">
            <Label className="text-white">Suggested Cost Centers (click to add)</Label>
            <div className="flex flex-wrap gap-2">
              {defaultCenters.map((center) => (
                <Badge
                  key={center}
                  variant="outline"
                  className="cursor-pointer hover:bg-orange-500 hover:text-white transition-colors"
                  onClick={() => handleAddSuggested(center)}
                >
                  {center}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Loading cost centers...</p>
        ) : (
          <div className="space-y-2">
            <Label className="text-white">Your Cost Centers ({costCenters.length})</Label>
            <div className="flex flex-wrap gap-2">
              {costCenters.length === 0 ? (
                <p className="text-gray-400 text-sm">No cost centers added yet</p>
              ) : (
                costCenters.map((center) => (
                  <Badge
                    key={center.id}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    {center.cost_center}
                    <button
                      onClick={() => deleteCostCenter(center.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CostCenterManager;
