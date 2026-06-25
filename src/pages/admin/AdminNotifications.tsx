import { useState, useEffect } from 'react';
import {
  Plus, Trash2, X, Bell, Send, Megaphone, Mail, Smartphone,
  Layers, Clock, CheckCircle2, XCircle, Users, ChevronDown,
  Zap, Tag, Package, Ticket, Info, AlertCircle, RefreshCw,
} from 'lucide-react';
import {
  adminFetchCampaigns,
  adminCreateCampaign,
  adminDeleteCampaign,
  adminSendCampaign,
} from '../../lib/api';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

// ── Meta maps ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'info',       label: 'Info',       icon: Info,        color: '#00D1FF' },
  { value: 'promo',      label: 'Promo',      icon: Tag,         color: '#22C55E' },
  { value: 'alert',      label: 'Alert',      icon: AlertCircle, color: '#EF4444' },
  { value: 'order',      label: 'Order',      icon: Package,     color: '#FF8A00' },
  { value: 'flash_sale', label: 'Flash Sale', icon: Zap,         color: '#F59E0B' },
  { value: 'coupon',     label: 'Coupon',     icon: Ticket,      color: '#A78BFA' },
];

const CATEGORY_OPTIONS = [
  { value: 'general',    label: 'General'    },
  { value: 'offers',     label: 'Offers'     },
  { value: 'orders',     label: 'Orders'     },
  { value: 'flash_sale', label: 'Flash Sale' },
  { value: 'coupons',    label: 'Coupons'    },
];

const CHANNEL_OPTIONS = [
  { value: 'in_app', label: 'In-App Only',        icon: Smartphone },
  { value: 'email',  label: 'Email Only',          icon: Mail       },
  { value: 'all',    label: 'In-App + Email',      icon: Layers     },
];

const STATUS_META: Record<string, { color: string; icon: any; label: string }> = {
  draft:  { color: '#8B8B9A', icon: Clock,        label: 'Draft'  },
  sent:   { color: '#34D399', icon: CheckCircle2,  label: 'Sent'   },
  failed: { color: '#F87171', icon: XCircle,       label: 'Failed' },
};

const EMPTY_FORM = {
  title: '', message: '', type: 'info', category: 'general',
  channel: 'in_app', target: 'all', link: '',
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// ── Channel selector pill ─────────────────────────────────────────────────────

function ChannelPill({
  value, selected, onClick,
}: { value: string; selected: boolean; onClick: () => void }) {
  const opt = CHANNEL_OPTIONS.find(o => o.value === value)!;
  const Icon = opt.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-medium transition-all"
      style={selected
        ? { background: 'rgba(255,138,0,0.12)', color: '#FF8A00', border: '1px solid rgba(255,138,0,0.25)' }
        : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }
      }
    >
      <Icon size={18} />
      {opt.label}
    </button>
  );
}

// ── Campaign card ─────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  onSend,
  onDelete,
  sending,
}: {
  campaign: any;
  onSend: () => void;
  onDelete: () => void;
  sending: boolean;
}) {
  const typeMeta  = TYPE_OPTIONS.find(t => t.value === campaign.type) || TYPE_OPTIONS[0];
  const statusMeta = STATUS_META[campaign.status] || STATUS_META.draft;
  const TypeIcon   = typeMeta.icon;
  const StatusIcon = statusMeta.icon;
  const channelOpt = CHANNEL_OPTIONS.find(c => c.value === campaign.channel);
  const ChannelIcon = channelOpt?.icon || Smartphone;

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${typeMeta.color}12`, border: `1px solid ${typeMeta.color}22` }}
        >
          <TypeIcon size={16} style={{ color: typeMeta.color }} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white leading-snug">{campaign.title}</p>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
              style={{ background: `${statusMeta.color}14`, color: statusMeta.color }}
            >
              <StatusIcon size={9} />
              {statusMeta.label}
            </div>
          </div>
          <p className="text-xs text-white/45 mt-0.5 line-clamp-2">{campaign.message}</p>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md font-medium capitalize"
              style={{ color: typeMeta.color, background: `${typeMeta.color}10` }}
            >
              {campaign.type.replace('_', ' ')}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-white/30">
              <ChannelIcon size={9} />
              {channelOpt?.label || campaign.channel}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-white/30">
              <Users size={9} />
              {campaign.target === 'all' ? 'All users' : campaign.target}
            </span>
            {campaign.recipient_count > 0 && (
              <span className="text-[10px] text-green-400">
                {campaign.recipient_count} delivered
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/20 mt-1">{fmt(campaign.created_at)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {campaign.status !== 'sent' ? (
          <button
            onClick={onSend}
            disabled={sending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
          >
            {sending ? <RefreshCw size={11} className="animate-spin" /> : <Send size={11} />}
            {sending ? 'Sending…' : 'Send Now'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-green-400"
            style={{ background: 'rgba(52,211,153,0.08)' }}>
            <CheckCircle2 size={11} />
            Sent {campaign.sent_at ? fmt(campaign.sent_at) : ''}
          </div>
        )}
        <div className="flex-1" />
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-red-500/10"
          style={{ background: 'rgba(239,68,68,0.05)' }}
        >
          <Trash2 size={13} className="text-red-400/50 hover:text-red-400 transition-colors" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdminNotifications() {
  const toast = useToast();
  const [campaigns, setCampaigns]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [sendingId, setSendingId]   = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent'>('all');

  const load = async () => {
    const data = await adminFetchCampaigns();
    setCampaigns(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await adminCreateCampaign({
      ...form,
      link: form.link || undefined,
    });
    if (error) {
      toast.error(error);
    } else if (data) {
      toast.success('Campaign created');
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    }
    setSaving(false);
  };

  const handleSend = async (campaign: any) => {
    setSendingId(campaign.id);
    const { error, data } = await adminSendCampaign(campaign.id, {
      title:    campaign.title,
      message:  campaign.message,
      type:     campaign.type,
      category: campaign.category,
      channel:  campaign.channel,
      target:   campaign.target,
      link:     campaign.link,
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Delivered to ${data?.total ?? 0} recipient${data?.total !== 1 ? 's' : ''}`);
      await load();
    }
    setSendingId(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await adminDeleteCampaign(id);
    if (error) toast.error(error);
    else { toast.success('Deleted'); await load(); }
    setConfirmDel(null);
  };

  const visible = campaigns.filter(c =>
    filterStatus === 'all' || c.status === filterStatus
  );

  const sentCount  = campaigns.filter(c => c.status === 'sent').length;
  const draftCount = campaigns.filter(c => c.status === 'draft').length;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Notification Center</h2>
          <p className="text-xs text-white/30 mt-0.5">{sentCount} sent · {draftCount} draft</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white glow-btn"
          style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
        >
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',  value: campaigns.length,           color: '#00D1FF', icon: Bell        },
          { label: 'Sent',   value: sentCount,                  color: '#34D399', icon: CheckCircle2 },
          { label: 'Drafts', value: draftCount,                 color: '#F59E0B', icon: Clock        },
        ].map(s => {
          const SIcon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-3 text-center"
              style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
              <SIcon size={16} style={{ color: s.color }} className="mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-[10px]" style={{ color: s.color }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'draft', 'sent'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className="px-4 py-1.5 rounded-xl text-xs font-medium transition-all capitalize"
            style={filterStatus === f
              ? { background: 'rgba(255,138,0,0.1)', color: '#FF8A00', border: '1px solid rgba(255,138,0,0.2)' }
              : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,138,0,0.07)', border: '1px solid rgba(255,138,0,0.15)' }}>
            <Megaphone size={24} className="text-mia-orange/50" />
          </div>
          <p className="text-sm text-white/30">No campaigns yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(c => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onSend={() => handleSend(c)}
              onDelete={() => setConfirmDel(c)}
              sending={sendingId === c.id}
            />
          ))}
        </div>
      )}

      {/* Create campaign modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9980] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div
            className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-y-auto"
            style={{
              background: 'linear-gradient(145deg, #141820, #0D1117)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              maxHeight: '92dvh',
            }}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
              style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,138,0,0.12)' }}>
                  <Megaphone size={15} className="text-mia-orange" />
                </div>
                <h3 className="text-base font-bold text-white">New Campaign</h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={14} className="text-white/60" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs text-white/40 font-medium mb-1.5 block">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. 50% off flash sale!"
                  className="admin-input"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs text-white/40 font-medium mb-1.5 block">Message *</label>
                <textarea
                  required
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Your notification message…"
                  rows={3}
                  className="admin-input resize-none"
                />
              </div>

              {/* Type + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 font-medium mb-1.5 block">Type</label>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="admin-input appearance-none pr-8"
                    >
                      {TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 font-medium mb-1.5 block">Category</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="admin-input appearance-none pr-8"
                    >
                      {CATEGORY_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Channel */}
              <div>
                <label className="text-xs text-white/40 font-medium mb-2 block">Channel</label>
                <div className="flex gap-2">
                  {CHANNEL_OPTIONS.map(o => (
                    <ChannelPill
                      key={o.value}
                      value={o.value}
                      selected={form.channel === o.value}
                      onClick={() => setForm(f => ({ ...f, channel: o.value }))}
                    />
                  ))}
                </div>
                {form.channel === 'email' && (
                  <p className="text-[10px] text-yellow-400/60 mt-1.5">Requires RESEND_API_KEY secret.</p>
                )}
              </div>

              {/* Target */}
              <div>
                <label className="text-xs text-white/40 font-medium mb-1.5 block">Audience</label>
                <div className="relative">
                  <select
                    value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    className="admin-input appearance-none pr-8"
                  >
                    <option value="all">All Users</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              {/* Deep link */}
              <div>
                <label className="text-xs text-white/40 font-medium mb-1.5 block">Deep Link (optional)</label>
                <input
                  value={form.link}
                  onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  placeholder="/product/123 or /coupons"
                  className="admin-input"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium text-white/50 transition-colors hover:text-white/70"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
                >
                  {saving ? 'Saving…' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDel && (
        <ConfirmDialog
          title="Delete Campaign"
          message={`Delete "${confirmDel.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(confirmDel.id)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
