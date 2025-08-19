
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { BarChart, Cpu, CheckCircle, Users, Zap, Target, DollarSign, Calculator, TrendingUp, MessageCircle, Eye, Package, ShieldAlert } from 'lucide-react';

const Index = () => {

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-[#1A1A1A] text-white">
          <div className="container mx-auto px-6 py-24 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Get the business financial clarity to transform your business
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto">
              Turn your business numbers into clear, actionable insights to drive smarter decisions and growth
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold w-full sm:w-auto text-lg py-4 px-8">
                  👉 Join our Waitlist
                </Button>
              </Link>
            </div>
          </div>
        </section>


        {/* Features Carousel Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Features that drive results</h2>
              <p className="text-muted-foreground mt-4">Navigate through our powerful features that transform your business data into actionable insights</p>
            </div>
            
            <Carousel className="w-full max-w-4xl mx-auto">
              <CarouselContent>
                {/* Feature 1 - Cost & Profit Clarity */}
                <CarouselItem>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-2">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                        <DollarSign size={32} className="text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-bold mb-2">Cost & Profit Clarity</CardTitle>
                      <p className="text-lg font-semibold text-primary">See what makes money—and what doesn't.</p>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        Flowz breaks down direct, indirect, fixed, and variable costs to reveal true margins per product/service. Cut waste and price with confidence.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-sm font-medium text-foreground">
                          <span className="font-bold">What you'll see:</span> "Product B margin: 7% (below target). Recommendation: reprice or reduce input cost."
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* Feature 2 - Budgeting & Variance Analysis */}
                <CarouselItem>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-2">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                        <Calculator size={32} className="text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-bold mb-2">Budgeting & Variance Analysis</CardTitle>
                      <p className="text-lg font-semibold text-primary">Plan smart. Track reality. Adjust fast.</p>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        Set monthly/quarterly budgets and compare against actuals automatically. Spot overspend early, understand variances, and stay on target.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-sm font-medium text-foreground">
                          <span className="font-bold">What you'll see:</span> "Ops spend +₦185k vs budget (staff overtime). Suggested fix: shift scheduling; review headcount hours."
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* Feature 3 - Scenario & Decision Analysis */}
                <CarouselItem>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-2">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                        <TrendingUp size={32} className="text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-bold mb-2">Scenario & Decision Analysis</CardTitle>
                      <p className="text-lg font-semibold text-primary">Ask "what if?" before you spend.</p>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        Test price changes, supplier switches, and volume shifts. See margin, cash, and break-even impact—before you commit.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-sm font-medium text-foreground">
                          <span className="font-bold">What you'll see:</span> "What if price +5%? Profit +₦480k/month; demand impact minimal based on last 90 days."
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* Feature 4 - Chat with Flowz */}
                <CarouselItem>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-2">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                        <MessageCircle size={32} className="text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-bold mb-2">Chat with Flowz (Assistant)</CardTitle>
                      <p className="text-lg font-semibold text-primary">Answers about your numbers, in plain English.</p>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        Ask anything—"Why did profit drop?" "Which branch leaks cash?" Flowz explains, compares trends, and pulls external signals when relevant.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-sm font-medium text-foreground">
                          <span className="font-bold">What you'll see:</span> "Last month's profit fell 9% due to diesel + vendor price hike on flour."
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* Feature 5 - Smart Forecasting */}
                <CarouselItem>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-2">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                        <Eye size={32} className="text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-bold mb-2">Smart Forecasting</CardTitle>
                      <p className="text-lg font-semibold text-primary">Plan tomorrow, today.</p>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        Predict cash flow, costs, and sales using your history and market signals. Know when it's safe to grow.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-sm font-medium text-foreground">
                          <span className="font-bold">What you'll see:</span> "Projected cash dip in week 3. Recommendation: delay bulk purchase or negotiate 14-day terms."
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* Feature 6 - Records, COGS & Sales */}
                <CarouselItem>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-2">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                        <Package size={32} className="text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-bold mb-2">Records, COGS & Sales</CardTitle>
                      <p className="text-lg font-semibold text-primary">Clean books, clear stock, true COGS.</p>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        Sales and cost of goods sold automatically—so your margins aren't a guess.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-sm font-medium text-foreground">
                          <span className="font-bold">What you'll see:</span> "COGS up 6% from freight; margin compression flagged on SKUs #121–#138."
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* Feature 7 - Risk & Leak Detection */}
                <CarouselItem>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-2">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                        <ShieldAlert size={32} className="text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-bold mb-2">Risk & Leak Detection</CardTitle>
                      <p className="text-lg font-semibold text-primary">Catch silent losses early.</p>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        Flowz flags unusual expenses, rising unit costs, low-performing items, and operational leaks (e.g., shrinkage, overtime drift).
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-sm font-medium text-foreground">
                          <span className="font-bold">What you'll see:</span> "Delivery loss rate 3.2% (↑). Estimated monthly leak: ₦92k."
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              
              <div className="flex justify-center mt-8 gap-4">
                <CarouselPrevious className="relative static translate-y-0" />
                <CarouselNext className="relative static translate-y-0" />
              </div>
            </Carousel>
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
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-[#1A1A1A] font-bold w-full sm:w-auto text-lg py-4 px-8 border-2 bg-white/10 backdrop-blur-sm">
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
