
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bot, Cpu, FileUp } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#1A1A1A]">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-[#1A1A1A] text-white">
          <div className="container mx-auto px-6 py-24 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              AI-Powered Financial Clarity for Your Business Growth
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Flowz transforms your complex financial data into actionable insights, helping you make smarter, data-driven decisions.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-primary hover:bg-secondary text-white font-bold">Get Started for Free</Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-[#1A1A1A] font-bold">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Revolutionize Your Financial Management</h2>
              <p className="mt-2 text-lg text-gray-600">Flowz offers a suite of powerful tools to simplify your accounting.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Cpu size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">Automated Cost Classification</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Our AI automatically categorizes your expenses, saving you time and reducing errors.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <BarChart size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">Predictive Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Forecast future revenue and costs with high accuracy to plan with confidence.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <FileUp size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">Seamless Data Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Upload CSVs, Excel files, or connect your existing accounting software effortlessly.</p>
                </CardContent>
              </Card>
               <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Bot size={32} className="text-primary" />
                  </div>
                  <CardTitle className="mt-4">AI Chatbot Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Get instant answers to your financial questions in plain English, 24/7.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="bg-gray-100">
          <div className="container mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Take Control of Your Finances?</h2>
            <p className="mt-4 text-lg text-gray-600">Join hundreds of MSMEs who trust Flowz for financial clarity.</p>
            <div className="mt-8">
              <Link to="/signup">
                <Button size="lg" className="bg-primary hover:bg-secondary text-white font-bold">Sign Up Now</Button>
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
