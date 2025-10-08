import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Calendar, MapPin, Package, DollarSign, Loader2, Building2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type RFQRequest = Database['public']['Tables']['rfq_requests']['Row'];

export default function RFQMarketplace() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [openRFQs, setOpenRFQs] = useState<RFQRequest[]>([]);
  const [governmentalRFQs, setGovernmentalRFQs] = useState<RFQRequest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
        .select(`
          *,
          profiles:requester_id(full_name)
        `)
        .eq('is_public', true)
        .eq('rfq_type', 'open')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (openError) throw openError;

      // Fetch governmental RFQs
      const { data: govData, error: govError } = await supabase
        .from('rfq_requests')
        .select(`
          *,
          profiles:requester_id(full_name)
        `)
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
    if (selectedCategory === 'all') return rfqs;
    return rfqs.filter(rfq => rfq.product_category === selectedCategory);
  };

  const categories = Array.from(
    new Set([...openRFQs, ...governmentalRFQs].map(rfq => rfq.product_category))
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
                <Badge variant="outline">{t(`category.${rfq.product_category}`)}</Badge>
              </div>
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
                <span>{rfq.quantity} {rfq.unit || ''}</span>
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
                  onClick={() => window.location.href = `/messages/new/${rfq.requester_id}`}
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

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              {t('common.all')}
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {t(`category.${category}`)}
              </Button>
            ))}
          </div>
        )}

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
      </div>
    </div>
  );
}