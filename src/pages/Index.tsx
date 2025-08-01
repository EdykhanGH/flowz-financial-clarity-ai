
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bot, Cpu, FileUp, Search, TrendingUp, Repeat, AlertTriangle, PieChart, CheckCircle, Users, Zap, Target, UserCheck } from 'lucide-react';

const Index = () => {
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
            <p className="text-xl md:text-2xl italic text-gray-300 mt-2">
              the business financial clarity you crave for
            </p>
            <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-4xl mx-auto">
              In this inflation-driven economy, guesswork can kill your business. Flowz gives you clear, actionable cost and profit insights, so you can cut waste, protect margins, and grow without financial confusion.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold w-full sm:w-auto">
                  👉 Join Waitlist
                </Button>
              </Link>
            </div>
          </div>
        </section>


        {/* What Flowz Does Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Clarity, not complexity.</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Search size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">🔍 Cost & Profit Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Track what you're spending, on what — and how it affects profit.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <TrendingUp size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">📈 Forecasting & Budgeting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Plan your business future with smart AI-powered projections.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Repeat size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">🔁 Product & Unit Economics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Know which products make or lose money — and adjust fast.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <AlertTriangle size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">🚨 Smart Alerts & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Get AI insights to stop overspending or poor financial moves.</p>
                </CardContent>
              </Card>
              <Card className="text-center md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <PieChart size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">📊 Visual Dashboards</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">All your business finances in one clean, easy-to-understand dashboard.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Who Flowz Is For Section */}
        <section className="py-16 bg-muted/30">
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
              🚀 Join other MSMEs building smarter, stronger businesses with Flowz.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold w-full sm:w-auto">
                  👉 Get Early Access
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-[#1A1A1A] font-bold w-full sm:w-auto">
                  👉 Join Our Waitlist
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="secondary" className="font-bold w-full sm:w-auto">
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
