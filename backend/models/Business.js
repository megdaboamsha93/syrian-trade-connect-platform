const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  nameEn: {
    type: String,
    required: [true, 'Product name in English is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  nameAr: {
    type: String,
    required: [true, 'Product name in Arabic is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  descriptionEn: {
    type: String,
    required: [true, 'Product description in English is required'],
    maxlength: [1000, 'Product description cannot exceed 1000 characters']
  },
  descriptionAr: {
    type: String,
    required: [true, 'Product description in Arabic is required'],
    maxlength: [1000, 'Product description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Product category is required']
  },
  subcategory: String,
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  specifications: [{
    nameEn: String,
    nameAr: String,
    value: String,
    unit: String
  }],
  pricing: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'SYP', 'TRY']
    },
    minPrice: {
      type: Number,
      min: [0, 'Price cannot be negative']
    },
    maxPrice: {
      type: Number,
      min: [0, 'Price cannot be negative']
    },
    priceUnit: String,
    priceType: {
      type: String,
      enum: ['fixed', 'negotiable', 'quote_required'],
      default: 'negotiable'
    }
  },
  availability: {
    inStock: {
      type: Boolean,
      default: true
    },
    quantity: {
      type: Number,
      min: [0, 'Quantity cannot be negative']
    },
    minOrderQuantity: {
      type: Number,
      min: [1, 'Minimum order quantity must be at least 1']
    },
    leadTime: String
  },
  certifications: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const businessSchema = new mongoose.Schema({
  // Basic Information
  nameEn: {
    type: String,
    required: [true, 'Business name in English is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  nameAr: {
    type: String,
    required: [true, 'Business name in Arabic is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  descriptionEn: {
    type: String,
    required: [true, 'Business description in English is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  descriptionAr: {
    type: String,
    required: [true, 'Business description in Arabic is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Business Details
  businessType: {
    type: String,
    enum: ['importer', 'exporter', 'both'],
    required: [true, 'Business type is required']
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: ['manufacturing', 'agriculture', 'textiles', 'materials', 'services', 'technology', 'food', 'chemicals', 'automotive', 'construction']
  },
  subIndustries: [String],
  foundedYear: {
    type: Number,
    required: [true, 'Founded year is required'],
    min: [1900, 'Founded year must be after 1900'],
    max: [new Date().getFullYear(), 'Founded year cannot be in the future']
  },
  employeeCount: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    required: [true, 'Employee count is required']
  },
  annualRevenue: {
    type: String,
    enum: ['under_100k', '100k_500k', '500k_1m', '1m_5m', '5m_10m', '10m_plus']
  },
  
  // Location
  location: {
    city: {
      type: String,
      required: [true, 'City is required']
    },
    governorate: {
      type: String,
      required: [true, 'Governorate is required']
    },
    country: {
      type: String,
      default: 'Syria'
    },
    address: String,
    postalCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Contact Information
  contactInfo: {
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    fax: String,
    website: String,
    socialMedia: {
      facebook: String,
      linkedin: String,
      twitter: String,
      instagram: String
    }
  },
  
  // Media
  logoUrl: String,
  coverUrl: String,
  gallery: [{
    url: String,
    caption: String,
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    }
  }],
  
  // Verification & Trust
  verified: {
    type: Boolean,
    default: false
  },
  verificationLevel: {
    type: String,
    enum: ['none', 'basic', 'enhanced', 'premium'],
    default: 'none'
  },
  verifiedAt: Date,
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['business_license', 'tax_certificate', 'export_license', 'quality_certificate', 'bank_statement']
    },
    url: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: Date,
    notes: String
  }],
  
  // Products & Services
  products: [productSchema],
  
  // Business Capabilities
  capabilities: {
    exportMarkets: [String],
    importSources: [String],
    paymentMethods: [String],
    shippingMethods: [String],
    qualityCertifications: [String],
    languages: [String]
  },
  
  // Business Metrics
  metrics: {
    profileViews: {
      type: Number,
      default: 0
    },
    inquiriesReceived: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageResponseTime: Number, // in hours
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    },
    totalTransactions: {
      type: Number,
      default: 0
    }
  },
  
  // Settings
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowDirectContact: {
      type: Boolean,
      default: true
    },
    autoReply: {
      enabled: {
        type: Boolean,
        default: false
      },
      messageEn: String,
      messageAr: String
    },
    showPricing: {
      type: Boolean,
      default: false
    }
  },
  
  // Owner
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Business owner is required']
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_approval'],
    default: 'pending_approval'
  },
  
  // SEO
  keywords: [String],
  tags: [String]
}, {
  timestamps: true
});

// Indexes for search optimization
businessSchema.index({ 
  nameEn: 'text', 
  nameAr: 'text', 
  descriptionEn: 'text', 
  descriptionAr: 'text',
  keywords: 'text'
});
businessSchema.index({ businessType: 1, industry: 1 });
businessSchema.index({ 'location.city': 1, 'location.governorate': 1 });
businessSchema.index({ verified: 1, status: 1 });
businessSchema.index({ createdAt: -1 });
businessSchema.index({ slug: 1 });
businessSchema.index({ owner: 1 });

// Generate slug before saving
businessSchema.pre('save', function(next) {
  if (this.isModified('nameEn') || this.isNew) {
    this.slug = slugify(this.nameEn, { lower: true, strict: true });
  }
  next();
});

// Virtual for profile completion percentage
businessSchema.virtual('profileCompleteness').get(function() {
  let score = 0;
  const maxScore = 100;
  
  // Basic info (30 points)
  if (this.nameEn && this.nameAr) score += 5;
  if (this.descriptionEn && this.descriptionAr) score += 10;
  if (this.businessType && this.industry) score += 10;
  if (this.foundedYear && this.employeeCount) score += 5;
  
  // Contact info (20 points)
  if (this.contactInfo.email && this.contactInfo.phone) score += 20;
  
  // Media (20 points)
  if (this.logoUrl) score += 10;
  if (this.coverUrl) score += 10;
  
  // Products (20 points)
  if (this.products && this.products.length > 0) score += 20;
  
  // Verification (10 points)
  if (this.verified) score += 10;
  
  return Math.round((score / maxScore) * 100);
});

// Methods
businessSchema.methods.incrementViews = function() {
  this.metrics.profileViews += 1;
  return this.save();
};

businessSchema.methods.updateRating = function(newRating) {
  const currentTotal = this.metrics.rating.average * this.metrics.rating.count;
  this.metrics.rating.count += 1;
  this.metrics.rating.average = Number(((currentTotal + newRating) / this.metrics.rating.count).toFixed(2));
  return this.save();
};

businessSchema.methods.incrementInquiries = function() {
  this.metrics.inquiriesReceived += 1;
  return this.save();
};

// Transform output
businessSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Business', businessSchema); 