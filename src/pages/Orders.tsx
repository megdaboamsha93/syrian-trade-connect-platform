import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Package, MapPin, DollarSign, Calendar, Building2, User, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  product_name: string;
  product_category: string;
  quantity: string;
  unit: string | null;
  agreed_price: number;
  currency: string;
  delivery_location: string;
  expected_delivery_date: string | null;
  payment_terms: string | null;
  notes: string | null;
  created_at: string;
  buyer_id: string;
  seller_business_id: string;
  profiles?: {
    full_name: string;
  };
  businesses?: {
    name_en: string;
    name_ar: string;
  };
}

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'in_production',
  'ready_to_ship',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
];

const PAYMENT_STATUSES = ['pending', 'deposit_paid', 'paid', 'refunded'];

export default function Orders() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);

    // Load orders as buyer
    const { data: buyerData } = await supabase
      .from('orders')
      .select(`
        *,
        businesses!seller_business_id (name_en, name_ar)
      `)
      .eq('buyer_id', user?.id)
      .order('created_at', { ascending: false });

    // Load orders as seller (for user's businesses)
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user?.id);

    const businessIds = businesses?.map(b => b.id) || [];

    const { data: sellerData } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!buyer_id (full_name)
      `)
      .in('seller_business_id', businessIds)
      .order('created_at', { ascending: false });

    setBuyerOrders(buyerData as any || []);
    setSellerOrders(sellerData as any || []);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);

    const updateData: any = { status: newStatus };
    
    if (newStatus === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
    } else if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (newStatus === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    setUpdatingStatus(false);

    if (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحديث الحالة' : 'Failed to update status',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: language === 'ar' ? 'تم التحديث' : 'Updated',
      description: language === 'ar' ? 'تم تحديث حالة الطلب بنجاح' : 'Order status updated successfully',
    });

    loadOrders();
    if (selectedOrder?.id === orderId) {
      setShowDetailsDialog(false);
    }
  };

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);

    const { error } = await supabase
      .from('orders')
      .update({ payment_status: newStatus })
      .eq('id', orderId);

    setUpdatingStatus(false);

    if (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحديث حالة الدفع' : 'Failed to update payment status',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: language === 'ar' ? 'تم التحديث' : 'Updated',
      description: language === 'ar' ? 'تم تحديث حالة الدفع بنجاح' : 'Payment status updated successfully',
    });

    loadOrders();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'secondary',
      confirmed: 'default',
      in_production: 'default',
      ready_to_ship: 'default',
      in_transit: 'default',
      delivered: 'default',
      completed: 'default',
      cancelled: 'destructive',
    };

    return (
      <Badge variant={colors[status] as any || 'secondary'}>
        {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'secondary',
      deposit_paid: 'default',
      paid: 'default',
      refunded: 'destructive',
    };

    return (
      <Badge variant={colors[status] as any || 'secondary'}>
        {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
      </Badge>
    );
  };

  const OrderCard = ({ order, isBuyer }: { order: Order; isBuyer: boolean }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
      setSelectedOrder(order);
      setShowDetailsDialog(true);
    }}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {order.product_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="font-mono text-xs">{order.order_number}</span>
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {getStatusBadge(order.status)}
            {getPaymentBadge(order.payment_status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          {isBuyer ? (
            <>
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span>{language === 'ar' ? order.businesses?.name_ar : order.businesses?.name_en}</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{order.profiles?.full_name}</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span>{order.quantity} {order.unit || 'units'}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{order.agreed_price} {order.currency}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{order.delivery_location}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {format(new Date(order.created_at), 'MMM dd, yyyy')}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="w-8 h-8" />
          {language === 'ar' ? 'الطلبات' : 'Orders'}
        </h1>
      </div>

      <Tabs defaultValue="buying" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buying">
            {language === 'ar' ? 'الشراء' : 'Buying'} ({buyerOrders.length})
          </TabsTrigger>
          <TabsTrigger value="selling">
            {language === 'ar' ? 'البيع' : 'Selling'} ({sellerOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buying" className="space-y-4">
          {buyerOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {language === 'ar' ? 'لا توجد طلبات شراء' : 'No purchase orders'}
              </CardContent>
            </Card>
          ) : (
            buyerOrders.map(order => <OrderCard key={order.id} order={order} isBuyer={true} />)
          )}
        </TabsContent>

        <TabsContent value="selling" className="space-y-4">
          {sellerOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {language === 'ar' ? 'لا توجد طلبات بيع' : 'No sales orders'}
              </CardContent>
            </Card>
          ) : (
            sellerOrders.map(order => <OrderCard key={order.id} order={order} isBuyer={false} />)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'رقم الطلب' : 'Order Number'}</p>
                  <p className="font-mono font-semibold">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'التاريخ' : 'Date'}</p>
                  <p className="font-semibold">{format(new Date(selectedOrder.created_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'حالة الدفع' : 'Payment Status'}</p>
                  {getPaymentBadge(selectedOrder.payment_status)}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المنتج' : 'Product'}</p>
                <p className="font-semibold text-lg">{selectedOrder.product_name}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.product_category}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الكمية' : 'Quantity'}</p>
                  <p className="font-semibold">{selectedOrder.quantity} {selectedOrder.unit || 'units'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'السعر' : 'Price'}</p>
                  <p className="font-semibold">{selectedOrder.agreed_price} {selectedOrder.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'موقع التسليم' : 'Delivery'}</p>
                  <p className="font-semibold">{selectedOrder.delivery_location}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'ملاحظات' : 'Notes'}</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{language === 'ar' ? 'تحديث الحالة' : 'Update Status'}</p>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{language === 'ar' ? 'تحديث حالة الدفع' : 'Update Payment Status'}</p>
                  <Select
                    value={selectedOrder.payment_status}
                    onValueChange={(value) => updatePaymentStatus(selectedOrder.id, value)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
