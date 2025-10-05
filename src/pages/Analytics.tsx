import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, MessageSquare, Package, TrendingUp, Calendar, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from '@/hooks/use-toast';

interface DailyView {
  date: string;
  view_count: number;
}

interface ProductEngagement {
  product_id: string;
  product_name: string;
  view_count: number;
  unique_viewers: number;
}

interface MessageStats {
  total_conversations: number;
  total_messages: number;
  unread_messages: number;
}

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  
  // Analytics data
  const [totalViews, setTotalViews] = useState(0);
  const [dailyViews, setDailyViews] = useState<DailyView[]>([]);
  const [productEngagement, setProductEngagement] = useState<ProductEngagement[]>([]);
  const [messageStats, setMessageStats] = useState<MessageStats>({
    total_conversations: 0,
    total_messages: 0,
    unread_messages: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchBusinessAndAnalytics = async () => {
      try {
        // Get user's business - select first one
        const { data: businesses, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (businessError) {
          console.error('Error fetching business:', businessError);
          throw businessError;
        }

        if (!businesses || businesses.length === 0) {
          toast({
            title: 'No Business Found',
            description: 'Please register a business first',
            variant: 'destructive',
          });
          navigate('/register-business');
          return;
        }

        const business = businesses[0];
        setBusinessId(business.id);
        await fetchAnalytics(business.id);
        setLoading(false);
      } catch (error) {
        console.error('Error in fetchBusinessAndAnalytics:', error);
        setLoading(false);
      }
    };

    fetchBusinessAndAnalytics();
  }, [user, timeRange]);

  const exportToCSV = () => {
    if (!businessId) return;

    // Prepare CSV data
    const csvRows = [];
    
    // Header
    csvRows.push(['Analytics Export', '']);
    csvRows.push(['Business ID', businessId]);
    csvRows.push(['Date Range', `${timeRange} days`]);
    csvRows.push(['Export Date', new Date().toLocaleDateString()]);
    csvRows.push([]);
    
    // Overview stats
    csvRows.push(['Overview Statistics']);
    csvRows.push(['Metric', 'Value']);
    csvRows.push(['Total Profile Views', totalViews]);
    csvRows.push(['Total Conversations', messageStats.total_conversations]);
    csvRows.push(['Total Messages', messageStats.total_messages]);
    csvRows.push(['Unread Messages', messageStats.unread_messages]);
    csvRows.push([]);
    
    // Daily views
    csvRows.push(['Daily Profile Views']);
    csvRows.push(['Date', 'Views']);
    dailyViews.forEach(view => {
      csvRows.push([view.date, view.view_count]);
    });
    csvRows.push([]);
    
    // Product engagement
    csvRows.push(['Product Engagement']);
    csvRows.push(['Product Name', 'Total Views', 'Unique Viewers']);
    productEngagement.forEach(product => {
      csvRows.push([product.product_name, product.view_count, product.unique_viewers]);
    });
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Success',
      description: 'Analytics exported successfully',
    });
  };

  const fetchAnalytics = async (bId: string) => {
    const days = parseInt(timeRange);

    // Fetch total profile views
    const { count: viewsCount, error: viewsError } = await supabase
      .from('business_views')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bId);

    if (!viewsError) {
      setTotalViews(viewsCount || 0);
    }

    // Fetch daily views trend using RPC
    const { data: dailyData, error: dailyError } = await supabase
      .rpc('get_business_daily_views', {
        _business_id: bId,
        _days: days,
      });

    if (!dailyError && dailyData) {
      setDailyViews(dailyData.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        view_count: parseInt(d.view_count),
      })));
    }

    // Fetch product engagement using RPC
    const { data: productData, error: productError } = await supabase
      .rpc('get_product_engagement', {
        _business_id: bId,
        _days: days,
      });

    if (!productError && productData) {
      setProductEngagement(productData.map((p: any) => ({
        product_id: p.product_id,
        product_name: p.product_name,
        view_count: parseInt(p.view_count),
        unique_viewers: parseInt(p.unique_viewers),
      })));
    }

    // Fetch message statistics
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, participant_1_id, participant_1_unread, participant_2_id, participant_2_unread')
      .or(`participant_1_id.eq.${user?.id},participant_2_id.eq.${user?.id}`);

    if (!convError && conversations) {
      const unread = conversations.reduce((sum, conv) => {
        const unreadCount = conv.participant_1_id === user?.id
          ? conv.participant_1_unread || 0
          : conv.participant_2_unread || 0;
        return sum + unreadCount;
      }, 0);

      // Count total messages in user's conversations
      const { count: msgCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', conversations.map(c => c.id));

      setMessageStats({
        total_conversations: conversations.length,
        total_messages: msgCount || 0,
        unread_messages: unread,
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Business Analytics</h1>
          <p className="text-muted-foreground">Track your business performance</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-auto">
            <TabsList>
              <TabsTrigger value="7">7 Days</TabsTrigger>
              <TabsTrigger value="30">30 Days</TabsTrigger>
              <TabsTrigger value="90">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnalyticsCard
          title="Profile Views"
          value={totalViews}
          icon={Eye}
          description="Total profile visits"
        />
        <AnalyticsCard
          title="Conversations"
          value={messageStats.total_conversations}
          icon={MessageSquare}
          description={`${messageStats.unread_messages} unread messages`}
        />
        <AnalyticsCard
          title="Total Messages"
          value={messageStats.total_messages}
          icon={MessageSquare}
          description="All messages received"
        />
        <AnalyticsCard
          title="Products"
          value={productEngagement.length}
          icon={Package}
          description="Active products"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Visitor Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Visitor Trends
            </CardTitle>
            <CardDescription>
              Daily profile views over the last {timeRange} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyViews.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyViews}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="view_count" 
                    stroke="hsl(var(--primary))" 
                    name="Views"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No view data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Engagement
            </CardTitle>
            <CardDescription>
              Most viewed products in the last {timeRange} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productEngagement.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productEngagement.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="view_count" fill="hsl(var(--primary))" name="Views" />
                  <Bar dataKey="unique_viewers" fill="hsl(var(--secondary))" name="Unique Viewers" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No product engagement data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Product Table */}
      {productEngagement.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Performance Details</CardTitle>
            <CardDescription>Complete breakdown of product engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Product Name</th>
                    <th className="text-right py-3 px-4">Total Views</th>
                    <th className="text-right py-3 px-4">Unique Viewers</th>
                    <th className="text-right py-3 px-4">Avg. Views/Viewer</th>
                  </tr>
                </thead>
                <tbody>
                  {productEngagement.map((product) => (
                    <tr key={product.product_id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{product.product_name}</td>
                      <td className="text-right py-3 px-4">{product.view_count}</td>
                      <td className="text-right py-3 px-4">{product.unique_viewers}</td>
                      <td className="text-right py-3 px-4">
                        {(product.view_count / product.unique_viewers).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
