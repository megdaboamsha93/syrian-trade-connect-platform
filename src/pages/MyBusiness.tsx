import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Building2, Package, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import ProductManager from '@/components/ProductManager';
import { BusinessLayout } from '@/layouts/BusinessLayout';

interface Business {
  id: string;
  name_en: string;
  name_ar: string;
  business_type: string;
  industry: string;
  location: string;
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
      <BusinessLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </BusinessLayout>
    );
  }

  if (businesses.length === 0) {
    return (
      <BusinessLayout>
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
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout>
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
                className={`cursor-pointer transition-all min-w-[250px] ${
                  selectedBusiness?.id === business.id
                    ? 'ring-2 ring-primary'
                    : 'hover:border-primary'
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
          <Card>
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
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </BusinessLayout>
  );
}
