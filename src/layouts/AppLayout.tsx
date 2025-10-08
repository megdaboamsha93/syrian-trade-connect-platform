import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageSquare, User, LogOut, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { language, setLanguage, dir, t } = useLanguage();
  const unreadCount = useUnreadMessages();
  const location = useLocation();
  
  // Hide sidebar on auth pages
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
  const isAuthPage = authPages.includes(location.pathname);

  return (
    <SidebarProvider defaultOpen={!isAuthPage}>
      <div className="flex min-h-screen w-full" dir={dir}>
        {!isAuthPage && <AppSidebar />}
        <SidebarInset className="flex-1 flex flex-col">
          {/* Compact Header with Icons */}
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <div className="flex-1" />
            
            {/* Right side icons */}
            <div className="flex items-center gap-1">
              {user ? (
                <>
                  {/* Messages */}
                  <Button variant="ghost" size="icon" asChild className="relative">
                    <Link to="/messages">
                      <MessageSquare className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </Button>

                  {/* Notifications - placeholder for now */}
                  <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                  </Button>

                  {/* Language Switcher */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Globe className="h-5 w-5" />
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

                  {/* Profile Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/complete-profile" className="cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          Profile Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {/* Language Switcher */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Globe className="h-5 w-5" />
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

                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login">{t('auth.login')}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register">{t('auth.register')}</Link>
                  </Button>
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      </div>
    </SidebarProvider>
  );
}