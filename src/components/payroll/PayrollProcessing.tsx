import React, { useState } from 'react';
import { Calendar, DollarSign, Users, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEmployees } from '@/hooks/useEmployees';

const PayrollProcessing = () => {
  const { employees } = useEmployees();
  const [isProcessing, setIsProcessing] = useState(false);

  const activeEmployees = employees.filter(emp => emp.is_active);
  const totalPayroll = activeEmployees.reduce((sum, emp) => sum + emp.base_salary, 0);

  const handleProcessPayroll = async () => {
    setIsProcessing(true);
    // Simulate payroll processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for payroll
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Monthly total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payroll</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25th</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Process Payroll</CardTitle>
          <CardDescription>
            Run payroll for all active employees for the current month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Monthly Payroll Run</h3>
              <p className="text-sm text-muted-foreground">
                Process salaries for {activeEmployees.length} employees
              </p>
            </div>
            <Button 
              onClick={handleProcessPayroll}
              disabled={isProcessing || activeEmployees.length === 0}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Run Payroll'}
            </Button>
          </div>

          {activeEmployees.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Employees</h3>
              <p className="text-muted-foreground">
                Add employees to start processing payroll
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {activeEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Summary</CardTitle>
            <CardDescription>
              Overview of employees included in payroll
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {employee.employee_id} • {employee.position || 'No position'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₦{employee.base_salary.toLocaleString()}</p>
                    <Badge variant="secondary" className="text-xs">
                      {employee.salary_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PayrollProcessing;