import { useState, useEffect } from 'react';
import {
  ArrowLeft, Bell, BellOff, Trash2, CheckCheck, Loader2,
  Package, Tag, Info, AlertCircle, Zap, Ticket, ShoppingBag, RefreshCw,
} from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../lib/auth';
import {
  fetchUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteUserNotification,
} from '../lib/api';
import { useTranslation } from 'react-i18next';

interface Notif {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'promo' | 'alert' | 'order';
  category: 'general' | 'offers' | 'orders' | 'flash_sale' | 'coupons';
  is_read: boolean;
  link?: string;
  created_at: string;
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order:      { icon: Package,      color: '#FF8A00', bg: 'rgba(255,138,0,0.1)'  },
  promo:      { icon: Tag,          color: '#22C55E', bg: 'rgba(34,197,94,0.1)'  },
  alert:      { icon: AlertCircle,  color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
  flash_sale: { icon: Zap,          color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  coupon:     { icon: Ticket,       color: '#A78BFA', bg: 'rgba(167,139,250,0.1)'},
  info:       { icon: Info,         color: '#00D1FF', bg: 'rgba(0,209,255,0.1)'  },
};

const CATEGORY_TABS = [
  { key: 'all',        labelKey: 'notifications.all',        icon: Bell,       color: '#00D1FF' },
  { key: 'offers',     labelKey: 'notifications.offers',     icon: Tag,        color: '#22C55E' },
  { key: 'orders',     labelKey: 'notifications.orders',     icon: ShoppingBag,color: '#FF8A00' },
  { key: 'flash_sale', labelKey: 'notifications.flashSale', icon: Zap,        color: '#F59E0B' },
  { key: 'coupons',    labelKey: 'notifications.coupons',    icon: Ticket,     color: '#A78BFA' },
] as const;

type CategoryTab = typeof CATEGORY_TABS[number]['key'];

function timeAgo(dateStr: string, t: (key: string, opts?: any) => string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifications.justNow');
  if (mins < 60) return `${mins}${t('notifications.minAgo')}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${t('notifications.hourAgo')}`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}${t('notifications.dayAgo')}`;
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function getMeta(notif: Notif) {
  if (notif.category === 'flash_sale') return TYPE_META.flash_sale;
  if (notif.category === 'coupons')    return TYPE_META.coupon;
  return TYPE_META[notif.type] || TYPE_META.info;
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifs, setNotifs]       = useState<Notif[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory]   = useState<CategoryTab>('all');
  const [showUnread, setShowUnread] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    load();
  }, [user]);

  const load = async (spinner = false) => {
    if (!user) return;
    if (spinner) setRefreshing(true);
    setLoading(true);
    const data = await fetchUserNotifications(user.id);
    setNotifs(data as Notif[]);
    setLoading(false);
    setRefreshing(false);
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteUserNotification(id);
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notifs
    .filter(n => category === 'all' || n.category === category)
    .filter(n => !showUnread || !n.is_read);

  const unreadCount  = notifs.filter(n => !n.is_read).length;
  const categoryCount = (cat: CategoryTab) =>
    cat === 'all' ? notifs.length : notifs.filter(n => n.category === cat).length;

  return (
    <div className="page-transition pb-28 min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 py-3"
        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/8 transition-colors"
              style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft size={16} className="text-white/70" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">{t('notifications.title')}</h1>
              {unreadCount > 0 && (
                <p className="text-[10px]" style={{ color: '#00D1FF' }}>{unreadCount} {t('notifications.unread')}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleReadAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors"
                style={{ color: '#00D1FF', background: 'rgba(0,209,255,0.07)', border: '1px solid rgba(0,209,255,0.15)' }}
              >
                <CheckCheck size={12} /> {t('notifications.markAllRead')}
              </button>
            )}
            <button
              onClick={() => load(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/8 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw size={14} className={`text-mia-gray ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_TABS.map(tab => {
            const TabIcon = tab.icon;
            const count   = categoryCount(tab.key);
            const active  = category === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setCategory(tab.key)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-medium transition-all"
                style={active
                  ? { background: `${tab.color}15`, color: tab.color, border: `1px solid ${tab.color}30` }
                  : { background: 'var(--bg-input)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }
                }
              >
                <TabIcon size={13} />
                {t(tab.labelKey)}
                {count > 0 && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={active
                      ? { background: `${tab.color}20`, color: tab.color }
                      : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Unread toggle */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-mia-gray">{filtered.length} {filtered.length !== 1 ? t('notifications.notifications') : t('notifications.notification')}</p>
          <button
            onClick={() => setShowUnread(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={showUnread
              ? { background: 'rgba(0,209,255,0.1)', color: '#00D1FF', border: '1px solid rgba(0,209,255,0.2)' }
              : { background: 'var(--bg-input)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }
            }
          >
            <Bell size={11} />
            {t('notifications.unreadOnly')}
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: '#00D1FF' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(0,209,255,0.06)', border: '1px solid rgba(0,209,255,0.12)' }}
            >
              <BellOff size={32} style={{ color: 'rgba(0,209,255,0.4)' }} />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">
                {showUnread ? t('notifications.allCaughtUp') : `${t('notifications.noUnread')}`}
              </p>
              <p className="text-mia-gray text-sm mt-1">
                {showUnread ? t('notifications.noUnread') : t('notifications.checkBackLater')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(notif => {
              const meta = getMeta(notif);
              const Icon = meta.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) handleRead(notif.id);
                    if (notif.link) navigate(notif.link);
                  }}
                  className="relative flex gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.99]"
                  style={{
                    background: notif.is_read ? 'var(--bg-surface)' : 'var(--bg-card)',
                    border: notif.is_read ? '1px solid rgba(255,255,255,0.04)' : `1px solid ${meta.color}22`,
                  }}
                >
                  {!notif.is_read && (
                    <div
                      className="absolute top-4 right-10 w-2 h-2 rounded-full"
                      style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
                    />
                  )}

                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: meta.bg }}
                  >
                    <Icon size={20} style={{ color: meta.color }} />
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <p className={`text-sm font-semibold leading-snug ${notif.is_read ? 'text-white/55' : 'text-white'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[10px] text-white/25">{timeAgo(notif.created_at, t)}</p>
                      {notif.category && notif.category !== 'general' && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-md font-medium capitalize"
                          style={{ color: meta.color, background: `${meta.color}12` }}
                        >
                          {notif.category.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={e => handleDelete(notif.id, e)}
                    className="absolute top-3.5 right-3 w-7 h-7 flex items-center justify-center rounded-xl transition-colors hover:bg-red-500/12"
                    style={{ opacity: 0.45 }}
                  >
                    <Trash2 size={12} className="text-white/50 hover:text-red-400 transition-colors" />
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
