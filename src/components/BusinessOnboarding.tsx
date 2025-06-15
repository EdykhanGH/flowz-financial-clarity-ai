
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
    turnover: '',
    employees: '',
    businessModel: '',
    revenueStreams: [] as string[],
    costCenters: [] as string[],
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

  const revenueStreamOptions = [
    'Product Sales', 'Service Revenue', 'Subscription Revenue', 'Licensing', 'Consulting', 'Commission'
  ];

  const costCenterOptions = [
    'Production', 'Sales & Marketing', 'Administration', 'R&D', 'IT', 'HR', 'Finance'
  ];

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
        ...formData,
        user_id: user.id,
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

  const handleCheckboxChange = (field: 'revenueStreams' | 'costCenters', value: string, checked: boolean) => {
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
        <Label htmlFor="businessName" className="text-white">Business Name</Label>
        <Input
          id="businessName"
          value={formData.businessName}
          onChange={(e) => setFormData({...formData, businessName: e.target.value})}
          placeholder="Enter your business name"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="category" className="text-white">Business Category</Label>
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

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="description" className="text-white">Business Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Describe your business (AI suggestions coming soon...)"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="turnover" className="text-white">Annual Turnover Range</Label>
        <Select value={formData.turnover} onValueChange={(value) => setFormData({...formData, turnover: value})}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select turnover range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-1cr">₹0 - ₹1 Crore</SelectItem>
            <SelectItem value="1-10cr">₹1 - ₹10 Crore</SelectItem>
            <SelectItem value="10-50cr">₹10 - ₹50 Crore</SelectItem>
            <SelectItem value="50cr+">₹50+ Crore</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="employees" className="text-white">Number of Employees</Label>
        <Select value={formData.employees} onValueChange={(value) => setFormData({...formData, employees: value})}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select employee count" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-10">1-10</SelectItem>
            <SelectItem value="11-50">11-50</SelectItem>
            <SelectItem value="51-200">51-200</SelectItem>
            <SelectItem value="200+">200+</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="businessModel" className="text-white">Business Model</Label>
        <Select value={formData.businessModel} onValueChange={(value) => setFormData({...formData, businessModel: value})}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select business model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="B2B">B2B</SelectItem>
            <SelectItem value="B2C">B2C</SelectItem>
            <SelectItem value="Hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-white">Primary Revenue Streams</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {revenueStreamOptions.map((stream) => (
            <div key={stream} className="flex items-center space-x-2">
              <Checkbox
                id={stream}
                checked={formData.revenueStreams.includes(stream)}
                onCheckedChange={(checked) => handleCheckboxChange('revenueStreams', stream, checked as boolean)}
              />
              <Label htmlFor={stream} className="text-sm text-gray-300">{stream}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-white">Main Cost Centers</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {costCenterOptions.map((center) => (
            <div key={center} className="flex items-center space-x-2">
              <Checkbox
                id={center}
                checked={formData.costCenters.includes(center)}
                onCheckedChange={(checked) => handleCheckboxChange('costCenters', center, checked as boolean)}
              />
              <Label htmlFor={center} className="text-sm text-gray-300">{center}</Label>
            </div>
          ))}
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

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-[#2D2D2D] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Business Setup</CardTitle>
              <CardDescription className="text-gray-400">
                Step {currentStep} of 3: {currentStep === 1 ? 'Business Details' : currentStep === 2 ? 'Business Profile' : 'Setup Preferences'}
              </CardDescription>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3].map((step) => (
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
              {isLoading ? 'Saving...' : (currentStep === 3 ? 'Complete Setup' : 'Next')}
              {currentStep < 3 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessOnboarding;
