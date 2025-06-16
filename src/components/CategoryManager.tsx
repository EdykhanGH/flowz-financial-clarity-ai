
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';

interface CategoryManagerProps {
  title?: string;
  description?: string;
  showTitle?: boolean;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  title = "Business Categories",
  description = "Add categories that will be used for organizing your transactions",
  showTitle = true
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { categories, loading, addCategory, deleteCategory } = useBusinessCategories();

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    setIsAdding(true);
    try {
      await addCategory(newCategory.trim());
      setNewCategory('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    }
  };

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
          <p className="text-gray-400 text-sm">{description}</p>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="category" className="text-white">Category Name</Label>
            <Input
              id="category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter category name..."
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAddCategory}
              disabled={!newCategory.trim() || isAdding}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading categories...</p>
        ) : (
          <div className="space-y-2">
            <Label className="text-white">Your Categories ({categories.length})</Label>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <p className="text-gray-400 text-sm">No categories added yet</p>
              ) : (
                categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    {category.category_name}
                    <button
                      onClick={() => deleteCategory(category.id)}
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

export default CategoryManager;
