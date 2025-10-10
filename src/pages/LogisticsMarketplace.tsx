import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Ship, Plane, Train, Star, MapPin, Clock, Globe } from 'lucide-react';
import { LogisticsMap } from '@/components/LogisticsMap';

export default function LogisticsMarketplace() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const { data: providers, isLoading } = useQuery({
    queryKey: ['logistics-providers', searchQuery, serviceTypeFilter, regionFilter],
    queryFn: async () => {
      let query = supabase
        .from('logistics_providers')
        .select(`
          *,
          shipping_routes(*),
          service_areas(*)
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        const field = language === 'ar' ? 'company_name_ar' : 'company_name_en';
        query = query.ilike(field, `%${searchQuery}%`);
      }

      if (serviceTypeFilter !== 'all') {
        query = query.contains('service_types', [serviceTypeFilter]);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by region on the client side since we need to check shipping routes OR service areas
      if (regionFilter !== 'all' && data) {
        return data.filter(provider => {
          const middleEastCountries = ['Syria', 'Lebanon', 'Turkey', 'Iraq', 'Jordan', 'Egypt', 'UAE', 'Saudi Arabia', 'Palestine', 'Kuwait', 'Bahrain', 'Qatar', 'Oman', 'Yemen'];
          const europeCountries = ['Germany', 'France', 'Italy', 'Greece', 'Cyprus', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Switzerland', 'UK', 'Poland'];
          const asiaCountries = ['China', 'India', 'Singapore', 'Russia', 'Japan', 'South Korea', 'Thailand', 'Malaysia', 'Vietnam'];
          
          let countriesInRegion: string[] = [];
          if (regionFilter === 'middle-east') {
            countriesInRegion = middleEastCountries;
          } else if (regionFilter === 'europe') {
            countriesInRegion = europeCountries;
          } else if (regionFilter === 'asia') {
            countriesInRegion = asiaCountries;
          }
          
          // Check if provider has routes to/from the region
          const hasRouteInRegion = provider.shipping_routes?.some((route: any) => 
            countriesInRegion.includes(route.origin_country) || 
            countriesInRegion.includes(route.destination_country)
          );
          
          // Check if provider has service areas in the region
          const hasServiceAreaInRegion = provider.service_areas?.some((area: any) => 
            countriesInRegion.includes(area.country)
          );
          
          return hasRouteInRegion || hasServiceAreaInRegion;
        });
      }
      
      return data;
    },
  });

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'air': return <Plane className="h-4 w-4" />;
      case 'sea': return <Ship className="h-4 w-4" />;
      case 'land': return <Truck className="h-4 w-4" />;
      case 'rail': return <Train className="h-4 w-4" />;
      default: return <Truck className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">
            {language === 'ar' ? 'سوق النقل والشحن' : 'Logistics Marketplace'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'اعثر على مزودي خدمات النقل والشحن الموثوقين لاحتياجاتك التجارية'
              : 'Find reliable shipping and logistics providers for your business needs'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Input
            placeholder={language === 'ar' ? 'ابحث عن مزود خدمة...' : 'Search providers...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="z-50">
              <SelectValue placeholder={language === 'ar' ? 'نوع الخدمة' : 'Service Type'} />
            </SelectTrigger>
            <SelectContent className="z-[1001]">
              <SelectItem value="all">{language === 'ar' ? 'جميع الخدمات' : 'All Services'}</SelectItem>
              <SelectItem value="air">{language === 'ar' ? 'جوي' : 'Air'}</SelectItem>
              <SelectItem value="sea">{language === 'ar' ? 'بحري' : 'Sea'}</SelectItem>
              <SelectItem value="land">{language === 'ar' ? 'بري' : 'Land'}</SelectItem>
              <SelectItem value="rail">{language === 'ar' ? 'سكك حديدية' : 'Rail'}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="z-50">
              <SelectValue>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  {regionFilter === 'all' 
                    ? (language === 'ar' ? 'جميع المناطق' : 'All Regions')
                    : regionFilter === 'middle-east'
                    ? (language === 'ar' ? 'الشرق الأوسط' : 'Middle East')
                    : regionFilter === 'europe'
                    ? (language === 'ar' ? 'أوروبا' : 'Europe')
                    : (language === 'ar' ? 'آسيا' : 'Asia')}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-[1001]">
              <SelectItem value="all">{language === 'ar' ? 'جميع المناطق' : 'All Regions'}</SelectItem>
              <SelectItem value="middle-east">{language === 'ar' ? 'الشرق الأوسط' : 'Middle East'}</SelectItem>
              <SelectItem value="europe">{language === 'ar' ? 'أوروبا' : 'Europe'}</SelectItem>
              <SelectItem value="asia">{language === 'ar' ? 'آسيا' : 'Asia'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'ar' ? 'خريطة الطرق النشطة' : 'Active Routes Map'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' 
                    ? 'اضغط على العلامات لرؤية تفاصيل الطريق'
                    : 'Click on markers to see route details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LogisticsMap 
                  providers={providers || []} 
                  selectedProvider={selectedProvider}
                  onProviderSelect={setSelectedProvider}
                />
              </CardContent>
            </Card>
          </div>

          {/* Providers List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              {language === 'ar' ? 'مزودو الخدمات' : 'Service Providers'}
            </h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : providers && providers.length > 0 ? (
              providers.map((provider) => (
                <Card 
                  key={provider.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedProvider === provider.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {language === 'ar' ? provider.company_name_ar : provider.company_name_en}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {language === 'ar' ? provider.description_ar : provider.description_en}
                        </CardDescription>
                      </div>
                      {provider.is_verified && (
                        <Badge variant="secondary" className="ml-2">
                          {language === 'ar' ? 'موثق' : 'Verified'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Service Types */}
                    <div className="flex flex-wrap gap-2">
                      {provider.service_types?.map((type: string) => (
                        <Badge key={type} variant="outline" className="flex items-center gap-1">
                          {getServiceIcon(type)}
                          {language === 'ar' 
                            ? type === 'air' ? 'جوي' : type === 'sea' ? 'بحري' : type === 'land' ? 'بري' : 'سكك حديدية'
                            : type.charAt(0).toUpperCase() + type.slice(1)}
                        </Badge>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span>{provider.average_rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{provider.shipping_routes?.length || 0} {language === 'ar' ? 'طرق' : 'routes'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <span>{provider.service_areas?.length || 0} {language === 'ar' ? 'دول' : 'countries'}</span>
                      </div>
                    </div>

                    {/* Contact */}
                    <Button variant="outline" size="sm" className="w-full">
                      {language === 'ar' ? 'طلب عرض سعر' : 'Request Quote'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {language === 'ar' 
                    ? 'لا توجد مزودي خدمات متاحين حالياً'
                    : 'No providers available at the moment'}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
