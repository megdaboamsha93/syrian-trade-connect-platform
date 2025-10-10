import { Building2, BarChart3, Search, Heart, MessageSquare, Home, Plus, Store, FileText, ClipboardList } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const location = useLocation();
  const { setOpen } = useSidebar();
  const isActive = (path: string) => location.pathname === path;

  const exploreItems = [
    {
      titleKey: 'nav.home',
      url: '/',
      icon: Home,
    },
    {
      titleKey: 'nav.browse',
      url: '/browse',
      icon: Search,
    },
    {
      titleKey: 'rfq.marketplace.title',
      url: '/rfq-marketplace',
      icon: ClipboardList,
    },
  ];

  const businessItems = [
    {
      titleKey: 'nav.myBusinesses',
      url: '/my-business',
      icon: Building2,
      requiresAuth: true,
    },
    {
      titleKey: 'nav.analytics',
      url: '/analytics',
      icon: BarChart3,
      requiresAuth: true,
    },
    {
      titleKey: 'nav.messages',
      url: '/messages',
      icon: MessageSquare,
      requiresAuth: true,
    },
    {
      titleKey: 'nav.rfqs',
      url: '/rfqs',
      icon: FileText,
      requiresAuth: true,
    },
    {
      titleKey: 'nav.favorites',
      url: '/favorites',
      icon: Heart,
      requiresAuth: true,
    },
  ];

  return (
    <Sidebar
      side={dir === 'rtl' ? 'right' : 'left'}
      collapsible="icon"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader className="px-6 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        <NavLink to="/" className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground group-data-[collapsible=icon]:hidden">STC Platform</span>
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2">
        {/* Explore Section */}
        <SidebarGroup className="mb-6">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 group-data-[collapsible=icon]:hidden">
            {t('nav.home')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {exploreItems.map((item) => {
                const title = t(item.titleKey);
                return (
                  <SidebarMenuItem key={item.titleKey} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton asChild tooltip={title} isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-2 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                        <item.icon className="h-5 w-5 group-data-[collapsible=icon]:mx-auto" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">{title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* My Business Section - Only show if logged in */}
        {user && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 group-data-[collapsible=icon]:hidden">
              {t('nav.myBusinesses')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
              {businessItems.map((item) => {
                const title = t(item.titleKey);
                return (
                  <SidebarMenuItem key={item.titleKey} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton asChild tooltip={title} isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-2 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                        <item.icon className="h-5 w-5 group-data-[collapsible=icon]:mx-auto" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">{title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}