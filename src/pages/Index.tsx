
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronRight, Building2, Filter, MessageCircle } from 'lucide-react';
import { businesses } from '../data/businesses';
import BusinessCard from '@/components/BusinessCard';

const Index: React.FC = () => {
  const { t } = useLanguage();
  const featuredBusinesses = businesses.slice(0, 3);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/90 to-primary text-white py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" variant="secondary" className="text-primary hover:text-primary/90">
                <Link to="/browse">
                  {t('home.cta.browse')}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link to="/register">
                  {t('home.cta.register')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Abstract shape */}
        <div className="hidden md:block absolute right-0 bottom-0 w-1/3 h-full bg-white/10 transform skew-x-12 -mr-20"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            {t('home.features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature1.title')}</h3>
              <p className="text-muted-foreground">{t('home.feature1.desc')}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Filter className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature2.title')}</h3>
              <p className="text-muted-foreground">{t('home.feature2.desc')}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature3.title')}</h3>
              <p className="text-muted-foreground">{t('home.feature3.desc')}</p>
            </div>
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
