
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { businesses, Business, BusinessType } from '../data/businesses';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from 'lucide-react';
import BusinessGrid from '@/components/BusinessGrid';

const Browse: React.FC = () => {
  const { t } = useLanguage();
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>(businesses);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  
  useEffect(() => {
    let filtered = [...businesses];

    // Search by name
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        business => 
          business.nameEn.toLowerCase().includes(lowerSearchTerm) ||
          business.nameAr.toLowerCase().includes(lowerSearchTerm) ||
          business.descriptionEn.toLowerCase().includes(lowerSearchTerm) ||
          business.descriptionAr.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Filter by industry
    if (industryFilter !== 'all') {
      filtered = filtered.filter(business => business.industry === industryFilter);
    }

    // Filter by business type
    if (businessTypeFilter !== 'all') {
      filtered = filtered.filter(business => business.businessType === businessTypeFilter as BusinessType);
    }

    setFilteredBusinesses(filtered);
  }, [searchTerm, industryFilter, businessTypeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search happens automatically through the useEffect
  };

  const industries = ['manufacturing', 'agriculture', 'textiles', 'materials', 'services'];
  const businessTypes = ['importer', 'exporter', 'both'];

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('browse.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg border p-4">
            <h2 className="font-medium mb-4">{t('browse.filter')}</h2>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('browse.search')}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>

            {/* Industry Filter */}
            <div className="mb-4">
              <label className="text-sm font-medium block mb-2">
                {t('browse.industry')}
              </label>
              <Select 
                value={industryFilter}
                onValueChange={(value) => setIndustryFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('browse.industry')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {t(`industry.${industry}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Business Type Filter */}
            <div className="mb-4">
              <label className="text-sm font-medium block mb-2">
                {t('browse.type')}
              </label>
              <Select 
                value={businessTypeFilter}
                onValueChange={(value) => setBusinessTypeFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('browse.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {businessTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`browse.type.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="w-full" onClick={() => {
              setSearchTerm('');
              setIndustryFilter('all');
              setBusinessTypeFilter('all');
            }}>
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="mb-4">
            <h3 className="text-lg font-medium">
              {t('browse.results')} ({filteredBusinesses.length})
            </h3>
          </div>
          <BusinessGrid businesses={filteredBusinesses} />
        </div>
      </div>
    </div>
  );
};

export default Browse;
