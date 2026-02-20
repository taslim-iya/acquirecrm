import { Bell, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, NotificationType } from '@/hooks/useNotifications';
import { useToggleTaskComplete } from '@/hooks/useTasks';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const iconMap: Record<NotificationType, typeof Bell> = {
  overdue_task: CheckCircle2,
  stale_contact: Users,
  stale_investor: TrendingUp,
};

const labelMap: Record<NotificationType, string> = {
  overdue_task: 'Overdue Tasks',
  stale_contact: 'Stale Contacts',
  stale_investor: 'Investors Need Follow-Up',
};

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const toggleComplete = useToggleTaskComplete();
  const navigate = useNavigate();
  const count = notifications.length;

  const grouped = notifications.reduce(
    (acc, n) => {
      (acc[n.type] ??= []).push(n);
      return acc;
    },
    {} as Record<NotificationType, typeof notifications>,
  );

  const handleClick = (n: (typeof notifications)[0]) => {
    if (n.type === 'overdue_task') navigate('/tasks');
    else if (n.type === 'stale_contact') navigate('/contacts');
    else navigate('/investors');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
          <p className="text-xs text-muted-foreground">{count} items need attention</p>
        </div>
        <ScrollArea className="max-h-80">
          {count === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">You're all caught up!</p>
          ) : (
            Object.entries(grouped).map(([type, items]) => {
              const Icon = iconMap[type as NotificationType];
              return (
                <div key={type}>
                  <div className="px-4 py-2 bg-secondary/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {labelMap[type as NotificationType]} ({items.length})
                    </span>
                  </div>
                  {items.slice(0, 5).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-accent/50 transition-colors"
                    >
                      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                        {n.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{n.subtitle}</p>
                        )}
                      </div>
                      {n.type === 'overdue_task' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete.mutate({ id: n.entityId, completed: true });
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                        </Button>
                      )}
                    </button>
                  ))}
                  {items.length > 5 && (
                    <p className="px-4 py-1.5 text-xs text-muted-foreground">
                      +{items.length - 5} more
                    </p>
                  )}
                </div>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
