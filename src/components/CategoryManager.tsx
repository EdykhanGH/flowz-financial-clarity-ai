
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
      const result = await addCategory(newCategory.trim());
      if (result && !result.error) {
        setNewCategory('');
      }
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding) {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <Card className="w-full bg-gray-800 border-gray-700">
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
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              disabled={isAdding}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAddCategory}
              disabled={!newCategory.trim() || isAdding}
              className="bg-orange-500 hover:bg-orange-600 text-white"
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
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-white hover:bg-gray-600"
                  >
                    {category.category_name}
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-400 hover:text-red-300 ml-1"
                      title="Delete category"
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
