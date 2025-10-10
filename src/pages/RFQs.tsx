import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Package, DollarSign, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface RFQRequest {
  id: string;
  product_category: string;
  product_name: string;
  quantity: string;
  unit: string | null;
  description: string | null;
  required_by: string | null;
  budget_range: string | null;
  delivery_location: string | null;
  status: string;
  created_at: string;
  requester_id: string;
  target_business_id: string;
  profiles?: {
    full_name: string;
  };
  businesses?: {
    name_en: string;
    name_ar: string;
  };
}

interface RFQResponse {
  id: string;
  quoted_price: number;
  currency: string;
  unit_price: number | null;
  lead_time: string | null;
  validity_period: string | null;
  notes: string | null;
  created_at: string;
  business_id: string;
  businesses?: {
    name_en: string;
    name_ar: string;
  };
}

export default function RFQs() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [sentRequests, setSentRequests] = useState<RFQRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<RFQRequest[]>([]);
  const [sentQuotes, setSentQuotes] = useState<Record<string, RFQResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQRequest | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showQuotesDialog, setShowQuotesDialog] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState<RFQResponse[]>([]);
  const [responseForm, setResponseForm] = useState({
    quoted_price: '',
    unit_price: '',
    lead_time: '',
    validity_period: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadRFQs();
    }
  }, [user]);

  const loadRFQs = async () => {
    setLoading(true);

    // Load sent requests
    const { data: sent } = await supabase
      .from('rfq_requests')
      .select(`
        *,
        businesses!target_business_id (name_en, name_ar)
      `)
      .eq('requester_id', user?.id)
      .order('created_at', { ascending: false });

    // Load quotes for sent requests
    if (sent && sent.length > 0) {
      const sentIds = sent.map(r => r.id);
      const { data: quotes } = await supabase
        .from('rfq_responses')
        .select(`
          *,
          businesses (name_en, name_ar)
        `)
        .in('rfq_request_id', sentIds);

      const quotesMap: Record<string, RFQResponse[]> = {};
      quotes?.forEach((quote: any) => {
        if (!quotesMap[quote.rfq_request_id]) {
          quotesMap[quote.rfq_request_id] = [];
        }
        quotesMap[quote.rfq_request_id].push(quote);
      });
      setSentQuotes(quotesMap);
    }

    // Load received requests (for user's businesses)
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user?.id);

    const businessIds = businesses?.map(b => b.id) || [];

    const { data: received } = await supabase
      .from('rfq_requests')
      .select(`
        *,
        profiles!requester_id (full_name)
      `)
      .in('target_business_id', businessIds)
      .order('created_at', { ascending: false});

    setSentRequests(sent as any || []);
    setReceivedRequests(received as any || []);
    setLoading(false);
  };

  const handleRespondToRFQ = async (rfqId: string) => {
    const rfq = receivedRequests.find(r => r.id === rfqId);
    if (!rfq) return;

    setSelectedRFQ(rfq);
    setShowResponseDialog(true);
  };

  const submitResponse = async () => {
    if (!selectedRFQ) return;

    const { error } = await supabase.from('rfq_responses').insert({
      rfq_request_id: selectedRFQ.id,
      business_id: selectedRFQ.target_business_id,
      quoted_price: parseFloat(responseForm.quoted_price),
      unit_price: responseForm.unit_price ? parseFloat(responseForm.unit_price) : null,
      lead_time: responseForm.lead_time,
      validity_period: responseForm.validity_period,
      notes: responseForm.notes,
    });

    if (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إرسال الرد' : 'Failed to send response',
        variant: 'destructive',
      });
      return;
    }

    // Update RFQ status
    await supabase
      .from('rfq_requests')
      .update({ status: 'quoted' })
      .eq('id', selectedRFQ.id);

    toast({
      title: language === 'ar' ? 'تم الإرسال' : 'Sent',
      description: language === 'ar' ? 'تم إرسال عرض السعر بنجاح' : 'Quote sent successfully',
    });

    setShowResponseDialog(false);
    setResponseForm({
      quoted_price: '',
      unit_price: '',
      lead_time: '',
      validity_period: '',
      notes: '',
    });
    loadRFQs();
  };

  const viewQuotes = (rfqId: string) => {
    const quotes = sentQuotes[rfqId] || [];
    setSelectedQuotes(quotes);
    setSelectedRFQ(sentRequests.find(r => r.id === rfqId) || null);
    setShowQuotesDialog(true);
  };

  const acceptQuote = async (quote: RFQResponse) => {
    if (!selectedRFQ) return;

    // Generate order number
    const { data: orderNumber } = await supabase.rpc('generate_order_number');

    // Create order
    const { error } = await supabase.from('orders').insert({
      rfq_request_id: selectedRFQ.id,
      rfq_response_id: quote.id,
      buyer_id: user?.id,
      seller_business_id: quote.business_id,
      order_number: orderNumber,
      product_name: selectedRFQ.product_name,
      product_category: selectedRFQ.product_category,
      quantity: selectedRFQ.quantity,
      unit: selectedRFQ.unit,
      agreed_price: quote.quoted_price,
      currency: quote.currency,
      delivery_location: selectedRFQ.delivery_location || '',
      payment_terms: quote.validity_period,
    });

    if (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إنشاء الطلب' : 'Failed to create order',
        variant: 'destructive',
      });
      return;
    }

    // Update RFQ status
    await supabase
      .from('rfq_requests')
      .update({ status: 'accepted' })
      .eq('id', selectedRFQ.id);

    toast({
      title: language === 'ar' ? 'تم القبول' : 'Accepted',
      description: language === 'ar' ? 'تم قبول العرض وإنشاء الطلب' : 'Quote accepted and order created',
    });

    setShowQuotesDialog(false);
    loadRFQs();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      quoted: 'default',
      accepted: 'default',
      rejected: 'destructive',
      expired: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const RFQCard = ({ rfq, isSent }: { rfq: RFQRequest; isSent: boolean }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {rfq.product_name}
            </CardTitle>
            <CardDescription className="mt-1">
              {isSent
                ? (language === 'ar' ? `إلى: ${rfq.businesses?.name_ar}` : `To: ${rfq.businesses?.name_en}`)
                : (language === 'ar' ? `من: ${rfq.profiles?.full_name}` : `From: ${rfq.profiles?.full_name}`)}
            </CardDescription>
          </div>
          {getStatusBadge(rfq.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span>
              {rfq.quantity} {rfq.unit || 'units'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span>{rfq.product_category}</span>
          </div>
          {rfq.required_by && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{format(new Date(rfq.required_by), 'MMM dd, yyyy')}</span>
            </div>
          )}
          {rfq.delivery_location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{rfq.delivery_location}</span>
            </div>
          )}
        </div>

        {rfq.budget_range && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span>{language === 'ar' ? 'الميزانية:' : 'Budget:'} {rfq.budget_range}</span>
          </div>
        )}

        {rfq.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{rfq.description}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {format(new Date(rfq.created_at), 'MMM dd, yyyy HH:mm')}
        </div>

        {!isSent && rfq.status === 'pending' && (
          <Button onClick={() => handleRespondToRFQ(rfq.id)} className="w-full">
            {language === 'ar' ? 'الرد بعرض سعر' : 'Respond with Quote'}
          </Button>
        )}

        {isSent && sentQuotes[rfq.id] && sentQuotes[rfq.id].length > 0 && (
          <Button onClick={() => viewQuotes(rfq.id)} variant="outline" className="w-full">
            {language === 'ar' ? `عرض العروض (${sentQuotes[rfq.id].length})` : `View Quotes (${sentQuotes[rfq.id].length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'ar' ? 'طلبات عروض الأسعار' : 'Request for Quotes'}
      </h1>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">
            {language === 'ar' ? 'الطلبات الواردة' : 'Received Requests'} ({receivedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            {language === 'ar' ? 'الطلبات المرسلة' : 'Sent Requests'} ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {language === 'ar' ? 'لا توجد طلبات واردة' : 'No received requests'}
              </CardContent>
            </Card>
          ) : (
            receivedRequests.map(rfq => <RFQCard key={rfq.id} rfq={rfq} isSent={false} />)
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {language === 'ar' ? 'لا توجد طلبات مرسلة' : 'No sent requests'}
              </CardContent>
            </Card>
          ) : (
            sentRequests.map(rfq => <RFQCard key={rfq.id} rfq={rfq} isSent={true} />)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'الرد بعرض سعر' : 'Respond with Quote'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'السعر الإجمالي' : 'Total Quoted Price'} *</Label>
                <Input
                  type="number"
                  value={responseForm.quoted_price}
                  onChange={(e) => setResponseForm(prev => ({ ...prev, quoted_price: e.target.value }))}
                  placeholder="10000"
                  required
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</Label>
                <Input
                  type="number"
                  value={responseForm.unit_price}
                  onChange={(e) => setResponseForm(prev => ({ ...prev, unit_price: e.target.value }))}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'مدة التسليم' : 'Lead Time'}</Label>
                <Input
                  value={responseForm.lead_time}
                  onChange={(e) => setResponseForm(prev => ({ ...prev, lead_time: e.target.value }))}
                  placeholder={language === 'ar' ? 'مثال: 7-14 يوم' : 'e.g., 7-14 days'}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'فترة الصلاحية' : 'Validity Period'}</Label>
                <Input
                  value={responseForm.validity_period}
                  onChange={(e) => setResponseForm(prev => ({ ...prev, validity_period: e.target.value }))}
                  placeholder={language === 'ar' ? 'مثال: 30 يوماً' : 'e.g., 30 days'}
                />
              </div>
            </div>

            <div>
              <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea
                value={responseForm.notes}
                onChange={(e) => setResponseForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={language === 'ar' ? 'أي تفاصيل إضافية...' : 'Any additional details...'}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={submitResponse}>
                {language === 'ar' ? 'إرسال عرض السعر' : 'Send Quote'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showQuotesDialog} onOpenChange={setShowQuotesDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'العروض المستلمة' : 'Received Quotes'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedQuotes.map((quote) => (
              <Card key={quote.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? quote.businesses?.name_ar : quote.businesses?.name_en}
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(quote.created_at), 'MMM dd, yyyy HH:mm')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'السعر الإجمالي' : 'Total Price'}</p>
                      <p className="text-lg font-semibold">{quote.quoted_price} {quote.currency}</p>
                    </div>
                    {quote.unit_price && (
                      <div>
                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</p>
                        <p className="text-lg font-semibold">{quote.unit_price} {quote.currency}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {quote.lead_time && (
                      <div>
                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مدة التسليم' : 'Lead Time'}</p>
                        <p className="font-medium">{quote.lead_time}</p>
                      </div>
                    )}
                    {quote.validity_period && (
                      <div>
                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'فترة الصلاحية' : 'Validity'}</p>
                        <p className="font-medium">{quote.validity_period}</p>
                      </div>
                    )}
                  </div>

                  {quote.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? 'ملاحظات' : 'Notes'}</p>
                      <p className="text-sm">{quote.notes}</p>
                    </div>
                  )}

                  <Button onClick={() => acceptQuote(quote)} className="w-full">
                    {language === 'ar' ? 'قبول العرض' : 'Accept Quote'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}