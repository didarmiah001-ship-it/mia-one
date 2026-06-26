import { useState, useEffect } from 'react';
import { adminFetchAllCustomers } from '../lib/api';
import { Search, User } from 'lucide-react';

export function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  useEffect(() => { adminFetchAllCustomers().then(d => { setCustomers(d); setLoading(false); }); }, []);

  const filtered = customers.filter(c =>
    !search ||
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <h2 className="text-base font-bold text-white">
          Customers <span className="text-white/30 text-sm font-normal">({filtered.length})</span>
        </h2>
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
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="glow-card h-16 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glow-card py-16 text-center text-white/25 text-sm">No customers found</div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="lg:hidden space-y-2">
            {filtered.map(c => (
              <div key={c.id} className="glow-card p-3 flex items-center gap-3">
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium text-mia-orange bg-mia-orange/10 capitalize">
                      {c.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/25 mt-0.5">
                    Joined {new Date(c.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block glow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {['Customer', 'Phone', 'Joined', 'Role'].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-white/30 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr
                      key={c.id}
                      className="hover:bg-white/[0.015] transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                            style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }}
                          >
                            {c.avatar_url
                              ? <img src={c.avatar_url} className="w-full h-full object-cover" alt="" />
                              : <User size={15} className="text-mia-orange/60" />
                            }
                          </div>
                          <span className="text-sm text-white/80 font-medium">{c.full_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50">{c.phone || '—'}</td>
                      <td className="px-4 py-3 text-xs text-white/40">
                        {new Date(c.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-lg font-medium text-mia-orange bg-mia-orange/10 border border-mia-orange/20 capitalize">
                          {c.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
