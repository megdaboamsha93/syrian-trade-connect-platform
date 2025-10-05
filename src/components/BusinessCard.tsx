
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Database } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

type Business = Database['public']['Tables']['businesses']['Row'];

interface BusinessCardProps {
  business: Business;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business }) => {
  const { language, t } = useLanguage();
  
  const name = language === 'en' ? business.name_en : business.name_ar;
  const description = language === 'en' ? (business.description_en || '') : (business.description_ar || '');
  const shortDesc = description.length > 120 ? description.substring(0, 120) + '...' : description;

  return (
    <Link to={`/business/${business.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
        <div className="h-32 overflow-hidden bg-muted flex items-center justify-center">
          {business.cover_url ? (
            <img 
              src={business.cover_url} 
              alt={name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="text-lg font-semibold line-clamp-1 flex-1">{name}</div>
            {business.is_verified && (
              <Badge variant="default" className="gap-1 shrink-0">
                <CheckCircle className="h-3 w-3" />
                {t('business.verified')}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="capitalize">
              {t(`industry.${business.industry}`)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {t(`browse.type.${business.business_type}`)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {shortDesc}
          </p>
          <div className="mt-3 text-xs text-muted-foreground">
            {business.location}{business.founded_year ? ` • ${t('business.founded')} ${business.founded_year}` : ''}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BusinessCard;
