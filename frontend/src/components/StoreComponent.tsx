import React, { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, Package, CheckCircle, ArrowLeft, Trash2, CreditCard, Wallet, Shield, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Product {
  product_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
  available: boolean;
}

interface Order {
  order_id: string;
  family_id: string;
  parent_id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  total_amount: number;
  status: string;
  order_date: string;
  payment_date: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface StoreComponentProps {
  role: 'owner' | 'admin' | 'coach' | 'parent';
  familyId?: string;
  parentId?: string;
  userId?: string;
}

export const StoreComponent: React.FC<StoreComponentProps> = ({ role, familyId, parentId, userId: _userId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'card_on_file' | 'new_card' | 'venmo' | 'cashapp'>('card_on_file');
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    fetchProducts();
    if (familyId) {
      fetchOrders();
    }
  }, [familyId]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();
      setProducts(data.filter((p: Product) => p.available));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders?family_id=${familyId}`);
      const data = await response.json();
      setOrders(data.sort((a: Order, b: Order) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime()));
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.product_id === product.product_id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.product_id === product.product_id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.product_id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.product.product_id === productId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (!familyId || !parentId) return;

    try {
      const orderItems = cart.map(item => ({
        product_id: item.product.product_id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }));

      await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: `order_${Date.now()}`,
          family_id: familyId,
          parent_id: parentId,
          items: orderItems,
          total_amount: getCartTotal(),
          status: 'Pending',
          order_date: new Date().toISOString(),
          payment_date: null
        })
      });

      setCart([]);
      setOrderPlaced(true);
      setCardForm({ number: '', name: '', expiry: '', cvv: '' });
      setPaymentMethod('card_on_file');
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handlePayment = async (orderId: string) => {
    try {
      await fetch(`${API_URL}/api/orders/${orderId}?status=Paid`, {
        method: 'PUT',
      });
      fetchOrders();
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Apparel': 'bg-blue-100 text-blue-800',
      'Supplies': 'bg-green-100 text-green-800',
      'Event Fee': 'bg-purple-100 text-purple-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Other'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  if (loading) {
    return <div className="text-center py-8">Loading store...</div>;
  }

  // Full-page Cart View
  if (showCart && role === 'parent') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowCart(false)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Store
          </Button>
          <h2 className="text-2xl font-bold">Shopping Cart</h2>
        </div>

        {cart.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-400 mb-6">Add some items from the store to get started</p>
              <Button onClick={() => setShowCart(false)}>Continue Shopping</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <Card key={item.product.product_id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{item.product.name}</p>
                        <p className="text-sm text-gray-500">${item.product.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)}>-</Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button size="sm" variant="outline" onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}>+</Button>
                        </div>
                        <p className="font-bold w-24 text-right text-lg">${(item.product.price * item.quantity).toFixed(2)}</p>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => removeFromCart(item.product.product_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.product_id} className="flex justify-between text-sm">
                      <span>{item.product.name} x {item.quantity}</span>
                      <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-[#D4AF7A]">${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <Button className="w-full" size="lg" onClick={() => { setShowCart(false); setShowCheckout(true); }}>
                    Proceed to Checkout
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setShowCart(false)}>
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full-page Checkout View
  if (showCheckout && role === 'parent') {
    // Order confirmation screen
    if (orderPlaced) {
      return (
        <div className="max-w-lg mx-auto py-16 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Order Placed!</h2>
          <p className="text-gray-500">Your order has been submitted successfully. You can view it in your order history.</p>
          <Button size="lg" onClick={() => { setShowCheckout(false); setOrderPlaced(false); }}>
            Back to Store
          </Button>
        </div>
      );
    }

    const formatCardNumber = (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    const formatExpiry = (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
      return digits;
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setShowCheckout(false); setShowCart(true); }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Checkout</h2>
            <p className="text-sm text-gray-500">Complete your purchase securely</p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-0">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#0A2463] text-white flex items-center justify-center text-sm font-bold">1</div>
            <span className="ml-2 text-sm font-medium text-[#0A2463]">Review</span>
          </div>
          <div className="w-12 h-0.5 bg-[#0A2463] mx-2"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#0A2463] text-white flex items-center justify-center text-sm font-bold">2</div>
            <span className="ml-2 text-sm font-medium text-[#0A2463]">Payment</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
            <span className="ml-2 text-sm font-medium text-gray-500">Confirm</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items ({cart.reduce((t, i) => t + i.quantity, 0)})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {cart.map((item) => (
                    <div key={item.product.product_id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.product.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="font-bold text-lg">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
                <CardDescription>Choose how you'd like to pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Card on File */}
                <button
                  onClick={() => setPaymentMethod('card_on_file')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'card_on_file'
                      ? 'border-[#0A2463] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'card_on_file' ? 'border-[#0A2463]' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'card_on_file' && <div className="w-3 h-3 rounded-full bg-[#0A2463]"></div>}
                  </div>
                  <CreditCard className="w-6 h-6 text-gray-600" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">Card on File</p>
                    <p className="text-sm text-gray-500">Visa ending in •••• 4242</p>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Default</Badge>
                </button>

                {/* New Card */}
                <button
                  onClick={() => setPaymentMethod('new_card')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'new_card'
                      ? 'border-[#0A2463] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'new_card' ? 'border-[#0A2463]' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'new_card' && <div className="w-3 h-3 rounded-full bg-[#0A2463]"></div>}
                  </div>
                  <CreditCard className="w-6 h-6 text-gray-600" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">Enter New Card</p>
                    <p className="text-sm text-gray-500">Pay with a different credit or debit card</p>
                  </div>
                </button>

                {/* New card form */}
                {paymentMethod === 'new_card' && (
                  <div className="ml-9 pl-4 border-l-2 border-[#0A2463] space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardForm.number}
                          onChange={(e) => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2463] focus:border-transparent outline-none"
                          maxLength={19}
                        />
                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="John Smith"
                        value={cardForm.name}
                        onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2463] focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiration</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardForm.expiry}
                          onChange={(e) => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2463] focus:border-transparent outline-none"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="123"
                            value={cardForm.cvv}
                            onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2463] focus:border-transparent outline-none"
                            maxLength={4}
                          />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Venmo */}
                <button
                  onClick={() => setPaymentMethod('venmo')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'venmo'
                      ? 'border-[#008CFF] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'venmo' ? 'border-[#008CFF]' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'venmo' && <div className="w-3 h-3 rounded-full bg-[#008CFF]"></div>}
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center">
                    <span className="text-[#008CFF] font-bold text-lg">V</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Venmo</p>
                    <p className="text-sm text-gray-500">Pay securely with your Venmo account</p>
                  </div>
                </button>

                {/* Cash App */}
                <button
                  onClick={() => setPaymentMethod('cashapp')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'cashapp'
                      ? 'border-[#00D632] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'cashapp' ? 'border-[#00D632]' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'cashapp' && <div className="w-3 h-3 rounded-full bg-[#00D632]"></div>}
                  </div>
                  <Wallet className="w-6 h-6 text-[#00D632]" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">Cash App</p>
                    <p className="text-sm text-gray-500">Pay securely with Cash App</p>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.product_id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.product.name} × {item.quantity}</span>
                    <span className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Subtotal</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-3">
                    <span>Processing Fee</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-[#D4AF7A]">${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                  onClick={handleCheckout}
                  style={{
                    backgroundColor: paymentMethod === 'venmo' ? '#008CFF' :
                      paymentMethod === 'cashapp' ? '#00D632' : '#0A2463'
                  }}
                >
                  {paymentMethod === 'venmo' ? (
                    <>Pay with Venmo — ${getCartTotal().toFixed(2)}</>
                  ) : paymentMethod === 'cashapp' ? (
                    <>Pay with Cash App — ${getCartTotal().toFixed(2)}</>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Pay ${getCartTotal().toFixed(2)}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Secure checkout — your information is encrypted</span>
                </div>

                <Button variant="ghost" className="w-full text-gray-500" onClick={() => { setShowCheckout(false); setShowCart(true); }}>
                  ← Return to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {role === 'parent' && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">School Store</h2>
          <Button onClick={() => setShowCart(true)} variant="outline" className="relative">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart ({cart.length})
          </Button>
        </div>
      )}

      {(role === 'owner' || role === 'admin') && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Store Overview</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{products.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{orders.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{orders.filter(o => o.status === 'Pending').length}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Products</h2>
        {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
          <div key={category} className="mb-8">
            <h3 className="text-xl font-semibold mb-4">{category}</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {categoryProducts.map((product) => (
                <Card key={product.product_id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <Badge className={getCategoryColor(product.category)}>{product.category}</Badge>
                    </div>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-bold text-[#D4AF7A]">${product.price.toFixed(2)}</p>
                      {role === 'parent' && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {role === 'parent' && orders.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">My Orders</h2>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.order_id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Order #{order.order_id.split('_')[1]}</CardTitle>
                      <CardDescription>{formatDate(order.order_date)}</CardDescription>
                    </div>
                    <Badge variant={order.status === 'Paid' ? 'default' : 'outline'}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product_name} x {item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-[#D4AF7A]">${order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    {order.status === 'Pending' && (
                      <Button className="w-full mt-4" onClick={() => handlePayment(order.order_id)}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                    {order.status === 'Paid' && order.payment_date && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Paid on {formatDate(order.payment_date)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          {selectedProduct && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start mb-2">
                  <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                  <Badge className={getCategoryColor(selectedProduct.category)}>{selectedProduct.category}</Badge>
                </div>
                <DialogDescription>{selectedProduct.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-3xl font-bold text-[#D4AF7A]">${selectedProduct.price.toFixed(2)}</p>
                  {role === 'parent' && (
                    <Button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>
                      Add to Cart
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
