export type BusinessType = 'importer' | 'exporter' | 'both';

export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
}

export interface Business {
  id: string;
  nameEn: string;
  nameAr: string;
  logoUrl: string;
  coverUrl: string;
  foundedYear: number;
  employeeCount: string;
  industry: string;
  businessType: BusinessType;
  location: string;
  verified: boolean;
  descriptionEn: string;
  descriptionAr: string;
  contactEmail: string;
  contactPhone: string;
  products: Product[];
}

export const businesses: Business[] = [
  {
    id: '1',
    nameEn: 'Al-Durra Textiles',
    nameAr: 'شركة الدرة للنسيج',
    logoUrl: 'https://placeholder.com/wp-content/uploads/2018/10/placeholder.com-logo3.jpg',
    coverUrl: 'https://tinyurl.com/4hb6vdb8',
    foundedYear: 1998,
    employeeCount: '50-100',
    industry: 'textiles',
    businessType: 'exporter',
    location: 'Damascus',
    verified: true,
    descriptionEn: 'Al-Durra is a leading textile manufacturer specializing in high-quality fabrics for the fashion and home furnishing industries. Our products are exported to countries across the Middle East and Europe.',
    descriptionAr: 'الدرة هي شركة رائدة في صناعة النسيج متخصصة في الأقمشة عالية الجودة لصناعات الأزياء والمفروشات المنزلية. يتم تصدير منتجاتنا إلى دول في جميع أنحاء الشرق الأوسط وأوروبا.',
    contactEmail: 'info@aldurra.com',
    contactPhone: '+963-11-1234567',
    products: [
      {
        id: '1-1',
        nameEn: 'Cotton Fabric',
        nameAr: 'قماش قطني',
        descriptionEn: 'Premium quality cotton fabric suitable for garments and home textiles.',
        descriptionAr: 'قماش قطني عالي الجودة مناسب للملابس والمنسوجات المنزلية.',
        image: 'https://images.unsplash.com/photo-1498998754966-9f372c31a999'
      },
      {
        id: '1-2',
        nameEn: 'Silk Blend',
        nameAr: 'مزيج حرير',
        descriptionEn: 'Luxury silk blend fabrics for high-end fashion design.',
        descriptionAr: 'أقمشة مزيج الحرير الفاخرة لتصميم الأزياء الراقية.',
        image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa'
      }
    ]
  },
  {
    id: '2',
    nameEn: 'Syrian Olive Treasures',
    nameAr: 'كنوز الزيتون السوري',
    logoUrl: 'https://placeholder.com/wp-content/uploads/2018/10/placeholder.com-logo1.jpg',
    coverUrl: 'https://tinyurl.com/mssfvhvv',
    foundedYear: 2005,
    employeeCount: '10-50',
    industry: 'agriculture',
    businessType: 'exporter',
    location: 'Aleppo',
    verified: true,
    descriptionEn: 'Syrian Olive Treasures produces premium olive oil and olive-based products. Our orchards are located in the fertile regions of Syria known for producing high-quality olive varieties.',
    descriptionAr: 'تنتج كنوز الزيتون السوري زيت الزيتون الممتاز والمنتجات القائمة على الزيتون. تقع بساتيننا في المناطق الخصبة من سوريا المعروفة بإنتاج أصناف زيتون عالية الجودة.',
    contactEmail: 'sales@syrianolive.com',
    contactPhone: '+963-21-9876543',
    products: [
      {
        id: '2-1',
        nameEn: 'Extra Virgin Olive Oil',
        nameAr: 'زيت زيتون بكر ممتاز',
        descriptionEn: 'Cold-pressed extra virgin olive oil from Syrian orchards.',
        descriptionAr: 'زيت زيتون بكر ممتاز معصور على البارد من البساتين السورية.',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'
      },
      {
        id: '2-2',
        nameEn: 'Olive Soap',
        nameAr: 'صابون الزيتون',
        descriptionEn: 'Natural olive soap made using traditional methods.',
        descriptionAr: 'صابون زيتون طبيعي مصنوع باستخدام طرق تقليدية.',
        image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f'
      }
    ]
  },
  {
    id: '3',
    nameEn: 'Damascus Steel Imports',
    nameAr: 'استيراد دمشق للصلب',
    logoUrl: 'https://placeholder.com/wp-content/uploads/2018/10/placeholder.com-logo4.jpg',
    coverUrl: 'https://tinyurl.com/4anb4v4n',
    foundedYear: 2010,
    employeeCount: '10-50',
    industry: 'materials',
    businessType: 'importer',
    location: 'Damascus',
    verified: false,
    descriptionEn: 'Damascus Steel Imports specializes in importing high-quality steel and metal products for the Syrian construction and manufacturing industries.',
    descriptionAr: 'استيراد دمشق للصلب متخصصة في استيراد منتجات الصلب والمعادن عالية الجودة لصناعات البناء والتصنيع السورية.',
    contactEmail: 'info@damascussteel.com',
    contactPhone: '+963-11-5557777',
    products: [
      {
        id: '3-1',
        nameEn: 'Construction Steel',
        nameAr: 'صلب البناء',
        descriptionEn: 'High-grade steel for construction projects.',
        descriptionAr: 'صلب عالي الجودة لمشاريع البناء.',
        image: 'https://images.unsplash.com/photo-1578658546705-07f84575eda8'
      }
    ]
  },
  {
    id: '4',
    nameEn: 'Syrian Nuts & Dried Fruits Co.',
    nameAr: 'شركة المكسرات والفواكه المجففة السورية',
    logoUrl: 'https://placeholder.com/wp-content/uploads/2018/10/placeholder.com-logo5.jpg',
    coverUrl: 'https://rb.gy/qy6l9y',
    foundedYear: 2002,
    employeeCount: '50-100',
    industry: 'agriculture',
    businessType: 'both',
    location: 'Homs',
    verified: true,
    descriptionEn: 'We export premium Syrian pistachios, almonds, and dried fruits while importing packaging machinery to enhance our production capabilities.',
    descriptionAr: 'نقوم بتصدير الفستق الحلبي واللوز والفواكه المجففة السورية عالية الجودة، بينما نستورد آلات التعبئة والتغليف لتعزيز قدراتنا الإنتاجية.',
    contactEmail: 'contact@syriannuts.com',
    contactPhone: '+963-31-4445555',
    products: [
      {
        id: '4-1',
        nameEn: 'Premium Pistachios',
        nameAr: 'فستق حلبي ممتاز',
        descriptionEn: 'Carefully selected Syrian pistachios known worldwide for their quality.',
        descriptionAr: 'فستق حلبي سوري منتقى بعناية ومعروف عالميًا بجودته.',
        image: 'https://images.unsplash.com/photo-1578662411101-c4e9a5604711'
      },
      {
        id: '4-2',
        nameEn: 'Dried Apricots',
        nameAr: 'مشمش مجفف',
        descriptionEn: 'Sun-dried apricots with no added preservatives.',
        descriptionAr: 'مشمش مجفف بالشمس بدون إضافة مواد حافظة.',
        image: 'https://images.unsplash.com/photo-1599639957043-f9a27eb31441'
      }
    ]
  },
  {
    id: '5',
    nameEn: 'Al-Sham Machinery',
    nameAr: 'آلات الشام',
    logoUrl: 'https://placeholder.com/wp-content/uploads/2018/10/placeholder.com-logo2.jpg',
    coverUrl: 'https://rb.gy/mnyguj',
    foundedYear: 1995,
    employeeCount: '100-500',
    industry: 'manufacturing',
    businessType: 'both',
    location: 'Latakia',
    verified: true,
    descriptionEn: 'Al-Sham Machinery manufactures food processing equipment while importing specialized industrial components for the Syrian manufacturing sector.',
    descriptionAr: 'تقوم آلات الشام بتصنيع معدات تجهيز الأغذية واستيراد مكونات صناعية متخصصة لقطاع التصنيع السوري.',
    contactEmail: 'info@alshammachinery.com',
    contactPhone: '+963-41-8889999',
    products: [
      {
        id: '5-1',
        nameEn: 'Food Packaging Lines',
        nameAr: 'خطوط تعبئة الأغذية',
        descriptionEn: 'Complete food packaging solutions for commercial food producers.',
        descriptionAr: 'حلول متكاملة لتعبئة الأغذية لمنتجي الأغذية التجاريين.',
        image: 'https://images.unsplash.com/photo-1586528116493-7f9957181b53'
      }
    ]
  },
  {
    id: '6',
    nameEn: 'Syrian Tech Solutions',
    nameAr: 'الحلول التقنية السورية',
    logoUrl: 'https://placeholder.com/wp-content/uploads/2018/10/placeholder.com-logo3.jpg',
    coverUrl: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7',
    foundedYear: 2012,
    employeeCount: '10-50',
    industry: 'services',
    businessType: 'importer',
    location: 'Damascus',
    verified: false,
    descriptionEn: 'Syrian Tech Solutions provides IT services and imports computing hardware for businesses across Syria.',
    descriptionAr: 'توفر الحلول التقنية السورية خدمات تكنولوجيا المعلومات وتستورد أجهزة الحوسبة للشركات في جميع أنحاء سوريا.',
    contactEmail: 'support@syriantech.com',
    contactPhone: '+963-11-7778888',
    products: [
      {
        id: '6-1',
        nameEn: 'Business Computing Hardware',
        nameAr: 'أجهزة حوسبة للشركات',
        descriptionEn: 'High-performance computers and networking equipment for businesses.',
        descriptionAr: 'أجهزة كمبيوتر عالية الأداء ومعدات شبكات للشركات.',
        image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b'
      },
      {
        id: '6-2',
        nameEn: 'IT Consulting Services',
        nameAr: 'خدمات استشارات تكنولوجيا المعلومات',
        descriptionEn: 'Expert IT consulting for Syrian businesses.',
        descriptionAr: 'استشارات خبيرة في تكنولوجيا المعلومات للشركات السورية.',
        image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998'
      }
    ]
  },
];

// Sample data for conversations
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
}

export const conversations: Conversation[] = [
  {
    id: '1',
    participants: ['1', '3'],
    messages: [
      {
        id: '1-1',
        senderId: '3',
        receiverId: '1',
        content: 'Hello, I am interested in your cotton fabrics. Do you have any available for immediate export?',
        timestamp: '2023-05-15T10:30:00',
        read: true
      },
      {
        id: '1-2',
        senderId: '1',
        receiverId: '3',
        content: 'Yes, we currently have 5,000 meters of premium cotton fabric available. Would you like to receive samples?',
        timestamp: '2023-05-15T11:45:00',
        read: true
      },
      {
        id: '1-3',
        senderId: '3',
        receiverId: '1',
        content: 'That would be great. Could you also provide a price quotation for 1,000 meters?',
        timestamp: '2023-05-16T09:20:00',
        read: false
      }
    ]
  },
  {
    id: '2',
    participants: ['2', '4'],
    messages: [
      {
        id: '2-1',
        senderId: '4',
        receiverId: '2',
        content: 'I would like to discuss a potential partnership for olive oil distribution in new markets.',
        timestamp: '2023-06-01T14:00:00',
        read: true
      },
      {
        id: '2-2',
        senderId: '2',
        receiverId: '4',
        content: 'We are always interested in expanding our distribution network. Could you share more details about the markets you are considering?',
        timestamp: '2023-06-02T10:15:00',
        read: true
      }
    ]
  }
];
