
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bot, Cpu, FileUp, Search, TrendingUp, Repeat, AlertTriangle, PieChart, CheckCircle, Users, Zap, Target, UserCheck, DollarSign, Eye, ShieldAlert, TrendingDown, Calculator, Package, MessageCircle, MapPin } from 'lucide-react';
import { useState } from 'react';

const Index = () => {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'cost-breakdown',
      title: 'Cost Breakdown That Makes Sense',
      icon: DollarSign,
      description: 'See exactly where your money goes — from bulk purchases to everyday running costs. Get a full picture of direct, indirect, and hidden costs eating into your profit.'
    },
    {
      id: 'profit-insight',
      title: 'Profit Insight, Not Just Revenue',
      icon: Eye,
      description: 'Not every sale is a good sale. Flowz shows you which products or services truly bring profit — and which ones drain your cash without you knowing.'
    },
    {
      id: 'wastage-detection',
      title: 'Wastage & Leak Detection',
      icon: TrendingDown,
      description: 'From excess inventory to silent costs like delivery losses or overstaffing, Flowz flags inefficiencies you may be overlooking — so you can fix them early.'
    },
    {
      id: 'smart-forecasting',
      title: 'Smart Forecasting',
      icon: TrendingUp,
      description: 'Plan ahead with confidence. Flowz analyzes your financial trends and shows you how much you can afford to spend, what to expect next month, and when it\'s safe to grow.'
    },
    {
      id: 'clear-dashboards',
      title: 'Clear Dashboards, No Jargon',
      icon: PieChart,
      description: 'You don\'t need to be an accountant. Flowz gives you simple, visual insights you can understand at a glance — no spreadsheets or guesswork.'
    },
    {
      id: 'inventory-tracking',
      title: 'Inventory & Cost of Goods Tracking',
      icon: Package,
      description: 'Track the cost of goods sold (COGS) and know exactly how inventory affects your cashflow. Whether you sell bags of rice or digital products, we help you stay ahead.'
    },
    {
      id: 'financial-alerts',
      title: 'Alerts for Financial Red Flags',
      icon: ShieldAlert,
      description: 'Don\'t wait until it\'s too late. Flowz alerts you to unusual expenses, rising costs, or sudden drops in profit — so you stay in control.'
    },
    {
      id: 'budgeting-variance',
      title: 'Budgeting & Variance Analysis',
      icon: Calculator,
      description: 'Set your budget and track what you actually spend. Flowz shows you the difference (variance) between your plan and reality — so you stay on track and adjust in real-time.'
    },
    {
      id: 'ai-chat',
      title: 'Chat With Flowz AI for Real-Time Advice',
      icon: MessageCircle,
      description: 'Got questions? Ask Flowz. Chat with our smart assistant to understand your numbers or get helpful insights about market trends, pricing strategies, or business opportunities.'
    },
    {
      id: 'tailored-nigerian',
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
        <section className="bg-[#1A1A1A] text-white">
          <div className="container mx-auto px-6 py-24 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Flowz
            </h1>
            <p className="text-2xl md:text-3xl italic text-gray-200 mt-2 font-medium">
              the business financial clarity you crave for
            </p>
            <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-4xl mx-auto">
              Prices keep going up and guessing your way through can kill your business. Flowz reveals where your money really goes, from hidden costs to low-performing products and silent losses, so you can cut waste and grow smart. No accountant needed.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold w-full sm:w-auto text-lg py-4 px-8">
                  👉 Join Waitlist
                </Button>
              </Link>
            </div>
          </div>
        </section>


        {/* Why Flowz Stands Out Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">What makes Flowz different?</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-2">Designed for Real Business Struggles</h3>
                  <p className="text-muted-foreground">From rising supplier costs to unpredictable expenses, Flowz gives growing businesses and MSMEs the clarity to take control not just survive, but grow stronger.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-2">No Finance Background Needed</h3>
                  <p className="text-muted-foreground">We simplify accounting so anyone can understand their numbers.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-2">Deep Insights</h3>
                  <p className="text-muted-foreground">While others track numbers, Flowz shows you what's eating your profits, and how to cut waste, adapt prices, and stay ahead.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-2">Designed for Growth</h3>
                  <p className="text-muted-foreground">From micro trader to scaling SME, Flowz grows with you.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Features Section */}
        <section id="features" className="py-16 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Features That Give You Clarity, Not Confusion</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => {
                const IconComponent = feature.icon;
                const isHovered = hoveredFeature === feature.id;
                
                return (
                  <Card 
                    key={feature.id}
                    className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 relative overflow-hidden"
                    onMouseEnter={() => setHoveredFeature(feature.id)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                        <IconComponent size={24} className="text-primary" />
                      </div>
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    
                    {/* Animated description overlay */}
                    <div className={`absolute inset-0 bg-background/95 backdrop-blur-sm p-6 flex items-center justify-center transition-all duration-300 ${
                      isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
                    }`}>
                      <CardContent className="p-0 text-center">
                        <div className="mb-4">
                          <IconComponent size={32} className="text-primary mx-auto mb-2" />
                          <h3 className="font-bold text-lg mb-3 text-primary">{feature.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {/* CTA Buttons */}
            <div className="mt-12 text-center">
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

        {/* Who Flowz Is For Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Built for growing businesses like yours:</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                  <Users size={32} className="text-primary" />
                </div>
                <p className="font-medium">Micro & Small Retailers</p>
              </div>
              <div className="text-center">
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                  <Cpu size={32} className="text-primary" />
                </div>
                <p className="font-medium">Food & Product Manufacturers</p>
              </div>
              <div className="text-center">
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                  <Zap size={32} className="text-primary" />
                </div>
                <p className="font-medium">Tech MSMEs</p>
              </div>
              <div className="text-center">
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                  <BarChart size={32} className="text-primary" />
                </div>
                <p className="font-medium">E-commerce & Traders</p>
              </div>
              <div className="text-center">
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                  <Target size={32} className="text-primary" />
                </div>
                <p className="font-medium">Service Providers</p>
              </div>
            </div>
            <p className="text-center mt-8 text-lg">
              Whether you sell goods, services, or both — Flowz works for your business.
            </p>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-muted/30">

          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <CardContent className="p-0">
                  <p className="text-lg mb-4 italic">
                    "Before Flowz, I was guessing my product prices. Now I know what each unit costs and how much I'm truly making."
                  </p>
                  <p className="font-bold">— Chioma, Small Scale Manufacturer</p>
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardContent className="p-0">
                  <p className="text-lg mb-4 italic">
                    "I no longer wait for my accountant to tell me what's wrong — Flowz shows me instantly."
                  </p>
                  <p className="font-bold">— Emeka, Tech MSME Founder</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">3 Simple Steps to Clarity:</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Connect your data</h3>
                <p className="text-muted-foreground">Upload receipts, input cost items, or sync basic records.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Get smart analysis</h3>
                <p className="text-muted-foreground">Flowz breaks it down — by cost, category, and profitability.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Act with confidence</h3>
                <p className="text-muted-foreground">Use insights to adjust prices, budgets, and decisions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 bg-[#1A1A1A] text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to make smarter financial decisions?</h2>
            <p className="text-lg text-gray-300 mb-8">
              Join other MSMEs building smarter, stronger businesses with Flowz.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold w-full sm:w-auto text-lg py-4 px-8">
                  👉 Join Our Waitlist
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-[#1A1A1A] font-bold w-full sm:w-auto text-lg py-4 px-8 border-2">
                  👉 Book a Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
