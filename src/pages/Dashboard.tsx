
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bell,
  Home,
  LineChart,
  Package2,
  PieChart,
  Settings,
  Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bar, BarChart as ReBarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const data = [
  { name: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Feb', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Apr', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'May', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Jun', total: Math.floor(Math.random() * 5000) + 1000 },
];

const Dashboard = () => {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-[#1A1A1A]">
      <div className="hidden border-r bg-[#2D2D2D] md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold text-white">
              <Package2 className="h-6 w-6 text-primary" />
              <span>Flowz Inc</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8 bg-transparent border-gray-600 text-white">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 text-gray-400">
              <Link to="#" className="flex items-center gap-3 rounded-lg px-3 py-2 bg-primary text-white transition-all">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link to="#" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:text-white transition-all">
                <LineChart className="h-4 w-4" />
                Analytics
              </Link>
              <Link to="#" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:text-white transition-all">
                <PieChart className="h-4 w-4" />
                Budgets
              </Link>
              <Link to="#" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:text-white transition-all">
                <BarChart className="h-4 w-4" />
                Reports
              </Link>
              <Link to="#" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:text-white transition-all">
                <Users className="h-4 w-4" />
                Integrations
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card className="bg-[#1A1A1A] border-gray-700">
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle className="text-white">Upgrade to Pro</CardTitle>
                <CardDescription className="text-gray-400">
                  Unlock all features and get unlimited access to our support team.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full bg-primary hover:bg-secondary">
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-[#2D2D2D] px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold text-white">Dashboard</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full text-white">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                <span className="text-green-500">$</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">$45,231.89</div>
                <p className="text-xs text-gray-500">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Costs</CardTitle>
                <span className="text-red-500">$</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">$21,120.50</div>
                <p className="text-xs text-gray-500">+12.4% from last month</p>
              </CardContent>
            </Card>
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Gross Profit</CardTitle>
                 <span className="text-primary">$</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">$24,111.39</div>
                <p className="text-xs text-gray-500">+28.2% from last month</p>
              </CardContent>
            </Card>
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Net Profit Margin</CardTitle>
                 <span className="text-primary">%</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">53.3%</div>
                <p className="text-xs text-gray-500">+2.5% from last month</p>
              </CardContent>
            </Card>
          </div>
          <Card className="bg-[#2D2D2D] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <ReBarChart data={data}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Bar dataKey="total" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
