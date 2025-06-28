import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, Check, X, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface APIConnection {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  icon?: string;
}

const APIConnections: React.FC = () => {
  const [connections, setConnections] = useState<APIConnection[]>([
    {
      id: '1',
      name: 'Paystack',
      type: 'payment',
      status: 'disconnected',
      icon: '💳'
    },
    {
      id: '2',
      name: 'Flutterwave',
      type: 'payment',
      status: 'connected',
      lastSync: '2024-01-15T10:00:00Z',
      icon: '🦋'
    },
    {
      id: '3',
      name: 'QuickBooks',
      type: 'accounting',
      status: 'disconnected',
      icon: '📊'
    }
  ]);

  const [selectedAPI, setSelectedAPI] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!selectedAPI || !apiKey) {
      toast({
        title: "Error",
        description: "Please select an API and enter your API key",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Simulate API connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnections(prev => 
        prev.map(conn => 
          conn.name.toLowerCase() === selectedAPI.toLowerCase() 
            ? { ...conn, status: 'connected' as const, lastSync: new Date().toISOString() }
            : conn
        )
      );

      toast({
        title: "Success",
        description: `Successfully connected to ${selectedAPI}`,
      });

      setSelectedAPI('');
      setApiKey('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to API",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, status: 'disconnected' as const, lastSync: undefined }
          : conn
      )
    );

    toast({
      title: "Success",
      description: "API disconnected successfully",
    });
  };

  const handleSync = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, lastSync: new Date().toISOString() }
          : conn
      )
    );

    toast({
      title: "Success",
      description: `Data synced from ${connection.name}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Add New Connection */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Link className="w-5 h-5 mr-2 text-green-400" />
            Connect New API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="api-select" className="text-gray-300">
                Select API Service
              </Label>
              <Select value={selectedAPI} onValueChange={setSelectedAPI}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an API service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paystack">Paystack</SelectItem>
                  <SelectItem value="flutterwave">Flutterwave</SelectItem>
                  <SelectItem value="quickbooks">QuickBooks</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="xero">Xero</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="api-key" className="text-gray-300">
                API Key / Token
              </Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
              />
            </div>
          </div>

          <Button 
            onClick={handleConnect}
            disabled={isConnecting || !selectedAPI || !apiKey}
            className="bg-green-600 hover:bg-green-700"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect API'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Connections */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">API Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{connection.icon}</div>
                  <div>
                    <h3 className="font-semibold text-white">{connection.name}</h3>
                    <p className="text-sm text-gray-400 capitalize">{connection.type} service</p>
                    {connection.lastSync && (
                      <p className="text-xs text-gray-500">
                        Last sync: {new Date(connection.lastSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={connection.status === 'connected' ? 'default' : 'destructive'}
                    className={connection.status === 'connected' ? 'bg-green-600' : 'bg-red-600'}
                  >
                    {connection.status === 'connected' ? (
                      <Check className="w-3 h-3 mr-1" />
                    ) : (
                      <X className="w-3 h-3 mr-1" />
                    )}
                    {connection.status}
                  </Badge>

                  {connection.status === 'connected' ? (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(connection.id)}
                      >
                        Sync Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(connection.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setSelectedAPI(connection.name.toLowerCase())}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIConnections;
