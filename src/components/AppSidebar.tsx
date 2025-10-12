import { Building2, BarChart3, Search, Heart, MessageSquare, Home, Plus, Store, FileText, ClipboardList, Truck, Package } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

  // Fetch user profile to check business type
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('business_type')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const isLogisticsProvider = profile?.business_type === 'logistics_provider' || profile?.business_type === 'both';
  const isStandardBusiness = profile?.business_type === 'standard' || profile?.business_type === 'both';

  const businessItems = [
    { titleKey: 'nav.home', url: '/', icon: Home },
    { titleKey: 'nav.browse', url: '/browse', icon: Search },
    { titleKey: 'rfq.marketplace.title', url: '/rfq-marketplace', icon: ClipboardList },
    { titleKey: 'nav.logistics', url: '/logistics', icon: Truck },
    { titleKey: 'nav.favorites', url: '/favorites', icon: Heart },
    { titleKey: 'nav.myBusinesses', url: '/my-business', icon: Building2 },
    { titleKey: 'nav.orders', url: '/orders', icon: Package },
    { titleKey: 'nav.analytics', url: '/analytics', icon: BarChart3 },
  ];

  // Logistics items for logistics providers
  const logisticsItems = [
    { titleKey: 'nav.myLogistics', url: '/my-logistics', icon: Truck },
  ];

  // Common items for all authenticated users
  const commonItems = [
    { titleKey: 'nav.messages', url: '/messages', icon: MessageSquare },
    { titleKey: 'nav.rfqs', url: '/rfqs', icon: FileText },
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
        {/* My Business Section - combined with general items */}
        {user && isStandardBusiness && (
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

        {/* Logistics Section */}
        {user && isLogisticsProvider && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 group-data-[collapsible=icon]:hidden">
              {t('nav.logistics')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
              {logisticsItems.map((item) => {
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

        {/* Common Items Section */}
        {user && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
              {commonItems.map((item) => {
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