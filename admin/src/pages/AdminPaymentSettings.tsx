import { useState, useEffect, useCallback } from 'react';
import {
  adminFetchPaymentMethods,
  adminCreatePaymentMethod,
  adminUpdatePaymentMethod,
  adminDeletePaymentMethod,
  adminFetchSettings,
  adminUpsertSettings,
} from '../lib/api';
import { uploadToImageKit } from '../lib/imagekit-upload';
import { CreditCard, Plus, Edit2, Trash2, Save, X, Check, Smartphone, Building, DollarSign, QrCode, Upload, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

interface PaymentMethod {
  id: string;
  payment_type: 'bkash' | 'nagad' | 'rocket' | 'bank_transfer' | 'cash_on_delivery' | 'stripe' | 'sslcommerz';
  account_name: string;
  account_number: string;
  account_type: 'personal' | 'agent' | 'merchant' | 'bank' | 'none';
  bank_name: string;
  branch_name: string;
  routing_number: string;
  payment_instructions: string;
  is_active: boolean;
  sort_order: number;
  icon_url: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

const PAYMENT_TYPES = [
  { value: 'bkash', label: 'বিকাশ (bKash)', icon: Smartphone, color: '#E2136E' },
  { value: 'nagad', label: 'নগদ (Nagad)', icon: Smartphone, color: '#F6921E' },
  { value: 'rocket', label: 'রকেট (Rocket)', icon: Smartphone, color: '#8B5CF6' },
  { value: 'bank_transfer', label: 'ব্যাংক ট্রান্সফার', icon: Building, color: '#00D1FF' },
  { value: 'cash_on_delivery', label: 'ক্যাশ অন ডেলিভারি', icon: DollarSign, color: '#22C55E' },
  { value: 'stripe', label: 'Stripe (কার্ড)', icon: CreditCard, color: '#635BFF' },
  { value: 'sslcommerz', label: 'SSLCommerz', icon: CreditCard, color: '#00A651' },
];

const ACCOUNT_TYPES = [
  { value: 'personal', label: 'পার্সোনাল' },
  { value: 'agent', label: 'এজেন্ট' },
  { value: 'merchant', label: 'মার্চেন্ট' },
  { value: 'bank', label: 'ব্যাংক' },
  { value: 'none', label: 'প্রযোজ্য নয়' },
];

const emptyForm: Partial<PaymentMethod> = {
  payment_type: 'bkash',
  account_name: '',
  account_number: '',
  account_type: 'merchant',
  bank_name: '',
  branch_name: '',
  routing_number: '',
  payment_instructions: '',
  is_active: true,
  sort_order: 0,
  icon_url: '',
  display_name: '',
};

export function AdminPaymentSettings() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<PaymentMethod>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();

  // Bangla QR state
  const [banglaQRUrl, setBanglaQRUrl] = useState<string>('');
  const [qrUploading, setQrUploading] = useState(false);
  const [qrSaving, setQrSaving] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    const data = await adminFetchPaymentMethods();
    setMethods(data as PaymentMethod[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  useEffect(() => {
    adminFetchSettings('bangla_qr').then(data => {
      if (data?.qr_image_url) setBanglaQRUrl(data.qr_image_url);
      setQrLoading(false);
    }).catch(() => setQrLoading(false));
  }, []);

  const handleQRUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setQrUploading(true);
    try {
      const result = await uploadToImageKit(file, 'bangla-qr');
      if (result.url) {
        setBanglaQRUrl(result.url);
        toast.success('QR image uploaded');
      } else {
        toast.error('Upload failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    }
    setQrUploading(false);
  };

  const handleSaveQR = async () => {
    setQrSaving(true);
    const { error } = await adminUpsertSettings('bangla_qr', { qr_image_url: banglaQRUrl, updated_at: new Date().toISOString() });
    if (error) toast.error(error);
    else toast.success('Bangla QR saved successfully');
    setQrSaving(false);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setForm(method);
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.payment_type) {
      toast.error('Payment type is required');
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await adminUpdatePaymentMethod(editingId, form);

      if (error) {
        toast.error('Failed to update payment method');
      } else {
        toast.success('Payment method updated successfully');
        setEditingId(null);
        fetchMethods();
      }
    } else {
      const { error } = await adminCreatePaymentMethod(form);

      if (error) {
        toast.error('Failed to create payment method');
      } else {
        toast.success('Payment method created successfully');
        setShowAddForm(false);
        fetchMethods();
      }
    }

    setSaving(false);
    setForm(emptyForm);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await adminDeletePaymentMethod(deleteId);

    if (error) {
      toast.error('Failed to delete payment method');
    } else {
      toast.success('Payment method deleted successfully');
      fetchMethods();
    }
    setDeleteId(null);
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    const { error } = await adminUpdatePaymentMethod(method.id, { is_active: !method.is_active });

    if (error) {
      toast.error('Failed to toggle status');
    } else {
      toast.success(`Payment method ${!method.is_active ? 'activated' : 'deactivated'}`);
      fetchMethods();
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    return PAYMENT_TYPES.find(p => p.value === type)?.label || type;
  };

  const getPaymentTypeColor = (type: string) => {
    return PAYMENT_TYPES.find(p => p.value === type)?.color || '#FF8A00';
  };

  const getAccountTypeLabel = (type: string) => {
    return ACCOUNT_TYPES.find(a => a.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Delete confirmation */}
      {deleteId && (
        <ConfirmDialog
          title="Delete Payment Method"
          message="Are you sure you want to delete this payment method? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          danger
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Payment Settings</h2>
          <p className="text-sm text-white/50 mt-1">Manage payment methods, accounts, and instructions</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)',
            boxShadow: '0 4px 20px rgba(255,138,0,0.25)',
          }}
        >
          <Plus size={16} />
          <span>Add Payment Method</span>
        </button>
      </div>

      {/* Bangla QR Upload Section */}
      <div className="glow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.2)' }}>
            <QrCode size={15} className="text-[#00D1FF]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Bangla QR Code</h3>
            <p className="text-[11px] text-white/30">Universal QR for mobile banking apps (bKash, Nagad, Rocket, etc.)</p>
          </div>
        </div>

        {qrLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-white/30" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* QR Preview */}
            <div className="shrink-0">
              {banglaQRUrl ? (
                <div className="relative group">
                  <img
                    src={banglaQRUrl}
                    alt="Bangla QR"
                    className="w-32 h-32 rounded-2xl object-contain"
                    style={{ background: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button
                    onClick={() => setBanglaQRUrl('')}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove QR"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-2xl flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)' }}>
                  <QrCode size={32} className="text-white/20" />
                  <span className="text-[10px] text-white/30">No QR uploaded</span>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleQRUpload(e.target.files[0])}
                  className="hidden"
                />
                <div
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all hover:scale-[1.01]"
                  style={{ background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.2)', color: '#00D1FF' }}
                >
                  {qrUploading ? (
                    <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload size={16} /> {banglaQRUrl ? 'Replace QR Image' : 'Upload Bangla QR Code'}</>
                  )}
                </div>
              </label>
              <p className="text-[11px] text-white/30 leading-relaxed">
                Upload a single Bangla QR image. Customers will see this QR at checkout when they select a mobile/digital payment method. They can scan it with any banking app to pay instantly.
              </p>
              {banglaQRUrl && (
                <button
                  onClick={handleSaveQR}
                  disabled={qrSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #00D1FF, #7B2CFF)' }}
                >
                  {qrSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {qrSaving ? 'Saving...' : 'Save QR Settings'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[#FF8A00] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Add New Form */}
          {showAddForm && (
            <div className="glow-card p-5 space-y-4" style={{ borderColor: 'rgba(255,138,0,0.3)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">New Payment Method</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X size={18} className="text-white/60" />
                </button>
              </div>
              <PaymentMethodForm
                form={form}
                setForm={setForm}
                saving={saving}
                onSave={handleSave}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Existing Methods */}
          {methods.map((method) => (
            <div
              key={method.id}
              className="glow-card p-5"
              style={{
                borderColor: method.is_active ? `${getPaymentTypeColor(method.payment_type)}30` : 'rgba(255,255,255,0.05)',
                opacity: method.is_active ? 1 : 0.6,
              }}
            >
              {editingId === method.id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white">Edit Payment Method</h3>
                    <button
                      onClick={handleCancelEdit}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <X size={18} className="text-white/60" />
                    </button>
                  </div>
                  <PaymentMethodForm
                    form={form}
                    setForm={setForm}
                    saving={saving}
                    onSave={handleSave}
                    onCancel={handleCancelEdit}
                  />
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon and Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: `${getPaymentTypeColor(method.payment_type)}15`,
                        border: `1px solid ${getPaymentTypeColor(method.payment_type)}30`,
                      }}
                    >
                      {(() => {
                        const Icon = PAYMENT_TYPES.find(p => p.value === method.payment_type)?.icon || CreditCard;
                        return <Icon size={22} style={{ color: getPaymentTypeColor(method.payment_type) }} />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {method.display_name || getPaymentTypeLabel(method.payment_type)}
                        </h3>
                        <span
                          className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            background: method.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
                            color: method.is_active ? '#4ade80' : '#9ca3af',
                          }}
                        >
                          {method.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {method.account_number && (
                        <p className="text-xs text-white/50 mt-0.5">{method.account_number}</p>
                      )}
                      {method.account_name && (
                        <p className="text-xs text-white/40">{method.account_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="hidden lg:flex items-center gap-4 text-xs text-white/50">
                    {method.account_type !== 'none' && method.account_type !== 'bank' && (
                      <span className="px-2 py-1 rounded bg-white/5">{getAccountTypeLabel(method.account_type)}</span>
                    )}
                    {method.bank_name && (
                      <span>{method.bank_name}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(method)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105 ${
                        method.is_active ? 'bg-green-500/10' : 'bg-gray-500/10'
                      }`}
                      title={method.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Check size={16} className={method.is_active ? 'text-green-400' : 'text-gray-500'} />
                    </button>
                    <button
                      onClick={() => handleEdit(method)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 hover:bg-[#FF8A00]/10 transition-colors"
                    >
                      <Edit2 size={16} className="text-white/60 hover:text-[#FF8A00]" />
                    </button>
                    <button
                      onClick={() => setDeleteId(method.id)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={16} className="text-white/60 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Show details on click for mobile */}
              {editingId !== method.id && method.payment_instructions && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-white/40 leading-relaxed">{method.payment_instructions}</p>
                </div>
              )}
            </div>
          ))}

          {methods.length === 0 && !loading && (
            <div className="glow-card p-10 text-center">
              <CreditCard size={40} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/50">No payment methods configured</p>
              <button
                onClick={handleAddNew}
                className="mt-4 text-sm text-[#FF8A00] hover:underline"
              >
                Add your first payment method
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Form component for create/edit
function PaymentMethodForm({
  form,
  setForm,
  saving,
  onSave,
  onCancel,
}: {
  form: Partial<PaymentMethod>;
  setForm: (f: Partial<PaymentMethod>) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const needsBankDetails = form.payment_type === 'bank_transfer';
  const needsMobileDetails = ['bkash', 'nagad', 'rocket'].includes(form.payment_type || '');
  const isCOD = form.payment_type === 'cash_on_delivery';

  return (
    <div className="space-y-4">
      {/* Row 1: Payment Type & Display Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Payment Type *</label>
          <select
            value={form.payment_type || ''}
            onChange={(e) => setForm({ ...form, payment_type: e.target.value as PaymentMethod['payment_type'] })}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#FF8A00]/40 transition-colors"
          >
            {PAYMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value} className="bg-[#141820]">
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Display Name</label>
          <input
            type="text"
            value={form.display_name || ''}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            placeholder="e.g., বিকাশ, নগদ"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-[#FF8A00]/40 transition-colors"
          />
        </div>
      </div>

      {/* Row 2: Account Name & Number (for mobile banking) */}
      {(needsMobileDetails || needsBankDetails) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Account Name {needsMobileDetails && '*'}
            </label>
            <input
              type="text"
              value={form.account_name || ''}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              placeholder="Account holder name"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-[#FF8A00]/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              {needsBankDetails ? 'Account Number' : 'Mobile Number'} {needsMobileDetails && '*'}
            </label>
            <input
              type="text"
              value={form.account_number || ''}
              onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              placeholder={needsBankDetails ? 'Account number' : '01XXXXXXXXX'}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-[#FF8A00]/40 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Row 3: Account Type (for mobile banking) */}
      {needsMobileDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Account Type</label>
            <select
              value={form.account_type || 'personal'}
              onChange={(e) => setForm({ ...form, account_type: e.target.value as PaymentMethod['account_type'] })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#FF8A00]/40 transition-colors"
            >
              {ACCOUNT_TYPES.filter(a => a.value !== 'bank').map((type) => (
                <option key={type.value} value={type.value} className="bg-[#141820]">
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Sort Order</label>
            <input
              type="number"
              value={form.sort_order || 0}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#FF8A00]/40 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Bank Details */}
      {needsBankDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Bank Name *</label>
            <input
              type="text"
              value={form.bank_name || ''}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              placeholder="Bank name"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-[#FF8A00]/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Branch Name</label>
            <input
              type="text"
              value={form.branch_name || ''}
              onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
              placeholder="Branch name"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-[#FF8A00]/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Routing Number</label>
            <input
              type="text"
              value={form.routing_number || ''}
              onChange={(e) => setForm({ ...form, routing_number: e.target.value })}
              placeholder="Routing number"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-[#FF8A00]/40 transition-colors"
            />
          </div>
        </div>
      )}

      {/* COD Options */}
      {isCOD && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Account Type</label>
            <select
              value={form.account_type || 'none'}
              onChange={(e) => setForm({ ...form, account_type: e.target.value as PaymentMethod['account_type'] })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#FF8A00]/40 transition-colors"
            >
              <option value="none" className="bg-[#141820]">প্রযোজ্য নয়</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Sort Order</label>
            <input
              type="number"
              value={form.sort_order || 0}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#FF8A00]/40 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Payment Instructions */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5">Payment Instructions</label>
        <textarea
          value={form.payment_instructions || ''}
          onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })}
          placeholder="Instructions for customers on how to pay..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-[#FF8A00]/40 transition-colors resize-none"
        />
      </div>

      {/* Active Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setForm({ ...form, is_active: !form.is_active })}
          className={`w-11 h-6 rounded-full transition-all duration-300 ${
            form.is_active ? 'bg-green-500' : 'bg-white/10'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
              form.is_active ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className="text-sm text-white/70">{form.is_active ? 'Active' : 'Inactive'}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)',
          }}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}
