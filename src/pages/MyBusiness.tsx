import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Building2, Package, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import ProductManager from '@/components/ProductManager';
import BusinessEditor from '@/components/BusinessEditor';
import VerificationManager from '@/components/VerificationManager';

interface Business {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  business_type: string;
  industry: string;
  location: string;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  founded_year: number | null;
  is_verified: boolean;
  logo_url: string | null;
  cover_url: string | null;
}

export default function MyBusiness() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadBusinesses();
  }, [user, navigate]);

  const loadBusinesses = async () => {
    if (!user?.id) return;

    console.log('📊 MyBusiness: Loading businesses for user:', user.id);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_example', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ MyBusiness: Error loading businesses:', error);
        throw error;
      }

      console.log('✅ MyBusiness: Loaded businesses:', data);
      setBusinesses(data || []);
      
      if (data && data.length > 0 && !selectedBusiness) {
        setSelectedBusiness(data[0]);
      }
    } catch (error: any) {
      toast.error(
        language === 'ar' 
          ? 'خطأ في تحميل الأعمال' 
          : 'Error loading businesses'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">
            {language === 'ar' ? 'لا توجد أعمال' : 'No Businesses'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {language === 'ar' 
              ? 'لم تقم بتسجيل أي عمل بعد. ابدأ بتسجيل عملك الأول!' 
              : "You haven't registered any businesses yet. Start by registering your first business!"}
          </p>
          <Button onClick={() => navigate('/register-business')}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'تسجيل عمل جديد' : 'Register New Business'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {language === 'ar' ? 'إدارة أعمالي' : 'My Businesses'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'إدارة أعمالك ومنتجاتك' 
                : 'Manage your businesses and products'}
            </p>
          </div>
          <Button onClick={() => navigate('/register-business')}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'إضافة عمل' : 'Add Business'}
          </Button>
        </div>

        {businesses.length > 1 && (
          <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
            {businesses.map((business) => (
              <Card
                key={business.id}
                className={`cursor-pointer transition-all duration-300 min-w-[250px] hover:-translate-y-1 ${
                  selectedBusiness?.id === business.id
                    ? 'ring-2 ring-primary shadow-lg'
                    : 'hover:border-primary hover:shadow-md'
                }`}
                onClick={() => setSelectedBusiness(business)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {language === 'ar' ? business.name_ar : business.name_en}
                    </CardTitle>
                    {business.is_verified && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <CardDescription>{business.industry}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {selectedBusiness && (
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedBusiness.logo_url && (
                    <img
                      src={selectedBusiness.logo_url}
                      alt="Logo"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>
                        {language === 'ar' ? selectedBusiness.name_ar : selectedBusiness.name_en}
                      </CardTitle>
                      {selectedBusiness.is_verified && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {language === 'ar' ? 'موثق' : 'Verified'}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {selectedBusiness.industry} • {selectedBusiness.location}
                    </CardDescription>
                  </div>
                </div>
                <BusinessEditor 
                  business={selectedBusiness} 
                  onUpdate={loadBusinesses}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="products">
                <TabsList>
                  <TabsTrigger value="products" className="gap-2">
                    <Package className="h-4 w-4" />
                    {language === 'ar' ? 'المنتجات' : 'Products'}
                  </TabsTrigger>
                  <TabsTrigger value="info" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    {language === 'ar' ? 'معلومات العمل' : 'Business Info'}
                  </TabsTrigger>
                  <TabsTrigger value="verification" className="gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {language === 'ar' ? 'التوثيق' : 'Verification'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-6">
                  <ProductManager businessId={selectedBusiness.id} />
                </TabsContent>

                <TabsContent value="info" className="mt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">
                        {language === 'ar' ? 'نوع العمل' : 'Business Type'}
                      </h3>
                      <Badge variant="outline">
                        {selectedBusiness.business_type}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        {language === 'ar' ? 'الموقع' : 'Location'}
                      </h3>
                      <p className="text-muted-foreground">{selectedBusiness.location}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        {language === 'ar' ? 'القطاع' : 'Industry'}
                      </h3>
                      <p className="text-muted-foreground">{selectedBusiness.industry}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="verification" className="mt-6">
                  <VerificationManager 
                    businessId={selectedBusiness.id}
                    isVerified={selectedBusiness.is_verified}
                    onVerificationChange={loadBusinesses}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
