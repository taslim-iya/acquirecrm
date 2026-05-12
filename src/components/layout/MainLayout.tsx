import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, MobileSidebar, MobileHeader, SidebarProvider } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { ChatBubble } from './ChatBubble';
import { ErrorBoundary } from './ErrorBoundary';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isDemoMode, exitDemoMode } = useDemoMode();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MobileSidebar />
        <MobileHeader />
        <main className="lg:pl-60 pt-14 lg:pt-0">
          {/* macOS-style translucent top bar */}
          <div className="vibrancy hidden lg:flex h-12 items-center justify-end px-6 sticky top-0 z-30 border-x-0 border-t-0">
            <NotificationBell />
          </div>
          {isDemoMode && (
            <div className="bg-primary/8 border-b border-primary/15 px-4 py-2 flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">Demo Mode</span>
                <span className="text-muted-foreground">— Viewing sample data (read-only)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exitDemoMode();
                  navigate('/auth');
                }}
              >
                Sign Up to Get Started
              </Button>
            </div>
          )}
          <ErrorBoundary>
            <div className="min-h-screen">{children}</div>
          </ErrorBoundary>
        </main>
        <ChatBubble />
      </div>
    </SidebarProvider>
  );
}
