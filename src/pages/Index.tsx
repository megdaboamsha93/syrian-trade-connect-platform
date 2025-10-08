import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Building2, Filter, MessageCircle, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import BusinessCard from '@/components/BusinessCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Business = Database['public']['Tables']['businesses']['Row'];
type RFQ = Database['public']['Tables']['rfq_requests']['Row'];

const Index: React.FC = () => {
  const { t, dir, language } = useLanguage();
  const { user } = useAuth();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [liveRFQs, setLiveRFQs] = useState<RFQ[]>([]);
  
  useEffect(() => {
    const fetchFeaturedBusinesses = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setFeaturedBusinesses(data || []);
      } catch (error) {
        console.error('Error fetching featured businesses:', error);
      }
    };

    fetchFeaturedBusinesses();

    const fetchLiveRFQs = async () => {
      try {
        const { data, error } = await supabase
          .from('rfq_requests')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        setLiveRFQs(data || []);
      } catch (error) {
        console.error('Error fetching live RFQs:', error);
      }
    };

    fetchLiveRFQs();

    // Subscribe to realtime updates for public RFQs
    const channel = supabase
      .channel('public-rfqs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rfq_requests',
          filter: 'is_public=eq.true',
        },
        () => {
          fetchLiveRFQs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/90 to-primary text-white py-16 md:py-24 overflow-hidden">
        {/* Syrian Pattern Background */}
        <div 
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'url(/images/syrian-pattern.png?v=2)',
            backgroundSize: '600px 600px',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center'
          }}
        />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90 animate-fade-in [animation-delay:100ms]">
              {t('home.hero.subtitle')}
            </p>
            <div className={`${dir === 'rtl' ? 'text-right' : 'text-left'} animate-fade-in [animation-delay:200ms]`}> 
              <div className="inline-flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-white/95 text-primary hover:bg-white hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl rounded-full px-8"
                >
                  <Link to="/browse">
                    {t('home.cta.browse')}
                    {dir === 'rtl' ? (
                      <ChevronLeft className="mr-2 h-4 w-4 inline" />
                    ) : (
                      <ChevronRight className="ml-2 h-4 w-4 inline" />
                    )}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 hover:border-white/50 hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm rounded-full px-8"
                >
                  <Link to={user ? "/register-business" : "/register"}>
                    {t('home.cta.register')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="hidden md:block absolute right-0 bottom-0 w-1/3 h-full bg-white/5 transform skew-x-12 -mr-20" />
        <div className="hidden md:block absolute -right-10 top-1/4 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="hidden md:block absolute right-1/4 bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            {t('home.features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-8 rounded-2xl border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature1.title')}</h3>
              <p className="text-muted-foreground">{t('home.feature1.desc')}</p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Filter className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature2.title')}</h3>
              <p className="text-muted-foreground">{t('home.feature2.desc')}</p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <MessageCircle className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature3.title')}</h3>
              <p className="text-muted-foreground">{t('home.feature3.desc')}</p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <ClipboardList className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature4.title')}</h3>
              <p className="text-muted-foreground">{t('home.feature4.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Public RFQs */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {t('rfq.liveMarketplace')}
              </h2>
              <p className="text-muted-foreground">
                {t('rfq.liveMarketplaceDesc')}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/rfq-marketplace">
                {t('rfq.viewAll')}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveRFQs.map((rfq) => (
              <Card key={rfq.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{rfq.product_name}</CardTitle>
                    <Badge variant={rfq.rfq_type === 'governmental' ? 'default' : 'secondary'}>
                      {rfq.rfq_type === 'governmental' 
                        ? t('rfq.type.governmental') 
                        : t('rfq.type.open')}
                    </Badge>
                  </div>
                  <CardDescription>{t(`category.${rfq.product_category}`)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('rfq.quantity')}:</span>
                    <span className="font-medium">{rfq.quantity} {rfq.unit || ''}</span>
                  </div>
                  {rfq.budget_range && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('rfq.budgetRange')}:</span>
                      <span className="font-medium">{rfq.budget_range}</span>
                    </div>
                  )}
                  {rfq.delivery_location && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('rfq.deliveryLocation')}:</span>
                      <span className="font-medium">{rfq.delivery_location}</span>
                    </div>
                  )}
                  <Button asChild className="w-full mt-4" size="sm">
                    <Link to="/rfq-marketplace">
                      {t('rfq.viewDetails')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">
              {t('browse.title')}
            </h2>
            <Button asChild variant="outline">
              <Link to="/browse">
                {t('browse.results')}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
