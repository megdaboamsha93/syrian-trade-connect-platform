import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, X, SlidersHorizontal } from 'lucide-react';
import BusinessGrid from '@/components/BusinessGrid';
import type { Database } from '@/integrations/supabase/types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Business = Database['public']['Tables']['businesses']['Row'];

const ITEMS_PER_PAGE = 9;

const Browse: React.FC = () => {
  const { t, dir } = useLanguage();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [paginatedBusinesses, setPaginatedBusinesses] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<string[]>([]);
  
  // Fetch businesses from Supabase
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        // Only show verified businesses or example businesses
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .or('is_verified.eq.true,is_example.eq.true')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const uniqueLocations = [...new Set((data || []).map(b => b.location))].sort();
        setLocations(uniqueLocations);
        
        setBusinesses(data || []);
        setFilteredBusinesses(data || []);
      } catch (error) {
        console.error('Error fetching businesses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  useEffect(() => {
    let filtered = [...businesses];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        business => 
          business.name_en.toLowerCase().includes(lowerSearchTerm) ||
          business.name_ar.toLowerCase().includes(lowerSearchTerm) ||
          (business.description_en?.toLowerCase().includes(lowerSearchTerm)) ||
          (business.description_ar?.toLowerCase().includes(lowerSearchTerm))
      );
    }

    if (industryFilter !== 'all') {
      filtered = filtered.filter(business => business.industry === industryFilter);
    }

    if (businessTypeFilter !== 'all') {
      filtered = filtered.filter(business => business.business_type === businessTypeFilter);
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(business => business.location === locationFilter);
    }

    if (verifiedOnly) {
      filtered = filtered.filter(business => business.is_verified);
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name_en.localeCompare(b.name_en));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name_en.localeCompare(a.name_en));
        break;
    }

    setFilteredBusinesses(filtered);
    setCurrentPage(1);
  }, [searchTerm, industryFilter, businessTypeFilter, locationFilter, verifiedOnly, sortBy, businesses]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setPaginatedBusinesses(filteredBusinesses.slice(startIndex, endIndex));
  }, [filteredBusinesses, currentPage]);

  const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setIndustryFilter('all');
    setBusinessTypeFilter('all');
    setLocationFilter('all');
    setVerifiedOnly(false);
    setSortBy('newest');
  };

  const activeFiltersCount = [
    searchTerm,
    industryFilter !== 'all',
    businessTypeFilter !== 'all',
    locationFilter !== 'all',
    verifiedOnly,
    sortBy !== 'newest'
  ].filter(Boolean).length;

  const industries = ['manufacturing', 'agriculture', 'textiles', 'materials', 'services'];
  const businessTypes = ['importer', 'exporter', 'both'];

  const FilterSidebar = () => (
    <div className="lg:col-span-1">
      <div className="bg-card shadow-lg rounded-2xl border p-6 sticky top-4 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">{t('browse.filter')}</h2>
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={resetFilters}
              className="h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
        
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

        <div className="mb-4">
          <label className="text-sm font-medium block mb-2">
            Location
          </label>
          <Select 
            value={locationFilter}
            onValueChange={(value) => setLocationFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <Label htmlFor="verified-only" className="text-sm font-medium">
            Verified Only
          </Label>
          <Switch
            id="verified-only"
            checked={verifiedOnly}
            onCheckedChange={setVerifiedOnly}
          />
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium block mb-2">
            Sort By
          </label>
          <Select 
            value={sortBy}
            onValueChange={(value) => setSortBy(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const MainContent = () => (
    <div className="lg:col-span-3">
      <div className={`mb-6 flex items-center ${dir === 'rtl' ? 'text-right' : ''} justify-between`}>
        <h3 className="text-lg font-medium">
          {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'Result' : 'Results'}
        </h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <BusinessGrid businesses={paginatedBusinesses} />
          
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return <PaginationItem key={pageNum}>...</PaginationItem>;
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className={`flex items-center ${dir === 'rtl' ? 'flex-row-reverse text-right' : ''} justify-between mb-6`}>
        <h1 className="text-2xl md:text-3xl font-bold">{t('browse.title')}</h1>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="gap-2">
            <SlidersHorizontal className="h-3 w-3" />
            {activeFiltersCount} Active
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {dir === 'rtl' ? (
          <>
            <MainContent />
            <FilterSidebar />
          </>
        ) : (
          <>
            <FilterSidebar />
            <MainContent />
          </>
        )}
      </div>
    </div>
  );
};

export default Browse;
