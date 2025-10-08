import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileCheck, setProfileCheck] = useState<'loading' | 'complete' | 'incomplete'>('loading');

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;

      // Skip profile check for specific routes
      const skipRoutes = ['/verify-email', '/complete-profile'];
      if (skipRoutes.includes(location.pathname)) {
        setProfileCheck('complete');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone, location')
        .eq('id', user.id)
        .single();

      if (data && data.full_name && data.phone && data.location) {
        setProfileCheck('complete');
      } else {
        setProfileCheck('incomplete');
      }
    };

    checkProfile();
  }, [user, location.pathname]);

  if (loading || profileCheck === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check email verification
  if (!user.email_confirmed_at && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace />;
  }

  // Check profile completion
  if (profileCheck === 'incomplete' && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};
