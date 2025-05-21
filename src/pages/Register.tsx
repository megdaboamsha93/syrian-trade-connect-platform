
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Register: React.FC = () => {
  const { t } = useLanguage();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would register against a backend
    alert('Registration functionality would be implemented in a real app');
  };
  
  const industries = ['manufacturing', 'agriculture', 'textiles', 'materials', 'services'];
  const businessTypes = ['importer', 'exporter', 'both'];
  
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
                  <Label htmlFor="businessName">{t('auth.businessName')}</Label>
                  <Input id="businessName" required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessType">{t('auth.businessType')}</Label>
                    <Select>
                      <SelectTrigger id="businessType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`browse.type.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="industry">{t('auth.industry')}</Label>
                    <Select>
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {t(`industry.${industry}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input id="email" type="email" required />
                </div>
                
                <div>
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input id="password" type="password" required />
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                {t('auth.register')}
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
