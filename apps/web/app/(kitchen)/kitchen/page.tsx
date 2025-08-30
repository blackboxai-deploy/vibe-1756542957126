'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Timer, 
  Users, 
  ChefHat,
  Bell,
  RefreshCw,
  Printer,
  Eye,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  modifiers: string[];
  specialInstructions?: string;
  allergens: string[];
  estimatedTime: number; // minutes
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

interface Order {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  items: OrderItem[];
  status: 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  acceptedAt?: string;
  estimatedCompletionTime?: string;
  totalEstimatedTime: number;
  specialRequests?: string;
  allergyWarnings: string[];
  driverAssigned?: {
    id: string;
    name: string;
    phone: string;
  };
}

interface KitchenStats {
  activeOrders: number;
  avgPrepTime: number;
  completedToday: number;
  pendingOrders: number;
  overdueOrders: number;
}

const ORDER_STATUS_COLORS = {
  new: 'bg-blue-500',
  accepted: 'bg-yellow-500',
  preparing: 'bg-orange-500',
  ready: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500'
};

const PRIORITY_COLORS = {
  low: 'border-gray-300',
  normal: 'border-blue-300',
  high: 'border-orange-300',
  urgent: 'border-red-500 animate-pulse'
};

export default function KitchenPanelPage() {
  const [selectedTab, setSelectedTab] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const queryClient = useQueryClient();

  // Fetch kitchen stats
  const { data: stats } = useQuery<KitchenStats>({
    queryKey: ['kitchen-stats'],
    queryFn: async () => {
      const response = await fetch('/api/kitchen/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['kitchen-orders', selectedTab],
    queryFn: async () => {
      const response = await fetch(`/api/kitchen/orders?status=${selectedTab}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, itemId }: { 
      orderId: string; 
      status: string; 
      itemId?: string;
    }) => {
      const response = await fetch(`/api/kitchen/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, itemId })
      });
      if (!response.ok) throw new Error('Failed to update order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-stats'] });
      toast({
        title: 'Order Updated',
        description: 'Order status has been updated successfully.'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update order status.',
        variant: 'destructive'
      });
    }
  });

  // Print order mutation
  const printOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/kitchen/orders/${orderId}/print`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to print order');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Order Printed',
        description: 'Order has been sent to kitchen printer.'
      });
    }
  });

  // Play notification sound for new orders
  useEffect(() => {
    if (soundEnabled && orders.some(order => order.status === 'new')) {
      const audio = new Audio('/sounds/kitchen-notification.mp3');
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    }
  }, [orders, soundEnabled]);

  const handleAcceptOrder = useCallback((orderId: string) => {
    updateOrderMutation.mutate({ orderId, status: 'accepted' });
  }, [updateOrderMutation]);

  const handleStartPreparing = useCallback((orderId: string) => {
    updateOrderMutation.mutate({ orderId, status: 'preparing' });
  }, [updateOrderMutation]);

  const handleMarkReady = useCallback((orderId: string) => {
    updateOrderMutation.mutate({ orderId, status: 'ready' });
  }, [updateOrderMutation]);

  const handleCompleteOrder = useCallback((orderId: string) => {
    updateOrderMutation.mutate({ orderId, status: 'completed' });
  }, [updateOrderMutation]);

  const handlePrintOrder = useCallback((orderId: string) => {
    printOrderMutation.mutate(orderId);
  }, [printOrderMutation]);

  const getOrderAge = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  };

  const isOrderOverdue = (order: Order) => {
    if (!order.estimatedCompletionTime) return false;
    return new Date() > new Date(order.estimatedCompletionTime);
  };

  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case 'new':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAcceptOrder(order.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePrintOrder(order.id)}
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        );
      case 'accepted':
        return (
          <Button
            size="sm"
            onClick={() => handleStartPreparing(order.id)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <ChefHat className="w-4 h-4 mr-1" />
            Start Preparing
          </Button>
        );
      case 'preparing':
        return (
          <Button
            size="sm"
            onClick={() => handleMarkReady(order.id)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Bell className="w-4 h-4 mr-1" />
            Mark Ready
          </Button>
        );
      case 'ready':
        return (
          <Button
            size="sm"
            onClick={() => handleCompleteOrder(order.id)}
            className="bg-gray-600 hover:bg-gray-700"
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            Complete
          </Button>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kitchen Panel</h1>
            <p className="text-gray-600">Manage orders and kitchen operations</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              <Bell className={cn("w-4 h-4", soundEnabled ? "text-green-600" : "text-gray-400")} />
              {soundEnabled ? "Sound On" : "Sound Off"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold">{stats.activeOrders}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Prep Time</p>
                  <p className="text-2xl font-bold">{stats.avgPrepTime}m</p>
                </div>
                <Timer className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold">{stats.completedToday}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                </div>
                <Users className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdueOrders}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="ready">Ready</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Orders</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className={cn(
                  "relative transition-all duration-200 hover:shadow-lg",
                  PRIORITY_COLORS[order.priority],
                  isOrderOverdue(order) && "border-red-500 bg-red-50",
                  selectedOrder === order.id && "ring-2 ring-blue-500"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Order #{order.orderNumber}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn("text-white", ORDER_STATUS_COLORS[order.status])}
                      >
                        {order.status.toUpperCase()}
                      </Badge>
                      {order.priority === 'urgent' && (
                        <Badge variant="destructive">URGENT</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{order.orderType.toUpperCase()}</span>
                    <span>{getOrderAge(order.createdAt)}</span>
                  </div>
                  {order.tableNumber && (
                    <div className="text-sm">
                      <span className="font-medium">Table: {order.tableNumber}</span>
                    </div>
                  )}
                  {order.customerName && (
                    <div className="text-sm">
                      <span className="font-medium">Customer: {order.customerName}</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <ScrollArea className="max-h-48">
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="border-l-4 border-gray-200 pl-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {item.quantity}x {item.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.estimatedTime}m
                            </Badge>
                          </div>
                          {item.modifiers.length > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              Modifiers: {item.modifiers.join(', ')}
                            </div>
                          )}
                          {item.specialInstructions && (
                            <div className="text-sm text-orange-600 mt-1 font-medium">
                              Note: {item.specialInstructions}
                            </div>
                          )}
                          {item.allergens.length > 0 && (
                            <div className="text-sm text-red-600 mt-1">
                              ⚠️ Allergens: {item.allergens.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Special Requests */}
                  {order.specialRequests && (
                    <div className="bg-yellow-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-yellow-800">Special Requests:</p>
                      <p className="text-sm text-yellow-700">{order.specialRequests}</p>
                    </div>
                  )}

                  {/* Allergy Warnings */}
                  {order.allergyWarnings.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-red-800">⚠️ Allergy Warnings:</p>
                      <p className="text-sm text-red-700">{order.allergyWarnings.join(', ')}</p>
                    </div>
                  )}

                  {/* Driver Info */}
                  {order.driverAssigned && order.orderType === 'delivery' && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-blue-800">Driver Assigned:</p>
                      <p className="text-sm text-blue-700">
                        {order.driverAssigned.name} - {order.driverAssigned.phone}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Estimated Completion Time */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Est. Total Time:</span>
                    <span className={cn(
                      "font-medium",
                      isOrderOverdue(order) ? "text-red-600" : "text-gray-900"
                    )}>
                      {order.totalEstimatedTime} minutes
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-2">
                    {getStatusActions(order)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(
                        selectedOrder === order.id ? null : order.id
                      )}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {selectedTab === 'active' 
                  ? "No active orders at the moment. New orders will appear here automatically."
                  : `No ${selectedTab} orders found.`
                }
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}