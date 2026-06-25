import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, BellOff, Trash2, CheckCheck, Loader2, Package, Tag, Info, AlertCircle } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../lib/auth';
import {
  fetchUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteUserNotification,
} from '../lib/api';

interface Notif {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'promo' | 'alert' | 'order';
  is_read: boolean;
  link?: string;
  created_at: string;
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order: { icon: Package, color: '#FF8A00', bg: 'rgba(255,138,0,0.1)' },
  promo: { icon: Tag, color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  alert: { icon: AlertCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  info: { icon: Info, color: '#00D1FF', bg: 'rgba(0,209,255,0.1)' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchUserNotifications(user.id);
    setNotifs(data as Notif[]);
    setLoading(false);
  };

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleReadAll = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleDelete = async (id: string) => {
    await deleteUserNotification(id);
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const visible = filter === 'unread' ? notifs.filter(n => !n.is_read) : notifs;
  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <div className="page-transition pb-28">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <ArrowLeft size={16} className="text-white/60" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Notifications</h1>
              {unreadCount > 0 && <p className="text-[10px] text-mia-blue">{unreadCount} unread</p>}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleReadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium text-mia-blue"
              style={{ background: 'rgba(0,209,255,0.07)', border: '1px solid rgba(0,209,255,0.15)' }}>
              <CheckCheck size={12} /> Mark all read
            </button>
          )}
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={filter === f
                ? { background: 'rgba(0,209,255,0.1)', color: '#00D1FF', border: '1px solid rgba(0,209,255,0.2)' }
                : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {f === 'all' ? `All (${notifs.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-mia-blue animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center float-premium"
              style={{ background: 'rgba(0,209,255,0.06)', border: '1px solid rgba(0,209,255,0.12)' }}>
              <BellOff size={24} className="text-mia-blue/40" />
            </div>
            <p className="text-sm text-white/40">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(notif => {
              const meta = TYPE_META[notif.type] || TYPE_META.info;
              const Icon = meta.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) handleRead(notif.id);
                    if (notif.link) navigate(notif.link);
                  }}
                  className="relative flex gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    background: notif.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                    border: notif.is_read ? '1px solid rgba(255,255,255,0.04)' : `1px solid ${meta.color}20`,
                  }}>
                  {!notif.is_read && (
                    <div
                      className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full"
                      style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
                    />
                  )}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: meta.bg }}>
                    <Icon size={18} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`text-sm font-medium leading-snug ${notif.is_read ? 'text-white/60' : 'text-white'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-white/25 mt-1.5">{timeAgo(notif.created_at)}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(notif.id); }}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
                    style={{ opacity: 0.4 }}>
                    <Trash2 size={11} className="text-white/40 hover:text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
