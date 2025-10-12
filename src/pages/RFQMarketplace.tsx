import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ClipboardList, Calendar, MapPin, Package, DollarSign, Loader2, Building2, Filter, Save, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';
import { RFQResponseDialog } from '@/components/RFQResponseDialog';

type RFQRequest = Database['public']['Tables']['rfq_requests']['Row'];
type FilterPreference = Database['public']['Tables']['rfq_filter_preferences']['Row'];

export default function RFQMarketplace() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [openRFQs, setOpenRFQs] = useState<RFQRequest[]>([]);
  const [governmentalRFQs, setGovernmentalRFQs] = useState<RFQRequest[]>([]);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [minBudget, setMinBudget] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [requiredByDate, setRequiredByDate] = useState<string>('');
  
  // Save filter dialog
  const [saveFilterOpen, setSaveFilterOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [notifyOnMatch, setNotifyOnMatch] = useState(true);

  // Respond dialog
  const [responseOpen, setResponseOpen] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQRequest | null>(null);

  useEffect(() => {
    loadPublicRFQs();

    // Subscribe to real-time updates
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
          loadPublicRFQs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPublicRFQs = async () => {
    try {
      setLoading(true);
      
      // Fetch open RFQs
      const { data: openData, error: openError } = await supabase
        .from('rfq_requests')
        .select('*')
        .eq('is_public', true)
        .eq('rfq_type', 'open')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (openError) throw openError;

      // Fetch governmental RFQs
      const { data: govData, error: govError } = await supabase
        .from('rfq_requests')
        .select('*')
        .eq('is_public', true)
        .eq('rfq_type', 'governmental')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (govError) throw govError;

      setOpenRFQs(openData || []);
      setGovernmentalRFQs(govData || []);
    } catch (error) {
      console.error('Error loading public RFQs:', error);
      toast.error(t('rfq.error.loading'));
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRFQs = (rfqs: RFQRequest[]) => {
    return rfqs.filter(rfq => {
      // Category filter
      if (selectedCategory !== 'all' && rfq.product_category !== selectedCategory) {
        return false;
      }

      // Location filter
      if (selectedLocation !== 'all' && rfq.delivery_location && 
          !rfq.delivery_location.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }

      // Budget filter
      if (minBudget || maxBudget) {
        const budgetRange = rfq.budget_range;
        if (budgetRange) {
          const numbers = budgetRange.match(/\d+/g);
          if (numbers && numbers.length >= 2) {
            const rfqMin = parseInt(numbers[0]);
            const rfqMax = parseInt(numbers[1]);
            
            if (minBudget && rfqMax < parseInt(minBudget)) return false;
            if (maxBudget && rfqMin > parseInt(maxBudget)) return false;
          }
        }
      }

      // Required by date filter
      if (requiredByDate && rfq.required_by) {
        const rfqDate = new Date(rfq.required_by);
        const filterDate = new Date(requiredByDate);
        if (rfqDate > filterDate) return false;
      }

      return true;
    });
  };

  const handleSaveFilter = async () => {
    if (!user) {
      toast.error(t('common.loginRequired'));
      return;
    }

    if (!filterName.trim()) {
      toast.error(t('rfq.filter.nameRequired'));
      return;
    }

    try {
      const { error } = await supabase
        .from('rfq_filter_preferences')
        .insert({
          user_id: user.id,
          filter_name: filterName,
          categories: selectedCategory === 'all' ? [] : [selectedCategory],
          locations: selectedLocation === 'all' ? [] : [selectedLocation],
          min_budget: minBudget ? parseFloat(minBudget) : null,
          max_budget: maxBudget ? parseFloat(maxBudget) : null,
          required_by_end: requiredByDate || null,
          notify_on_match: notifyOnMatch
        });

      if (error) throw error;

      toast.success(t('rfq.filter.saved'));
      setSaveFilterOpen(false);
      setFilterName('');
    } catch (error) {
      console.error('Error saving filter:', error);
      toast.error(t('rfq.filter.error'));
    }
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedLocation('all');
    setMinBudget('');
    setMaxBudget('');
    setRequiredByDate('');
  };

  const categories = Array.from(
    new Set([...openRFQs, ...governmentalRFQs].map(rfq => rfq.product_category))
  );

  const locations = Array.from(
    new Set([...openRFQs, ...governmentalRFQs]
      .map(rfq => rfq.delivery_location)
      .filter(Boolean) as string[])
  );

  const RFQCard = ({ rfq }: { rfq: RFQRequest }) => {
    const timeAgo = formatDistanceToNow(new Date(rfq.created_at), {
      addSuffix: true,
      locale: language === 'ar' ? ar : undefined,
    });

    return (
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">{rfq.product_name}</CardTitle>
                <Badge variant={rfq.rfq_type === 'governmental' ? 'default' : 'secondary'}>
                  {rfq.rfq_type === 'governmental' ? t('rfq.type.governmental') : t('rfq.type.open')}
                </Badge>
              </div>
              <Badge variant="outline" className="mb-2">{t(`category.${rfq.product_category}`)}</Badge>
              <CardDescription className="text-sm text-muted-foreground">
                {timeAgo}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rfq.description && (
              <p className="text-sm text-muted-foreground">{rfq.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{rfq.quantity}{rfq.unit ? ` ${rfq.unit}` : ''}</span>
              </div>
              
              {rfq.budget_range && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{rfq.budget_range}</span>
                </div>
              )}
              
              {rfq.delivery_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{rfq.delivery_location}</span>
                </div>
              )}
              
              {rfq.required_by && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(rfq.required_by).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                </div>
              )}
            </div>

            {user && (
              <div className="pt-3 border-t">
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => {
                    setSelectedRFQ(rfq);
                    setResponseOpen(true);
                  }}
                >
                  {t('rfq.sendQuote')}
                </Button>
              </div>
            )}
            
            {!user && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  {t('rfq.loginToQuote')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('rfq.marketplace.title')}</h1>
          </div>
          <p className="text-muted-foreground">
            {t('rfq.marketplace.description')}
          </p>
        </div>

        {/* Advanced Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('rfq.filter.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label>{t('rfq.filter.category')}</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(`category.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('rfq.filter.location')}</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('rfq.filter.minBudget')}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('rfq.filter.maxBudget')}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('rfq.filter.requiredBy')}</Label>
                <Input
                  type="date"
                  value={requiredByDate}
                  onChange={(e) => setRequiredByDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                {t('rfq.filter.clear')}
              </Button>
              {user && (
                <Dialog open={saveFilterOpen} onOpenChange={setSaveFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="gap-2">
                      <Save className="h-4 w-4" />
                      {t('rfq.filter.save')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('rfq.filter.saveTitle')}</DialogTitle>
                      <DialogDescription>
                        {t('rfq.filter.saveDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('rfq.filter.filterName')}</Label>
                        <Input
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                          placeholder={t('rfq.filter.filterNamePlaceholder')}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="notify"
                          checked={notifyOnMatch}
                          onChange={(e) => setNotifyOnMatch(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="notify" className="cursor-pointer">
                          <Bell className="h-4 w-4 inline mr-2" />
                          {t('rfq.filter.notifyOnMatch')}
                        </Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveFilter}>
                        {t('common.save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="open" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open" className="gap-2">
              <Building2 className="h-4 w-4" />
              {t('rfq.type.open')} ({getFilteredRFQs(openRFQs).length})
            </TabsTrigger>
            <TabsTrigger value="governmental" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              {t('rfq.type.governmental')} ({getFilteredRFQs(governmentalRFQs).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4">
            {getFilteredRFQs(openRFQs).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('rfq.noOpenRFQs')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getFilteredRFQs(openRFQs).map((rfq) => (
                  <RFQCard key={rfq.id} rfq={rfq} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="governmental" className="space-y-4">
            {getFilteredRFQs(governmentalRFQs).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('rfq.noGovRFQs')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getFilteredRFQs(governmentalRFQs).map((rfq) => (
                  <RFQCard key={rfq.id} rfq={rfq} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <RFQResponseDialog
          open={responseOpen}
          onOpenChange={setResponseOpen}
          rfq={selectedRFQ}
        />
      </div>
    </div>
  );
}