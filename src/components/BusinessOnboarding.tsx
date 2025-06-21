
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import CategoryManager from '@/components/CategoryManager';
import RevenueStreamManager from '@/components/RevenueStreamManager';
import CostCenterManager from '@/components/CostCenterManager';

interface BusinessOnboardingProps {
  onComplete: () => void;
}

const BusinessOnboarding = ({ onComplete }: BusinessOnboardingProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    description: '',
    businessSizeEmployees: '',
    businessSizeScale: '',
    annualRevenueRange: '',
    businessModel: '',
    coreActivities: [] as string[],
    location: '',
    marketScope: '',
    seasonalBusiness: false
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

  const coreActivitiesOptions = [
    'Production', 'Sales', 'Customer Service', 'Logistics', 'R&D', 'Marketing', 'Quality Control', 'Administration'
  ];

  const getDescriptionTemplate = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('manufacturing')) {
      return "We are a manufacturing company that specializes in [product type]. Our main activities include [production processes], [quality control], and [distribution]. What makes us unique is [unique selling proposition/competitive advantage].";
    } else if (categoryLower.includes('services')) {
      return "We provide [type of services] to [target customers]. Our core services include [main service offerings]. We differentiate ourselves through [unique value proposition/expertise].";
    } else if (categoryLower.includes('retail') || categoryLower.includes('trade')) {
      return "We are a [retail/wholesale] business that sells [product categories] to [target market]. Our operations include [buying/sourcing], [inventory management], and [sales channels]. Our competitive advantage is [what sets you apart].";
    } else {
      return "We are a [business type] company that [what you do]. Our main activities include [core business processes]. What makes us unique is [unique features/competitive advantages].";
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
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
      const { error } = await supabase.from("business_profiles").insert({
        user_id: user.id,
        business_name: formData.businessName,
        category: formData.category,
        description: formData.description,
        business_size_employees: formData.businessSizeEmployees,
        business_size_scale: formData.businessSizeScale,
        annual_revenue_range: formData.annualRevenueRange,
        business_model: formData.businessModel,
        core_activities: formData.coreActivities,
        location: formData.location,
        market_scope: formData.marketScope,
        seasonal_business: formData.seasonalBusiness,
      });

      if (error) throw error;

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

  const handleCheckboxChange = (field: 'coreActivities', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="businessName" className="text-white">Business Name *</Label>
        <Input
          id="businessName"
          value={formData.businessName}
          onChange={(e) => setFormData({...formData, businessName: e.target.value})}
          placeholder="Enter your business name"
          className="mt-1"
        />
      </div>
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
      <div>
        <Label htmlFor="location" className="text-white">Area/Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          placeholder="Enter your business location (city, state)"
          className="mt-1"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="description" className="text-white">Business Description *</Label>
        <div className="text-sm text-gray-400 mb-2">
          Template: {getDescriptionTemplate(formData.category)}
        </div>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Describe what your business does, main activities, and unique features..."
          className="mt-1"
          rows={4}
        />
      </div>
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
      <div>
        <Label className="text-white">Core Activities/Operations</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {coreActivitiesOptions.map((activity) => (
            <div key={activity} className="flex items-center space-x-2">
              <Checkbox
                id={activity}
                checked={formData.coreActivities.includes(activity)}
                onCheckedChange={(checked) => handleCheckboxChange('coreActivities', activity, checked as boolean)}
              />
              <Label htmlFor={activity} className="text-sm text-gray-300">{activity}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="employees" className="text-white">Number of Employees</Label>
          <Input
            id="employees"
            type="number"
            value={formData.businessSizeEmployees}
            onChange={(e) => setFormData({...formData, businessSizeEmployees: e.target.value})}
            placeholder="e.g., 25"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="scale" className="text-white">Business Scale</Label>
          <Select value={formData.businessSizeScale} onValueChange={(value) => setFormData({...formData, businessSizeScale: value})}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select scale" />
            </SelectTrigger>
            <SelectContent>
              {businessScales.map((scale) => (
                <SelectItem key={scale} value={scale.toLowerCase()}>{scale}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="revenue" className="text-white">Annual Revenue Range (₹)</Label>
          <Select value={formData.annualRevenueRange} onValueChange={(value) => setFormData({...formData, annualRevenueRange: value})}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1cr">₹0 - ₹1 Crore</SelectItem>
              <SelectItem value="1-10cr">₹1 - ₹10 Crore</SelectItem>
              <SelectItem value="10-50cr">₹10 - ₹50 Crore</SelectItem>
              <SelectItem value="50-100cr">₹50 - ₹100 Crore</SelectItem>
              <SelectItem value="100cr+">₹100+ Crore</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="marketScope" className="text-white">Geographic Market Scope</Label>
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
      <div className="flex items-center space-x-2">
        <Switch
          id="seasonal"
          checked={formData.seasonalBusiness}
          onCheckedChange={(checked) => setFormData({...formData, seasonalBusiness: checked})}
        />
        <Label htmlFor="seasonal" className="text-white">Seasonal Business Patterns</Label>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <RevenueStreamManager businessCategory={formData.category} />
      <CostCenterManager businessCategory={formData.category} />
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <CategoryManager 
        title="Transaction Categories"
        description="Add categories that will be used for organizing your financial transactions. You can always add more categories later."
        showTitle={true}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-[#2D2D2D] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Business Setup</CardTitle>
              <CardDescription className="text-gray-400">
                Step {currentStep} of 5: {
                  currentStep === 1 ? 'Basic Information' : 
                  currentStep === 2 ? 'Business Details' : 
                  currentStep === 3 ? 'Business Size & Scope' : 
                  currentStep === 4 ? 'Revenue & Cost Structure' : 
                  'Transaction Categories'
                }
              </CardDescription>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((step) => (
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
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          
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
              {isLoading ? 'Saving...' : (currentStep === 5 ? 'Complete Setup' : 'Next')}
              {currentStep < 5 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessOnboarding;
