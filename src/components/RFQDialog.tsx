import { useState, useEffect } from 'react';
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

const CATEGORY_MAP: Record<string, string> = {
  'Food & Beverages': 'category.foodBeverages',
  'Electronics & Technology': 'category.electronics',
  'Textiles & Clothing': 'category.textiles',
  'Industrial Equipment': 'category.industrial',
  'Petrochemicals': 'category.petrochemicals',
  'Crafts & Handmade': 'category.crafts',
  'Agriculture': 'category.agriculture',
  'Construction Materials': 'category.construction',
  'Chemicals': 'category.chemicals',
  'Machinery': 'category.machinery',
  'Furniture': 'category.furniture',
  'Pharmaceuticals': 'category.pharmaceuticals',
  'Automotive': 'category.automotive',
  'Energy': 'category.energy',
  'Other': 'category.other',
};

export const RFQDialog = ({ businessId, businessName }: RFQDialogProps) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [businessCategories, setBusinessCategories] = useState<string[]>([]);
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

  const allCategories = [
    'Food & Beverages',
    'Electronics & Technology',
    'Textiles & Clothing',
    'Industrial Equipment',
    'Petrochemicals',
    'Crafts & Handmade',
    'Agriculture',
    'Construction Materials',
    'Chemicals',
    'Machinery',
    'Furniture',
    'Pharmaceuticals',
    'Automotive',
    'Energy',
    'Other',
  ];

  // Fetch business products to filter categories
  useEffect(() => {
    const fetchBusinessCategories = async () => {
      const { data } = await supabase
        .from('business_products')
        .select('category')
        .eq('business_id', businessId)
        .eq('is_active', true);
      
      if (data && data.length > 0) {
        const uniqueCategories = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
        setBusinessCategories(uniqueCategories);
      } else {
        // If no products, show all categories
        setBusinessCategories(allCategories);
      }
    };
    
    if (open && businessId) {
      fetchBusinessCategories();
    }
  }, [open, businessId]);

  const categories = businessCategories.length > 0 ? businessCategories : allCategories;

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
        title: t('rfq.error'),
        description: t('rfq.errorSending'),
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: t('rfq.sent'),
      description: t('rfq.sentSuccess'),
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
          {t('rfq.requestQuote')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('rfq.requestQuoteFrom')} {businessName}
          </DialogTitle>
          <DialogDescription>
            {t('rfq.fillDetails')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('rfq.productCategory')} *</Label>
              <Select
                value={formData.product_category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, product_category: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('rfq.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {t(CATEGORY_MAP[category] || 'category.other')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('rfq.productName')} *</Label>
              <Input
                value={formData.product_name}
                onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                placeholder={t('rfq.productName')}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('rfq.quantity')} *</Label>
              <Input
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="1000"
                required
              />
            </div>

            <div>
              <Label>{t('rfq.unit')}</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder={t('rfq.unitPlaceholder')}
              />
            </div>
          </div>

          <div>
            <Label>{t('rfq.description')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('rfq.descriptionPlaceholder')}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('rfq.requiredBy')}</Label>
              <Input
                type="date"
                value={formData.required_by}
                onChange={(e) => setFormData(prev => ({ ...prev, required_by: e.target.value }))}
              />
            </div>

            <div>
              <Label>{t('rfq.budgetRange')}</Label>
              <Input
                value={formData.budget_range}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_range: e.target.value }))}
                placeholder={t('rfq.budgetPlaceholder')}
              />
            </div>
          </div>

          <div>
            <Label>{t('rfq.deliveryLocation')}</Label>
            <Input
              value={formData.delivery_location}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_location: e.target.value }))}
              placeholder={t('rfq.deliveryPlaceholder')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('rfq.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('rfq.sending') : t('rfq.sendRequest')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};