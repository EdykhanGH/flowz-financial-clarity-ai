import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { DollarSign, Eye, TrendingDown, TrendingUp, PieChart, Package, ShieldAlert, Calculator, MessageCircle, MapPin } from 'lucide-react';

const Features = () => {
  const features = [
    {
      title: 'Cost Breakdown That Makes Sense',
      icon: DollarSign,
      description: 'See exactly where your money goes — from bulk purchases to everyday running costs. Get a full picture of direct, indirect, and hidden costs eating into your profit.'
    },
    {
      title: 'Profit Insight, Not Just Revenue',
      icon: Eye,
      description: 'Not every sale is a good sale. Flowz shows you which products or services truly bring profit — and which ones drain your cash without you knowing.'
    },
    {
      title: 'Wastage & Leak Detection',
      icon: TrendingDown,
      description: 'From excess inventory to silent costs like delivery losses or overstaffing, Flowz flags inefficiencies you may be overlooking — so you can fix them early.'
    },
    {
      title: 'Smart Forecasting',
      icon: TrendingUp,
      description: 'Plan ahead with confidence. Flowz analyzes your financial trends and shows you how much you can afford to spend, what to expect next month, and when it\'s safe to grow.'
    },
    {
      title: 'Clear Dashboards, No Jargon',
      icon: PieChart,
      description: 'You don\'t need to be an accountant. Flowz gives you simple, visual insights you can understand at a glance — no spreadsheets or guesswork.'
    },
    {
      title: 'Inventory & Cost of Goods Tracking',
      icon: Package,
      description: 'Track the cost of goods sold (COGS) and know exactly how inventory affects your cashflow. Whether you sell bags of rice or digital products, we help you stay ahead.'
    },
    {
      title: 'Alerts for Financial Red Flags',
      icon: ShieldAlert,
      description: 'Don\'t wait until it\'s too late. Flowz alerts you to unusual expenses, rising costs, or sudden drops in profit — so you stay in control.'
    },
    {
      title: 'Budgeting & Variance Analysis',
      icon: Calculator,
      description: 'Set your budget and track what you actually spend. Flowz shows you the difference (variance) between your plan and reality — so you stay on track and adjust in real-time.'
    },
    {
      title: 'Chat With Flowz AI for Real-Time Advice',
      icon: MessageCircle,
      description: 'Got questions? Ask Flowz. Chat with our smart assistant to understand your numbers or get helpful insights about market trends, pricing strategies, or business opportunities.'
    },
    {
      title: 'Tailored for Growing Nigerian Businesses',
      icon: MapPin,
      description: 'Built with your hustle in mind, Flowz works for retail, manufacturing, services, or trade. No complex setup, just plug in your data and start seeing results.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-[#1A1A1A] text-white py-16">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Features That Give You Clarity, Not Confusion
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Discover how Flowz transforms complex financial data into actionable insights for your growing business.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                
                return (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 rounded-full p-3 w-fit group-hover:bg-primary/20 transition-colors flex-shrink-0">
                          <IconComponent size={24} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors mb-3">
                            {feature.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground leading-relaxed pl-16">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* CTA Buttons */}
            <div className="mt-16 text-center">
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold w-full sm:w-auto text-lg py-4 px-8">
                    👉 Join the Waitlist
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="lg" variant="outline" className="font-bold w-full sm:w-auto text-lg py-4 px-8 border-2">
                    👉 Book a Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Features;