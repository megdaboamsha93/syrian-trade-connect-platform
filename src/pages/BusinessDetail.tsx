
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CheckCircle, Mail, Phone, ChevronLeft, MessageSquare, Globe, Calendar, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';

type Business = Tables<'businesses'>;
type Product = Tables<'business_products'>;

const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      // Fetch business details
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (businessError || !businessData) {
        console.error('Error fetching business:', businessError);
        navigate('/browse');
        return;
      }
      
      setBusiness(businessData);
      
      // Track business view
      await supabase
        .from('business_views')
        .insert({
          business_id: id,
          viewer_id: user?.id || null,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
        });
      
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('business_products')
        .select('*')
        .eq('business_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (!productsError && productsData) {
        setProducts(productsData);
      }
      
      setLoading(false);
    };
    
    fetchBusinessData();
  }, [id, navigate, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Skeleton className="h-48 md:h-64 w-full" />
        <div className="container mx-auto px-6">
          <div className="relative -mt-16 mb-6">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return null;
  }

  const name = language === 'en' ? business.name_en : business.name_ar;
  const description = language === 'en' ? business.description_en : business.description_ar;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Cover Image */}
      <div className="h-48 md:h-64 overflow-hidden relative bg-muted">
        {business.cover_url ? (
          <img 
            src={business.cover_url} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-black/30"></div>
        <Button 
          variant="outline"
          className="absolute top-4 left-4 bg-white/80 hover:bg-white"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t('browse.title')}
        </Button>
      </div>

      <div className="container mx-auto px-6">
        {/* Business Header */}
        <div className="relative -mt-16 mb-6">
          <div className="bg-card rounded-lg shadow-md p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
                  {business.is_verified && (
                    <div className="flex items-center text-xs text-blue-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {t('business.verified')}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {business.industry}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {t(`browse.type.${business.business_type}`)}
                  </Badge>
                  <Badge variant="outline">{business.location}</Badge>
                </div>
              </div>
              <Button className="flex gap-2" asChild>
                <Link to={`/messages/new/${business.id}`}>
                  <MessageSquare className="h-4 w-4" />
                  {t('business.message')}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full bg-card rounded-lg shadow-sm">
              <TabsList className="border-b w-full justify-start rounded-none px-6 pt-3">
                <TabsTrigger value="about">{t('business.about')}</TabsTrigger>
                <TabsTrigger value="products">{t('business.products')}</TabsTrigger>
              </TabsList>
              <TabsContent value="about" className="p-6">
                <div>
                  <h2 className="font-medium text-lg mb-3">{t('business.about')}</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
                </div>
              </TabsContent>
              <TabsContent value="products" className="p-6">
                <h2 className="font-medium text-lg mb-3">{t('business.products')}</h2>
                {products.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No products listed yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.map(product => {
                      const productName = language === 'en' ? product.name_en : product.name_ar;
                      const productDesc = language === 'en' ? product.description_en : product.description_ar;
                      const firstImage = product.image_urls?.[0];
                      
                      return (
                        <Card key={product.id} className="overflow-hidden">
                          {firstImage && (
                            <div className="h-40 overflow-hidden bg-muted">
                              <img 
                                src={firstImage} 
                                alt={productName} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <h3 className="font-medium mb-2">{productName}</h3>
                            {productDesc && (
                              <p className="text-sm text-muted-foreground mb-2">{productDesc}</p>
                            )}
                            {product.category && (
                              <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                            )}
                            {product.price_range && (
                              <p className="text-sm text-muted-foreground mt-2">Price: {product.price_range}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="font-medium text-lg mb-4">{t('business.details')}</h2>
              <div className="space-y-4">
                {business.founded_year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{t('business.founded')}</div>
                      <div>{business.founded_year}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{t('business.type')}</div>
                    <div className="capitalize">{t(`browse.type.${business.business_type}`)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h2 className="font-medium text-lg mb-4">{t('business.contact')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${business.contact_email}`} className="text-primary hover:underline break-all">
                      {business.contact_email}
                    </a>
                  </div>
                  {business.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${business.contact_phone}`} className="text-primary hover:underline">
                        {business.contact_phone}
                      </a>
                    </div>
                  )}
                  {business.website_url && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={business.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline break-all"
                      >
                        {business.website_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
