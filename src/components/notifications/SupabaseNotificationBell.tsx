import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useRole } from '@/hooks/useRole';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  event_id: string | null;
  shift_id: string | null;
  created_at: string;
}

export const SupabaseNotificationBell = () => {
  const { profile } = useRole();
  const { subscription, subscribe, unsubscribe, isLoading } = usePushNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications for current operator
  useEffect(() => {
    if (!profile?.operator_id) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('operator_id', profile.operator_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    };

    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `operator_id=eq.${profile.operator_id}`
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.operator_id]);

  const handleToggleNotifications = async () => {
    if (subscription) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!profile?.operator_id) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  if (!profile?.operator_id) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-header-foreground hover:bg-white/10">
          {subscription ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifiche
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleNotifications}
            disabled={isLoading}
            className="h-7 px-2 text-xs"
          >
            {isLoading ? 'Caricamento...' : subscription ? 'Disattiva' : 'Attiva'}
          </Button>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            Nessuna notifica
          </DropdownMenuItem>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start p-4 cursor-pointer min-h-[80px] ${
                !notification.read ? 'bg-accent/50' : ''
              }`}
              onClick={() => handleMarkAsRead(notification.id)}
              asChild={!!notification.event_id}
            >
              {notification.event_id ? (
                <Link to={`/events/${notification.event_id}`} className="w-full">
                  <div className="w-full">
                    <div className="font-medium text-sm mb-1">{notification.title}</div>
                    <div className="text-xs text-muted-foreground whitespace-pre-line mb-2">
                      {notification.message}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString('it-IT')}
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1 ml-auto" />
                    )}
                  </div>
                </Link>
              ) : (
                <div className="w-full">
                  <div className="font-medium text-sm mb-1">{notification.title}</div>
                  <div className="text-xs text-muted-foreground whitespace-pre-line mb-2">
                    {notification.message}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString('it-IT')}
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-1 ml-auto" />
                  )}
                </div>
              )}
            </DropdownMenuItem>
          ))
        )}
        
        {notifications.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-sm text-muted-foreground">
              +{notifications.length - 5} altre notifiche
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};