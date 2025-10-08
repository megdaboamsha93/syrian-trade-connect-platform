import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Loader2, ArrowLeft, ArrowRight, Check, Upload, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PhoneInput } from '@/components/ui/phone-input';
import { registerBusinessSchema } from '@/lib/validation';
import { z } from 'zod';

const BUSINESS_TYPES = ['importer', 'exporter', 'both'] as const;
const INDUSTRIES = [
  'Agriculture', 'Textiles', 'Food & Beverages', 'Construction Materials',
  'Chemicals', 'Electronics', 'Machinery', 'Furniture', 'Pharmaceuticals',
  'Automotive', 'Energy', 'Services', 'Other'
];

const INDUSTRY_MAP: Record<string, string> = {
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
  'Services': 'industry.services',
  'Other': 'category.other',
};

export default function RegisterBusiness() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const { uploadFile, uploading } = useFileUpload();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    businessType: '' as typeof BUSINESS_TYPES[number] | '',
    industry: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    foundedYear: new Date().getFullYear(),
    logoUrl: null as string | null,
    coverUrl: null as string | null,
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'cover') => {
    const bucket = type === 'logo' ? 'business-logos' : 'business-covers';
    const maxSize = type === 'logo' ? 5 : 10;
    
    const url = await uploadFile(file, { bucket, maxSizeMB: maxSize });
    
    if (url) {
      updateFormData(type === 'logo' ? 'logoUrl' : 'coverUrl', url);
      toast({
        title: language === 'ar' ? 'تم الرفع بنجاح' : 'Upload successful',
        description: language === 'ar' 
          ? `تم رفع ${type === 'logo' ? 'الشعار' : 'صورة الغلاف'} بنجاح` 
          : `${type === 'logo' ? 'Logo' : 'Cover image'} uploaded successfully`,
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    try {
      switch (currentStep) {
        case 1:
          registerBusinessSchema.pick({ 
            nameEn: true, 
            nameAr: true, 
            businessType: true 
          }).parse({
            nameEn: formData.nameEn.trim(),
            nameAr: formData.nameAr.trim(),
            businessType: formData.businessType,
          });
          return true;
        case 2:
          registerBusinessSchema.pick({ 
            industry: true, 
            location: true 
          }).parse({
            industry: formData.industry,
            location: formData.location,
          });
          return true;
        case 3:
          registerBusinessSchema.pick({ 
            contactEmail: true, 
            contactPhone: true 
          }).parse({
            contactEmail: formData.contactEmail.trim(),
            contactPhone: formData.contactPhone.trim(),
          });
          return true;
        default:
          return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: language === 'ar' ? 'خطأ في الإدخال' : 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    
    if (!user?.id) {
      console.error('❌ RegisterBusiness: No user ID found');
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'You must be logged in',
        variant: 'destructive',
      });
      return;
    }

    console.log('📝 RegisterBusiness: Starting submission...', {
      userId: user.id,
      businessName: formData.nameEn,
      hasLogo: !!formData.logoUrl,
      hasCover: !!formData.coverUrl,
    });

    setLoading(true);

    try {
      const businessData = {
        owner_id: user.id,
        name_en: formData.nameEn.trim(),
        name_ar: formData.nameAr.trim(),
        description_en: formData.descriptionEn.trim() || null,
        description_ar: formData.descriptionAr.trim() || null,
        business_type: formData.businessType as 'importer' | 'exporter' | 'both',
        industry: formData.industry,
        location: formData.location,
        contact_email: formData.contactEmail.trim(),
        contact_phone: formData.contactPhone.trim(),
        website_url: formData.websiteUrl.trim() || null,
        founded_year: formData.foundedYear,
        logo_url: formData.logoUrl,
        cover_url: formData.coverUrl,
        is_verified: false,
      };

      console.log('📤 RegisterBusiness: Inserting business data...', businessData);

      const { data, error } = await supabase
        .from('businesses')
        .insert(businessData)
        .select()
        .single();

      if (error) {
        console.error('❌ RegisterBusiness: Database error:', error);
        throw error;
      }

      console.log('✅ RegisterBusiness: Business created successfully!', data);

      toast({
        title: language === 'ar' ? 'تم التسجيل بنجاح!' : 'Successfully Registered!',
        description: language === 'ar' 
          ? 'تم تسجيل عملك. سيتم مراجعته قريباً.' 
          : 'Your business has been registered. It will be reviewed soon.',
      });

      // Navigate to verification flow
      navigate(`/my-business?verify=${data.id}`);
    } catch (error: any) {
      console.error('❌ RegisterBusiness: Submission failed:', error);
      
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.code === '23505') {
        errorMessage = language === 'ar' 
          ? 'يوجد عمل مسجل بهذه المعلومات بالفعل' 
          : 'A business with these details already exists';
      } else if (error.code === '23503') {
        errorMessage = language === 'ar' 
          ? 'خطأ في الربط مع حساب المستخدم' 
          : 'Error linking to user account';
      }

      toast({
        title: language === 'ar' ? 'خطأ في التسجيل' : 'Registration Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getBusinessTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      importer: { en: 'Importer', ar: 'مستورد' },
      exporter: { en: 'Exporter', ar: 'مصدر' },
      both: { en: 'Both (Importer & Exporter)', ar: 'كلاهما (مستورد ومصدر)' },
    };
    return language === 'ar' ? labels[type]?.ar : labels[type]?.en;
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className={language === 'ar' ? 'text-right' : ''}>
                {language === 'ar' ? 'تسجيل عمل جديد' : 'Register Your Business'}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {language === 'ar' ? `${step} من ${totalSteps}` : `${step} of ${totalSteps}`}
              </span>
            </div>
            <Progress value={progress} className="mb-2" />
            <CardDescription className={language === 'ar' ? 'text-right' : ''}>
              {step === 1 && (language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information')}
              {step === 2 && (language === 'ar' ? 'تفاصيل العمل' : 'Business Details')}
              {step === 3 && (language === 'ar' ? 'معلومات الاتصال' : 'Contact Information')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nameEn">{language === 'ar' ? 'اسم العمل (إنجليزي)' : 'Business Name (English)'} *</Label>
                    <Input
                      id="nameEn"
                      value={formData.nameEn}
                      onChange={(e) => updateFormData('nameEn', e.target.value)}
                      placeholder="e.g., Damascus Textiles Co."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nameAr">{language === 'ar' ? 'اسم العمل (عربي)' : 'Business Name (Arabic)'} *</Label>
                    <Input
                      id="nameAr"
                      value={formData.nameAr}
                      onChange={(e) => updateFormData('nameAr', e.target.value)}
                      placeholder="مثال: شركة دمشق للمنسوجات"
                      required
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">{language === 'ar' ? 'نوع العمل' : 'Business Type'} *</Label>
                    <Select value={formData.businessType} onValueChange={(value) => updateFormData('businessType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر نوع العمل' : 'Select business type'} />
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
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="industry">{language === 'ar' ? 'القطاع' : 'Industry'} *</Label>
                    <Select value={formData.industry} onValueChange={(value) => updateFormData('industry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر القطاع' : 'Select industry'} />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map(industry => (
                          <SelectItem key={industry} value={industry}>
                            {t(INDUSTRY_MAP[industry] || 'category.other')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">{language === 'ar' ? 'الموقع' : 'Location'} *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => updateFormData('location', e.target.value)}
                      placeholder={language === 'ar' ? 'مثال: دمشق' : 'e.g., Damascus'}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descriptionEn">{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                    <Textarea
                      id="descriptionEn"
                      value={formData.descriptionEn}
                      onChange={(e) => updateFormData('descriptionEn', e.target.value)}
                      placeholder="Brief description of your business..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descriptionAr">{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                    <Textarea
                      id="descriptionAr"
                      value={formData.descriptionAr}
                      onChange={(e) => updateFormData('descriptionAr', e.target.value)}
                      placeholder="وصف مختصر عن عملك..."
                      rows={4}
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="foundedYear">{language === 'ar' ? 'سنة التأسيس' : 'Founded Year'}</Label>
                    <Input
                      id="foundedYear"
                      type="number"
                      value={formData.foundedYear}
                      onChange={(e) => updateFormData('foundedYear', parseInt(e.target.value))}
                      min={1900}
                      max={new Date().getFullYear()}
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'شعار العمل' : 'Business Logo'}</Label>
                    <div className="flex items-center gap-4">
                      {formData.logoUrl ? (
                        <div className="relative">
                          <img 
                            src={formData.logoUrl} 
                            alt="Logo preview" 
                            className="h-20 w-20 object-cover rounded-lg border"
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
                        <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors">
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
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'صيغ مدعومة: JPG, PNG, WEBP (حد أقصى 5 ميجابايت)' : 'Supported: JPG, PNG, WEBP (max 5MB)'}
                    </p>
                  </div>

                  {/* Cover Image Upload */}
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'صورة الغلاف' : 'Cover Image'}</Label>
                    <div className="flex items-center gap-4">
                      {formData.coverUrl ? (
                        <div className="relative w-full">
                          <img 
                            src={formData.coverUrl} 
                            alt="Cover preview" 
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
                        <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors w-full">
                          <Upload className="h-5 w-5" />
                          <span className="text-sm">{language === 'ar' ? 'رفع صورة الغلاف' : 'Upload Cover Image'}</span>
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
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'صيغ مدعومة: JPG, PNG, WEBP (حد أقصى 10 ميجابايت)' : 'Supported: JPG, PNG, WEBP (max 10MB)'}
                    </p>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">{language === 'ar' ? 'البريد الإلكتروني' : 'Contact Email'} *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => updateFormData('contactEmail', e.target.value)}
                      placeholder="contact@business.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">{language === 'ar' ? 'رقم الهاتف' : 'Contact Phone'} *</Label>
                    <PhoneInput
                      value={formData.contactPhone}
                      onChange={(value) => updateFormData('contactPhone', value)}
                      placeholder="+963 XX XXX XXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">{language === 'ar' ? 'الموقع الإلكتروني' : 'Website URL'}</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      value={formData.websiteUrl}
                      onChange={(e) => updateFormData('websiteUrl', e.target.value)}
                      placeholder="https://www.example.com"
                    />
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {language === 'ar' 
                        ? 'سيتم مراجعة عملك من قبل فريقنا. قد يستغرق الأمر بضعة أيام.' 
                        : 'Your business will be reviewed by our team. This may take a few days.'}
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1 || loading || uploading}
                >
                  {language === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                  {language === 'ar' ? 'السابق' : 'Back'}
                </Button>

                {step < totalSteps ? (
                  <Button type="button" onClick={handleNext} disabled={uploading}>
                    {language === 'ar' ? 'التالي' : 'Next'}
                    {language === 'ar' ? <ArrowLeft className="h-4 w-4 ml-2" /> : <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={loading || uploading}>
                    {loading || uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'إرسال' : 'Submit'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
