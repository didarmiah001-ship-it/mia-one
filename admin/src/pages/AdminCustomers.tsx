import { useState, useEffect } from 'react';
import { Search, User, Phone, MapPin, Calendar, ShoppingCart, DollarSign, Package, ChevronRight, X, Eye, CreditCard, Image as ImageIcon, FileText } from 'lucide-react';
import { adminFetchAllCustomers } from '../lib/api';
import { supabase } from '../lib/supabase';

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
}: {
  customer: CustomerWithStats;
  onClose: () => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      // Fetch orders by user_id or by matching phone number in address
      const { data } = await supabase
        .from('orders')
        .select('*, payments(*)')
        .or(`user_id.eq.${customer.id}`)
        .order('created_at', { ascending: false })
        .limit(50);
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, [customer.id]);

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
              <p className="text-xs font-bold text-green-400">
                {customer.lastOrderDate ? fmtDate(customer.lastOrderDate) : '—'}
              </p>
              <p className="text-[10px] text-white/40">Last Order</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Contact Info</p>
            <div className="flex items-center gap-2">
              <Phone size={12} className="text-white/30 shrink-0" />
              <span className="text-sm text-white/70">{customer.phone || '—'}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-white/30 shrink-0" />
                <span className="text-sm text-white/70">{customer.email}</span>
              </div>
            )}
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
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);

      // Fetch all customers (profiles with role='customer')
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Fetch all orders to calculate stats
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total, created_at, address');

      // Calculate stats per customer
      const customersWithStats: CustomerWithStats[] = profiles.map(p => {
        // Find orders for this customer by user_id or by matching phone in address
        const customerOrders = (orders || []).filter(o => {
          if (o.user_id === p.id) return true;
          const phone = (o.address as any)?.phone;
          if (phone && p.phone && phone === p.phone) return true;
          return false;
        });

        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const lastOrderDate = customerOrders.length > 0
          ? customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : undefined;

        return {
          id: p.id,
          full_name: p.full_name || 'Unknown',
          phone: p.phone || '',
          avatar_url: p.avatar_url || '',
          role: p.role,
          created_at: p.created_at,
          totalOrders,
          totalSpent,
          lastOrderDate,
        };
      });

      // Sort by total spent
      customersWithStats.sort((a, b) => b.totalSpent - a.totalSpent);
      setCustomers(customersWithStats);
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c =>
    !search ||
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-base font-bold text-white">
            Customers <span className="text-white/30 text-sm font-normal">({filtered.length})</span>
          </h2>
          <p className="text-xs text-white/30 mt-0.5">
            Total Revenue: <span className="text-mia-orange font-semibold">৳{filtered.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()}</span>
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers…"
            className="w-full sm:w-60 pl-9 pr-3 py-2 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40"
          />
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
          {/* Mobile card list */}
          <div className="lg:hidden space-y-2">
            {filtered.map(c => (
              <button key={c.id} onClick={() => setSelectedCustomer(c)}
                className="w-full glow-card p-3 flex items-center gap-3 text-left hover:border-white/10 transition-colors">
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
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {c.phone && <span className="text-[11px] text-white/45">{c.phone}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-white/40">{c.totalOrders} orders</span>
                    <span className="text-[10px] text-mia-orange font-medium">৳{c.totalSpent.toLocaleString()}</span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-white/30" />
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block glow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Customer</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Phone</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Orders</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Total Spent</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Last Order</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">Joined</th>
                    <th className="text-left text-[11px] font-semibold text-white/30 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-white/[0.015] transition-colors cursor-pointer"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onClick={() => setSelectedCustomer(c)}>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3 text-xs text-white/50">{c.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-white/70">{c.totalOrders}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-mia-orange">৳{c.totalSpent.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/40">
                        {c.lastOrderDate ? fmtDate(c.lastOrderDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/40">
                        {fmtDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
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
        />
      )}
    </div>
  );
}
