import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // If user is already verified, redirect to home
    if (user?.email_confirmed_at) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!user?.email) return;

    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });
    setLoading(false);

    if (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: language === 'ar' ? 'تم الإرسال' : 'Email Sent',
      description: language === 'ar' 
        ? 'تم إرسال رسالة التحقق مرة أخرى' 
        : 'Verification email sent again',
    });

    setResendCooldown(60); // 60 second cooldown
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {language === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Verify Your Email'}
          </CardTitle>
          <CardDescription className="text-center">
            {language === 'ar'
              ? 'أرسلنا رسالة تحقق إلى'
              : 'We sent a verification email to'}
            <br />
            <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {language === 'ar'
                  ? 'انقر على الرابط في البريد الإلكتروني لتفعيل حسابك'
                  : 'Click the link in the email to activate your account'}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {language === 'ar'
                  ? 'تحقق من مجلد البريد المزعج إذا لم تجد الرسالة'
                  : "Check your spam folder if you don't see the email"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleResendEmail}
              disabled={loading || resendCooldown > 0}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                </>
              ) : resendCooldown > 0 ? (
                language === 'ar'
                  ? `إعادة الإرسال خلال ${resendCooldown} ثانية`
                  : `Resend in ${resendCooldown}s`
              ) : (
                language === 'ar'
                  ? 'إعادة إرسال البريد الإلكتروني'
                  : 'Resend Verification Email'
              )}
            </Button>

            <Button onClick={handleLogout} variant="ghost" className="w-full">
              {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {language === 'ar'
              ? 'بعد التحقق، يمكنك تسجيل الدخول والاستمتاع بجميع المزايا'
              : 'After verification, you can sign in and enjoy all features'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
