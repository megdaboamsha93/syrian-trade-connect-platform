import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';
import { completeProfileSchema } from '@/lib/validation';
import { z } from 'zod';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [isGovernment, setIsGovernment] = useState(false);
  const [businessType, setBusinessType] = useState<'standard' | 'logistics_provider' | 'both'>('standard');

  const categories = ['electronics', 'textiles', 'food', 'machinery', 'chemicals'];
  const industries = ['manufacturing', 'agriculture', 'textiles', 'materials', 'services'];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if profile is already complete
    const checkProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone, location')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setLocation(data.location || '');
        
        // If profile seems complete, redirect to business registration
        if (data.full_name && data.phone && data.location) {
          navigate('/register-business');
        }
      }
    };
    
    checkProfile();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    try {
      completeProfileSchema.parse({
        fullName: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: language === 'ar' ? 'خطأ في الإدخال' : 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          location: location.trim(),
          preferred_language: language,
          is_government_account: isGovernment,
          business_type: businessType,
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Save interests if any selected
      if (selectedCategories.length > 0 || selectedIndustries.length > 0) {
        const { error: interestsError } = await supabase
          .from('user_interests')
          .upsert({
            user_id: user?.id,
            categories: selectedCategories,
            industries: selectedIndustries,
          }, { onConflict: 'user_id' });

        if (interestsError) throw interestsError;
      }

      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Success',
        description: language === 'ar' ? 'تم تحديث ملفك الشخصي' : 'Your profile has been updated',
      });

      // Navigate based on business type
      if (businessType === 'logistics_provider') {
        navigate('/my-logistics');
      } else {
        navigate('/register-business');
      }
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'أكمل ملفك الشخصي' : 'Complete Your Profile'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' 
              ? 'نحتاج بعض المعلومات قبل أن تسجل عملك' 
              : 'We need some information before you register your business'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                required
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
              </Label>
              <PhoneInput
                value={phone}
                onChange={(value) => setPhone(value)}
                placeholder={language === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                {language === 'ar' ? 'الموقع (المدينة)' : 'Location (City)'}
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: دمشق، حلب، حمص' : 'e.g., Damascus, Aleppo, Homs'}
                required
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {language === 'ar' ? 'الفئات المهتمة بها (اختياري)' : 'Interested Categories (Optional)'}
              </Label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    type="button"
                    variant={selectedCategories.includes(cat) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {language === 'ar' ? 'الصناعات المهتمة بها (اختياري)' : 'Interested Industries (Optional)'}
              </Label>
              <div className="flex flex-wrap gap-2">
                {industries.map(ind => (
                  <Button
                    key={ind}
                    type="button"
                    variant={selectedIndustries.includes(ind) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleIndustry(ind)}
                  >
                    {t(`industry.${ind}`)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t">
              <Label>
                {language === 'ar' ? 'نوع العمل' : 'Business Type'}
              </Label>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <input
                    type="radio"
                    id="standard"
                    name="businessType"
                    checked={businessType === 'standard'}
                    onChange={() => setBusinessType('standard')}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <Label htmlFor="standard" className="font-normal cursor-pointer">
                      {language === 'ar' ? 'عمل تجاري عادي' : 'Standard Business'}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'ar'
                        ? 'شركة تقدم منتجات أو خدمات'
                        : 'Company offering products or services'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <input
                    type="radio"
                    id="logistics"
                    name="businessType"
                    checked={businessType === 'logistics_provider'}
                    onChange={() => setBusinessType('logistics_provider')}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <Label htmlFor="logistics" className="font-normal cursor-pointer">
                      {language === 'ar' ? 'مزود خدمات نقل وشحن' : 'Logistics Provider'}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'ar'
                        ? 'شركة متخصصة في النقل والشحن الدولي'
                        : 'Company specialized in shipping and logistics'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 rtl:space-x-reverse pt-2">
                <input
                  type="checkbox"
                  id="isGovernment"
                  checked={isGovernment}
                  onChange={(e) => setIsGovernment(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <div className="flex-1">
                  <Label htmlFor="isGovernment" className="font-normal cursor-pointer">
                    {language === 'ar' 
                      ? 'حساب حكومي أو مرتبط بالحكومة' 
                      : 'Government Account'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar'
                      ? 'سيتيح لك هذا إنشاء طلبات التسعير الحكومية'
                      : 'Allows creating governmental RFQs'}
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === 'ar' ? 'متابعة' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
