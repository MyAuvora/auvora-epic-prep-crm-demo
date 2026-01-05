import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface PaymentMethod {
  payment_method_id: string;
  family_id: string;
  card_type: string;
  last_four: string;
  expiration_month: string;
  expiration_year: string;
  cardholder_name: string;
  is_default: boolean;
  billing_zip: string;
}

interface PaymentMethodStorageProps {
  familyId: string;
}

export const PaymentMethodStorage: React.FC<PaymentMethodStorageProps> = ({ familyId }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCard, setNewCard] = useState({
    card_number: '',
    cardholder_name: '',
    expiration_month: '',
    expiration_year: '',
    cvv: '',
    billing_zip: '',
    card_type: 'Visa'
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, [familyId]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payment-methods?family_id=${familyId}`);
      const data = await response.json();
      setPaymentMethods(data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    try {
      const lastFour = newCard.card_number.slice(-4);
      
      await fetch(`${API_URL}/api/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method_id: `pm_${Date.now()}`,
          family_id: familyId,
          card_type: newCard.card_type,
          last_four: lastFour,
          expiration_month: newCard.expiration_month,
          expiration_year: newCard.expiration_year,
          cardholder_name: newCard.cardholder_name,
          billing_zip: newCard.billing_zip,
          is_default: paymentMethods.length === 0
        })
      });
      
      setShowAddModal(false);
      setNewCard({
        card_number: '',
        cardholder_name: '',
        expiration_month: '',
        expiration_year: '',
        cvv: '',
        billing_zip: '',
        card_type: 'Visa'
      });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await fetch(`${API_URL}/api/payment-methods/${paymentMethodId}/set-default`, {
        method: 'PUT'
      });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  };

  const handleDeleteCard = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;
    
    try {
      await fetch(`${API_URL}/api/payment-methods/${paymentMethodId}`, {
        method: 'DELETE'
      });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  const getCardIcon = () => {
    return <CreditCard className="w-6 h-6" />;
  };

  const getCardColor = (cardType: string) => {
    const colors: Record<string, string> = {
      'Visa': 'from-blue-500 to-blue-600',
      'Mastercard': 'from-red-500 to-orange-500',
      'American Express': 'from-green-500 to-teal-500',
      'Discover': 'from-orange-500 to-amber-500'
    };
    return colors[cardType] || 'from-gray-500 to-gray-600';
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i);
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  if (loading) {
    return <div className="text-center py-8">Loading payment methods...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Payment Methods</h3>
          <p className="text-sm text-gray-600 mt-1">Manage your saved payment methods for extra expenses</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No payment methods saved</p>
            <Button onClick={() => setShowAddModal(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <Card key={method.payment_method_id} className="relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${getCardColor(method.card_type)} opacity-10`} />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getCardIcon()}
                    <div>
                      <CardTitle className="text-lg">{method.card_type}</CardTitle>
                      <CardDescription>•••• {method.last_four}</CardDescription>
                    </div>
                  </div>
                  {method.is_default && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Cardholder</p>
                    <p className="font-medium">{method.cardholder_name}</p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Expires</p>
                      <p className="font-medium">{method.expiration_month}/{method.expiration_year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ZIP</p>
                      <p className="font-medium">{method.billing_zip}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSetDefault(method.payment_method_id)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteCard(method.payment_method_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Card Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a debit or credit card for extra expenses and store purchases
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="card_type">Card Type</Label>
              <Select value={newCard.card_type} onValueChange={(value) => setNewCard({ ...newCard, card_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Visa">Visa</SelectItem>
                  <SelectItem value="Mastercard">Mastercard</SelectItem>
                  <SelectItem value="American Express">American Express</SelectItem>
                  <SelectItem value="Discover">Discover</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="card_number">Card Number</Label>
              <Input
                id="card_number"
                value={newCard.card_number}
                onChange={(e) => setNewCard({ ...newCard, card_number: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                placeholder="1234 5678 9012 3456"
                maxLength={16}
              />
            </div>

            <div>
              <Label htmlFor="cardholder_name">Cardholder Name</Label>
              <Input
                id="cardholder_name"
                value={newCard.cardholder_name}
                onChange={(e) => setNewCard({ ...newCard, cardholder_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expiration_month">Month</Label>
                <Select value={newCard.expiration_month} onValueChange={(value) => setNewCard({ ...newCard, expiration_month: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expiration_year">Year</Label>
                <Select value={newCard.expiration_year} onValueChange={(value) => setNewCard({ ...newCard, expiration_year: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="password"
                  value={newCard.cvv}
                  onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="billing_zip">Billing ZIP Code</Label>
              <Input
                id="billing_zip"
                value={newCard.billing_zip}
                onChange={(e) => setNewCard({ ...newCard, billing_zip: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                placeholder="12345"
                maxLength={5}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Secure:</strong> Your payment information is encrypted and stored securely.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCard}
              className="bg-red-600 hover:bg-red-700"
              disabled={
                !newCard.card_number || 
                newCard.card_number.length < 13 ||
                !newCard.cardholder_name ||
                !newCard.expiration_month ||
                !newCard.expiration_year ||
                !newCard.cvv ||
                !newCard.billing_zip
              }
            >
              Add Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
