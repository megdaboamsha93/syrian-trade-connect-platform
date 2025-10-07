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

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

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
    
    if (!fullName.trim() || !phone.trim() || !location.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          location: location.trim(),
          preferred_language: language,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Success',
        description: language === 'ar' ? 'تم تحديث ملفك الشخصي' : 'Your profile has been updated',
      });

      navigate('/register-business');
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
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
                required
                dir="ltr"
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
