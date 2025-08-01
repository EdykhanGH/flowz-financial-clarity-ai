import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Target, Eye, Heart } from 'lucide-react';

const About = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-[#1A1A1A] text-white py-16">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              About Flowz
            </h1>
            <p className="text-xl text-gray-300 mt-4 max-w-2xl mx-auto">
              Financial clarity for small and growing businesses across Africa
            </p>
          </div>
        </section>

        {/* Who We Are Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Who We Are</h2>
              <div className="text-lg text-muted-foreground space-y-6">
                <p>
                  Flowz is a financial clarity platform built for small and growing businesses across Africa. We understand how hard it is to navigate today's unpredictable economy — especially with rising costs, cash flow pressures, and inflation.
                </p>
                <p>
                  Our mission is simple: help business owners get a clear view of their finances and make better decisions without needing to hire an accountant.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why We Exist Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Why We Exist</h2>
              <div className="text-lg text-muted-foreground space-y-6">
                <p>
                  Running a business shouldn't feel like a guessing game. Yet too many business owners struggle to understand their true costs, profits, and where their money is going.
                </p>
                <p>
                  We believe every MSME — no matter how small — deserves access to tools that make financial clarity simple, fast, and actionable.
                </p>
              </div>
              
              {/* Problem Points */}
              <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6 text-center">Most MSMEs struggle with:</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-destructive mb-2">❌</div>
                    <p className="font-medium">Confusing cost structures</p>
                  </div>
                  <div className="text-center">
                    <div className="text-destructive mb-2">❌</div>
                    <p className="font-medium">Poor pricing decisions</p>
                  </div>
                  <div className="text-center">
                    <div className="text-destructive mb-2">❌</div>
                    <p className="font-medium">Untracked waste and expenses</p>
                  </div>
                  <div className="text-center">
                    <div className="text-destructive mb-2">❌</div>
                    <p className="font-medium">No clear view of profit or cash flow</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Offer Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">What We Offer</h2>
              <div className="text-lg text-muted-foreground space-y-6">
                <p>
                  Flowz simplifies financial analysis for small businesses by translating your cost, profit, and pricing data into insights you can act on.
                </p>
                <p>
                  No confusing spreadsheets. No complicated dashboards. Just plain-language breakdowns that show you what's working and what needs fixing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Vision Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Our Vision</h2>
              <div className="text-lg text-muted-foreground">
                <p>
                  We're building a world where financial clarity is not a luxury, but a right — especially for the businesses that power our communities and economies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Our Values</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <CheckCircle size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">Simplicity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Making complex finances easy to understand</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Target size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">Focus</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Built specifically for small businesses</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Eye size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">Clarity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Clear insights over confusing data</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Heart size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">Empowerment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Giving business owners confidence</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;