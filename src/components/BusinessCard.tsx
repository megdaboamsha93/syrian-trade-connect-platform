
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Business } from '../data/businesses';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BusinessCardProps {
  business: Business;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business }) => {
  const { language, t } = useLanguage();
  
  const name = language === 'en' ? business.nameEn : business.nameAr;
  const description = language === 'en' ? business.descriptionEn : business.descriptionAr;
  const shortDesc = description.length > 120 ? description.substring(0, 120) + '...' : description;

  return (
    <Link to={`/business/${business.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
        <div className="h-32 overflow-hidden">
          <img 
            src={business.coverUrl} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="text-lg font-semibold line-clamp-1">{name}</div>
            {business.verified && (
              <div className="flex items-center text-xs text-blue-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                {t('business.verified')}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="capitalize">
              {t(`industry.${business.industry}`)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {t(`browse.type.${business.businessType}`)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {shortDesc}
          </p>
          <div className="mt-3 text-xs text-muted-foreground">
            {business.location} • {t('business.founded')} {business.foundedYear}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BusinessCard;
