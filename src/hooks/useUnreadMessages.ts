import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('participant_1_id, participant_1_unread, participant_2_id, participant_2_unread')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`);

      if (error) {
        console.error('Error fetching unread count:', error);
        return;
      }

      const total = data.reduce((sum, conv) => {
        const unread = conv.participant_1_id === user.id
          ? conv.participant_1_unread || 0
          : conv.participant_2_unread || 0;
        return sum + unread;
      }, 0);

      setUnreadCount(total);
    };

    fetchUnreadCount();

    // Subscribe to conversation updates
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_1_id=eq.${user.id}`,
        },
        () => fetchUnreadCount()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_2_id=eq.${user.id}`,
        },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
};
