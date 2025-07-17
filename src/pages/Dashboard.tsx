
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
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
  X,
  LogOut,
  Target
} from 'lucide-react';
import DataUpload from '@/components/DataUpload';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import AnalyticsPage from '@/components/analytics/AnalyticsPage';
import ScenarioAnalysisPage from '@/components/analytics/ScenarioAnalysisPage';
import BudgetManagementPage from '@/components/budget/BudgetManagementPage';
import EnhancedAIAssistant from '@/components/EnhancedAIAssistant';

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut, user } = useAuth();

  const sidebarItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'data', label: 'Data Upload', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'scenario', label: 'Scenario Analysis', icon: TrendingUp },
    { id: 'budget', label: 'Budget Management', icon: Calculator },
    { id: 'assistant', label: 'AI Assistant', icon: Bot }
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardOverview setActiveTab={setActiveTab} />;
      case 'data':
        return (
          <div className="bg-gray-900 min-h-full p-6 rounded-lg">
            <DataUpload />
          </div>
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'scenario':
        return <ScenarioAnalysisPage />;
      case 'budget':
        return <BudgetManagementPage />;
      case 'assistant':
        return <EnhancedAIAssistant />;
      default:
        return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`bg-[#1A1A1A] text-white transition-all duration-300 fixed h-full z-10 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
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

        {/* User section */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="text-sm truncate">{user?.email}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-white hover:bg-gray-700"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
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
              {activeTab === 'scenario' ? 'Scenario Analysis' : 
               activeTab === 'home' ? 'Home' : 
               activeTab === 'data' ? 'Data Upload' :
               activeTab === 'analytics' ? 'Analytics' :
               activeTab === 'budget' ? 'Budget Management' :
               activeTab === 'assistant' ? 'AI Assistant' : activeTab}
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
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
};

export default Dashboard;
