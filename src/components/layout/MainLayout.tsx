import { ReactNode } from 'react';
import { Sidebar, MobileSidebar, MobileHeader, SidebarProvider } from './Sidebar';
import { NotificationBell } from './NotificationBell';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MobileSidebar />
        <MobileHeader />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="hidden lg:flex h-12 items-center justify-end px-6 border-b border-border bg-background sticky top-0 z-30">
            <NotificationBell />
          </div>
          <div className="min-h-screen">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
