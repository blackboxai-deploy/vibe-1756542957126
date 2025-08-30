```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface KPIData {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  aovGrowth: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  estimatedTime?: number;
  createdAt: string;
  updatedAt: string;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

const mockKPIData: KPIData = {
  totalRevenue: 45280.50,
  totalOrders: 1247,
  activeCustomers: 892,
  averageOrderValue: 36.32,
  revenueGrowth: 12.5,
  ordersGrowth: 8.3,
  customersGrowth: 15.2,
  aovGrowth: 4.1
};

const mockSalesData: SalesData[] = Array.from({ length: 30 }, (_, i) => {
  const date = format(subDays(new Date(), 29 - i), 'MMM dd');
  return {
    date,
    revenue: Math.floor(Math.random() * 2000) + 800,
    orders: Math.floor(Math.random() * 50) + 20
  };
});

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    items: [
      { name: 'Margherita Pizza', quantity: 1, price: 18.99 },
      { name: 'Caesar Salad', quantity: 1, price: 12.99 }
    ],
    total: 31.98,
    status: 'preparing',
    paymentStatus: 'paid',
    orderType: 'dine-in',
    tableNumber: 'T-05',
    estimatedTime: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerName: 'Jane Smith',
    customerPhone: '+1234567891',
    items: [
      { name: 'Chicken Burger', quantity: 2, price: 15.99 },
      { name: 'French Fries', quantity: 1, price: 6.99 }
    ],
    total: 38.97,
    status: 'ready',
    paymentStatus: 'paid',
    orderType: 'takeaway',
    estimatedTime: 5,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    customerName: 'Mike Johnson',
    customerPhone: '+1234567892',
    items: [
      { name: 'Pasta Carbonara', quantity: 1, price: 22.99 },
      { name: 'Garlic Bread', quantity: 1, price: 8.99 }
    ],
    total: 31.98,
    status: 'confirmed',
    paymentStatus: 'paid',
    orderType: 'delivery',
    estimatedTime: 25,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'confirmed': return 'bg-blue-100 text-blue-800';
    case 'preparing': return 'bg-orange-100 text-orange-800';
    case 'ready': return 'bg-green-100 text-green-800';
    case 'delivered': return 'bg-gray-100 text-gray-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: Order['status']) => {
  switch (status) {
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'confirmed': return <CheckCircle className="h-4 w-4" />;
    case 'preparing': return <Clock className="h-4 w-4" />;
    case 'ready': return <CheckCircle className="h-4 w-4" />;
    case 'delivered': return <CheckCircle className="h-4 w-4" />;
    case 'cancelled': return <AlertCircle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

export default function OwnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [kpiData, setKpiData] = useState<KPIData>(mockKPIData);
  const [salesData, setSalesData] = useState<SalesData[]>(mockSalesData);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchDashboardData();
  }, [session, status, router, selectedTimeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // In production, these would be actual API calls
      // const kpiResponse = await fetch('/api/owner/kpis');
      // const salesResponse = await fetch('/api/owner/sales');
      // const ordersResponse = await fetch('/api/owner/orders');
      
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      setKpiData(mockKPIData);
      setSalesData(mockSalesData);
      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderAction = async (orderId: string, action: string) => {
    try {
      // In production: await fetch(`/api/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify({ action }) });
      console.log(`Performing ${action} on order ${orderId}`);
      
      // Update local state for demo
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: action as Order['status'], updatedAt: new Date().toISOString() }
          : order
      ));
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push('/owner/menu')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${kpiData.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`inline-flex items-center ${kpiData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {kpiData.revenueGrowth > 0 ? '+' : ''}{kpiData.revenueGrowth}%
                  </span>
                  {' '}from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.totalOrders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`inline-flex items-center ${kpiData.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {kpiData.ordersGrowth > 0 ? '+' : ''}{kpiData.ordersGrowth}%
                  </span>
                  {' '}from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.activeCustomers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`inline-flex items-center ${kpiData.customersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {kpiData.customersGrowth > 0 ? '+' : ''}{kpiData.customersGrowth}%
                  </span>
                  {' '}from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${kpiData.averageOrderValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`inline-flex items-center ${kpiData.aovGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {kpiData.aovGrowth > 0 ? '+' : ''}{kpiData.aovGrowth}%
                  </span>
                  {' '}from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Chart */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Daily revenue for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`$${value}`, 'Revenue']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from your restaurant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <div>
                            <p className="text-sm font-medium">{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{order.customerName}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${order.total.toFixed(2)}</p>
                        <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>Manage and track all orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <p key={index} className="text-sm">
                              {item.quantity}x {item.name}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.orderType}</Badge>
                        {order.tableNumber && (
                          <p className="text-xs text-muted-foreground mt-1">{order.tableNumber}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        {order.estimatedTime && (
                          <p className="text-sm">{order.estimatedTime} min</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), 'HH:mm')}
                        </p>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOrderAction(order.id, 'confirmed')}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOrderAction(order.id, 'preparing')}>
                              <Clock className="mr-2 h-4 w-4" />
                              Start Preparing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOrderAction(order.id, 'ready')}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Ready
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/owner/orders/${order.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Orders by Day</CardTitle>
                <CardDescription>Number of orders per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Order Completion Rate</span>
                  <span className="text-sm text-green-600">94.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Prep Time</span>
                  <span className="text-sm">18 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                  <span className="text-sm text-green-600">4.7/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Peak Hours</span>
                  <span className="text-sm">12:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Most Popular Item</span>
                  <span className="text-sm">Margherita Pizza</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```