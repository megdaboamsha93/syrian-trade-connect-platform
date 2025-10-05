import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { BusinessSidebar } from '@/components/BusinessSidebar';
import { Separator } from '@/components/ui/separator';

interface BusinessLayoutProps {
  children: React.ReactNode;
}

export function BusinessLayout({ children }: BusinessLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <BusinessSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </header>
          <div className="flex-1">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}