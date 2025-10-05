import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
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

    setEmailSent(true);
    toast({
      title: language === 'ar' ? 'تم الإرسال' : 'Email Sent',
      description: language === 'ar' 
        ? 'تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور' 
        : 'Check your email to reset your password',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
        </Button>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {language === 'ar' ? 'استعادة كلمة المرور' : 'Forgot Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {language === 'ar'
                ? 'أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور'
                : 'Enter your email to reset your password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {language === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === 'ar'
                      ? 'أرسلنا رابط إعادة تعيين كلمة المرور إلى'
                      : 'We sent a password reset link to'}
                    <br />
                    <strong>{email}</strong>
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                  {language === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? language === 'ar'
                      ? 'جاري الإرسال...'
                      : 'Sending...'
                    : language === 'ar'
                    ? 'إرسال رابط إعادة التعيين'
                    : 'Send Reset Link'}
                </Button>

                <div className="text-center text-sm">
                  <Link to="/login" className="text-primary hover:underline">
                    {language === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
