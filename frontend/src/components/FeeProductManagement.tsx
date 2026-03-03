import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Calendar, Package, Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Product {
  product_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  original_price?: number;
  image_url: string | null;
  available: boolean;
  available_from?: string;
  available_until?: string;
  is_fee?: boolean;
  fee_type?: string;
}

interface FeeProductManagementProps {
  campusId?: string | null;
}

export const FeeProductManagement: React.FC<FeeProductManagementProps> = ({ campusId: _campusId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Fee',
    price: '',
    original_price: '',
    available: true,
    available_from: '',
    available_until: '',
    is_fee: true,
    fee_type: 'enrollment'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const handleCreate = async () => {
    try {
      const newProduct: Product = {
        product_id: `product_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : undefined,
        image_url: null,
        available: formData.available,
        available_from: formData.available_from || undefined,
        available_until: formData.available_until || undefined,
        is_fee: formData.is_fee,
        fee_type: formData.is_fee ? formData.fee_type : undefined
      };

      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      if (response.ok) {
        await fetchProducts();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;

    try {
      const updatedProduct: Product = {
        ...selectedProduct,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : undefined,
        available: formData.available,
        available_from: formData.available_from || undefined,
        available_until: formData.available_until || undefined,
        is_fee: formData.is_fee,
        fee_type: formData.is_fee ? formData.fee_type : undefined
      };

      const response = await fetch(`${API_URL}/api/products/${selectedProduct.product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });

      if (response.ok) {
        await fetchProducts();
        setShowEditModal(false);
        setSelectedProduct(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${product.product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, available: !product.available })
      });

      if (response.ok) {
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      available: product.available,
      available_from: product.available_from || '',
      available_until: product.available_until || '',
      is_fee: product.is_fee || false,
      fee_type: product.fee_type || 'enrollment'
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Fee',
      price: '',
      original_price: '',
      available: true,
      available_from: '',
      available_until: '',
      is_fee: true,
      fee_type: 'enrollment'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Fee': 'bg-purple-100 text-purple-800',
      'Enrollment Fee': 'bg-blue-100 text-blue-800',
      'Registration Fee': 'bg-indigo-100 text-indigo-800',
      'Apparel': 'bg-green-100 text-green-800',
      'Supplies': 'bg-yellow-100 text-yellow-800',
      'Event Fee': 'bg-pink-100 text-pink-800',
      'Field Trip': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Other'];
  };

  const fees = products.filter(p => p.is_fee || p.category === 'Fee' || p.category === 'Enrollment Fee' || p.category === 'Registration Fee' || p.category === 'Event Fee' || p.category === 'Field Trip');
  const merchandise = products.filter(p => !p.is_fee && p.category !== 'Fee' && p.category !== 'Enrollment Fee' && p.category !== 'Registration Fee' && p.category !== 'Event Fee' && p.category !== 'Field Trip');

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fee & Product Management</h2>
          <p className="text-gray-500">Create and manage fees, enrollment charges, and store products</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-[#0A2463] hover:bg-[#163B9A]">
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Total Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{fees.length}</p>
            <p className="text-sm text-gray-500">{fees.filter(f => f.available).length} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{merchandise.length}</p>
            <p className="text-sm text-gray-500">{merchandise.filter(m => m.available).length} available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="w-5 h-5 text-orange-600" />
              Discounted Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{products.filter(p => p.original_price && p.original_price > p.price).length}</p>
            <p className="text-sm text-gray-500">Early bird / promotional</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Time-Limited
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{products.filter(p => p.available_from || p.available_until).length}</p>
            <p className="text-sm text-gray-500">With date restrictions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Fees & Charges
          </CardTitle>
          <CardDescription>Enrollment fees, registration fees, field trips, and other charges</CardDescription>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No fees created yet</p>
              <p className="text-sm">Click "Create New" to add enrollment fees, registration fees, etc.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Availability</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fees.map((fee) => (
                    <tr key={fee.product_id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium">{fee.name}</p>
                          <p className="text-sm text-gray-500">{fee.description}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={getCategoryColor(fee.category)}>{fee.category}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-bold text-lg">${fee.price.toFixed(2)}</p>
                          {fee.original_price && fee.original_price > fee.price && (
                            <p className="text-sm text-gray-500 line-through">${fee.original_price.toFixed(2)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {fee.available_from || fee.available_until ? (
                          <div>
                            {fee.available_from && <p>From: {new Date(fee.available_from).toLocaleDateString()}</p>}
                            {fee.available_until && <p>Until: {new Date(fee.available_until).toLocaleDateString()}</p>}
                          </div>
                        ) : (
                          <span className="text-gray-500">Always available</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={fee.available ? 'default' : 'secondary'}>
                          {fee.available ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditModal(fee)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleToggleAvailability(fee)}>
                            {fee.available ? 'Disable' : 'Enable'}
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(fee.product_id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Store Products
          </CardTitle>
          <CardDescription>Uniforms, supplies, and other merchandise</CardDescription>
        </CardHeader>
        <CardContent>
          {merchandise.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No products created yet</p>
              <p className="text-sm">Click "Create New" to add uniforms, supplies, etc.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {merchandise.map((product) => (
                <Card key={product.product_id} className={`${!product.available ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <Badge className={getCategoryColor(product.category)}>{product.category}</Badge>
                    </div>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
                        {product.original_price && product.original_price > product.price && (
                          <p className="text-sm text-gray-500 line-through">${product.original_price.toFixed(2)}</p>
                        )}
                      </div>
                      <Badge variant={product.available ? 'default' : 'secondary'}>
                        {product.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditModal(product)}>
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(product.product_id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Fee or Product</DialogTitle>
            <DialogDescription>Add a new fee, charge, or store product for families to pay</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                type="button"
                variant={formData.is_fee ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFormData({ ...formData, is_fee: true, category: 'Fee' })}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Fee / Charge
              </Button>
              <Button
                type="button"
                variant={!formData.is_fee ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFormData({ ...formData, is_fee: false, category: 'Apparel' })}
              >
                <Package className="w-4 h-4 mr-2" />
                Product
              </Button>
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={formData.is_fee ? "e.g., Early Bird Enrollment Fee" : "e.g., School Polo Shirt"}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the fee or product"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.is_fee ? (
                    <>
                      <SelectItem value="Enrollment Fee">Enrollment Fee</SelectItem>
                      <SelectItem value="Registration Fee">Registration Fee</SelectItem>
                      <SelectItem value="Event Fee">Event Fee</SelectItem>
                      <SelectItem value="Field Trip">Field Trip</SelectItem>
                      <SelectItem value="Fee">Other Fee</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Apparel">Apparel</SelectItem>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="original_price">Original Price (optional)</Label>
                <Input
                  id="original_price"
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  placeholder="For discounts"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="available_from">Available From (optional)</Label>
                <Input
                  id="available_from"
                  type="date"
                  value={formData.available_from}
                  onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="available_until">Available Until (optional)</Label>
                <Input
                  id="available_until"
                  type="date"
                  value={formData.available_until}
                  onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.price}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {formData.is_fee ? 'Fee' : 'Product'}</DialogTitle>
            <DialogDescription>Update the details for this item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enrollment Fee">Enrollment Fee</SelectItem>
                  <SelectItem value="Registration Fee">Registration Fee</SelectItem>
                  <SelectItem value="Event Fee">Event Fee</SelectItem>
                  <SelectItem value="Field Trip">Field Trip</SelectItem>
                  <SelectItem value="Fee">Other Fee</SelectItem>
                  <SelectItem value="Apparel">Apparel</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-original_price">Original Price (optional)</Label>
                <Input
                  id="edit-original_price"
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-available_from">Available From</Label>
                <Input
                  id="edit-available_from"
                  type="date"
                  value={formData.available_from}
                  onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-available_until">Available Until</Label>
                <Input
                  id="edit-available_until"
                  type="date"
                  value={formData.available_until}
                  onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedProduct(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!formData.name || !formData.price}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
