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
import { Loader2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const BUSINESS_TYPES = ['importer', 'exporter', 'both'] as const;
const INDUSTRIES = [
  'Agriculture', 'Textiles', 'Food & Beverages', 'Construction Materials',
  'Chemicals', 'Electronics', 'Machinery', 'Furniture', 'Pharmaceuticals',
  'Automotive', 'Energy', 'Services', 'Other'
];

export default function RegisterBusiness() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
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
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.nameEn.trim() || !formData.nameAr.trim()) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' ? 'يرجى إدخال اسم العمل بالعربي والإنجليزي' : 'Please enter business name in both English and Arabic',
            variant: 'destructive',
          });
          return false;
        }
        if (!formData.businessType) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' ? 'يرجى اختيار نوع العمل' : 'Please select business type',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      case 2:
        if (!formData.industry || !formData.location) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      case 3:
        if (!formData.contactEmail.trim() || !formData.contactPhone.trim()) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' ? 'يرجى إدخال البريد الإلكتروني ورقم الهاتف' : 'Please enter email and phone number',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      default:
        return true;
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
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'You must be logged in',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('businesses')
        .insert({
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
          is_verified: false,
        });

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم التسجيل بنجاح!' : 'Successfully Registered!',
        description: language === 'ar' 
          ? 'تم تسجيل عملك. سيتم مراجعته قريباً.' 
          : 'Your business has been registered. It will be reviewed soon.',
      });

      navigate('/browse');
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
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
        <Card>
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
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
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
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => updateFormData('contactPhone', e.target.value)}
                      placeholder="+963 XX XXX XXXX"
                      required
                      dir="ltr"
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
                  disabled={step === 1 || loading}
                >
                  {language === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                  {language === 'ar' ? 'السابق' : 'Back'}
                </Button>

                {step < totalSteps ? (
                  <Button type="button" onClick={handleNext}>
                    {language === 'ar' ? 'التالي' : 'Next'}
                    {language === 'ar' ? <ArrowLeft className="h-4 w-4 ml-2" /> : <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
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
