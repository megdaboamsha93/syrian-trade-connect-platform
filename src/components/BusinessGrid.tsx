
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Business } from '../data/businesses';
import BusinessCard from './BusinessCard';

interface BusinessGridProps {
  businesses: Business[];
}

const BusinessGrid: React.FC<BusinessGridProps> = ({ businesses }) => {
  const { t } = useLanguage();
  
  if (businesses.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">{t('browse.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  );
};

export default BusinessGrid;
