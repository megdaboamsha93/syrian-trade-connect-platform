import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Heart } from 'lucide-react';
import BusinessGrid from '@/components/BusinessGrid';
import type { Database } from '@/integrations/supabase/types';

type Business = Database['public']['Tables']['businesses']['Row'];

const Favorites: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        
        // Get user's favorites
        const { data: favorites, error: favError } = await supabase
          .from('favorites')
          .select('business_id')
          .eq('user_id', user.id);

        if (favError) throw favError;

        if (favorites && favorites.length > 0) {
          // Get business details
          const businessIds = favorites.map(f => f.business_id);
          const { data: businessesData, error: bizError } = await supabase
            .from('businesses')
            .select('*')
            .in('id', businessIds);

          if (bizError) throw bizError;
          setBusinesses(businessesData || []);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-red-500 fill-current" />
        <h1 className="text-2xl md:text-3xl font-bold">My Favorites</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground mb-6">
            Start exploring businesses and save your favorites
          </p>
        </div>
      ) : (
        <BusinessGrid businesses={businesses} />
      )}
    </div>
  );
};

export default Favorites;