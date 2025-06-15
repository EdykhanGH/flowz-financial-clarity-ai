export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' }
];

export const defaultExpenseTypes = [
  'income',
  'expense',
  'transfer',
  'investment',
  'refund'
];

export const budgetAlerts = [
  {
    department: 'Marketing',
    message: '85% budget utilized',
    action: 'Consider budget reallocation for Q4 campaigns',
    severity: 'medium' as const
  },
  {
    department: 'IT',
    message: '120% budget exceeded',
    action: 'Immediate review required for infrastructure costs',
    severity: 'high' as const
  },
  {
    department: 'Operations',
    message: '65% budget utilized',
    action: 'On track for quarterly targets',
    severity: 'low' as const
  }
];

export const budgetTemplates = [
  {
    name: 'Operating Budget',
    description: 'Day-to-day operational expenses',
    icon: () => null,
    color: 'bg-blue-100'
  },
  {
    name: 'Capital Budget',
    description: 'Long-term investments and assets',
    icon: () => null,
    color: 'bg-green-100'
  },
  {
    name: 'Cash Flow Budget',
    description: 'Cash inflows and outflows',
    icon: () => null,
    color: 'bg-orange-100'
  },
  {
    name: 'Project Budget',
    description: 'Specific project allocations',
    icon: () => null,
    color: 'bg-purple-100'
  }
];

export const budgetData = [
  { month: 'Jan', budgeted: 300000, actual: 285000 },
  { month: 'Feb', budgeted: 320000, actual: 310000 },
  { month: 'Mar', budgeted: 350000, actual: 365000 },
  { month: 'Apr', budgeted: 340000, actual: 330000 },
  { month: 'May', budgeted: 360000, actual: 355000 },
  { month: 'Jun', budgeted: 380000, actual: 375000 }
];

export const departmentSpending = [
  { department: 'Sales', budgeted: 500000, actual: 475000, utilization: 95 },
  { department: 'Marketing', budgeted: 300000, actual: 255000, utilization: 85 },
  { department: 'Operations', budgeted: 400000, actual: 260000, utilization: 65 },
  { department: 'IT', budgeted: 200000, actual: 240000, utilization: 120 },
  { department: 'HR', budgeted: 150000, actual: 135000, utilization: 90 }
];
