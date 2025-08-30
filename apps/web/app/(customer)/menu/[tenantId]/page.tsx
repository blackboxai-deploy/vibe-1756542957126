```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Search, 
  Filter, 
  Star,
  Clock,
  Utensils,
  AlertTriangle,
  MessageCircle,
  X,
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';

// Types
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  allergens: string[];
  dietary: string[];
  preparationTime: number;
  available: boolean;
  rating: number;
  reviewCount: number;
  calories?: number;
  spiceLevel?: number;
  tags: string[];
  modifiers: MenuModifier[];
}

interface MenuModifier {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: ModifierOption[];
}

interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  menuItemId: string;
  quantity: number;
  modifiers: { [modifierId: string]: string[] };
  specialInstructions?: string;
  price: number;
}

interface Tenant {
  id: string;
  name: string;
  logo: string;
  currency: string;
  locale: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  settings: {
    enableAIChat: boolean;
    enableReviews: boolean;
    minimumOrder: number;
    deliveryFee: number;
    taxRate: number;
  };
}

// Validation schemas
const cartItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().min(1),
  modifiers: z.record(z.array(z.string())),
  specialInstructions: z.string().optional(),
});

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  orderType: z.enum(['dine-in', 'takeaway', 'delivery']),
  tableNumber: z.string().optional(),
  deliveryAddress: z.string().optional(),
  specialRequests: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CustomerMenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const tenantId = params.tenantId as string;
  const tableNumber = searchParams.get('table');
  
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemModifiers, setItemModifiers] = useState<{ [key: string]: string[] }>({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Forms
  const checkoutForm = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      orderType: tableNumber ? 'dine-in' : 'takeaway',
      tableNumber: tableNumber || '',
    },
  });

  // API calls
  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch tenant');
      return response.json() as Promise<Tenant>;
    },
  });

  const { data: menu, isLoading: menuLoading } = useQuery({
    queryKey: ['menu', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${tenantId}/menu`);
      if (!response.ok) throw new Error('Failed to fetch menu');
      return response.json() as Promise<MenuItem[]>;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch(`/api/tenants/${tenantId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Order placed successfully!',
        description: `Order #${data.orderNumber} has been sent to the kitchen.`,
      });
      setCart([]);
      setShowCheckout(false);
      router.push(`/order/${data.id}/tracking`);
    },
    onError: (error) => {
      toast({
        title: 'Order failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    },
  });

  // Computed values
  const categories = useMemo(() => {
    if (!menu) return [];
    const cats = Array.from(new Set(menu.map(item => item.category)));
    return ['all', ...cats];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    if (!menu) return [];
    
    return menu.filter(item => {
      // Search filter
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      
      // Dietary filters
      if (selectedFilters.length > 0) {
        const hasFilter = selectedFilters.some(filter => 
          item.dietary.includes(filter) || item.tags.includes(filter)
        );
        if (!hasFilter) return false;
      }
      
      return item.available;
    });
  }, [menu, searchQuery, selectedCategory, selectedFilters]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // Cart functions
  const addToCart = () => {
    if (!selectedItem) return;
    
    const modifierPrice = Object.entries(itemModifiers).reduce((total, [modifierId, optionIds]) => {
      const modifier = selectedItem.modifiers.find(m => m.id === modifierId);
      if (!modifier) return total;
      
      return total + optionIds.reduce((modTotal, optionId) => {
        const option = modifier.options.find(o => o.id === optionId);
        return modTotal + (option?.price || 0);
      }, 0);
    }, 0);

    const cartItem: CartItem = {
      menuItemId: selectedItem.id,
      quantity: itemQuantity,
      modifiers: itemModifiers,
      specialInstructions: specialInstructions || undefined,
      price: selectedItem.price + modifierPrice,
    };

    setCart(prev => [...prev, cartItem]);
    
    // Reset item selection
    setSelectedItem(null);
    setItemQuantity(1);
    setItemModifiers({});
    setSpecialInstructions('');
    
    toast({
      title: 'Added to cart',
      description: `${selectedItem.name} x${itemQuantity}`,
    });
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
    } else {
      setCart(prev => prev.map((item, i) => 
        i === index ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleCheckout = async (data: CheckoutFormData) => {
    if (cart.length === 0) return;
    
    const orderData = {
      tenantId,
      customerInfo: {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
      },
      orderType: data.orderType,
      tableNumber: data.tableNumber,
      deliveryAddress: data.deliveryAddress,
      items: cart,
      subtotal: cartTotal,
      tax: cartTotal * (tenant?.settings.taxRate || 0),
      deliveryFee: data.orderType === 'delivery' ? (tenant?.settings.deliveryFee || 0) : 0,
      specialRequests: data.specialRequests,
    };

    createOrderMutation.mutate(orderData);
  };

  if (tenantLoading || menuLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tenant || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
          <p className="text-muted-foreground">The restaurant you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src={tenant.logo}
                alt={tenant.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <h1 className="text-xl font-bold">{tenant.name}</h1>
                {tableNumber && (
                  <p className="text-sm text-muted-foreground">Table {tableNumber}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {tenant.settings.enableAIChat && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIChat(true)}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              )}
              
              <Sheet open={showCart} onOpenChange={setShowCart}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <ShoppingCart className="h-4 w-4" />
                    {cartItemCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Your Order</SheetTitle>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-4">
                    {cart.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Your cart is empty
                      </p>
                    ) : (
                      <>
                        <ScrollArea className="h-[400px]">
                          {cart.map((item, index) => {
                            const menuItem = menu.find(m => m.id === item.menuItemId);
                            if (!menuItem) return null;
                            
                            return (
                              <div key={index} className="flex items-center space-x-3 py-3 border-b">
                                <div className="flex-1">
                                  <h4 className="font-medium">{menuItem.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {tenant.currency}{item.price.toFixed(2)} each
                                  </p>
                                  {item.specialInstructions && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Note: {item.specialInstructions}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </ScrollArea>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{tenant.currency}{cartTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax</span>
                            <span>{tenant.currency}{(cartTotal * (tenant.settings.taxRate || 0)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>{tenant.currency}{(cartTotal * (1 + (tenant.settings.taxRate || 0))).toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <Button
                          className="w-full"
                          onClick={() => {
                            setShowCart(false);
                            setShowCheckout(true);
                          }}
                          disabled={cartTotal < tenant.settings.minimumOrder}
                        >
                          {cartTotal < tenant.settings.minimumOrder
                            ? `Minimum order ${tenant.currency}${tenant.settings.minimumOrder}`
                            : 'Proceed to Checkout'
                          }
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {selectedFilters.length > 0 && (
                  <Badge className="ml-2">{selectedFilters.length}</Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Menu</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Dietary Preferences</h4>
                  <div className="flex flex-wrap gap-2">
                    {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'halal'].map(filter => (
                      <Button
                        key={filter}
                        variant={selectedFilters.includes(filter) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSelectedFilters(prev =>
                            prev.includes(filter)
                              ? prev.filter(f => f !== filter)
                              : [...prev, filter]
                          );
                        }}
                      >
                        {filter}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Menu Items */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenu.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                <div className="relative">
                  {item.images.length > 0 && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    </div>
                  )}
                  
                  {item.spiceLevel && item.spiceLevel > 0 && (
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      {'🌶️'.repeat(item.spiceLevel)}
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <span className="font-bold text-primary">
                      {tenant.currency}{item.price.toFixed(2)}
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{item.preparationTime} min</span>
                      
                      {item.rating > 0 && (
                        <>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{item.rating.toFixed(1)} ({item.reviewCount})</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {item.allergens.length > 0 && (
                    <div className="flex items-center space-x-1 mb-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-muted-foreground">
                        Contains: {item.allergens.join(', ')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.dietary.map(diet => (
                      <Badge key={diet} variant="secondary" className="text-xs">
                        {diet}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={() => setSelectedItem(item)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {filteredMenu.length === 0 && (
          <div className="text-center py-12">
            <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {selectedItem.images.length > 0 && (
                  <div className="relative h-64 w-full">
                    <Image
                      src={selectedItem.images[0]}
                      alt={selectedItem.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div>
                  <p className="text-muted-foreground mb-4">{selectedItem.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{selectedItem.preparationTime} minutes</span>
                    </div>
                    
                    {selectedItem.calories && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{selectedItem.calories} cal</span>
                      </div>
                    )}
                    
                    {selectedItem.rating > 0 && (
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{selectedItem.rating.toFixed(1)} ({selectedItem.reviewCount} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedItem.allergens.length > 0 && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-800">Allergen Information</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      Contains: {selectedItem.allergens.join(', ')}
                    </p>
                  </div>
                )}
                
                {/* Modifiers */}
                {selectedItem.modifiers.map(modifier => (
                  <div key={modifier.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{modifier.name}</h4>
                      {modifier.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {modifier.options.map(option => (
                        <div key={option.id} className="flex items-center justify-between">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type={modifier.type === 'single' ? 'radio' : 'checkbox'}
                              name={modifier.id}
                              value={option.id}
                              checked={itemModifiers[modifier.id]?.includes(option.id) || false}
                              onChange={(e) => {
                                if (modifier.type === 'single') {
                                  setItemModifiers(prev => ({
                                    ...prev,
                                    [modifier.id]: e.target.checked ? [option.id] : []
                                  }));
                                } else {
                                  setItemModifiers(prev => {
                                    const current = prev[modifier.id] || [];
                                    return {
                                      ...prev,
                                      [modifier.id]: e.target.checked
                                        ? [...current, option.id]
                                        : current.filter(id => id !== option.id)
                                    };
                                  });
                                }
                              }}
                            />
                            <span>{option.name}</span>
                          </label>
                          
                          {option.price > 0 && (
                            <span className="text-sm text-muted-foreground">
                              +{tenant.currency}{option.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Special Instructions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Special Instructions</label>
                  <Textarea
                    placeholder="Any special requests or modifications..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={3}
                  />
                </div>
                
                {/* Quantity and Add to Cart */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">Quantity:</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{itemQuantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setItemQuantity(itemQuantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Button onClick={addToCart} className="px-8">
                    Add to Cart - {tenant.currency}{(selectedItem.price * itemQuantity).toFixed(2)}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={checkoutForm.handleSubmit(handleCheckout)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  {...checkoutForm.register('customerName')}
                  placeholder="Your full name"
                />
                {checkoutForm.formState.errors.customerName && (
                  <p className="text-sm text-red-600 mt-1">
                    {checkoutForm.formState.errors.customerName.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  {...checkoutForm.register('customerEmail')}
                  type="email"
                  placeholder="your@email.com"
                />
                {checkoutForm.formState.errors.customerEmail && (
                  <p className="text-sm text-red-600 mt-1">
                    {checkoutForm.formState.errors.customerEmail.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium">Phone *</label>
                <Input
                  {...checkoutForm.register('customerPhone')}
                  type="tel"
                  placeholder="Your phone number"
                />
                {checkoutForm.formState.errors.customerPhone && (
                  <p className="text-sm text-red-600 mt-1">
                    {checkoutForm.formState.errors.customerPhone.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium">Order Type *</label>
                <Select
                  value={checkoutForm.watch('orderType')}
                  onValueChange={(value) => checkoutForm.setValue('orderType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine-in">Dine In</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {checkoutForm.watch('orderType') === 'dine-in' && (
              <div>
                <label className="text-sm font-medium">Table Number</label>
                <Input
                  {...checkoutForm.register('tableNumber')}
                  placeholder="Table number"
                />
              </div>
            )}
            
            {checkoutForm.watch('orderType') === 'delivery' && (
              <div>
                <label className="text-sm font-medium">Delivery Address *</label>
                <Textarea
                  {...checkoutForm.register('deliveryAddress')}
                  placeholder="Full delivery address"
                  rows={3}
                />
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Special Requests</label>
              <Textarea
                {...checkoutForm.register('specialRequests')}
                placeholder="Any special requests for your order..."
                rows={3}
              />
            </div>
            
            {/* Order Summary */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{tenant.currency}{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{tenant.currency}{(cartTotal * (tenant.settings.taxRate || 0)).toFixed(2)}</span>
                </div>
                {checkoutForm.watch('orderType') === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{tenant.currency}{tenant.settings.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    {tenant.currency}
                    {(
                      cartTotal * (1 + (tenant.settings.taxRate || 0)) +
                      (checkoutForm.watch('orderType') === 'delivery' ? tenant.settings.deliveryFee : 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCheckout(false)}
              >
                Back to Cart
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Chat Modal */}
      {tenant.settings.enableAIChat && (
        <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
          <DialogContent className="max-w-md max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>AI Assistant</DialogTitle>
            </DialogHeader>
            
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                AI chat feature coming soon! Ask me about menu items, allergens, or recommendations.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Floating Cart Button (Mobile) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
          <Button
            onClick={() => setShowCart(true)}
            className="rounded-full h-14 w-14 shadow-lg"
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {cartItemCount}
              </Badge>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}
```