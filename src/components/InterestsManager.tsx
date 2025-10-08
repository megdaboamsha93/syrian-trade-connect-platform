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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface InterestsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUGGESTED_CATEGORIES = [
  'Electronics', 'Food & Beverages', 'Textiles', 'Machinery', 
  'Crafts', 'Petrochemicals', 'Technology', 'Agriculture'
];

const SUGGESTED_INDUSTRIES = [
  'Manufacturing', 'Retail', 'Wholesale', 'Technology',
  'Food & Beverage', 'Textiles', 'Agriculture', 'Services'
];

export const InterestsManager = ({ open, onOpenChange }: InterestsManagerProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newIndustry, setNewIndustry] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchInterests();
    }
  }, [open, user]);

  const fetchInterests = async () => {
    try {
      const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCategories(data.categories || []);
        setIndustries(data.industries || []);
      }
    } catch (error) {
      console.error('Error fetching interests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('user_interests')
        .upsert({
          user_id: user!.id,
          categories,
          industries,
        });

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar'
          ? 'تم حفظ اهتماماتك'
          : 'Your interests have been saved',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving interests:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar'
          ? 'فشل حفظ الاهتمامات'
          : 'Failed to save interests',
        variant: 'destructive',
      });
    }
  };

  const addCategory = (category: string) => {
    if (category && !categories.includes(category)) {
      setCategories([...categories, category]);
      setNewCategory('');
    }
  };

  const addIndustry = (industry: string) => {
    if (industry && !industries.includes(industry)) {
      setIndustries([...industries, industry]);
      setNewIndustry('');
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  const removeIndustry = (industry: string) => {
    setIndustries(industries.filter(i => i !== industry));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'إدارة الاهتمامات' : 'Manage Interests'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'حدد فئات المنتجات والصناعات التي تهمك لتلقي إشعارات ذات صلة'
              : 'Select product categories and industries you\'re interested in to receive relevant notifications'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Categories */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {language === 'ar' ? 'فئات المنتجات' : 'Product Categories'}
              </Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder={language === 'ar' ? 'أضف فئة...' : 'Add category...'}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCategory(newCategory)}
                />
                <Button onClick={() => addCategory(newCategory)} size="sm">
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {SUGGESTED_CATEGORIES.filter(c => !categories.includes(c)).map((category) => (
                  <Badge
                    key={category}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => addCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge key={category} variant="default" className="gap-1">
                    {category}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeCategory(category)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {language === 'ar' ? 'الصناعات' : 'Industries'}
              </Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder={language === 'ar' ? 'أضف صناعة...' : 'Add industry...'}
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIndustry(newIndustry)}
                />
                <Button onClick={() => addIndustry(newIndustry)} size="sm">
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {SUGGESTED_INDUSTRIES.filter(i => !industries.includes(i)).map((industry) => (
                  <Badge
                    key={industry}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => addIndustry(industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <Badge key={industry} variant="default" className="gap-1">
                    {industry}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeIndustry(industry)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

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
