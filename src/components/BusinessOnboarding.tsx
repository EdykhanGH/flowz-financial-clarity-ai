import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useRevenueCategories } from '@/hooks/useRevenueCategories';

interface BusinessOnboardingProps {
  onComplete: () => void;
}

const BusinessOnboarding = ({ onComplete }: BusinessOnboardingProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addCategory: addExpenseCategory } = useExpenseCategories();
  const { addCategory: addRevenueCategory } = useRevenueCategories();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newRevenueCategory, setNewRevenueCategory] = useState('');
  
  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    description: '',
    businessModel: '',
    businessScale: '',
    marketScope: '',
    expenseCategories: [] as string[],
    revenueCategories: [] as string[],
    city: '',
    state: ''
  });

  const businessCategories = [
    'Manufacturing - Food Products',
    'Manufacturing - Chemical Products', 
    'Manufacturing - Metal Industries',
    'Services - Professional Services',
    'Services - IT Services',
    'Services - Consulting',
    'Services - Healthcare',
    'Retail & Trade - E-commerce',
    'Retail & Trade - Traditional Retail',
    'Retail & Trade - Wholesale',
    'Construction & Real Estate',
    'Transportation & Logistics',
    'Agriculture & Agro-based Industries',
    'Other Services'
  ];

  const businessScales = ['Micro', 'Small', 'Medium', 'Large'];
  const businessModels = ['B2B', 'B2C', 'Hybrid', 'E-commerce', 'Marketplace', 'Subscription', 'Franchise'];

  const predefinedExpenseCategories = [
    'Office Supplies', 'Marketing', 'Utilities', 'Transportation', 'Equipment', 
    'Rent', 'Insurance', 'Legal & Professional', 'Raw Materials', 'Staff Salaries'
  ];

  const predefinedRevenueCategories = [
    'Product Sales', 'Service Revenue', 'Subscription Revenue', 'Consulting Revenue',
    'Commission', 'Licensing', 'Rental Income', 'Interest Income'
  ];

  const handleNext = () => {
    if (currentStep < 9) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete the setup.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Save business profile
      const { error: profileError } = await supabase.from("business_profiles").insert({
        user_id: user.id,
        business_name: formData.businessName,
        category: formData.category,
        description: formData.description,
        business_model: formData.businessModel,
        business_size_scale: formData.businessScale,
        market_scope: formData.marketScope,
        expense_categories: formData.expenseCategories,
        revenue_categories: formData.revenueCategories,
        city: formData.city,
        state: formData.state,
      });

      if (profileError) throw profileError;

      // Save expense categories to database
      for (const category of formData.expenseCategories) {
        await addExpenseCategory(category);
      }

      // Save revenue categories to database
      for (const category of formData.revenueCategories) {
        await addRevenueCategory(category);
      }

      toast({
        title: "Setup Complete!",
        description: "Your business profile has been created successfully.",
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save business profile: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addExpenseCategoryToList = () => {
    if (newExpenseCategory.trim() && !formData.expenseCategories.includes(newExpenseCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        expenseCategories: [...prev.expenseCategories, newExpenseCategory.trim()]
      }));
      setNewExpenseCategory('');
    }
  };

  const addRevenueCategoryToList = () => {
    if (newRevenueCategory.trim() && !formData.revenueCategories.includes(newRevenueCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        revenueCategories: [...prev.revenueCategories, newRevenueCategory.trim()]
      }));
      setNewRevenueCategory('');
    }
  };

  const removeCategoryFromList = (category: string, type: 'expense' | 'revenue') => {
    if (type === 'expense') {
      setFormData(prev => ({
        ...prev,
        expenseCategories: prev.expenseCategories.filter(cat => cat !== category)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        revenueCategories: prev.revenueCategories.filter(cat => cat !== category)
      }));
    }
  };

  const addPredefinedCategory = (category: string, type: 'expense' | 'revenue') => {
    if (type === 'expense' && !formData.expenseCategories.includes(category)) {
      setFormData(prev => ({
        ...prev,
        expenseCategories: [...prev.expenseCategories, category]
      }));
    } else if (type === 'revenue' && !formData.revenueCategories.includes(category)) {
      setFormData(prev => ({
        ...prev,
        revenueCategories: [...prev.revenueCategories, category]
      }));
    }
  };

  const renderBusinessName = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="businessName" className="text-white">Business Name *</Label>
        <Input
          id="businessName"
          value={formData.businessName}
          onChange={(e) => setFormData({...formData, businessName: e.target.value})}
          placeholder="Enter your business name"
          className="mt-1"
          required
        />
      </div>
    </div>
  );

  const renderBusinessCategory = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="category" className="text-white">Business Category *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select your business category" />
          </SelectTrigger>
          <SelectContent>
            {businessCategories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderBusinessDescription = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="description" className="text-white">Business Description (Core Business Operations) *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Describe what your business does, main activities, and core operations..."
          className="mt-1"
          rows={4}
          required
        />
      </div>
    </div>
  );

  const renderBusinessModel = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="businessModel" className="text-white">Business Model *</Label>
        <Select value={formData.businessModel} onValueChange={(value) => setFormData({...formData, businessModel: value})}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select business model" />
          </SelectTrigger>
          <SelectContent>
            {businessModels.map((model) => (
              <SelectItem key={model} value={model}>{model}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderBusinessScale = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="scale" className="text-white">Business Scale *</Label>
        <Select value={formData.businessScale} onValueChange={(value) => setFormData({...formData, businessScale: value})}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select business scale" />
          </SelectTrigger>
          <SelectContent>
            {businessScales.map((scale) => (
              <SelectItem key={scale} value={scale.toLowerCase()}>{scale}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderMarketScope = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="marketScope" className="text-white">Market Scope *</Label>
        <Select value={formData.marketScope} onValueChange={(value) => setFormData({...formData, marketScope: value})}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select market scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="regional">Regional</SelectItem>
            <SelectItem value="national">National</SelectItem>
            <SelectItem value="international">International</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderExpenseCategories = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-white">Expense Categories</Label>
        <p className="text-sm text-gray-400 mb-4">Select categories where your business typically spends money</p>
        
        {/* Predefined categories */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {predefinedExpenseCategories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={formData.expenseCategories.includes(category) ? "default" : "outline"}
              size="sm"
              onClick={() => addPredefinedCategory(category, 'expense')}
              className="text-xs"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Add custom category */}
        <div className="flex gap-2 mb-4">
          <Input
            value={newExpenseCategory}
            onChange={(e) => setNewExpenseCategory(e.target.value)}
            placeholder="Add custom expense category..."
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addExpenseCategoryToList()}
          />
          <Button
            type="button"
            onClick={addExpenseCategoryToList}
            size="sm"
            disabled={!newExpenseCategory.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected categories */}
        {formData.expenseCategories.length > 0 && (
          <div>
            <Label className="text-sm text-gray-400">Selected Categories:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.expenseCategories.map((category) => (
                <div key={category} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm">
                  <span className="text-gray-300">{category}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4 h-4 text-gray-400 hover:text-red-400"
                    onClick={() => removeCategoryFromList(category, 'expense')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderRevenueCategories = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-white">Revenue Categories</Label>
        <p className="text-sm text-gray-400 mb-4">Select categories where your business generates income</p>
        
        {/* Predefined categories */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {predefinedRevenueCategories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={formData.revenueCategories.includes(category) ? "default" : "outline"}
              size="sm"
              onClick={() => addPredefinedCategory(category, 'revenue')}
              className="text-xs"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Add custom category */}
        <div className="flex gap-2 mb-4">
          <Input
            value={newRevenueCategory}
            onChange={(e) => setNewRevenueCategory(e.target.value)}
            placeholder="Add custom revenue category..."
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addRevenueCategoryToList()}
          />
          <Button
            type="button"
            onClick={addRevenueCategoryToList}
            size="sm"
            disabled={!newRevenueCategory.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected categories */}
        {formData.revenueCategories.length > 0 && (
          <div>
            <Label className="text-sm text-gray-400">Selected Categories:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.revenueCategories.map((category) => (
                <div key={category} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm">
                  <span className="text-gray-300">{category}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4 h-4 text-gray-400 hover:text-red-400"
                    onClick={() => removeCategoryFromList(category, 'revenue')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderLocation = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city" className="text-white">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            placeholder="Enter your city"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="state" className="text-white">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({...formData, state: e.target.value})}
            placeholder="Enter your state"
            className="mt-1"
            required
          />
        </div>
      </div>
    </div>
  );

  const getStepTitle = () => {
    const titles = [
      'Business Name',
      'Business Category', 
      'Business Description',
      'Business Model',
      'Business Scale',
      'Market Scope',
      'Expense Categories',
      'Revenue Categories',
      'Location'
    ];
    return titles[currentStep - 1];
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderBusinessName();
      case 2: return renderBusinessCategory();
      case 3: return renderBusinessDescription();
      case 4: return renderBusinessModel();
      case 5: return renderBusinessScale();
      case 6: return renderMarketScope();
      case 7: return renderExpenseCategories();
      case 8: return renderRevenueCategories();
      case 9: return renderLocation();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-[#2D2D2D] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Business Setup</CardTitle>
              <CardDescription className="text-gray-400">
                Step {currentStep} of 9: {getStepTitle()}
              </CardDescription>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep ? 'bg-primary' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderCurrentStep()}
          
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1 || isLoading}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="bg-primary hover:bg-secondary flex items-center gap-2"
            >
              {isLoading ? 'Saving...' : (currentStep === 9 ? 'Complete Setup' : 'Next')}
              {currentStep < 9 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessOnboarding;