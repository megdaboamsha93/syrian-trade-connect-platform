
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold">STC</span>
          </div>
          <h1 className="text-lg font-bold text-primary hidden md:block">{t('app.title')}</h1>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="font-medium hover:text-primary">{t('nav.home')}</Link>
          <Link to="/browse" className="font-medium hover:text-primary">{t('nav.browse')}</Link>
          <Link to="/messages" className="font-medium hover:text-primary">{t('nav.messages')}</Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Globe className="h-5 w-5" />
                <span className="sr-only">{t('language')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setLanguage('en')}
                className={language === 'en' ? 'bg-primary/10' : ''}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage('ar')}
                className={language === 'ar' ? 'bg-primary/10' : ''}
              >
                العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth Buttons */}
          <div className="hidden md:flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/login">{t('nav.login')}</Link>
            </Button>
            <Button asChild>
              <Link to="/register">{t('nav.register')}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 py-3">
          <nav className="flex flex-col space-y-3">
            <Link to="/" className="font-medium py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              {t('nav.home')}
            </Link>
            <Link to="/browse" className="font-medium py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              {t('nav.browse')}
            </Link>
            <Link to="/messages" className="font-medium py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              {t('nav.messages')}
            </Link>
            <div className="flex gap-2 py-2">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>{t('nav.login')}</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/register" onClick={() => setIsMenuOpen(false)}>{t('nav.register')}</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
