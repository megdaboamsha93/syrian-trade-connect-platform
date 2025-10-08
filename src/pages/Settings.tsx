import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { InterestsManager } from '@/components/InterestsManager';

export default function Settings() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const [showInterests, setShowInterests] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setLocation(data.location || '');
        setAvatarUrl(data.avatar_url || '');
      }
    };
    
    loadProfile();
  }, [user, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !phone.trim() || !location.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all required fields',
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
          avatar_url: avatarUrl.trim() || null,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Success',
        description: language === 'ar' ? 'تم تحديث معلوماتك الشخصية' : 'Your personal information has been updated',
      });
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
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{language === 'ar' ? 'الإعدادات' : 'Settings'}</h1>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {language === 'ar' ? 'الشخصية' : 'Personal'}
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {language === 'ar' ? 'الشركة' : 'Company'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'قم بتحديث معلوماتك الشخصية هنا' 
                  : 'Update your personal information here'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    {language === 'ar' ? 'الموقع' : 'Location'}
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: دمشق' : 'e.g., Damascus'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">
                    {language === 'ar' ? 'رابط الصورة الشخصية' : 'Avatar URL'}
                  </Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                  </Button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t space-y-3">
                <h3 className="font-medium mb-3">
                  {language === 'ar' ? 'التفضيلات' : 'Preferences'}
                </h3>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowNotificationPrefs(true)}
                >
                  {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Preferences'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowInterests(true)}
                >
                  {language === 'ar' ? 'إدارة الاهتمامات' : 'Manage Interests'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إعدادات الشركة' : 'Company Settings'}</CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'إدارة معلومات شركتك' 
                  : 'Manage your company information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/my-business')}
                >
                  {language === 'ar' ? 'إدارة الأعمال' : 'Manage Businesses'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/register-business')}
                >
                  {language === 'ar' ? 'تسجيل عمل جديد' : 'Register New Business'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NotificationPreferences 
        open={showNotificationPrefs} 
        onOpenChange={setShowNotificationPrefs} 
      />
      <InterestsManager 
        open={showInterests} 
        onOpenChange={setShowInterests} 
      />
    </div>
  );
}
