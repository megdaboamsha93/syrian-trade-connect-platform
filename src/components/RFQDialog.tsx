import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';

interface RFQDialogProps {
  businessId: string;
  businessName: string;
}

export const RFQDialog = ({ businessId, businessName }: RFQDialogProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_category: '',
    product_name: '',
    quantity: '',
    unit: '',
    description: '',
    required_by: '',
    budget_range: '',
    delivery_location: '',
  });

  const categories = [
    'Food & Beverages',
    'Electronics & Technology',
    'Textiles & Clothing',
    'Industrial Equipment',
    'Petrochemicals',
    'Crafts & Handmade',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from('rfq_requests').insert({
      requester_id: user.id,
      target_business_id: businessId,
      ...formData,
    });

    setLoading(false);

    if (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إرسال طلب عرض السعر' : 'Failed to send RFQ request',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: language === 'ar' ? 'تم الإرسال' : 'Sent',
      description: language === 'ar' ? 'تم إرسال طلب عرض السعر بنجاح' : 'RFQ request sent successfully',
    });

    setOpen(false);
    setFormData({
      product_category: '',
      product_name: '',
      quantity: '',
      unit: '',
      description: '',
      required_by: '',
      budget_range: '',
      delivery_location: '',
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="w-4 h-4" />
          {language === 'ar' ? 'طلب عرض سعر' : 'Request Quote'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'طلب عرض سعر من ' : 'Request Quote from '}
            {businessName}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'املأ التفاصيل أدناه لطلب عرض سعر. سيتم إرسال طلبك مباشرة إلى الشركة.'
              : 'Fill in the details below to request a quote. Your request will be sent directly to the business.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ar' ? 'فئة المنتج' : 'Product Category'} *</Label>
              <Select
                value={formData.product_category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, product_category: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{language === 'ar' ? 'اسم المنتج' : 'Product Name'} *</Label>
              <Input
                value={formData.product_name}
                onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                placeholder={language === 'ar' ? 'اسم المنتج' : 'Product name'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ar' ? 'الكمية' : 'Quantity'} *</Label>
              <Input
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="1000"
                required
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'الوحدة' : 'Unit'}</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder={language === 'ar' ? 'مثال: كجم، قطعة، صندوق' : 'e.g., kg, pieces, boxes'}
              />
            </div>
          </div>

          <div>
            <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={language === 'ar' ? 'أضف أي تفاصيل إضافية...' : 'Add any additional details...'}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ar' ? 'مطلوب بتاريخ' : 'Required By'}</Label>
              <Input
                type="date"
                value={formData.required_by}
                onChange={(e) => setFormData(prev => ({ ...prev, required_by: e.target.value }))}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'نطاق الميزانية' : 'Budget Range'}</Label>
              <Input
                value={formData.budget_range}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_range: e.target.value }))}
                placeholder={language === 'ar' ? 'مثال: $5000-$10000' : 'e.g., $5000-$10000'}
              />
            </div>
          </div>

          <div>
            <Label>{language === 'ar' ? 'موقع التسليم' : 'Delivery Location'}</Label>
            <Input
              value={formData.delivery_location}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_location: e.target.value }))}
              placeholder={language === 'ar' ? 'المدينة، الدولة' : 'City, Country'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                : (language === 'ar' ? 'إرسال الطلب' : 'Send Request')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};