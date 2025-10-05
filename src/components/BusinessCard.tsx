import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Building2, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Business = Database['public']['Tables']['businesses']['Row'];

interface BusinessCardProps {
  business: Business;
  showFavorite?: boolean;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, showFavorite = true }) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const name = language === 'en' ? business.name_en : business.name_ar;
  const description = language === 'en' ? (business.description_en || '') : (business.description_ar || '');
  const shortDesc = description.length > 120 ? description.substring(0, 120) + '...' : description;

  // Check if business is favorited
  useEffect(() => {
    if (!user || !showFavorite) return;
    
    const checkFavorite = async () => {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', business.id)
        .maybeSingle();
      
      setIsFavorite(!!data);
    };
    
    checkFavorite();
  }, [user, business.id, showFavorite]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to save favorites');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('business_id', business.id);
        
        if (error) throw error;
        
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            business_id: business.id,
          });
        
        if (error) throw error;
        
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link to={`/business/${business.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow overflow-hidden relative group">
        {showFavorite && user && (
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background ${
              isFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={handleFavoriteToggle}
            disabled={loading}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        )}
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
