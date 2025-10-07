import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface TranslateOptions {
  context?: string;
  sourceLang?: 'en' | 'ar';
}

export function useTranslate() {
  const { language } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = async (
    text: string,
    options: TranslateOptions = {}
  ): Promise<string | null> => {
    if (!text || text.trim() === '') return null;

    const { context, sourceLang = language === 'ar' ? 'en' : 'ar' } = options;
    const targetLang = language;

    // If source and target are the same, return original text
    if (sourceLang === targetLang) return text;

    setIsTranslating(true);

    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: {
          text,
          sourceLang,
          targetLang,
          context,
        },
      });

      if (error) throw error;

      if (data?.error) {
        console.error('Translation error:', data.error);
        toast.error(
          language === 'ar'
            ? 'فشلت الترجمة'
            : 'Translation failed'
        );
        return null;
      }

      return data.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(
        language === 'ar'
          ? 'فشلت الترجمة'
          : 'Translation failed'
      );
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  const translateBatch = async (
    texts: string[],
    options: TranslateOptions = {}
  ): Promise<(string | null)[]> => {
    const promises = texts.map(text => translate(text, options));
    return Promise.all(promises);
  };

  return {
    translate,
    translateBatch,
    isTranslating,
  };
}
