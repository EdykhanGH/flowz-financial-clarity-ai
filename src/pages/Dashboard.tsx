
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Home,
  Database,
  BarChart3, 
  TrendingUp, 
  Calculator, 
  Bot,
  Bell,
  Settings,
  User,
  Menu,
  X
} from 'lucide-react';
import { AIAssistant } from '@/components/AIAssistant';
import DataUpload from '@/components/DataUpload';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import AnalysisSection from '@/components/dashboard/AnalysisSection';
import ScenariosSection from '@/components/dashboard/ScenariosSection';
import BudgetSection from '@/components/dashboard/BudgetSection';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'scenarios', label: 'What-If Scenarios', icon: TrendingUp },
    { id: 'budgets', label: 'Budgets', icon: Calculator },
    { id: 'assistant', label: 'AI Assistant', icon: Bot }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview setActiveTab={setActiveTab} />;
      case 'data':
        return (
          <div className="bg-gray-900 min-h-full p-6 rounded-lg">
            <DataUpload />
          </div>
        );
      case 'analysis':
        return <AnalysisSection />;
      case 'scenarios':
        return <ScenariosSection />;
      case 'budgets':
        return <BudgetSection />;
      case 'assistant':
        return <AIAssistant />;
      default:
        return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-[#1A1A1A] text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className={`text-xl font-bold text-orange-500 ${sidebarOpen ? 'block' : 'hidden'}`}>
              Flowz
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-gray-700"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <nav className="mt-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left text-sm transition-colors ${
                activeTab === item.id
                  ? 'bg-orange-500 text-white border-r-4 border-orange-300'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3 text-white" />
              <span className={sidebarOpen ? 'block' : 'hidden'}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 md:hidden"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold capitalize text-gray-900">
              {activeTab === 'scenarios' ? 'What-If Scenarios' : activeTab}
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-white">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
