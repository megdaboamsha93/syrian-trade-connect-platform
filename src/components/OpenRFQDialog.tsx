import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ClipboardList, Plus } from 'lucide-react';
import { toast } from 'sonner';

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Food & Agriculture',
  'Textiles & Apparel',
  'Petrochemicals',
  'Industrial Equipment',
  'Dates',
  'Technology',
  'Crafts & Handicrafts',
];

export function OpenRFQDialog() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGovAccount, setIsGovAccount] = useState(false);
  const [formData, setFormData] = useState({
    rfq_type: 'open' as 'open' | 'governmental',
    product_name: '',
    product_category: '',
    quantity: '',
    unit: '',
    budget_range: '',
    delivery_location: '',
    required_by: '',
    description: '',
  });

  useEffect(() => {
    const checkGovAccount = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('is_government_account')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setIsGovAccount(data.is_government_account || false);
      }
    };
    
    checkGovAccount();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(t('common.loginRequired'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('rfq_requests').insert({
        requester_id: user.id,
        rfq_type: formData.rfq_type,
        is_public: true,
        product_name: formData.product_name,
        product_category: formData.product_category,
        quantity: formData.quantity,
        unit: formData.unit || null,
        budget_range: formData.budget_range || null,
        delivery_location: formData.delivery_location || null,
        required_by: formData.required_by || null,
        description: formData.description || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success(t('rfq.created'));
      setOpen(false);
      setFormData({
        rfq_type: 'open',
        product_name: '',
        product_category: '',
        quantity: '',
        unit: '',
        budget_range: '',
        delivery_location: '',
        required_by: '',
        description: '',
      });
    } catch (error) {
      console.error('Error creating RFQ:', error);
      toast.error(t('rfq.error.create'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('rfq.createOpen')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {t('rfq.createOpen')}
          </DialogTitle>
          <DialogDescription>{t('rfq.createOpenDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isGovAccount && (
            <div className="space-y-2">
              <Label>{t('rfq.type.label')}</Label>
              <RadioGroup
                value={formData.rfq_type}
                onValueChange={(value: 'open' | 'governmental') =>
                  setFormData({ ...formData, rfq_type: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="open" id="open" />
                  <Label htmlFor="open" className="font-normal cursor-pointer">
                    {t('rfq.type.open')} - {t('rfq.type.openDesc')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="governmental" id="governmental" />
                  <Label htmlFor="governmental" className="font-normal cursor-pointer">
                    {t('rfq.type.governmental')} - {t('rfq.type.govDesc')}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_name">{t('rfq.productName')} *</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('rfq.category')} *</Label>
              <Select
                value={formData.product_category}
                onValueChange={(value) => setFormData({ ...formData, product_category: value })}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder={t('rfq.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {t(`category.${category}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('rfq.quantity')} *</Label>
              <Input
                id="quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">{t('rfq.unit')}</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder={t('rfq.unitPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget_range">{t('rfq.budgetRange')}</Label>
            <Input
              id="budget_range"
              value={formData.budget_range}
              onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
              placeholder={t('rfq.budgetPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_location">{t('rfq.deliveryLocation')}</Label>
              <Input
                id="delivery_location"
                value={formData.delivery_location}
                onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="required_by">{t('rfq.requiredBy')}</Label>
              <Input
                id="required_by"
                type="date"
                value={formData.required_by}
                onChange={(e) => setFormData({ ...formData, required_by: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('rfq.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder={t('rfq.descriptionPlaceholder')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.creating') : t('rfq.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}