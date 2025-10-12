import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, MapPin, Package, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RFQRequest {
  id: string;
  product_category: string;
  product_name: string;
  quantity: string;
  description: string;
  budget_range: string;
  required_by: string;
  delivery_location: string;
  created_at: string;
  requester_id: string;
}

const CATEGORY_MAP: Record<string, string> = {
  'Food & Beverages': 'category.foodBeverages',
  'Electronics & Technology': 'category.electronics',
  'Textiles & Clothing': 'category.textiles',
  'Industrial Equipment': 'category.industrial',
  'Petrochemicals': 'category.petrochemicals',
  'Crafts & Handmade': 'category.crafts',
  'Agriculture': 'category.agriculture',
  'Other': 'category.other',
};

export default function RFQBoard() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rfqs, setRfqs] = useState<RFQRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const categories = [
    'Food & Beverages',
    'Electronics & Technology',
    'Textiles & Clothing',
    'Industrial Equipment',
    'Petrochemicals',
    'Crafts & Handmade',
    'Agriculture',
    'Other',
  ];

  useEffect(() => {
    loadRFQs();
  }, []);

  const loadRFQs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rfq_requests')
        .select(`
          *
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRfqs(data || []);
    } catch (error) {
      console.error('Error loading RFQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRFQs = rfqs.filter((rfq) => {
    const matchesSearch = 
      rfq.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || rfq.product_category === categoryFilter;
    const matchesLocation = locationFilter === 'all' || rfq.delivery_location?.includes(locationFilter);
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t('rfq.boardTitle')}
        </h1>
        <p className="text-muted-foreground">
          {t('rfq.boardDescription')}
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('rfq.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('rfq.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('rfq.allCategories')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(CATEGORY_MAP[cat] || 'category.other')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setLocationFilter('all');
              }}
            >
              {t('browse.clearAll')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredRFQs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {t('rfq.noRequests')}
            </h3>
            <p className="text-muted-foreground">
              {t('rfq.noRequestsDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRFQs.map((rfq) => (
            <Card key={rfq.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{rfq.product_name}</CardTitle>
                    <Badge variant="secondary">
                      {t(CATEGORY_MAP[rfq.product_category] || 'category.other')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Package className="h-4 w-4 mr-2" />
                  <span>{rfq.quantity}</span>
                </div>
                
                {rfq.budget_range && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>{rfq.budget_range}</span>
                  </div>
                )}
                
                {rfq.delivery_location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{rfq.delivery_location}</span>
                  </div>
                )}
                
                {rfq.required_by && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(rfq.required_by).toLocaleDateString('en-US')}</span>
                  </div>
                )}

                {rfq.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {rfq.description}
                  </p>
                )}

                {user ? (
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => navigate(`/rfqs`)}
                  >
                    {t('rfq.submitQuote')}
                  </Button>
                ) : (
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => navigate('/login')}
                  >
                    {t('rfq.loginToQuote')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
