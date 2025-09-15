import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useRiskAssessment, RiskMetric, RiskAlert } from '@/hooks/useRiskAssessment';

const RiskDashboard: React.FC = () => {
  const riskAssessment = useRiskAssessment();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'current' | 'trend'>('current');

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-primary';
      case 'medium': return 'bg-secondary';
      case 'low': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const getRiskTextColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive-foreground';
      case 'high': return 'text-primary-foreground';
      case 'medium': return 'text-secondary-foreground';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return <Zap className="h-4 w-4 text-destructive" />;
      case 'this_week': return <AlertTriangle className="h-4 w-4 text-primary" />;
      case 'this_month': return <Clock className="h-4 w-4 text-secondary" />;
      default: return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const RiskMetricCard: React.FC<{ 
    title: string; 
    metric: RiskMetric; 
    icon: React.ElementType 
  }> = ({ title, metric, icon: Icon }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{metric.score}/100</div>
          <Badge 
            variant="outline" 
            className={`${getRiskColor(metric.level)} ${getRiskTextColor(metric.level)}`}
          >
            {metric.level.toUpperCase()}
          </Badge>
        </div>
        <Progress value={metric.score} className="h-2" />
        <div className="text-xs text-muted-foreground">
          {metric.description}
        </div>
        <div className="flex items-center gap-2">
          {metric.trend === 'deteriorating' ? (
            <TrendingDown className="h-3 w-3 text-destructive" />
          ) : metric.trend === 'improving' ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <div className="h-3 w-3 rounded-full bg-muted" />
          )}
          <span className="text-xs capitalize">{metric.trend}</span>
        </div>
      </CardContent>
    </Card>
  );

  const RiskAlertCard: React.FC<{ alert: RiskAlert }> = ({ alert }) => (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getUrgencyIcon(alert.urgency)}
            <CardTitle className="text-base">{alert.title}</CardTitle>
          </div>
          <Badge variant="outline" className={`${getRiskColor(alert.type)} ${getRiskTextColor(alert.type)}`}>
            {alert.type.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{alert.description}</p>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Impact</AlertTitle>
          <AlertDescription>{alert.impact}</AlertDescription>
        </Alert>
        <div className="space-y-2">
          <div className="text-sm font-medium">Recommended Actions:</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {alert.actions.map((action, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                {action}
              </li>
            ))}
          </ul>
        </div>
        {alert.estimatedCost && (
          <div className="text-sm">
            <span className="font-medium">Estimated Impact: </span>
            <span className="text-destructive">₦{alert.estimatedCost.toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Risk Assessment Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage business risks across key areas
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Badge variant="outline" className="text-xs">
            Last Updated: {riskAssessment.lastUpdated.toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* Overall Risk Score */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-xl">Overall Risk Score</CardTitle>
              <CardDescription>
                Composite risk assessment across all business areas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-4xl font-bold text-foreground">
              {riskAssessment.overallScore}/100
            </div>
            <div className="flex-1 space-y-2">
              <Progress value={riskAssessment.overallScore} className="h-4" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low Risk</span>
                <span>High Risk</span>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`text-lg px-4 py-2 ${
                riskAssessment.overallScore >= 70 ? 'bg-destructive text-destructive-foreground' :
                riskAssessment.overallScore >= 50 ? 'bg-primary text-primary-foreground' :
                riskAssessment.overallScore >= 30 ? 'bg-secondary text-secondary-foreground' :
                'bg-muted text-muted-foreground'
              }`}
            >
              {riskAssessment.overallScore >= 70 ? 'HIGH RISK' :
               riskAssessment.overallScore >= 50 ? 'MEDIUM RISK' :
               riskAssessment.overallScore >= 30 ? 'LOW RISK' : 'MINIMAL RISK'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Risk Overview</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Risk Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RiskMetricCard
              title="Credit Risk"
              metric={riskAssessment.creditRisk}
              icon={Users}
            />
            <RiskMetricCard
              title="Liquidity Risk"
              metric={riskAssessment.liquidityRisk}
              icon={DollarSign}
            />
            <RiskMetricCard
              title="Operational Risk"
              metric={riskAssessment.operationalRisk}
              icon={Building}
            />
            <RiskMetricCard
              title="Market Risk"
              metric={riskAssessment.marketRisk}
              icon={BarChart3}
            />
            <RiskMetricCard
              title="Compliance Risk"
              metric={riskAssessment.complianceRisk}
              icon={Shield}
            />
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Mitigation Quick Actions</CardTitle>
              <CardDescription>
                Immediate steps you can take to reduce your risk profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Review Customer Concentration</div>
                    <div className="text-sm text-muted-foreground">
                      Diversify customer base to reduce dependency risk
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Improve Cash Flow Management</div>
                    <div className="text-sm text-muted-foreground">
                      Optimize collection and payment cycles
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Compliance Audit</div>
                    <div className="text-sm text-muted-foreground">
                      Ensure all regulatory requirements are met
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Supplier Diversification</div>
                    <div className="text-sm text-muted-foreground">
                      Reduce operational dependency on key suppliers
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active Risk Alerts</h2>
            <Badge variant="outline">
              {riskAssessment.alerts.length} Active Alert{riskAssessment.alerts.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {riskAssessment.alerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <div className="text-lg font-medium">No Active Risk Alerts</div>
                  <div className="text-muted-foreground">
                    Your business is currently operating within acceptable risk parameters
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {riskAssessment.alerts.map((alert) => (
                <RiskAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Credit Risk Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Credit Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Risk Score</span>
                    <span className="font-medium">{riskAssessment.creditRisk.score}/100</span>
                  </div>
                  <Progress value={riskAssessment.creditRisk.score} />
                </div>
                <div className="text-sm text-muted-foreground">
                  {riskAssessment.creditRisk.impact}
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Key Recommendations:</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {riskAssessment.creditRisk.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-1 w-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Liquidity Risk Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Liquidity Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Risk Score</span>
                    <span className="font-medium">{riskAssessment.liquidityRisk.score}/100</span>
                  </div>
                  <Progress value={riskAssessment.liquidityRisk.score} />
                </div>
                <div className="text-sm text-muted-foreground">
                  {riskAssessment.liquidityRisk.impact}
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Key Recommendations:</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {riskAssessment.liquidityRisk.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-1 w-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskDashboard;