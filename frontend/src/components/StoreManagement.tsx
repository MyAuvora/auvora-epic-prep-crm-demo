import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Bell, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Product {
  product_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
  available: boolean;
  stock_quantity: number;
}

interface StoreNotification {
  notification_id: string;
  order_id: string;
  campus_id: string;
  staff_id: string;
  family_name: string;
  items: Array<{ product_id: string; product_name: string; quantity: number; price: number }>;
  total_amount: number;
  order_date: string;
  status: string;
  acknowledged_at: string | null;
}

interface StoreManagementProps {
  campusId?: string;
}

export const StoreManagement: React.FC<StoreManagementProps> = ({ campusId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'Apparel',
    price: '',
    stock_quantity: '100',
    available: true
  });

  useEffect(() => {
    fetchProducts();
    fetchNotifications();
  }, [campusId]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (campusId) params.append('campus_id', campusId);
      const response = await fetch(`${API_URL}/api/store-notifications?${params}`);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleSaveProduct = async () => {
    try {
      const productData = {
        product_id: editingProduct?.product_id || `prod_${Date.now()}`,
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: parseFloat(productForm.price) || 0,
        image_url: null,
        available: productForm.available,
        stock_quantity: parseInt(productForm.stock_quantity) || 0
      };

      if (editingProduct) {
        await fetch(`${API_URL}/api/products/${editingProduct.product_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      } else {
        await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      }
      fetchProducts();
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await fetch(`${API_URL}/api/products/${productId}`, { method: 'DELETE' });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleNotificationAction = async (notificationId: string, status: string) => {
    try {
      await fetch(`${API_URL}/api/store-notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', category: 'Apparel', price: '', stock_quantity: '100', available: true });
    setShowProductModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      available: product.available
    });
    setShowProductModal(true);
  };

  const closeModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const pendingNotifications = notifications.filter(n => n.status === 'pending');
  const completedNotifications = notifications.filter(n => n.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders" className="relative">
            Incoming Orders
            {pendingNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingNotifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <div className="space-y-4">
            {pendingNotifications.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  Pending Orders to Prep ({pendingNotifications.length})
                </h3>
                <div className="space-y-3">
                  {pendingNotifications.map(notification => (
                    <Card key={notification.notification_id} className="border-orange-200 bg-orange-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-orange-100 text-orange-800">New Order</Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(notification.order_date).toLocaleDateString()} at{' '}
                                {new Date(notification.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900">{notification.family_name}</p>
                            <div className="space-y-1">
                              {notification.items.map((item, idx) => (
                                <p key={idx} className="text-sm text-gray-600">
                                  {item.quantity}x {item.product_name} — ${(item.price * item.quantity).toFixed(2)}
                                </p>
                              ))}
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              Total: ${notification.total_amount.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleNotificationAction(notification.notification_id, 'acknowledged')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleNotificationAction(notification.notification_id, 'fulfilled')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Fulfilled
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {completedNotifications.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Completed Orders ({completedNotifications.length})
                </h3>
                <div className="space-y-3">
                  {completedNotifications.slice(0, 10).map(notification => (
                    <Card key={notification.notification_id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={notification.status === 'fulfilled' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                                {notification.status === 'fulfilled' ? 'Fulfilled' : 'Acknowledged'}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(notification.order_date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900 mt-1">{notification.family_name}</p>
                            <p className="text-sm text-gray-500">
                              {notification.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900">${notification.total_amount.toFixed(2)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {notifications.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No store orders yet</p>
                <p className="text-sm">Orders from parents will appear here for you to prepare.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Products ({products.length})</h3>
              <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            <div className="grid gap-4">
              {products.map(product => (
                <Card key={product.product_id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <Badge className={product.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {product.available ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">{product.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm font-medium text-gray-900">${product.price.toFixed(2)}</span>
                          <span className={`text-sm flex items-center gap-1 ${product.stock_quantity <= 10 ? 'text-red-600' : 'text-gray-600'}`}>
                            {product.stock_quantity <= 10 && <AlertTriangle className="w-3 h-3" />}
                            Stock: {product.stock_quantity}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(product)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteProduct(product.product_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No products yet</p>
                <p className="text-sm">Add products to your store for parents to purchase.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                value={productForm.name}
                onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. School T-Shirt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={productForm.description}
                onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Brief product description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={productForm.category}
                  onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Apparel">Apparel</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Event Fee">Event Fee</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={productForm.stock_quantity}
                  onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.available}
                    onChange={e => setProductForm({ ...productForm, available: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Available for sale</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSaveProduct} className="bg-blue-600 hover:bg-blue-700">
                {editingProduct ? 'Save Changes' : 'Add Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
