import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type RFQRequest = Database['public']['Tables']['rfq_requests']['Row'];

interface RFQResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfq: RFQRequest | null;
}

export function RFQResponseDialog({ open, onOpenChange, rfq }: RFQResponseDialogProps) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [form, setForm] = useState({
    quoted_price: '',
    unit_price: '',
    currency: 'USD',
    lead_time: '',
    validity_period: '',
    notes: '',
  });

  useEffect(() => {
    const loadBusinesses = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name_en, name_ar')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading businesses', error);
        toast.error('Failed to load your businesses');
        return;
      }

      const list = (data || []).map((b) => ({ id: b.id, name: language === 'ar' ? (b as any).name_ar : (b as any).name_en }));
      setBusinesses(list);
      if (list.length > 0) setSelectedBusiness(list[0].id);
    };

    if (open) {
      loadBusinesses();
    }
  }, [open, user, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('common.loginRequired'));
      return;
    }
    if (!rfq) return;
    if (!selectedBusiness) {
      toast.error(t('analytics.noBusinessFound'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('rfq_responses').insert({
        rfq_request_id: rfq.id,
        business_id: selectedBusiness,
        quoted_price: parseFloat(form.quoted_price),
        unit_price: form.unit_price ? parseFloat(form.unit_price) : null,
        currency: form.currency,
        lead_time: form.lead_time || null,
        validity_period: form.validity_period || null,
        notes: form.notes || null,
      });

      if (error) throw error;

      toast.success(language === 'ar' ? 'تم إرسال عرض السعر' : 'Quote sent successfully');
      onOpenChange(false);
      setForm({ quoted_price: '', unit_price: '', currency: 'USD', lead_time: '', validity_period: '', notes: '' });
    } catch (err) {
      console.error('Failed to send quote', err);
      toast.error(language === 'ar' ? 'فشل إرسال العرض' : 'Failed to send quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('rfq.sendQuote')}</DialogTitle>
        </DialogHeader>

        {!user ? (
          <div className="py-8 text-center text-muted-foreground">{t('common.loginRequired')}</div>
        ) : businesses.length === 0 ? (
          <div className="space-y-4 py-2">
            <p className="text-muted-foreground">{t('analytics.pleaseRegisterFirst')}</p>
            <Button onClick={() => (window.location.href = '/register-business')} className="w-full">
              {language === 'ar' ? 'تسجيل عمل جديد' : 'Register a Business'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'اختر العمل' : 'Select Business'}</Label>
              <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'السعر الإجمالي' : 'Total Quoted Price'} *</Label>
                <Input
                  type="number"
                  required
                  value={form.quoted_price}
                  onChange={(e) => setForm((p) => ({ ...p, quoted_price: e.target.value }))}
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'العملة' : 'Currency'}</Label>
                <Select value={form.currency} onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</Label>
                <Input
                  type="number"
                  value={form.unit_price}
                  onChange={(e) => setForm((p) => ({ ...p, unit_price: e.target.value }))}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'مدة التسليم' : 'Lead Time'}</Label>
                <Input
                  value={form.lead_time}
                  onChange={(e) => setForm((p) => ({ ...p, lead_time: e.target.value }))}
                  placeholder={language === 'ar' ? 'مثال: 7-14 يوم' : 'e.g., 7-14 days'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'فترة الصلاحية' : 'Validity Period'}</Label>
                <Input
                  value={form.validity_period}
                  onChange={(e) => setForm((p) => ({ ...p, validity_period: e.target.value }))}
                  placeholder={language === 'ar' ? 'مثال: 30 يوماً' : 'e.g., 30 days'}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder={language === 'ar' ? 'أي تفاصيل إضافية...' : 'Any additional details...'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="sr-only">{language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder={language === 'ar' ? 'أي تفاصيل إضافية...' : 'Any additional details...'}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('common.loading') : t('rfq.sendQuote')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
