
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { businesses, Business } from '../data/businesses';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CheckCircle, Mail, Phone, ChevronLeft, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    if (id) {
      const foundBusiness = businesses.find(b => b.id === id);
      if (foundBusiness) {
        setBusiness(foundBusiness);
      } else {
        navigate('/browse');
      }
    }
  }, [id, navigate]);

  if (!business) {
    return (
      <div className="container mx-auto px-6 py-8 text-center">
        Loading...
      </div>
    );
  }

  const name = language === 'en' ? business.nameEn : business.nameAr;
  const description = language === 'en' ? business.descriptionEn : business.descriptionAr;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Cover Image */}
      <div className="h-48 md:h-64 overflow-hidden relative">
        <img 
          src={business.coverUrl} 
          alt={name} 
          className="w-full h-full object-cover"
        />
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
                  {business.verified && (
                    <div className="flex items-center text-xs text-blue-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {t('business.verified')}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {t(`industry.${business.industry}`)}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {t(`browse.type.${business.businessType}`)}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {business.products.map(product => {
                    const productName = language === 'en' ? product.nameEn : product.nameAr;
                    const productDesc = language === 'en' ? product.descriptionEn : product.descriptionAr;
                    
                    return (
                      <Card key={product.id} className="overflow-hidden">
                        <div className="h-40 overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={productName} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-2">{productName}</h3>
                          <p className="text-sm text-muted-foreground">{productDesc}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="font-medium text-lg mb-4">{t('business.details')}</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">{t('business.founded')}</div>
                  <div>{business.foundedYear}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">{t('business.employees')}</div>
                  <div>{business.employeeCount}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">{t('business.type')}</div>
                  <div className="capitalize">{t(`browse.type.${business.businessType}`)}</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h2 className="font-medium text-lg mb-4">{t('business.contact')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${business.contactEmail}`} className="text-primary hover:underline">
                      {business.contactEmail}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${business.contactPhone}`} className="text-primary hover:underline">
                      {business.contactPhone}
                    </a>
                  </div>
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
