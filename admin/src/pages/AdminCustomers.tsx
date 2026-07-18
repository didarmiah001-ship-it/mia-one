import { useState, useEffect } from 'react';
import { Search, User, Phone, MapPin, Calendar, Package, ChevronRight, X, Eye, CreditCard, FileText, Ban, Shield, Copy, Download } from 'lucide-react';
import { adminFetchCustomersWithStats, adminFetchCustomerOrders, adminUpdateCustomerBlacklist } from '../lib/api';
import { useToast } from '../components/Toast';

interface CustomerWithStats {
  id: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  role: string;
  created_at: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  ltv: number;
  is_blacklisted: boolean;
  blacklist_reason: string;
  lastOrderDate?: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Customer Detail Drawer
function CustomerDrawer({
  customer,
  onClose,
  onBlacklistToggle,
}: {
  customer: CustomerWithStats;
  onClose: () => void;
  onBlacklistToggle: (id: string, isBlacklisted: boolean, reason?: string) => Promise<void>;
}) {
  const toast = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState(customer.blacklist_reason || '');
  const [togglingBlacklist, setTogglingBlacklist] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const data = await adminFetchCustomerOrders(customer.id);
      setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, [customer.id]);

  const handleToggleBlacklist = async () => {
    setTogglingBlacklist(true);
    await onBlacklistToggle(customer.id, !customer.is_blacklisted, blacklistReason);
    setTogglingBlacklist(false);
    setShowBlacklistModal(false);
    onClose();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="fixed inset-0 z-[9990] flex">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg h-full overflow-y-auto flex flex-col"
        style={{ background: 'linear-gradient(180deg, #141820, #0D1117)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
          style={{ background: 'rgba(13,17,23,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
              style={{ background: 'rgba(255,138,0,0.12)', border: '1px solid rgba(255,138,0,0.2)' }}>
              {customer.avatar_url
                ? <img src={customer.avatar_url} className="w-full h-full object-cover" alt="" />
                : <User size={18} className="text-mia-orange" />
              }
            </div>
            <div>
              <p className="text-sm font-bold text-white">{customer.full_name || 'Unknown'}</p>
              <p className="text-[10px] text-white/40 capitalize">{customer.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <X size={14} className="text-white/60" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }}>
              <p className="text-xl font-bold text-mia-orange">{customer.totalOrders}</p>
              <p className="text-[10px] text-white/40">Orders</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.15)' }}>
              <p className="text-base font-bold text-[#00D1FF]">৳{customer.totalSpent.toLocaleString()}</p>
              <p className="text-[10px] text-white/40">Spent</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <p className="text-base font-bold text-green-400">৳{customer.ltv.toLocaleString()}</p>
              <p className="text-[10px] text-white/40">LTV</p>
            </div>
          </div>

          {/* Blacklist Status / Action */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: customer.is_blacklisted ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', border: customer.is_blacklisted ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {customer.is_blacklisted ? <Ban size={14} className="text-red-400" /> : <Shield size={14} className="text-white/40" />}
                <span className="text-xs font-semibold text-white/70">Blacklist Status</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${customer.is_blacklisted ? 'bg-red-500/15 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                {customer.is_blacklisted ? 'BLACKLISTED' : 'ACTIVE'}
              </span>
            </div>
            {customer.is_blacklisted && customer.blacklist_reason && (
              <p className="text-[11px] text-red-300/70 pl-6">Reason: {customer.blacklist_reason}</p>
            )}
            {!showBlacklistModal ? (
              <button
                onClick={() => setShowBlacklistModal(true)}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${customer.is_blacklisted ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'}`}
                style={{ border: `1px solid ${customer.is_blacklisted ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}
              >
                {customer.is_blacklisted ? 'Remove from Blacklist' : 'Add to Blacklist'}
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={blacklistReason}
                  onChange={e => setBlacklistReason(e.target.value)}
                  placeholder="Reason for blacklisting (optional)..."
                  className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder:text-white/25 resize-none focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBlacklistModal(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium text-white/50 hover:bg-white/5 transition-colors"
                  >Cancel</button>
                  <button
                    onClick={handleToggleBlacklist}
                    disabled={togglingBlacklist}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 ${customer.is_blacklisted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                  >
                    {togglingBlacklist ? 'Saving...' : customer.is_blacklisted ? 'Confirm Remove' : 'Confirm Blacklist'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Contact Info Inside Drawer */}
          <div className="space-y-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Contact Info</p>
            
            <div className="flex items-center justify-between group/row">
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-white/30 shrink-0" />
                <span className="text-sm text-white/70">{customer.phone || '—'}</span>
              </div>
              {customer.phone && (
                <button 
                  onClick={() => copyToClipboard(customer.phone, 'Phone number')} 
                  className="p-1 rounded bg-white/5 opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-white/10"
                  title="Copy Phone"
                >
                  <Copy size={11} className="text-white/60" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between group/row">
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-white/30 shrink-0" />
                <span className="text-sm text-white/70 truncate max-w-[240px]">{customer.email || '—'}</span>
              </div>
              {customer.email && (
                <button 
                  onClick={() => copyToClipboard(customer.email || '', 'Email address')} 
                  className="p-1 rounded bg-white/5 opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-white/10"
                  title="Copy Email"
                >
                  <Copy size={11} className="text-white/60" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-white/30 shrink-0" />
              <span className="text-xs text-white/50">Joined {fmtDate(customer.created_at)}</span>
            </div>
          </div>

          {/* Orders */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Order History</p>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 rounded-xl text-center text-white/30 text-xs" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                No orders found for this customer
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map(order => {
                  const addr = order.address || {};
                  const items = order.items || [];
                  const payment = order.payments?.[0] || order.payment;
                  const screenshotUrl = payment?.screenshot_url || payment?.payment_screenshot_url || order.payment_screenshot_url;

                  return (
                    <div key={order.id} className="rounded-xl overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <button
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/2 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(255,138,0,0.1)' }}>
                            <Package size={16} className="text-mia-orange" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-white font-mono">
                              {order.order_number || `#${order.id.slice(-8).toUpperCase()}`}
                            </p>
                            <p className="text-[10px] text-white/40 mt-0.5">
                              {items.length} item{items.length !== 1 ? 's' : ''} · {fmtDateTime(order.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">৳{Number(order.total).toLocaleString()}</span>
                          <ChevronRight size={14} className={`text-white/30 transition-transform ${selectedOrder?.id === order.id ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {/* Expanded Order Details */}
                      {selectedOrder?.id === order.id && (
                        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                          {/* Order Items */}
                          <div className="space-y-2">
                            {items.length === 0 ? (
                              <p className="text-xs text-white/30 text-center py-2">No items found</p>
                            ) : (
                              items.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-2.5">
                                  {item.image && <img src={item.image} alt={item.name} className="w-8 h-8 rounded-md object-cover shrink-0" />}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-white/70 truncate">{item.name}</p>
                                    <p className="text-[10px] text-white/35">x{item.quantity} · ৳{item.price}</p>
                                  </div>
                                  <span className="text-xs font-medium text-white/60">৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Delivery Address */}
                          {addr.address && (
                            <div className="flex items-start gap-2 text-[11px] text-white/50">
                              <MapPin size={11} className="text-white/30 shrink-0 mt-0.5" />
                              <span>{addr.full_name} · {addr.phone}</span>
                            </div>
                          )}

                          {/* Payment Info */}
                          <div className="flex items-center justify-between text-xs py-2 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              <CreditCard size={11} className="text-white/30" />
                              <span className="text-white/50 capitalize">{(order.payment_method || '').replace(/_/g, ' ')}</span>
                            </div>
                            <span className={`capitalize ${payment?.status === 'verified' ? 'text-green-400' : payment?.status === 'failed' ? 'text-red-400' : 'text-white/50'}`}>
                              {payment?.status || order.payment_status || 'pending'}
                            </span>
                          </div>

                          {/* Screenshot */}
                          {screenshotUrl && (
                            <div className="space-y-2">
                              <p className="text-[10px] text-white/40 uppercase tracking-wider">Payment Proof</p>
                              <a href={screenshotUrl} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={screenshotUrl} alt="Payment proof" className="w-full rounded-lg object-cover border border-white/10 hover:border-mia-orange/40 transition-colors" style={{ maxHeight: '200px' }} />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminCustomers() {
  const toast = useToast();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [filterBlacklisted, setFilterBlacklisted] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const customersWithStats = await adminFetchCustomersWithStats();
      setCustomers(customersWithStats as any);
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  const handleBlacklistToggle = async (id: string, isBlacklisted: boolean, reason?: string) => {
    const { error } = await adminUpdateCustomerBlacklist(id, isBlacklisted, reason);
    if (error) {
      toast.error(error);
    } else {
      toast.success(isBlacklisted ? 'Customer blacklisted' : 'Customer removed from blacklist');
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, is_blacklisted: isBlacklisted, blacklist_reason: reason || '' } : c));
    }
  };

  // Client-side Global fast search (Name, Email, Phone)
  const filtered = customers.filter(c =>
    (!search ||
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)) &&
    (!filterBlacklisted || c.is_blacklisted)
  );

  // Fast Client-side Read-only CSV Export functionality
  const handleCSVExport = () => {
    if (filtered.length === 0) {
      toast.error('No customer data available to export.');
      return;
    }

    const headers = ['Customer ID', 'Full Name', 'Email', 'Phone', 'Total Orders', 'Total Spent (BDT)', 'LTV (BDT)', 'Status', 'Joined Date'];
    const rows = filtered.map(c => [
      c.id,
      c.full_name || 'Unknown',
      c.email || '-',
      c.phone || '-',
      c.totalOrders,
      c.totalSpent,
      c.ltv,
      c.is_blacklisted ? 'Blacklisted' : 'Active',
      fmtDate(c.created_at)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MIA_Customers_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV file exported successfully!');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-base font-bold text-white">
            Customers <span className="text-white/30 text-sm font-normal">({filtered.length})</span>
          </h2>
          <p className="text-xs text-white/30 mt-0.5">
            Total Revenue: <span className="text-mia-orange font-semibold">৳{filtered.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()}</span>
            <span className="mx-2 text-white/15">|</span>
            Total LTV: <span className="text-green-400 font-semibold">৳{filtered.reduce((s, c) => s + (c.ltv || 0), 0).toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* CSV Export Trigger Action Button */}
          <button
            onClick={handleCSVExport}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5 shrink-0"
          >
            <Download size={13} />
            Export CSV
          </button>

          <button
            onClick={() => setFilterBlacklisted(!filterBlacklisted)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${filterBlacklisted ? 'text-red-400' : 'text-white/40'}`}
            style={{ background: filterBlacklisted ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${filterBlacklisted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}
          >
            <Ban size={12} />
            Blacklisted
          </button>
          
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full sm:w-60 pl-9 pr-3 py-2 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="glow-card h-20 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glow-card py-16 text-center text-white/25 text-sm">No customers found</div>
      ) : (
        <>
          {/* Mobile Card Responsive View Layout List */}
          <div className="lg:hidden space-y-2">
            {filtered.map(c => (
              <div key={c.id} className="w-full glow-card p-3 flex flex-col gap-2 text-left relative">
                <div onClick={() => setSelectedCustomer(c)} className="flex items-center gap-3 cursor-pointer">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }}
                  >
                    {c.avatar_url
                      ? <img src={c.avatar_url} className="w-full h-full object-cover" alt="" />
                      : <User size={16} className="text-mia-orange/60" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{c.full_name || 'Unknown'}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{c.totalOrders} orders · <span className="text-mia-orange font-medium">৳{c.totalSpent.toLocaleString()}</span></p>
                  </div>
                  <ChevronRight size={14} className="text-white/30 ml-auto" />
                </div>

                {/* Mobile action inline clipboards details wrapper panel */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5 text-xs text-white/50">
                  <div className="flex items-center justify-between bg-white/[0.01] px-2 py-1 rounded-lg">
                    <span className="truncate pr-2">Phone: {c.phone || '—'}</span>
                    {c.phone && (
                      <button onClick={() => copyToClipboard(c.phone, 'Phone number')} className="p-1 hover:bg-white/10 rounded text-white/60">
                        <Copy size={11} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between bg-white/[0.01] px-2 py-1 rounded-lg">
                    <span className="truncate pr-2">Email: {c.email || '-'}</span>
                    {c.email && (
                      <button onClick={() => copyToClipboard(c.email || '', 'Email address')} className="p-1 hover:bg-white/10 rounded text-white/60">
                        <Copy size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Responsive View Layout Design */}
          <div className="hidden lg:block glow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Customer</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Email Address</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Phone</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Orders</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Total Spent</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">LTV</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Status</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Joined</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-white/[0.015] transition-colors group/row"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedCustomer(c)}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                            style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }}>
                            {c.avatar_url
                              ? <img src={c.avatar_url} className="w-full h-full object-cover" alt="" />
                              : <User size={15} className="text-mia-orange/60" />
                            }
                          </div>
                          <span className="text-sm text-white/80 font-medium">{c.full_name || 'Unknown'}</span>
                        </div>
                      </td>
                      
                      {/* Customer Email Display Engine Panel Column Cell */}
                      <td className="px-4 py-3 text-xs text-white/60">
                        <div className="flex items-center justify-between gap-2 max-w-[170px]">
                          <span className="truncate">{c.email || '-'}</span>
                          {c.email && (
                            <button 
                              onClick={() => copyToClipboard(c.email || '', 'Email address')} 
                              className="p-1 rounded bg-white/5 opacity-0 group-hover/row:opacity-100 hover:bg-white/10 text-white/40 hover:text-white transition-all shrink-0"
                              title="Copy Email"
                            >
                              <Copy size={11} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Phone Column Cell with dynamic copy clipboard action trigger feature */}
                      <td className="px-4 py-3 text-xs text-white/50">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono">{c.phone || '—'}</span>
                          {c.phone && (
                            <button 
                              onClick={() => copyToClipboard(c.phone, 'Phone number')} 
                              className="p-1 rounded bg-white/5 opacity-0 group-hover/row:opacity-100 hover:bg-white/10 text-white/40 hover:text-white transition-all shrink-0"
                              title="Copy Phone"
                            >
                              <Copy size={11} />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 cursor-pointer text-xs text-white/70" onClick={() => setSelectedCustomer(c)}>
                        {c.totalOrders}
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedCustomer(c)}>
                        <span className="text-xs font-semibold text-mia-orange">৳{c.totalSpent.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedCustomer(c)}>
                        <span className="text-xs font-semibold text-green-400">৳{(c.ltv || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedCustomer(c)}>
                        {c.is_blacklisted
                          ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold">BLACKLISTED</span>
                          : <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-bold">ACTIVE</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/40 cursor-pointer" onClick={() => setSelectedCustomer(c)}>
                        {fmtDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelectedCustomer(c)} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
                          <Eye size={13} className="text-white/30" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <CustomerDrawer
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onBlacklistToggle={handleBlacklistToggle}
        />
      )}
    </div>
  );
}
