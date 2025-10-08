import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Phone, Mail, DollarSign, Truck, X } from 'lucide-react';
import VerificationManager from './VerificationManager';

interface Business {
  id: string;
  name_en: string;
  name_ar: string;
}

interface BusinessSettings {
  platform_contact_name: string | null;
  platform_contact_phone: string | null;
  platform_contact_email: string | null;
  looking_for: string[];
  accept_messages: boolean;
  accept_rfqs: boolean;
  sales_method: string | null;
  minimum_order_value: number | null;
  payment_terms: string | null;
  delivery_terms: string | null;
}

export const CompanySettings = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [settings, setSettings] = useState<BusinessSettings>({
    platform_contact_name: '',
    platform_contact_phone: '',
    platform_contact_email: '',
    looking_for: [],
    accept_messages: true,
    accept_rfqs: true,
    sales_method: 'both',
    minimum_order_value: null,
    payment_terms: '',
    delivery_terms: '',
  });

  const lookingForOptions = ['Suppliers', 'Buyers', 'Partners', 'Distributors', 'Manufacturers'];

  useEffect(() => {
    if (user) {
      loadBusinesses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBusiness) {
      loadSettings();
    }
  }, [selectedBusiness]);

  const loadBusinesses = async () => {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name_en, name_ar')
      .eq('owner_id', user?.id);

    if (error) {
      console.error('Error loading businesses:', error);
      return;
    }

    setBusinesses(data || []);
    if (data && data.length > 0) {
      setSelectedBusiness(data[0].id);
    }
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', selectedBusiness)
      .maybeSingle();

    if (error) {
      console.error('Error loading settings:', error);
      return;
    }

    if (data) {
      setSettings({
        platform_contact_name: data.platform_contact_name,
        platform_contact_phone: data.platform_contact_phone,
        platform_contact_email: data.platform_contact_email,
        looking_for: data.looking_for || [],
        accept_messages: data.accept_messages,
        accept_rfqs: data.accept_rfqs,
        sales_method: data.sales_method,
        minimum_order_value: data.minimum_order_value,
        payment_terms: data.payment_terms,
        delivery_terms: data.delivery_terms,
      });
    }
  };

  const handleSave = async () => {
    if (!selectedBusiness) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('business_settings')
      .upsert({
        business_id: selectedBusiness,
        ...settings,
      });

    setLoading(false);

    if (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حفظ الإعدادات' : 'Failed to save settings',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      description: language === 'ar' ? 'تم حفظ إعدادات الشركة بنجاح' : 'Company settings saved successfully',
    });
  };

  const toggleLookingFor = (option: string) => {
    setSettings(prev => ({
      ...prev,
      looking_for: prev.looking_for.includes(option)
        ? prev.looking_for.filter(item => item !== option)
        : [...prev.looking_for, option],
    }));
  };

  if (businesses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'لا توجد شركات' : 'No Businesses'}</CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'يجب عليك تسجيل شركة أولاً لإدارة إعدادات الشركة' 
              : 'You need to register a business first to manage company settings'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Label>{language === 'ar' ? 'اختر الشركة' : 'Select Business'}</Label>
        <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {businesses.map(business => (
              <SelectItem key={business.id} value={business.id}>
                {language === 'ar' ? business.name_ar : business.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="contact" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contact">
            {language === 'ar' ? 'جهة الاتصال' : 'Contact'}
          </TabsTrigger>
          <TabsTrigger value="preferences">
            {language === 'ar' ? 'التفضيلات' : 'Preferences'}
          </TabsTrigger>
          <TabsTrigger value="operations">
            {language === 'ar' ? 'العمليات' : 'Operations'}
          </TabsTrigger>
          <TabsTrigger value="verification">
            {language === 'ar' ? 'التحقق' : 'Verification'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                {language === 'ar' ? 'معلومات الاتصال بالمنصة' : 'Platform Contact Information'}
              </CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? 'نقطة الاتصال الرئيسية في حالة النزاعات أو المشكلات'
                  : 'Primary contact point for disputes or issues'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'اسم جهة الاتصال' : 'Contact Name'}</Label>
                <Input
                  value={settings.platform_contact_name || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, platform_contact_name: e.target.value }))}
                  placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full name'}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                <Input
                  value={settings.platform_contact_phone || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, platform_contact_phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input
                  type="email"
                  value={settings.platform_contact_email || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, platform_contact_email: e.target.value }))}
                  placeholder="contact@company.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'ما الذي تبحث عنه؟' : 'What are you looking for?'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'حدد نوع الشراكات التجارية التي تهتم بها' : 'Select the type of business partnerships you are interested in'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lookingForOptions.map(option => (
                  <Badge
                    key={option}
                    variant={settings.looking_for.includes(option) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleLookingFor(option)}
                  >
                    {option}
                    {settings.looking_for.includes(option) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إعدادات الاتصال' : 'Communication Settings'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{language === 'ar' ? 'قبول الرسائل' : 'Accept Messages'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'السماح للمستخدمين بإرسال رسائل مباشرة' : 'Allow users to send direct messages'}
                  </p>
                </div>
                <Switch
                  checked={settings.accept_messages}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, accept_messages: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{language === 'ar' ? 'قبول طلبات عروض الأسعار' : 'Accept RFQ Requests'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'السماح للمستخدمين بإرسال طلبات عروض الأسعار' : 'Allow users to send quote requests'}
                  </p>
                </div>
                <Switch
                  checked={settings.accept_rfqs}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, accept_rfqs: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {language === 'ar' ? 'طريقة البيع' : 'Sales Method'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'نوع البيع' : 'Sales Type'}</Label>
                <Select
                  value={settings.sales_method || 'both'}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, sales_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wholesale">{language === 'ar' ? 'جملة' : 'Wholesale'}</SelectItem>
                    <SelectItem value="retail">{language === 'ar' ? 'تجزئة' : 'Retail'}</SelectItem>
                    <SelectItem value="both">{language === 'ar' ? 'كلاهما' : 'Both'}</SelectItem>
                    <SelectItem value="custom">{language === 'ar' ? 'مخصص' : 'Custom'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'ar' ? 'الحد الأدنى لقيمة الطلب' : 'Minimum Order Value'}</Label>
                <Input
                  type="number"
                  value={settings.minimum_order_value || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, minimum_order_value: parseFloat(e.target.value) || null }))}
                  placeholder="1000"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                {language === 'ar' ? 'شروط الدفع والتسليم' : 'Payment & Delivery Terms'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'شروط الدفع' : 'Payment Terms'}</Label>
                <Textarea
                  value={settings.payment_terms || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, payment_terms: e.target.value }))}
                  placeholder={language === 'ar' ? 'مثال: 30 يوماً صافي، 50% مقدماً' : 'e.g., Net 30, 50% upfront'}
                  rows={3}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'شروط التسليم' : 'Delivery Terms'}</Label>
                <Textarea
                  value={settings.delivery_terms || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, delivery_terms: e.target.value }))}
                  placeholder={language === 'ar' ? 'مثال: FOB، CIF، تسليم خلال 7-14 يوماً' : 'e.g., FOB, CIF, 7-14 days delivery'}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {language === 'ar' ? 'مستندات التحقق' : 'Verification Documents'}
              </CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? 'إدارة مستندات التحقق الخاصة بشركتك'
                  : 'Manage your business verification documents'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VerificationManager businessId={selectedBusiness} isVerified={false} onVerificationChange={loadBusinesses} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}
        </Button>
      </div>
    </div>
  );
};