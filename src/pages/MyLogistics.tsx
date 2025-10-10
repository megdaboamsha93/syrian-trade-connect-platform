import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Plus, Edit, MapPin, Clock, Globe } from 'lucide-react';

export default function MyLogistics() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewProviderOpen, setIsNewProviderOpen] = useState(false);
  const [isNewRouteOpen, setIsNewRouteOpen] = useState(false);

  // Fetch provider
  const { data: provider } = useQuery({
    queryKey: ['my-logistics-provider', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logistics_providers')
        .select('*')
        .eq('owner_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch routes
  const { data: routes } = useQuery({
    queryKey: ['my-routes', provider?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_routes')
        .select('*')
        .eq('provider_id', provider?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });

  // Create provider mutation
  const createProvider = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('logistics_providers')
        .insert({
          owner_id: user?.id,
          ...formData,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-logistics-provider'] });
      toast({
        title: language === 'ar' ? 'تم بنجاح' : 'Success',
        description: language === 'ar' ? 'تم إنشاء شركة الشحن' : 'Logistics provider created',
      });
      setIsNewProviderOpen(false);
    },
  });

  // Create route mutation
  const createRoute = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('shipping_routes')
        .insert({
          provider_id: provider?.id,
          ...formData,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-routes'] });
      toast({
        title: language === 'ar' ? 'تم بنجاح' : 'Success',
        description: language === 'ar' ? 'تم إضافة الطريق' : 'Route added successfully',
      });
      setIsNewRouteOpen(false);
    },
  });

  const handleProviderSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createProvider.mutate({
      company_name_en: formData.get('company_name_en'),
      company_name_ar: formData.get('company_name_ar'),
      description_en: formData.get('description_en'),
      description_ar: formData.get('description_ar'),
      contact_email: formData.get('contact_email'),
      contact_phone: formData.get('contact_phone'),
      website_url: formData.get('website_url'),
      service_types: (formData.get('service_types') as string).split(',').map(s => s.trim()),
    });
  };

  const handleRouteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createRoute.mutate({
      route_name: formData.get('route_name'),
      origin_country: formData.get('origin_country'),
      origin_city: formData.get('origin_city'),
      destination_country: formData.get('destination_country'),
      destination_city: formData.get('destination_city'),
      service_type: formData.get('service_type'),
      transit_time_days: parseInt(formData.get('transit_time_days') as string),
      frequency: formData.get('frequency'),
      notes: formData.get('notes'),
    });
  };

  if (!provider) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-6 w-6" />
              {language === 'ar' ? 'تسجيل شركة شحن' : 'Register Logistics Provider'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'سجل شركتك وابدأ في عرض خدمات الشحن الخاصة بك'
                : 'Register your company and start offering logistics services'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProviderSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name_en">{language === 'ar' ? 'اسم الشركة (EN)' : 'Company Name (EN)'}</Label>
                  <Input id="company_name_en" name="company_name_en" required />
                </div>
                <div>
                  <Label htmlFor="company_name_ar">{language === 'ar' ? 'اسم الشركة (AR)' : 'Company Name (AR)'}</Label>
                  <Input id="company_name_ar" name="company_name_ar" required dir="rtl" />
                </div>
              </div>

              <div>
                <Label htmlFor="description_en">{language === 'ar' ? 'الوصف (EN)' : 'Description (EN)'}</Label>
                <Textarea id="description_en" name="description_en" required />
              </div>

              <div>
                <Label htmlFor="description_ar">{language === 'ar' ? 'الوصف (AR)' : 'Description (AR)'}</Label>
                <Textarea id="description_ar" name="description_ar" required dir="rtl" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input id="contact_email" name="contact_email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="contact_phone">{language === 'ar' ? 'الهاتف' : 'Phone'}</Label>
                  <Input id="contact_phone" name="contact_phone" />
                </div>
              </div>

              <div>
                <Label htmlFor="website_url">{language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</Label>
                <Input id="website_url" name="website_url" type="url" />
              </div>

              <div>
                <Label htmlFor="service_types">{language === 'ar' ? 'أنواع الخدمات' : 'Service Types'}</Label>
                <Input 
                  id="service_types" 
                  name="service_types" 
                  placeholder="air, sea, land, rail"
                  required 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'ar' ? 'افصل بفاصلة (مثال: air, sea, land)' : 'Comma separated (e.g., air, sea, land)'}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={createProvider.isPending}>
                {createProvider.isPending
                  ? (language === 'ar' ? 'جاري التسجيل...' : 'Registering...')
                  : (language === 'ar' ? 'تسجيل الشركة' : 'Register Company')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {language === 'ar' ? provider.company_name_ar : provider.company_name_en}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'إدارة خدمات الشحن والطرق' : 'Manage your logistics services and routes'}
        </p>
      </div>

      <Tabs defaultValue="routes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="routes">
            {language === 'ar' ? 'الطرق' : 'Routes'} ({routes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="settings">
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">
              {language === 'ar' ? 'طرق الشحن' : 'Shipping Routes'}
            </h2>
            <Dialog open={isNewRouteOpen} onOpenChange={setIsNewRouteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'إضافة طريق' : 'Add Route'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{language === 'ar' ? 'إضافة طريق جديد' : 'Add New Route'}</DialogTitle>
                  <DialogDescription>
                    {language === 'ar' ? 'أضف طريق شحن جديد إلى شبكتك' : 'Add a new shipping route to your network'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleRouteSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="route_name">{language === 'ar' ? 'اسم الطريق' : 'Route Name'}</Label>
                    <Input id="route_name" name="route_name" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="origin_country">{language === 'ar' ? 'دولة المنشأ' : 'Origin Country'}</Label>
                      <Input id="origin_country" name="origin_country" required />
                    </div>
                    <div>
                      <Label htmlFor="origin_city">{language === 'ar' ? 'مدينة المنشأ' : 'Origin City'}</Label>
                      <Input id="origin_city" name="origin_city" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="destination_country">{language === 'ar' ? 'دولة الوجهة' : 'Destination Country'}</Label>
                      <Input id="destination_country" name="destination_country" required />
                    </div>
                    <div>
                      <Label htmlFor="destination_city">{language === 'ar' ? 'مدينة الوجهة' : 'Destination City'}</Label>
                      <Input id="destination_city" name="destination_city" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service_type">{language === 'ar' ? 'نوع الخدمة' : 'Service Type'}</Label>
                      <Select name="service_type" required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="air">{language === 'ar' ? 'جوي' : 'Air'}</SelectItem>
                          <SelectItem value="sea">{language === 'ar' ? 'بحري' : 'Sea'}</SelectItem>
                          <SelectItem value="land">{language === 'ar' ? 'بري' : 'Land'}</SelectItem>
                          <SelectItem value="rail">{language === 'ar' ? 'سكك حديدية' : 'Rail'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="transit_time_days">{language === 'ar' ? 'مدة التوصيل (أيام)' : 'Transit Time (days)'}</Label>
                      <Input id="transit_time_days" name="transit_time_days" type="number" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="frequency">{language === 'ar' ? 'التكرار' : 'Frequency'}</Label>
                    <Input id="frequency" name="frequency" placeholder="e.g., Daily, Weekly" />
                  </div>

                  <div>
                    <Label htmlFor="notes">{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                    <Textarea id="notes" name="notes" />
                  </div>

                  <Button type="submit" className="w-full" disabled={createRoute.isPending}>
                    {createRoute.isPending
                      ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...')
                      : (language === 'ar' ? 'إضافة الطريق' : 'Add Route')}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {routes && routes.length > 0 ? (
            <div className="grid gap-4">
              {routes.map((route) => (
                <Card key={route.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{route.route_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4" />
                          {route.origin_country} {route.origin_city && `(${route.origin_city})`} → {route.destination_country} {route.destination_city && `(${route.destination_city})`}
                        </CardDescription>
                      </div>
                      <Badge variant={route.is_active ? 'default' : 'secondary'}>
                        {route.is_active ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">{route.service_type}</Badge>
                      </div>
                      {route.transit_time_days && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {route.transit_time_days} {language === 'ar' ? 'يوم' : 'days'}
                        </div>
                      )}
                      {route.frequency && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          {route.frequency}
                        </div>
                      )}
                    </div>
                    {route.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{route.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {language === 'ar' ? 'لم تضف أي طرق بعد' : 'No routes added yet'}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'معلومات الشركة' : 'Company Information'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'اسم الشركة' : 'Company Name'}</Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? provider.company_name_ar : provider.company_name_en}
                </p>
              </div>
              <div>
                <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? provider.description_ar : provider.description_en}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {provider.service_types?.map((type: string) => (
                  <Badge key={type} variant="secondary">{type}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
