import React, { createContext, useContext, useEffect, useState } from 'react';

type LanguageContextType = {
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
  dir: 'ltr' | 'rtl';
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<'en' | 'ar'>('en');
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  // Translations
  const translations = {
    en: {
      // General
      'app.title': 'Syrian Trade Connect',
      'app.tagline': 'Connecting Syrian Importers & Exporters',
      'language': 'Language',
      
      // Navigation
      'nav.home': 'Home',
      'nav.browse': 'Browse Businesses',
      'nav.messages': 'Messages',
      'nav.profile': 'Profile',
      'nav.login': 'Login',
      'nav.register': 'Register',

      // Home
      'home.hero.title': 'Connecting Syrian Businesses Globally',
      'home.hero.subtitle': 'Find reliable import and export partners across industries',
      'home.cta.browse': 'Browse Businesses',
      'home.cta.register': 'Register Your Business',
      'home.features.title': 'Platform Features',
      'home.feature1.title': 'Verified Business Profiles',
      'home.feature1.desc': 'Connect with legitimate and verified Syrian businesses',
      'home.feature2.title': 'Industry Categorization',
      'home.feature2.desc': 'Find partners in your specific industry segment',
      'home.feature3.title': 'Direct Messaging',
      'home.feature3.desc': 'Communicate directly with potential trade partners',
      
      // Browse
      'browse.title': 'Browse Businesses',
      'browse.filter': 'Filter',
      'browse.search': 'Search businesses...',
      'browse.industry': 'Industry',
      'browse.type': 'Business Type',
      'browse.location': 'Location',
      'browse.type.importer': 'Importer',
      'browse.type.exporter': 'Exporter',
      'browse.type.both': 'Both',
      'browse.results': 'Results',
      'browse.noResults': 'No businesses found',
      
      // Business Profile
      'business.contact': 'Contact',
      'business.message': 'Send Message',
      'business.about': 'About',
      'business.products': 'Products & Services',
      'business.details': 'Business Details',
      'business.founded': 'Founded',
      'business.employees': 'Employees',
      'business.type': 'Business Type',
      'business.verified': 'Verified',
      
      // Industries
      'industry.manufacturing': 'Manufacturing',
      'industry.agriculture': 'Agriculture',
      'industry.textiles': 'Textiles',
      'industry.materials': 'Materials',
      'industry.services': 'Services',
      
      // Messaging
      'messages.title': 'Messages',
      'messages.noMessages': 'No messages yet',
      'messages.send': 'Send',
      'messages.writeMessage': 'Write a message...',
      'messages.templates': 'Templates',
      'messages.template.inquiry': 'Product Inquiry',
      'messages.template.pricing': 'Pricing Request',
      'messages.template.partnership': 'Partnership Proposal',
      
      // Auth
      'auth.login': 'Login',
      'auth.register': 'Register',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.noAccount': 'Don\'t have an account?',
      'auth.hasAccount': 'Already have an account?',
      'auth.businessName': 'Business Name',
      'auth.businessType': 'Business Type',
      'auth.industry': 'Industry',
      'auth.firstName': 'First Name',
      'auth.lastName': 'Last Name',
    },
    ar: {
      // General
      'app.title': 'منصة التجارة السورية',
      'app.tagline': 'ربط المستوردين والمصدرين السوريين',
      'language': 'اللغة',
      
      // Navigation
      'nav.home': 'الرئيسية',
      'nav.browse': 'تصفح الشركات',
      'nav.messages': 'الرسائل',
      'nav.profile': 'الملف الشخصي',
      'nav.login': 'تسجيل الدخول',
      'nav.register': 'التسجيل',

      // Home
      'home.hero.title': 'ربط الشركات السورية عالمياً',
      'home.hero.subtitle': 'ابحث عن شركاء استيراد وتصدير موثوقين عبر مختلف الصناعات',
      'home.cta.browse': 'تصفح الشركات',
      'home.cta.register': 'سجل شركتك',
      'home.features.title': 'ميزات المنصة',
      'home.feature1.title': 'ملفات شركات موثقة',
      'home.feature1.desc': 'تواصل مع شركات سورية موثوقة ومُتحقق منها',
      'home.feature2.title': 'تصنيف حسب الصناعة',
      'home.feature2.desc': 'ابحث عن شركاء في قطاع صناعتك المحدد',
      'home.feature3.title': 'مراسلة مباشرة',
      'home.feature3.desc': 'تواصل مباشرة مع شركاء تجاريين محتملين',
      
      // Browse
      'browse.title': 'تصفح الشركات',
      'browse.filter': 'تصفية',
      'browse.search': 'البحث عن شركات...',
      'browse.industry': 'الصناعة',
      'browse.type': 'نوع الشركة',
      'browse.location': 'الموقع',
      'browse.type.importer': 'مستورد',
      'browse.type.exporter': 'مصدر',
      'browse.type.both': 'كلاهما',
      'browse.results': 'النتائج',
      'browse.noResults': 'لم يتم العثور على شركات',
      
      // Business Profile
      'business.contact': 'التواصل',
      'business.message': 'إرسال رسالة',
      'business.about': 'نبذة عن الشركة',
      'business.products': 'المنتجات والخدمات',
      'business.details': 'تفاصيل الشركة',
      'business.founded': 'تأسست عام',
      'business.employees': 'عدد الموظفين',
      'business.type': 'نوع الشركة',
      'business.verified': 'موثقة',
      
      // Industries
      'industry.manufacturing': 'التصنيع',
      'industry.agriculture': 'الزراعة',
      'industry.textiles': 'المنسوجات',
      'industry.materials': 'المواد الخام',
      'industry.services': 'الخدمات',
      
      // Messaging
      'messages.title': 'الرسائل',
      'messages.noMessages': 'لا توجد رسائل حتى الآن',
      'messages.send': 'إرسال',
      'messages.writeMessage': 'اكتب رسالة...',
      'messages.templates': 'القوالب',
      'messages.template.inquiry': 'استفسار عن منتج',
      'messages.template.pricing': 'طلب تسعير',
      'messages.template.partnership': 'اقتراح شراكة',
      
      // Auth
      'auth.login': 'تسجيل الدخول',
      'auth.register': 'التسجيل',
      'auth.email': 'البريد الإلكتروني',
      'auth.password': 'كلمة المرور',
      'auth.forgotPassword': 'نسيت كلمة المرور؟',
      'auth.noAccount': 'ليس لديك حساب؟',
      'auth.hasAccount': 'لديك حساب بالفعل؟',
      'auth.businessName': 'اسم الشركة',
      'auth.businessType': 'نوع الشركة',
      'auth.industry': 'الصناعة',
      'auth.firstName': 'الاسم الأول',
      'auth.lastName': 'اسم العائلة',
    }
  };

  const setLanguage = (lang: 'en' | 'ar') => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'en' | 'ar';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    } else {
      // Default to browser language or navigator settings
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'ar') {
        setLanguage('ar');
      }
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
