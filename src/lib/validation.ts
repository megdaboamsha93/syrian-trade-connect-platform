import { z } from 'zod';

// Email validation with proper format checking
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .refine((email) => {
    // Additional email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, 'Invalid email format');

// Phone validation  
export const phoneSchema = z
  .string()
  .min(10, 'Phone number too short')
  .max(20, 'Phone number too long')
  .refine((phone) => {
    // Must start with + and contain only digits after
    return /^\+\d+$/.test(phone);
  }, 'Phone must include country code (e.g., +963...)');

// Arabic text validation (prevents English in Arabic fields)
export const arabicTextSchema = (fieldName: string) =>
  z.string()
    .min(2, `${fieldName} is too short`)
    .max(200, `${fieldName} is too long`)
    .refine((text) => {
      // Check if contains Arabic characters
      const arabicRegex = /[\u0600-\u06FF]/;
      return arabicRegex.test(text);
    }, `${fieldName} must contain Arabic text`);

// English text validation (prevents Arabic in English fields)
export const englishTextSchema = (fieldName: string) =>
  z.string()
    .min(2, `${fieldName} is too short`)
    .max(200, `${fieldName} is too long`)
    .refine((text) => {
      // Check if contains only Latin characters, numbers, and common punctuation
      const englishRegex = /^[a-zA-Z0-9\s.,!?'"&\-()]+$/;
      return englishRegex.test(text);
    }, `${fieldName} must contain English text only`);

// Complete Profile validation
export const completeProfileSchema = z.object({
  fullName: z.string().min(2, 'Name too short').max(100, 'Name too long'),
  phone: phoneSchema,
  location: z.string().min(2, 'Location too short').max(100, 'Location too long'),
});

// Register Business validation
export const registerBusinessSchema = z.object({
  nameEn: englishTextSchema('Business name (English)'),
  nameAr: arabicTextSchema('Business name (Arabic)'),
  descriptionEn: z.string().max(1000, 'Description too long').optional(),
  descriptionAr: z.string().max(1000, 'Description too long').optional(),
  businessType: z.enum(['importer', 'exporter', 'both']),
  industry: z.string().min(1, 'Industry is required'),
  location: z.string().min(2, 'Location is required'),
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  foundedYear: z.number().min(1900).max(new Date().getFullYear()),
});

// User registration validation
export const userRegisterSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long'),
  fullName: z.string().min(2, 'Name too short').max(100, 'Name too long'),
});
