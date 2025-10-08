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
import { CompanySettings } from '@/components/CompanySettings';

export default function Settings() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

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
      }
    };

    loadProfile();
  }, [user, navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        location,
      })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حفظ الملف الشخصي' : 'Failed to save profile',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      description: language === 'ar' ? 'تم حفظ الملف الشخصي بنجاح' : 'Profile saved successfully',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'ar' ? 'الإعدادات' : 'Settings'}
      </h1>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
          <TabsTrigger 
            value="personal" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <User className="w-4 h-4" />
            {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
          </TabsTrigger>
          <TabsTrigger 
            value="company" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            {language === 'ar' ? 'إعدادات الشركة' : 'Company Settings'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'قم بتحديث معلوماتك الشخصية' : 'Update your personal information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'الموقع' : 'Location'}</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={language === 'ar' ? 'المدينة، الدولة' : 'City, Country'}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Coming Soon Cards */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'تفضيلات الإشعارات' : 'Notification Preferences'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'إدارة إشعاراتك' : 'Manage your notifications'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {language === 'ar' ? 'قريباً - إدارة تفضيلات الإشعارات' : 'Coming soon - Manage your notification preferences'}
              </p>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'الاهتمامات' : 'Interests'}</CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? 'حدد اهتماماتك لتلقي توصيات مخصصة'
                  : 'Select your interests to receive personalized recommendations'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {language === 'ar' ? 'قريباً - حدد اهتماماتك' : 'Coming soon - Select your interests'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}