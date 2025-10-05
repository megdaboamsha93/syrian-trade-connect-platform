import { Building2, BarChart3, Search, Heart, MessageSquare, Home, Plus, Store } from 'lucide-react';
import { NavLink } from 'react-router-dom';
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Store className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-primary">STC Platform</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Explore Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {exploreItems.map((item) => {
                if (item.requiresAuth && !user) return null;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                            : ''
                        }
                      >
                        <item.icon />
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
            <SidebarGroupLabel>My Business</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {businessItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                            : ''
                        }
                      >
                        <item.icon />
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