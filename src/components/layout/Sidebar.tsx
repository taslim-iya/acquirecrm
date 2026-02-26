import { useState, createContext, useContext, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useAppMode, AppMode } from '@/hooks/useAppMode';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Building2,
  Mail,
  Inbox,
  FileText,
  BarChart3,
  Settings,
  ImageIcon,
  Sparkles,
  Calendar,
  LogOut,
  StickyNote,
  Menu,
  PieChart,
  CheckSquare,
  Target,
  Handshake,
  Briefcase,
  Shield,
} from 'lucide-react';
import { useUnreadEmailCount } from '@/hooks/useEmails';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  modes?: AppMode[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Investors', href: '/investors', icon: TrendingUp, modes: ['fundraising'] },
  { name: 'Cap Table', href: '/cap-table', icon: PieChart, modes: ['fundraising'] },
  { name: 'Targets', href: '/targets', icon: Target, modes: ['deal-sourcing'] },
  { name: 'Deals', href: '/ds-deals', icon: Briefcase, modes: ['deal-sourcing'] },
  { name: 'Brokers', href: '/brokers', icon: Handshake, modes: ['deal-sourcing'] },
  { name: 'Outreach', href: '/outreach', icon: Mail },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, modes: ['fundraising'] },
  { name: 'Analytics', href: '/ds-analytics', icon: BarChart3, modes: ['deal-sourcing'] },
];

const bottomNav = [
  { name: 'AI Assistant', href: '/assistant', icon: Sparkles },
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const adminNav = [
  { name: 'Admin Panel', href: '/admin', icon: Shield },
];

const SidebarContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

function ModeToggle() {
  const { mode, setMode } = useAppMode();

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-1 p-1 rounded-full bg-secondary border border-border">
        <button
          onClick={() => setMode('fundraising')}
          className={cn(
            'flex-1 text-[11px] font-medium py-1.5 px-3 rounded-full transition-all duration-200 text-center',
            mode === 'fundraising'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Fundraising
        </button>
        <button
          onClick={() => setMode('deal-sourcing')}
          className={cn(
            'flex-1 text-[11px] font-medium py-1.5 px-3 rounded-full transition-all duration-200 text-center',
            mode === 'deal-sourcing'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Deal Sourcing
        </button>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { mode } = useAppMode();
  const { data: unreadCount } = useUnreadEmailCount();

  const filteredNav = navigation.filter(
    (item) => !item.modes || item.modes.includes(mode)
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const name = user.user_metadata?.full_name || user.email;
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
        <BrandLogo
          variant="light"
          showSubtitle
          titleClassName="text-base text-foreground font-semibold"
          subtitleClassName="text-muted-foreground"
          iconClassName="bg-primary text-primary-foreground rounded-xl"
        />
      </div>

      <ModeToggle />

      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => onNavigate?.()}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary'
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.name}
              {item.name === 'Inbox' && unreadCount ? (
                <span className={cn(
                  "ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium min-w-[18px] text-center",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-destructive text-destructive-foreground"
                )}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
        {bottomNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => onNavigate?.()}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary'
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.name}
              {item.name === 'AI Assistant' && (
                <span className={cn(
                  "ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}>
                  NEW
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin */}
        <div className="pt-2 mt-2 border-t border-sidebar-border">
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">Admin</p>
          {adminNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => onNavigate?.()}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary'
                )}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{getDisplayName()}</p>
            <p className="text-xs text-muted-foreground truncate">Solo Searcher</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border hidden lg:flex flex-col">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const { open, setOpen } = useSidebar();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="p-0 w-64 border-r-0">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export function MobileHeader() {
  const { setOpen } = useSidebar();
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-border flex items-center px-4">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="mr-3">
        <Menu className="w-5 h-5" />
      </Button>
      <BrandLogo
        variant="mark"
        showTitle
        iconClassName="w-7 h-7 rounded-xl bg-primary text-primary-foreground"
        titleClassName="font-semibold text-foreground"
      />
    </header>
  );
}
