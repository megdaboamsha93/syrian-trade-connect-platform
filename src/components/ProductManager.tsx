import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Upload, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  category: string;
  price_range: string | null;
  minimum_order: string | null;
  image_urls: string[];
  is_active: boolean;
}

const CATEGORIES = [
  'Agriculture', 'Textiles', 'Food & Beverages', 'Construction Materials',
  'Chemicals', 'Electronics', 'Machinery', 'Furniture', 'Pharmaceuticals',
  'Automotive', 'Energy', 'Other'
];

const CATEGORY_MAP: Record<string, string> = {
  'Agriculture': 'category.agriculture',
  'Textiles': 'category.textiles',
  'Food & Beverages': 'category.foodBeverages',
  'Construction Materials': 'category.construction',
  'Chemicals': 'category.chemicals',
  'Electronics': 'category.electronics',
  'Machinery': 'category.machinery',
  'Furniture': 'category.furniture',
  'Pharmaceuticals': 'category.pharmaceuticals',
  'Automotive': 'category.automotive',
  'Energy': 'category.energy',
  'Other': 'category.other',
};

interface ProductManagerProps {
  businessId: string;
}

export default function ProductManager({ businessId }: ProductManagerProps) {
  const { language, t } = useLanguage();
  const { uploadFile, uploading } = useFileUpload();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    category: '',
    priceRange: '',
    minimumOrder: '',
    imageUrls: [] as string[],
  });

  useEffect(() => {
    loadProducts();
  }, [businessId]);

  const loadProducts = async () => {
    console.log('📦 ProductManager: Loading products for business:', businessId);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('business_products')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ ProductManager: Loaded products:', data);
      setProducts(data || []);
    } catch (error: any) {
      console.error('❌ ProductManager: Error loading products:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل المنتجات' : 'Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const url = await uploadFile(file, { bucket: 'product-images', maxSizeMB: 5 });
    if (url) {
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, url],
      }));
      toast.success(language === 'ar' ? 'تم رفع الصورة' : 'Image uploaded');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      category: '',
      priceRange: '',
      minimumOrder: '',
      imageUrls: [],
    });
    setEditingProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nameEn: product.name_en,
      nameAr: product.name_ar,
      descriptionEn: product.description_en || '',
      descriptionAr: product.description_ar || '',
      category: product.category,
      priceRange: product.price_range || '',
      minimumOrder: product.minimum_order || '',
      imageUrls: product.image_urls || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nameEn || !formData.nameAr || !formData.category) {
      toast.error(language === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }

    console.log('💾 ProductManager: Saving product...', { editingProduct, formData });

    try {
      const productData = {
        business_id: businessId,
        name_en: formData.nameEn.trim(),
        name_ar: formData.nameAr.trim(),
        description_en: formData.descriptionEn.trim() || null,
        description_ar: formData.descriptionAr.trim() || null,
        category: formData.category,
        price_range: formData.priceRange.trim() || null,
        minimum_order: formData.minimumOrder.trim() || null,
        image_urls: formData.imageUrls,
        is_active: true,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('business_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        console.log('✅ ProductManager: Product updated');
        toast.success(language === 'ar' ? 'تم تحديث المنتج' : 'Product updated');
      } else {
        const { error } = await supabase
          .from('business_products')
          .insert(productData);

        if (error) throw error;
        console.log('✅ ProductManager: Product created');
        toast.success(language === 'ar' ? 'تم إضافة المنتج' : 'Product added');
      }

      setDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      console.error('❌ ProductManager: Error saving product:', error);
      toast.error(language === 'ar' ? 'خطأ في حفظ المنتج' : 'Error saving product');
    }
  };

  const handleDelete = async (productId: string) => {
    console.log('🗑️ ProductManager: Deleting product:', productId);

    try {
      const { error } = await supabase
        .from('business_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      console.log('✅ ProductManager: Product deleted');
      toast.success(language === 'ar' ? 'تم حذف المنتج' : 'Product deleted');
      loadProducts();
    } catch (error: any) {
      console.error('❌ ProductManager: Error deleting product:', error);
      toast.error(language === 'ar' ? 'خطأ في حذف المنتج' : 'Error deleting product');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {language === 'ar' ? 'المنتجات' : 'Products'} ({products.length})
        </h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct
                  ? (language === 'ar' ? 'تعديل المنتج' : 'Edit Product')
                  : (language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'اسم المنتج (إنجليزي)' : 'Product Name (English)'} *</Label>
                  <Input
                    value={formData.nameEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                    placeholder="e.g., Olive Oil"
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'اسم المنتج (عربي)' : 'Product Name (Arabic)'} *</Label>
                  <Input
                    value={formData.nameAr}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                    placeholder="مثال: زيت الزيتون"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <Label>{language === 'ar' ? 'الفئة' : 'Category'} *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {t(CATEGORY_MAP[cat] || 'category.other')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'نطاق السعر' : 'Price Range'}</Label>
                  <Input
                    value={formData.priceRange}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                    placeholder="e.g., $10-$50/unit"
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'الحد الأدنى للطلب' : 'Minimum Order'}</Label>
                  <Input
                    value={formData.minimumOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimumOrder: e.target.value }))}
                    placeholder="e.g., 100 units"
                  />
                </div>
              </div>

              <div>
                <Label>{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                <Textarea
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>

              <div>
                <Label>{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                <Textarea
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                  placeholder="وصف المنتج..."
                  rows={3}
                  dir="rtl"
                />
              </div>

              <div>
                <Label>{language === 'ar' ? 'صور المنتج' : 'Product Images'}</Label>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {formData.imageUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img src={url} alt={`Product ${index + 1}`} className="h-24 w-full object-cover rounded border" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors">
                    <Upload className="h-5 w-5" />
                    <span className="text-sm">{language === 'ar' ? 'رفع صورة' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleSubmit} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{language === 'ar' ? 'لا توجد منتجات بعد' : 'No products yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
              <CardHeader className="p-0">
                {product.image_urls?.[0] && (
                  <img
                    src={product.image_urls[0]}
                    alt={language === 'ar' ? product.name_ar : product.name_en}
                    className="h-48 w-full object-cover rounded-t-lg"
                  />
                )}
              </CardHeader>
              <CardContent className="pt-4">
                <CardTitle className="text-lg mb-2">
                  {language === 'ar' ? product.name_ar : product.name_en}
                </CardTitle>
                <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                {product.price_range && (
                  <p className="text-sm font-semibold">{product.price_range}</p>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(product)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {language === 'ar' ? 'حذف المنتج' : 'Delete Product'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {language === 'ar'
                          ? 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.'
                          : 'Are you sure you want to delete this product? This action cannot be undone.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(product.id)}>
                        {language === 'ar' ? 'حذف' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
