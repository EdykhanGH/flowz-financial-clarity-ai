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
import { useCostCenters } from '@/hooks/useCostCenters';
import { useProfitCenters } from '@/hooks/useProfitCenters';

interface BusinessOnboardingProps {
  onComplete: () => void;
}

interface Product {
  id: string;
  name: string;
  category: string;
  sub_category?: string;
}

const BusinessOnboarding = ({ onComplete }: BusinessOnboardingProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addCostCenter } = useCostCenters();
  const { addProfitCenter } = useProfitCenters();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    description: '',
    businessModel: '',
    businessScale: '',
    marketScope: '',
    city: '',
    state: '',
    products: [] as Product[],
    costCenters: [] as string[],
    profitCenters: [] as string[]
  });

  const [newProduct, setNewProduct] = useState({ name: '', category: '', sub_category: '' });
  const [newCostCenter, setNewCostCenter] = useState('');
  const [newProfitCenter, setNewProfitCenter] = useState('');

  const businessCategories = [
    // Agriculture & Food
    'Agriculture & Farming',
    'Livestock & Poultry',
    'Fisheries & Aquaculture',
    'Food Processing & Manufacturing',
    'Food & Beverage Retail',
    
    // Manufacturing
    'Textile & Garment Manufacturing',
    'Chemical & Pharmaceutical Manufacturing',
    'Metal & Steel Processing',
    'Plastic & Rubber Manufacturing',
    'Cement & Construction Materials',
    'Automotive & Parts Manufacturing',
    'Electronics Manufacturing',
    'Furniture & Wood Products',
    
    // Energy & Natural Resources
    'Oil & Gas',
    'Renewable Energy',
    'Mining & Quarrying',
    'Power Generation & Distribution',
    
    // Technology & Communications
    'Information Technology Services',
    'Software Development',
    'Telecommunications',
    'Digital Marketing & Media',
    'E-commerce & Online Services',
    
    // Financial Services
    'Banking & Financial Services',
    'Insurance',
    'Investment & Securities',
    'Microfinance & Cooperatives',
    'Fintech',
    
    // Trade & Commerce
    'Import & Export Trading',
    'Wholesale Trading',
    'General Retail',
    'Supermarkets & Convenience Stores',
    'Fashion & Accessories Retail',
    'Auto Parts & Services',
    
    // Construction & Real Estate
    'Construction & Engineering',
    'Real Estate Development',
    'Property Management',
    'Architecture & Design',
    
    // Transportation & Logistics
    'Transportation Services',
    'Logistics & Warehousing',
    'Courier & Delivery Services',
    'Aviation Services',
    'Maritime Services',
    
    // Professional Services
    'Legal Services',
    'Accounting & Auditing',
    'Consulting Services',
    'Business Support Services',
    'Human Resources Services',
    
    // Healthcare & Education
    'Healthcare Services',
    'Pharmaceutical Services',
    'Medical Equipment & Supplies',
    'Education & Training',
    'Educational Technology',
    
    // Hospitality & Entertainment
    'Hotels & Hospitality',
    'Restaurants & Catering',
    'Event Planning & Management',
    'Entertainment & Media',
    'Tourism & Travel Services',
    
    // Personal & Consumer Services
    'Beauty & Personal Care',
    'Fitness & Wellness',
    'Laundry & Dry Cleaning',
    'Security Services',
    'Cleaning Services',
    
    // Specialized Industries
    'Printing & Publishing',
    'Advertising & Marketing',
    'Arts & Crafts',
    'Sports & Recreation',
    'Non-Profit Organizations'
  ];

  const businessScales = ['Micro', 'Small', 'Medium', 'Large'];
  const businessModels = ['B2B', 'B2C', 'Hybrid', 'E-commerce', 'Marketplace', 'Subscription', 'Franchise'];

  const handleNext = () => {
    if (currentStep < 3) {
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

  const addProduct = () => {
    if (newProduct.name.trim()) {
      const product: Product = {
        id: Date.now().toString(),
        name: newProduct.name.trim(),
        category: newProduct.category.trim() || 'General',
        sub_category: newProduct.sub_category.trim()
      };
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, product]
      }));
      setNewProduct({ name: '', category: '', sub_category: '' });
    }
  };

  const removeProduct = (id: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const addCostCenterToList = () => {
    if (newCostCenter.trim() && !formData.costCenters.includes(newCostCenter.trim())) {
      setFormData(prev => ({
        ...prev,
        costCenters: [...prev.costCenters, newCostCenter.trim()]
      }));
      setNewCostCenter('');
    }
  };

  const addProfitCenterToList = () => {
    if (newProfitCenter.trim() && !formData.profitCenters.includes(newProfitCenter.trim())) {
      setFormData(prev => ({
        ...prev,
        profitCenters: [...prev.profitCenters, newProfitCenter.trim()]
      }));
      setNewProfitCenter('');
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
        city: formData.city,
        state: formData.state,
      });

      if (profileError) throw profileError;

      // Add Product Cost center with products
      await addCostCenter('Product Cost', 'product_cost', formData.products);

      // Add other cost centers
      for (const center of formData.costCenters) {
        await addCostCenter(center, 'operational_cost');
      }

      // Add Product Sales profit center with products
      await addProfitCenter('Product Sales', 'product_sales', formData.products);

      // Add other profit centers
      for (const center of formData.profitCenters) {
        await addProfitCenter(center, 'service_revenue');
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

  const getStepTitle = () => {
    const titles = [
      'Business Information',
      'Business Details & Location',
      'Products & Centers'
    ];
    return titles[currentStep - 1];
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="businessName" className="text-white">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                placeholder="Enter your business name"
                required
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="category" className="text-white">Business Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your business category" />
                </SelectTrigger>
                <SelectContent>
                  {businessCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label htmlFor="description" className="text-white">Business Description (Core Business Operations) *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe what your business does, main activities, and core operations..."
                rows={4}
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-white">Business Model *</Label>
              <Select value={formData.businessModel} onValueChange={(value) => setFormData({...formData, businessModel: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business model" />
                </SelectTrigger>
                <SelectContent>
                  {businessModels.map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-white">Business Scale *</Label>
              <Select value={formData.businessScale} onValueChange={(value) => setFormData({...formData, businessScale: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business scale" />
                </SelectTrigger>
                <SelectContent>
                  {businessScales.map((scale) => (
                    <SelectItem key={scale} value={scale.toLowerCase()}>{scale}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-white">Market Scope *</Label>
              <Select value={formData.marketScope} onValueChange={(value) => setFormData({...formData, marketScope: value})}>
                <SelectTrigger>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label htmlFor="city" className="text-white">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Enter your city"
                  required
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="state" className="text-white">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  placeholder="Enter your state"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Products Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Products/Services</h3>
              <p className="text-sm text-gray-400">Add your main products or services (these will be used for cost and sales tracking)</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Product/Service name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
                <Input
                  placeholder="Category (e.g., Electronics)"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                />
                <Input
                  placeholder="Sub-category (optional)"
                  value={newProduct.sub_category}
                  onChange={(e) => setNewProduct({...newProduct, sub_category: e.target.value})}
                />
              </div>
              
              <Button
                type="button"
                onClick={addProduct}
                size="sm"
                disabled={!newProduct.name.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>

              {formData.products.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-white">Added Products ({formData.products.length})</Label>
                  <div className="grid gap-2">
                    {formData.products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded">
                        <span className="text-white">
                          {product.name} 
                          {product.category && <span className="text-gray-400 ml-2">({product.category})</span>}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cost Centers */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Additional Cost Centers</h3>
              <p className="text-sm text-gray-400">Product Cost is automatically added. Add other cost categories manually.</p>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add cost center (e.g., Marketing, Administration)"
                  value={newCostCenter}
                  onChange={(e) => setNewCostCenter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCostCenterToList()}
                />
                <Button
                  type="button"
                  onClick={addCostCenterToList}
                  size="sm"
                  disabled={!newCostCenter.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.costCenters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.costCenters.map((center, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm">
                      <span className="text-gray-300">{center}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 w-4 h-4 text-gray-400 hover:text-red-400"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          costCenters: prev.costCenters.filter((_, i) => i !== index)
                        }))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profit Centers */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Additional Profit Centers</h3>
              <p className="text-sm text-gray-400">Product Sales is automatically added. Add other revenue sources manually.</p>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add profit center (e.g., Consulting, Service Fees)"
                  value={newProfitCenter}
                  onChange={(e) => setNewProfitCenter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addProfitCenterToList()}
                />
                <Button
                  type="button"
                  onClick={addProfitCenterToList}
                  size="sm"
                  disabled={!newProfitCenter.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.profitCenters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.profitCenters.map((center, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm">
                      <span className="text-gray-300">{center}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 w-4 h-4 text-gray-400 hover:text-red-400"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          profitCenters: prev.profitCenters.filter((_, i) => i !== index)
                        }))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );


      default:
        return null;
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
                Step {currentStep} of 3: {getStepTitle()}
              </CardDescription>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep ? 'bg-orange-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px]">
            {renderStep()}
          </div>
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {currentStep === 3 ? (isLoading ? 'Completing...' : 'Complete Setup') : 'Next'}
              {currentStep < 3 && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessOnboarding;