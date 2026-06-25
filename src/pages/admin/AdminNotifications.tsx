import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Bell, Send } from 'lucide-react';
import { adminFetchNotifications, adminCreateNotification, adminDeleteNotification, adminMarkNotificationSent } from '../../lib/api';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

const TYPE_COLORS: Record<string, string> = { info: '#00D1FF', promo: '#FF8A00', alert: '#ef4444', order: '#22c55e' };
const EMPTY = { title: '', message: '', type: 'info', target: 'all' };

export function AdminNotifications() {
  const toast = useToast();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const load = async () => { const n = await adminFetchNotifications(); setNotifs(n); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await adminCreateNotification(form);
    if (error) toast.error(error); else { toast.success('Notification created'); setShowForm(false); await load(); }
    setSaving(false);
  };

  const handleSend = async (id: string) => {
    const { error } = await adminMarkNotificationSent(id);
    if (error) toast.error(error); else { toast.success('Marked as sent'); await load(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await adminDeleteNotification(id);
    if (error) toast.error(error); else { toast.success('Deleted'); await load(); }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Notifications <span className="text-white/30 text-sm font-normal">({notifs.length})</span></h2>
        <button onClick={() => { setForm(EMPTY); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white glow-btn" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
          <Plus size={14} /> New Notification
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="glow-card h-20 shimmer" />)}</div>
      ) : (
        <div className="space-y-3">
          {notifs.length === 0 && <div className="text-center py-12 text-white/25 text-sm">No notifications yet</div>}
          {notifs.map(n => {
            const c = TYPE_COLORS[n.type] || '#00D1FF';
            return (
              <div key={n.id} className="glow-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c}10`, border: `1px solid ${c}20` }}>
                      <Bell size={15} style={{ color: c }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white">{n.title}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium capitalize" style={{ color: c, background: `${c}10`, border: `1px solid ${c}20` }}>{n.type}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md text-white/30 bg-white/5">To: {n.target}</span>
                      </div>
                      <p className="text-xs text-white/50">{n.message}</p>
                      <p className="text-[10px] text-white/25 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {n.is_sent ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg text-green-400 bg-green-500/8 border border-green-500/20">Sent</span>
                    ) : (
                      <button onClick={() => handleSend(n.id)} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg font-medium text-mia-blue bg-mia-blue/8 border border-mia-blue/20 hover:bg-mia-blue/15 transition-colors">
                        <Send size={10} /> Send
                      </button>
                    )}
                    <button onClick={() => setConfirmDelete(n)} className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center hover:bg-red-500/10">
                      <Trash2 size={13} className="text-red-400/60" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[9980] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-sm rounded-3xl p-6" style={{ background: 'linear-gradient(145deg, #141820, #0D1117)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Bell size={16} className="text-mia-orange" /><h3 className="text-base font-bold text-white">New Notification</h3></div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"><X size={14} className="text-white/60" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" className="admin-input" />
              <textarea required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Message" rows={3} className="admin-input resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="admin-input">
                  <option value="info">Info</option>
                  <option value="promo">Promo</option>
                  <option value="alert">Alert</option>
                  <option value="order">Order</option>
                </select>
                <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} className="admin-input">
                  <option value="all">All Users</option>
                  <option value="customers">Customers</option>
                  <option value="admins">Admins</option>
                </select>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
                {saving ? 'Creating...' : 'Create Notification'}
              </button>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && <ConfirmDialog title="Delete Notification" message={`Delete "${confirmDelete.title}"?`} confirmLabel="Delete" danger onConfirm={() => handleDelete(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
