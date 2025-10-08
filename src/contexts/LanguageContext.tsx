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
      'nav.favorites': 'My Favorites',
      'nav.messages': 'Messages',
      'nav.rfqs': 'RFQs',
      // Analytics
      'analytics.noBusinessFound': 'No Business Found',
      'analytics.pleaseRegisterFirst': 'Please register a business first to view analytics',
      'analytics.loading': 'Loading analytics...',
      'analytics.title': 'Business Analytics',
      'analytics.trackPerformance': 'Track your business performance',
      'analytics.exportCSV': 'Export CSV',
      'analytics.profileViews': 'Profile Views',
      'analytics.totalVisits': 'Total profile visits',
      'analytics.conversations': 'Conversations',
      'analytics.unreadMessages': 'unread messages',
      'analytics.totalMessages': 'Total Messages',
      'analytics.allMessagesReceived': 'All messages received',
      'analytics.products': 'Products',
      'analytics.activeProducts': 'Active products',
      'analytics.visitorTrends': 'Visitor Trends',
      'analytics.dailyProfileViews': 'Daily profile views over the last',
      'analytics.days': 'days',
      'analytics.productEngagement': 'Product Engagement',
      'analytics.mostViewedProducts': 'Most viewed products in the last',
      'analytics.noDataYet': 'No data available yet',
      'analytics.views': 'Views',
      'analytics.uniqueViewers': 'Unique Viewers',
      
      // Validation errors
      'validation.emailInvalid': 'Invalid email format',
      'validation.emailTooLong': 'Email is too long',
      'validation.phoneTooShort': 'Phone number is too short',
      'validation.phoneTooLong': 'Phone number is too long',
      'validation.phoneFormat': 'Phone must include country code (e.g., +963...)',
      'validation.arabicRequired': 'must contain Arabic text',
      'validation.englishRequired': 'must contain English text only',
      'validation.fieldTooShort': 'is too short',
      'validation.fieldTooLong': 'is too long',
      'validation.required': 'This field is required',
      'validation.invalidUrl': 'Invalid URL format',
      'validation.yearInvalid': 'Invalid year',
      'analytics.productPerformance': 'Product Performance Details',
      'analytics.completeBreakdown': 'Complete breakdown of product engagement',
      'analytics.productName': 'Product Name',
      'analytics.totalViews': 'Total Views',
      'analytics.avgViewsPerViewer': 'Avg. Views/Viewer',
      'analytics.exportSuccess': 'Analytics exported successfully',
      'nav.myBusinesses': 'My Businesses',
      'nav.analytics': 'Analytics',
      'nav.registerBusiness': 'Register Business',
      'nav.profile': 'Profile',
      'nav.login': 'Login',
      'nav.register': 'Register',
      'nav.logout': 'Logout',

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
    'home.feature4.title': 'Open RFQ Marketplace',
    'home.feature4.desc': 'Post buying requests and receive competitive quotes from verified suppliers',
      
      // RFQ Marketplace
      'rfq.marketplace.title': 'RFQ Marketplace',
      'rfq.marketplace.description': 'Browse open and governmental RFQs from buyers looking for products and services',
      'rfq.createOpen': 'Create Open RFQ',
      'rfq.createOpenDesc': 'Post a public buying request to all suppliers on the platform',
      'rfq.type.label': 'RFQ Type',
      'rfq.type.open': 'Open RFQ',
      'rfq.type.openDesc': 'Public request to all suppliers',
      'rfq.type.governmental': 'Governmental RFQ',
      'rfq.type.govDesc': 'Government tender with transparent process',
      'rfq.created': 'RFQ created successfully',
      'rfq.error.create': 'Failed to create RFQ',
      'rfq.error.loading': 'Failed to load RFQs',
      'rfq.sendQuote': 'Send Quote',
      'rfq.noOpenRFQs': 'No open RFQs at the moment',
      'rfq.noGovRFQs': 'No governmental RFQs at the moment',
      'rfq.create': 'Create',
      
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
      
      // Categories
      'category.foodBeverages': 'Food & Beverages',
      'category.electronics': 'Electronics & Technology',
      'category.textiles': 'Textiles & Clothing',
      'category.industrial': 'Industrial Equipment',
      'category.petrochemicals': 'Petrochemicals',
      'category.crafts': 'Crafts & Handmade',
      'category.agriculture': 'Agriculture',
      'category.construction': 'Construction Materials',
      'category.chemicals': 'Chemicals',
      'category.machinery': 'Machinery',
      'category.furniture': 'Furniture',
      'category.pharmaceuticals': 'Pharmaceuticals',
      'category.automotive': 'Automotive',
      'category.energy': 'Energy',
      'category.other': 'Other',
      
      // RFQ
      'rfq.boardTitle': 'RFQ Board',
      'rfq.boardDescription': 'Browse active buying requests and submit your quotes',
      'rfq.searchPlaceholder': 'Search by product name...',
      'rfq.allCategories': 'All Categories',
      'rfq.allLocations': 'All Locations',
      'rfq.submitQuote': 'Submit Quote',
      'rfq.loginToQuote': 'Login to Quote',
      'rfq.noRequests': 'No Requests Found',
      'rfq.noRequestsDescription': 'There are no active RFQ requests matching your filters at the moment.',
      'rfq.requestQuote': 'Request Quote',
      'rfq.requestQuoteFrom': 'Request Quote from',
      'rfq.fillDetails': 'Fill in the details below to request a quote. Your request will be sent directly to the business.',
      'rfq.productCategory': 'Product Category',
      'rfq.selectCategory': 'Select category',
      'rfq.productName': 'Product Name',
      'rfq.quantity': 'Quantity',
      'rfq.unit': 'Unit',
      'rfq.unitPlaceholder': 'e.g., kg, pieces, boxes',
      'rfq.description': 'Description',
      'rfq.descriptionPlaceholder': 'Add any additional details...',
      'rfq.requiredBy': 'Required By',
      'rfq.budgetRange': 'Budget Range',
      'rfq.budgetPlaceholder': 'e.g., $5000-$10000',
      'rfq.deliveryLocation': 'Delivery Location',
      'rfq.deliveryPlaceholder': 'City, Country',
      'rfq.cancel': 'Cancel',
      'rfq.sendRequest': 'Send Request',
      'rfq.sending': 'Sending...',
      'rfq.error': 'Error',
      'rfq.errorSending': 'Failed to send RFQ request',
      'rfq.sent': 'Sent',
      'rfq.sentSuccess': 'RFQ request sent successfully',
      
      // Common
      'common.loading': 'Loading...',
      'common.noProductsYet': 'No products listed yet.',
      'common.review': 'review',
      'common.reviews': 'reviews',
      'common.price': 'Price',
      'common.all': 'All',
      'common.cancel': 'Cancel',
      'common.creating': 'Creating...',
      'common.loginRequired': 'Please login to continue',
      
      // Messaging
      'messages.title': 'Messages',
      'messages.noMessages': 'No messages yet',
      'messages.send': 'Send',
      'messages.writeMessage': 'Write a message...',
      'messages.templates': 'Templates',
      'messages.template.inquiry': 'Product Inquiry',
      'messages.template.pricing': 'Pricing Request',
      'messages.template.partnership': 'Partnership Proposal',
      'messages.search': 'Search conversations...',
      'messages.loading': 'Loading conversations...',
      'messages.noConversations': 'No conversations yet',
      'messages.noConversationsFound': 'No conversations found',
      'messages.browseBusiness': 'Browse Businesses',
      'messages.startConversation': 'Start a conversation',
      'messages.sendMessageTo': 'Send a message to',
      'messages.toBegin': 'to begin your conversation.',
      'messages.business': 'Business',
      'messages.yesterday': 'Yesterday',
      'messages.cannotMessageOwnBusiness': 'You cannot message your own business',
      'messages.businessNotFound': 'Business not found',
      'messages.failedToCreateConversation': 'Failed to create conversation',
      'messages.failedToSendMessage': 'Failed to send message',
      'messages.demoMessagingDisabled': 'Messaging is disabled for demo businesses',
      
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
      'auth.fullName': 'Full Name',
      
      // Filters & Browse
      'browse.allIndustries': 'All Industries',
      'browse.allTypes': 'All Types',
      'browse.allLocations': 'All Locations',
      'browse.verifiedOnly': 'Verified Only',
      'browse.sortBy': 'Sort By',
      'browse.clearAll': 'Clear All',
      'browse.result': 'Result',
      'browse.results': 'Results',
      'browse.active': 'Active',
      'sort.newest': 'Newest First',
      'sort.oldest': 'Oldest First',
      'sort.nameAsc': 'Name (A-Z)',
      'sort.nameDesc': 'Name (Z-A)',
    },
    ar: {
      // General
      'app.title': 'منصة التجارة السورية',
      'app.tagline': 'ربط المستوردين والمصدرين السوريين',
      'language': 'اللغة',
      
      // Navigation
      'nav.home': 'الرئيسية',
      'nav.browse': 'تصفح الشركات',
      'nav.favorites': 'المفضلة',
      'nav.messages': 'الرسائل',
      'nav.rfqs': 'طلبات الأسعار',
      // Analytics
      'analytics.noBusinessFound': 'لم يتم العثور على عمل',
      'analytics.pleaseRegisterFirst': 'يرجى تسجيل عمل أولاً لعرض التحليلات',
      'analytics.loading': 'جاري تحميل التحليلات...',
      'analytics.title': 'تحليلات العمل',
      'analytics.trackPerformance': 'تتبع أداء عملك',
      'analytics.exportCSV': 'تصدير CSV',
      'analytics.profileViews': 'مشاهدات الملف',
      'analytics.totalVisits': 'إجمالي زيارات الملف الشخصي',
      'analytics.conversations': 'المحادثات',
      'analytics.unreadMessages': 'رسائل غير مقروءة',
      'analytics.totalMessages': 'إجمالي الرسائل',
      'analytics.allMessagesReceived': 'جميع الرسائل المستلمة',
      'analytics.products': 'المنتجات',
      'analytics.activeProducts': 'منتجات نشطة',
      'analytics.visitorTrends': 'اتجاهات الزوار',
      'analytics.dailyProfileViews': 'مشاهدات الملف الشخصي اليومية خلال آخر',
      'analytics.days': 'يوم',
      'analytics.productEngagement': 'تفاعل المنتجات',
      'analytics.mostViewedProducts': 'المنتجات الأكثر مشاهدة في آخر',
      'analytics.noDataYet': 'لا توجد بيانات متاحة بعد',
      'analytics.views': 'المشاهدات',
      'analytics.uniqueViewers': 'المشاهدون الفريدون',
      
      // Validation errors
      'validation.emailInvalid': 'صيغة البريد الإلكتروني غير صحيحة',
      'validation.emailTooLong': 'البريد الإلكتروني طويل جداً',
      'validation.phoneTooShort': 'رقم الهاتف قصير جداً',
      'validation.phoneTooLong': 'رقم الهاتف طويل جداً',
      'validation.phoneFormat': 'يجب أن يتضمن رمز الدولة (مثال: +963...)',
      'validation.arabicRequired': 'يجب أن يحتوي على نص عربي',
      'validation.englishRequired': 'يجب أن يحتوي على نص إنجليزي فقط',
      'validation.fieldTooShort': 'قصير جداً',
      'validation.fieldTooLong': 'طويل جداً',
      'validation.required': 'هذا الحقل مطلوب',
      'validation.invalidUrl': 'صيغة الرابط غير صحيحة',
      'validation.yearInvalid': 'سنة غير صحيحة',
      'analytics.productPerformance': 'تفاصيل أداء المنتج',
      'analytics.completeBreakdown': 'تفصيل كامل لتفاعل المنتج',
      'analytics.productName': 'اسم المنتج',
      'analytics.totalViews': 'إجمالي المشاهدات',
      'analytics.avgViewsPerViewer': 'متوسط المشاهدات/مشاهد',
      'analytics.exportSuccess': 'تم تصدير التحليلات بنجاح',
      'nav.myBusinesses': 'أعمالي',
      'nav.analytics': 'التحليلات',
      'nav.registerBusiness': 'تسجيل شركة',
      'nav.profile': 'الملف الشخصي',
      'nav.login': 'تسجيل الدخول',
      'nav.register': 'التسجيل',
      'nav.logout': 'تسجيل الخروج',

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
      'home.feature4.title': 'سوق طلبات التسعير المفتوح',
      'home.feature4.desc': 'انشر طلبات الشراء واحصل على عروض أسعار تنافسية من موردين معتمدين',
      
      // RFQ Marketplace
      'rfq.marketplace.title': 'سوق طلبات التسعير',
      'rfq.marketplace.description': 'تصفح طلبات التسعير المفتوحة والحكومية من المشترين الذين يبحثون عن منتجات وخدمات',
      'rfq.createOpen': 'إنشاء طلب تسعير مفتوح',
      'rfq.createOpenDesc': 'انشر طلب شراء عام لجميع الموردين على المنصة',
      'rfq.type.label': 'نوع طلب التسعير',
      'rfq.type.open': 'طلب تسعير مفتوح',
      'rfq.type.openDesc': 'طلب عام لجميع الموردين',
      'rfq.type.governmental': 'طلب تسعير حكومي',
      'rfq.type.govDesc': 'مناقصة حكومية بعملية شفافة',
      'rfq.created': 'تم إنشاء طلب التسعير بنجاح',
      'rfq.error.create': 'فشل إنشاء طلب التسعير',
      'rfq.error.loading': 'فشل تحميل طلبات التسعير',
      'rfq.sendQuote': 'إرسال عرض سعر',
      'rfq.noOpenRFQs': 'لا توجد طلبات تسعير مفتوحة في الوقت الحالي',
      'rfq.noGovRFQs': 'لا توجد طلبات تسعير حكومية في الوقت الحالي',
      'rfq.create': 'إنشاء',
      
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
      
      // Categories
      'category.foodBeverages': 'الأغذية والمشروبات',
      'category.electronics': 'الإلكترونيات والتكنولوجيا',
      'category.textiles': 'المنسوجات والملابس',
      'category.industrial': 'المعدات الصناعية',
      'category.petrochemicals': 'البتروكيماويات',
      'category.crafts': 'الحرف اليدوية',
      'category.agriculture': 'الزراعة',
      'category.construction': 'مواد البناء',
      'category.chemicals': 'الكيماويات',
      'category.machinery': 'الآلات',
      'category.furniture': 'الأثاث',
      'category.pharmaceuticals': 'الأدوية',
      'category.automotive': 'السيارات',
      'category.energy': 'الطاقة',
      'category.other': 'أخرى',
      
      // RFQ
      'rfq.boardTitle': 'لوحة طلبات الأسعار',
      'rfq.boardDescription': 'تصفح طلبات الشراء النشطة وقدم عروض الأسعار الخاصة بك',
      'rfq.searchPlaceholder': 'البحث باسم المنتج...',
      'rfq.allCategories': 'جميع الفئات',
      'rfq.allLocations': 'جميع المواقع',
      'rfq.submitQuote': 'تقديم عرض',
      'rfq.loginToQuote': 'تسجيل الدخول لتقديم عرض',
      'rfq.noRequests': 'لا توجد طلبات',
      'rfq.noRequestsDescription': 'لا توجد طلبات أسعار نشطة تطابق المعايير الخاصة بك في الوقت الحالي.',
      'rfq.requestQuote': 'طلب عرض سعر',
      'rfq.requestQuoteFrom': 'طلب عرض سعر من',
      'rfq.fillDetails': 'املأ التفاصيل أدناه لطلب عرض سعر. سيتم إرسال طلبك مباشرة إلى الشركة.',
      'rfq.productCategory': 'فئة المنتج',
      'rfq.selectCategory': 'اختر الفئة',
      'rfq.productName': 'اسم المنتج',
      'rfq.quantity': 'الكمية',
      'rfq.unit': 'الوحدة',
      'rfq.unitPlaceholder': 'مثال: كجم، قطعة، صندوق',
      'rfq.description': 'الوصف',
      'rfq.descriptionPlaceholder': 'أضف أي تفاصيل إضافية...',
      'rfq.requiredBy': 'مطلوب بتاريخ',
      'rfq.budgetRange': 'نطاق الميزانية',
      'rfq.budgetPlaceholder': 'مثال: $5000-$10000',
      'rfq.deliveryLocation': 'موقع التسليم',
      'rfq.deliveryPlaceholder': 'المدينة، الدولة',
      'rfq.cancel': 'إلغاء',
      'rfq.sendRequest': 'إرسال الطلب',
      'rfq.sending': 'جاري الإرسال...',
      'rfq.error': 'خطأ',
      'rfq.errorSending': 'فشل في إرسال طلب عرض السعر',
      'rfq.sent': 'تم الإرسال',
      'rfq.sentSuccess': 'تم إرسال طلب عرض السعر بنجاح',
      
      // Common
      'common.loading': 'جاري التحميل...',
      'common.noProductsYet': 'لا توجد منتجات مدرجة بعد.',
      'common.review': 'تقييم',
      'common.reviews': 'تقييمات',
      'common.price': 'السعر',
      'common.all': 'الكل',
      'common.cancel': 'إلغاء',
      'common.creating': 'جاري الإنشاء...',
      'common.loginRequired': 'يرجى تسجيل الدخول للمتابعة',
      
      // Messaging
      'messages.title': 'الرسائل',
      'messages.noMessages': 'لا توجد رسائل حتى الآن',
      'messages.send': 'إرسال',
      'messages.writeMessage': 'اكتب رسالة...',
      'messages.templates': 'القوالب',
      'messages.template.inquiry': 'استفسار عن منتج',
      'messages.template.pricing': 'طلب تسعير',
      'messages.template.partnership': 'اقتراح شراكة',
      'messages.search': 'البحث في المحادثات...',
      'messages.loading': 'جاري تحميل المحادثات...',
      'messages.noConversations': 'لا توجد محادثات حتى الآن',
      'messages.noConversationsFound': 'لم يتم العثور على محادثات',
      'messages.browseBusiness': 'تصفح الشركات',
      'messages.startConversation': 'ابدأ محادثة',
      'messages.sendMessageTo': 'أرسل رسالة إلى',
      'messages.toBegin': 'لبدء محادثتك.',
      'messages.business': 'شركة',
      'messages.yesterday': 'أمس',
      'messages.cannotMessageOwnBusiness': 'لا يمكنك مراسلة شركتك الخاصة',
      'messages.businessNotFound': 'لم يتم العثور على الشركة',
      'messages.failedToCreateConversation': 'فشل في إنشاء محادثة',
      'messages.failedToSendMessage': 'فشل في إرسال الرسالة',
      'messages.demoMessagingDisabled': 'المراسلة غير متاحة للشركات التجريبية',
      
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
      'auth.fullName': 'الاسم الكامل',
      
      // Filters & Browse
      'browse.allIndustries': 'جميع الصناعات',
      'browse.allTypes': 'جميع الأنواع',
      'browse.allLocations': 'جميع المواقع',
      'browse.verifiedOnly': 'موثقة فقط',
      'browse.sortBy': 'ترتيب حسب',
      'browse.clearAll': 'مسح الكل',
      'browse.result': 'نتيجة',
      'browse.results': 'نتائج',
      'browse.active': 'نشط',
      'sort.newest': 'الأحدث أولاً',
      'sort.oldest': 'الأقدم أولاً',
      'sort.nameAsc': 'الاسم (أ-ي)',
      'sort.nameDesc': 'الاسم (ي-أ)',
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
