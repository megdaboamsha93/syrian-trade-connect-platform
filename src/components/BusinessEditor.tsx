import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/phone-input';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';
import { Edit, Upload, X, Loader2, Save, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { registerBusinessSchema } from '@/lib/validation';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BUSINESS_TYPES = ['importer', 'exporter', 'both'] as const;
const INDUSTRIES = [
  'Agriculture', 'Textiles', 'Food & Beverages', 'Construction Materials',
  'Chemicals', 'Electronics', 'Machinery', 'Furniture', 'Pharmaceuticals',
  'Automotive', 'Energy', 'Services', 'Other'
];

interface Business {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  business_type: string;
  industry: string;
  location: string;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  founded_year: number | null;
  logo_url: string | null;
  cover_url: string | null;
  is_verified: boolean;
}

interface BusinessEditorProps {
  business: Business;
  onUpdate: () => void;
}

export default function BusinessEditor({ business, onUpdate }: BusinessEditorProps) {
  const { language, t } = useLanguage();
  const { uploadFile, uploading } = useFileUpload();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    nameEn: business.name_en,
    nameAr: business.name_ar,
    descriptionEn: business.description_en || '',
    descriptionAr: business.description_ar || '',
    businessType: business.business_type,
    industry: business.industry,
    location: business.location,
    contactEmail: business.contact_email,
    contactPhone: business.contact_phone || '',
    websiteUrl: business.website_url || '',
    foundedYear: business.founded_year || new Date().getFullYear(),
    logoUrl: business.logo_url,
    coverUrl: business.cover_url,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'cover') => {
    const bucket = type === 'logo' ? 'business-logos' : 'business-covers';
    const maxSize = type === 'logo' ? 5 : 10;
    
    const url = await uploadFile(file, { bucket, maxSizeMB: maxSize });
    
    if (url) {
      updateFormData(type === 'logo' ? 'logoUrl' : 'coverUrl', url);
      toast.success(language === 'ar' ? 'تم رفع الصورة' : 'Image uploaded');
    }
  };

  const translateValidationError = (error: string): string => {
    if (error.includes('Arabic text')) return t('validation.arabicRequired');
    if (error.includes('English text')) return t('validation.englishRequired');
    if (error.includes('Invalid email')) return t('validation.emailInvalid');
    if (error.includes('Email too long')) return t('validation.emailTooLong');
    if (error.includes('Phone')) return t('validation.phoneFormat');
    if (error.includes('too short')) return t('validation.fieldTooShort');
    if (error.includes('too long')) return t('validation.fieldTooLong');
    if (error.includes('Invalid URL')) return t('validation.invalidUrl');
    return error;
  };

  const handleSubmit = async () => {
    setValidationErrors({});

    // Validate form data
    try {
      registerBusinessSchema.parse({
        nameEn: formData.nameEn.trim(),
        nameAr: formData.nameAr.trim(),
        descriptionEn: formData.descriptionEn.trim() || undefined,
        descriptionAr: formData.descriptionAr.trim() || undefined,
        businessType: formData.businessType,
        industry: formData.industry,
        location: formData.location,
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim(),
        websiteUrl: formData.websiteUrl.trim() || '',
        foundedYear: formData.foundedYear,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          errors[field] = translateValidationError(err.message);
        });
        setValidationErrors(errors);
        toast.error(language === 'ar' ? 'يرجى تصحيح الأخطاء' : 'Please fix the errors');
        return;
      }
    }

    console.log('💾 BusinessEditor: Updating business...', { businessId: business.id });
    setSaving(true);

    try {
      // Check if major fields changed (trigger re-verification)
      const majorFields = ['name_en', 'name_ar', 'business_type', 'industry', 'location'];
      const hasMajorChanges = majorFields.some(field => {
        const currentValue = business[field as keyof Business];
        const newValue = {
          name_en: formData.nameEn.trim(),
          name_ar: formData.nameAr.trim(),
          business_type: formData.businessType,
          industry: formData.industry,
          location: formData.location,
        }[field];
        return currentValue !== newValue;
      });

      const updateData = {
        name_en: formData.nameEn.trim(),
        name_ar: formData.nameAr.trim(),
        description_en: formData.descriptionEn.trim() || null,
        description_ar: formData.descriptionAr.trim() || null,
        business_type: formData.businessType as 'importer' | 'exporter' | 'both',
        industry: formData.industry,
        location: formData.location,
        contact_email: formData.contactEmail.trim(),
        contact_phone: formData.contactPhone.trim() || null,
        website_url: formData.websiteUrl.trim() || null,
        founded_year: formData.foundedYear,
        logo_url: formData.logoUrl,
        cover_url: formData.coverUrl,
        // Invalidate verification if major fields changed
        ...(hasMajorChanges && business.is_verified ? { is_verified: false } : {}),
      };

      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', business.id);

      if (error) throw error;

      console.log('✅ BusinessEditor: Business updated successfully');
      
      if (hasMajorChanges && business.is_verified) {
        toast.success(
          language === 'ar' 
            ? 'تم تحديث المعلومات. يجب إعادة التحقق من العمل.' 
            : 'Information updated. Business requires re-verification.',
          { duration: 5000 }
        );
      } else {
        toast.success(language === 'ar' ? 'تم تحديث معلومات العمل' : 'Business information updated');
      }
      
      setOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('❌ BusinessEditor: Error updating business:', error);
      toast.error(language === 'ar' ? 'خطأ في تحديث المعلومات' : 'Error updating information');
    } finally {
      setSaving(false);
    }
  };

  const getBusinessTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      importer: { en: 'Importer', ar: 'مستورد' },
      exporter: { en: 'Exporter', ar: 'مصدر' },
      both: { en: 'Both', ar: 'كلاهما' },
    };
    return language === 'ar' ? labels[type]?.ar : labels[type]?.en;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'تعديل المعلومات' : 'Edit Information'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'تعديل معلومات العمل' : 'Edit Business Information'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning about re-verification */}
          {business.is_verified && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {language === 'ar'
                  ? 'تعديل المعلومات الأساسية (الاسم، النوع، القطاع، الموقع) سيتطلب إعادة التحقق من العمل.'
                  : 'Editing basic information (name, type, industry, location) will require business re-verification.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">
              {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'اسم العمل (إنجليزي)' : 'Business Name (English)'} *</Label>
                  <Input
                    value={formData.nameEn}
                    onChange={(e) => {
                      updateFormData('nameEn', e.target.value);
                      setValidationErrors(prev => ({ ...prev, nameEn: '' }));
                    }}
                    className={validationErrors.nameEn ? 'border-destructive' : ''}
                  />
                  {validationErrors.nameEn && (
                    <p className="text-xs text-destructive mt-1">{validationErrors.nameEn}</p>
                  )}
                </div>
                <div>
                  <Label>{language === 'ar' ? 'اسم العمل (عربي)' : 'Business Name (Arabic)'} *</Label>
                  <Input
                    value={formData.nameAr}
                    onChange={(e) => {
                      updateFormData('nameAr', e.target.value);
                      setValidationErrors(prev => ({ ...prev, nameAr: '' }));
                    }}
                    dir="rtl"
                    className={validationErrors.nameAr ? 'border-destructive' : ''}
                  />
                  {validationErrors.nameAr && (
                    <p className="text-xs text-destructive mt-1">{validationErrors.nameAr}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'نوع العمل' : 'Business Type'} *</Label>
                  <Select value={formData.businessType} onValueChange={(value) => updateFormData('businessType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {getBusinessTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'القطاع' : 'Industry'} *</Label>
                  <Select value={formData.industry} onValueChange={(value) => updateFormData('industry', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'الموقع' : 'Location'} *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => updateFormData('location', e.target.value)}
                  />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'سنة التأسيس' : 'Founded Year'}</Label>
                  <Input
                    type="number"
                    value={formData.foundedYear}
                    onChange={(e) => updateFormData('foundedYear', parseInt(e.target.value))}
                    min={1900}
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">
              {language === 'ar' ? 'الوصف' : 'Description'}
            </h3>
            <div className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                <Textarea
                  value={formData.descriptionEn}
                  onChange={(e) => updateFormData('descriptionEn', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                <Textarea
                  value={formData.descriptionAr}
                  onChange={(e) => updateFormData('descriptionAr', e.target.value)}
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">
              {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *</Label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => {
                      updateFormData('contactEmail', e.target.value);
                      setValidationErrors(prev => ({ ...prev, contactEmail: '' }));
                    }}
                    className={validationErrors.contactEmail ? 'border-destructive' : ''}
                  />
                  {validationErrors.contactEmail && (
                    <p className="text-xs text-destructive mt-1">{validationErrors.contactEmail}</p>
                  )}
                </div>
                <div>
                  <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'} *</Label>
                  <PhoneInput
                    value={formData.contactPhone}
                    onChange={(value) => {
                      updateFormData('contactPhone', value);
                      setValidationErrors(prev => ({ ...prev, contactPhone: '' }));
                    }}
                    error={validationErrors.contactPhone}
                  />
                </div>
              </div>
              <div>
                <Label>{language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</Label>
                <Input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => updateFormData('websiteUrl', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </Card>

          {/* Images */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">
              {language === 'ar' ? 'الصور' : 'Images'}
            </h3>
            <div className="space-y-4">
              {/* Logo */}
              <div>
                <Label>{language === 'ar' ? 'شعار العمل' : 'Business Logo'}</Label>
                <div className="mt-2">
                  {formData.logoUrl ? (
                    <div className="relative inline-block">
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo" 
                        className="h-24 w-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => updateFormData('logoUrl', null)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors">
                      <Upload className="h-5 w-5" />
                      <span className="text-sm">{language === 'ar' ? 'رفع الشعار' : 'Upload Logo'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'logo');
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Cover */}
              <div>
                <Label>{language === 'ar' ? 'صورة الغلاف' : 'Cover Image'}</Label>
                <div className="mt-2">
                  {formData.coverUrl ? (
                    <div className="relative">
                      <img 
                        src={formData.coverUrl} 
                        alt="Cover" 
                        className="h-32 w-full object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => updateFormData('coverUrl', null)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors w-full">
                      <Upload className="h-5 w-5" />
                      <span className="text-sm">{language === 'ar' ? 'رفع صورة الغلاف' : 'Upload Cover'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'cover');
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={saving || uploading}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {!saving && <Save className="h-4 w-4 mr-2" />}
              {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}