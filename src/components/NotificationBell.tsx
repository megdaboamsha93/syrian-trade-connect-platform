import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getTitle = (notification: typeof notifications[0]) => {
    return language === 'ar' ? notification.title_ar : notification.title_en;
  };

  const getContent = (notification: typeof notifications[0]) => {
    return language === 'ar' ? notification.content_ar : notification.content_en;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">
            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto py-1 px-2 text-xs"
            >
              {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className="flex flex-col items-start gap-1 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <p className="font-medium text-sm">{getTitle(notification)}</p>
                  {!notification.is_read && (
                    <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {getContent(notification)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
