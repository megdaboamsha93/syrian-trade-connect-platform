import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Languages, Loader2 } from 'lucide-react';
import { useTranslate } from '@/hooks/useTranslate';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { sanitizeText } from '@/lib/sanitize';

interface MessageTranslateButtonProps {
  messageText: string;
  onTranslated?: (translatedText: string) => void;
}

export function MessageTranslateButton({ messageText, onTranslated }: MessageTranslateButtonProps) {
  const { translate, isTranslating } = useTranslate();
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);

  const handleTranslate = async () => {
    if (translatedText && !showOriginal) {
      // Toggle back to original
      setShowOriginal(true);
      return;
    }

    if (translatedText && showOriginal) {
      // Toggle to translated
      setShowOriginal(false);
      return;
    }

    // Perform translation
    const result = await translate(messageText, {
      context: 'chat message',
    });

    if (result) {
      setTranslatedText(result);
      setShowOriginal(false);
      onTranslated?.(result);
      toast.success(
        language === 'ar' 
          ? 'تمت الترجمة بنجاح' 
          : 'Translation successful'
      );
    }
  };

  const displayText = (!showOriginal && translatedText) ? translatedText : messageText;
  const buttonText = translatedText 
    ? (showOriginal 
        ? (language === 'ar' ? 'عرض الترجمة' : 'Show Translation')
        : (language === 'ar' ? 'عرض النص الأصلي' : 'Show Original')
      )
    : (language === 'ar' ? 'ترجمة' : 'Translate');

  return (
    <div className="space-y-2">
      <p className="text-sm whitespace-pre-wrap break-words">{sanitizeText(displayText)}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleTranslate}
        disabled={isTranslating}
        className="h-7 text-xs gap-1"
      >
        {isTranslating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Languages className="h-3 w-3" />
        )}
        {buttonText}
      </Button>
    </div>
  );
}
