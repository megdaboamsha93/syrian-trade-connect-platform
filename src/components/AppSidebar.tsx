import { Building2, BarChart3, Search, Heart, MessageSquare, Home, Plus, Store } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
} from '@/components/ui/sidebar';

const exploreItems = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Browse Businesses',
    url: '/browse',
    icon: Search,
  },
  {
    title: 'My Favorites',
    url: '/favorites',
    icon: Heart,
    requiresAuth: true,
  },
  {
    title: 'Messages',
    url: '/messages',
    icon: MessageSquare,
    requiresAuth: true,
  },
];

const businessItems = [
  {
    title: 'My Businesses',
    url: '/my-business',
    icon: Building2,
    requiresAuth: true,
  },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
    requiresAuth: true,
  },
  {
    title: 'Register Business',
    url: '/register-business',
    icon: Plus,
    requiresAuth: true,
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">STC Platform</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* Explore Section */}
        <SidebarGroup className="mb-6">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Explore
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {exploreItems.map((item) => {
                if (item.requiresAuth && !user) return null;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
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
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              My Business
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {businessItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}