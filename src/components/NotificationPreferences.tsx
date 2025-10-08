import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row'];

interface NotificationPreferencesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationPreferences = ({
  open,
  onOpenChange,
}: NotificationPreferencesProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<Partial<NotificationPreferences>>({
    email_on_message: true,
    email_on_verification: true,
    email_on_new_business: false,
    email_on_new_product: false,
    email_on_inquiry: true,
    email_on_favorite: false,
  });

  useEffect(() => {
    if (open && user) {
      fetchPreferences();
    }
  }, [open, user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user!.id,
          ...preferences,
        });

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' 
          ? 'تم حفظ تفضيلات الإشعارات'
          : 'Notification preferences saved',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar'
          ? 'فشل حفظ التفضيلات'
          : 'Failed to save preferences',
        variant: 'destructive',
      });
    }
  };

  const preferenceItems = [
    {
      key: 'email_on_message' as const,
      label: language === 'ar' ? 'رسائل جديدة' : 'New messages',
      description: language === 'ar'
        ? 'تلقي إشعارات البريد الإلكتروني للرسائل الجديدة'
        : 'Receive email notifications for new messages',
    },
    {
      key: 'email_on_verification' as const,
      label: language === 'ar' ? 'حالة التحقق' : 'Verification status',
      description: language === 'ar'
        ? 'تحديثات حول حالة التحقق من عملك'
        : 'Updates about your business verification status',
    },
    {
      key: 'email_on_new_business' as const,
      label: language === 'ar' ? 'أعمال جديدة' : 'New businesses',
      description: language === 'ar'
        ? 'إشعار عند انضمام أعمال في مجالك'
        : 'Notify when businesses in your industry join',
    },
    {
      key: 'email_on_new_product' as const,
      label: language === 'ar' ? 'منتجات جديدة' : 'New products',
      description: language === 'ar'
        ? 'إشعار عند إضافة منتجات تهمك'
        : 'Notify when products matching your interests are added',
    },
    {
      key: 'email_on_inquiry' as const,
      label: language === 'ar' ? 'الاستفسارات' : 'Inquiries',
      description: language === 'ar'
        ? 'إشعار عند تلقي استفسارات عن منتجاتك'
        : 'Notify when receiving inquiries about your products',
    },
    {
      key: 'email_on_favorite' as const,
      label: language === 'ar' ? 'تحديثات المفضلة' : 'Favorite updates',
      description: language === 'ar'
        ? 'إشعار عند تحديث الأعمال المفضلة'
        : 'Notify when your favorite businesses are updated',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'تفضيلات الإشعارات' : 'Notification Preferences'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'اختر الإشعارات التي تريد تلقيها عبر البريد الإلكتروني'
              : 'Choose which notifications you want to receive via email'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <div className="space-y-4">
            {preferenceItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor={item.key} className="font-medium">
                    {item.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  id={item.key}
                  checked={preferences[item.key] || false}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, [item.key]: checked })
                  }
                />
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSave}>
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
