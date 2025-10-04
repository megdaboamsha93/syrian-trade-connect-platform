import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
});

const Register: React.FC = () => {
  const { t } = useLanguage();
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    fullName?: string;
    general?: string 
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate input
    try {
      registerSchema.parse({ 
        email: email.trim(), 
        password,
        fullName: fullName.trim()
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);

    const { error } = await signUp(email.trim(), password, fullName.trim());

    if (error) {
      setErrors({ general: error.message || 'Registration failed' });
    } else {
      navigate('/login');
    }
    
    setLoading(false);
  };
  
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t('auth.register')}</CardTitle>
            <CardDescription>
              {t('app.tagline')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                  <Input 
                    id="fullName" 
                    type="text"
                    required 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
                <div>
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
              </div>
              {errors.general && <div className="text-destructive text-sm">{errors.general}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering...' : t('auth.register')}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p>
                {t('auth.hasAccount')}{' '}
                <Link to="/login" className="text-primary hover:underline">
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
