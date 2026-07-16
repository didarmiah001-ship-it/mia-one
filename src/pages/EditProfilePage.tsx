import { useState, useRef } from 'react';
import { ArrowLeft, Save, User, Phone, Camera, KeyRound, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../lib/auth';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { updatePassword as fbUpdatePassword } from 'firebase/auth';

type Tab = 'profile' | 'password';

export function EditProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();

  const [tab, setTab] = useState<Tab>('profile');

  // Profile fields
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setProfileError(t('editProfile.imageTooLarge'));
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setProfileError('');
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarPreview || null;
    const ext = avatarFile.name.split('.').pop();
    const fileName = `avatar-${user!.uid}-${Date.now()}.${ext}`;

    const authRes = await fetch('https://ljtwvmgxrhwrwaaovlbi.supabase.co/functions/v1/imagekit-auth');
    if (!authRes.ok) {
      console.error(`[ImageKit] Auth failed: ${authRes.status} ${authRes.statusText}`);
      return avatarPreview || null;
    }
    const { token, expire, signature } = await authRes.json();

    const formData = new FormData();
    formData.append('file', avatarFile);
    formData.append('fileName', fileName);
    formData.append('publicKey', 'public_i67rlxsde');
    formData.append('signature', signature);
    formData.append('expire', String(expire));
    formData.append('token', token);

    const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: formData });
    if (!uploadRes.ok) {
      console.error(`[ImageKit] Upload failed: ${uploadRes.status}`, await uploadRes.text().catch(() => ''));
      return avatarPreview;
    }
    const uploadData = await uploadRes.json();
    return uploadData.url || avatarPreview;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setProfileLoading(true);

    const avatarUrl = await uploadAvatar();
    const updates: any = { full_name: fullName, phone };
    if (avatarUrl) updates.avatar_url = avatarUrl;

    const { error } = await updateProfile(updates);
    setProfileLoading(false);
    if (error) setProfileError(error);
    else {
      setProfileSuccess(true);
      setAvatarFile(null);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError(t('editProfile.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('editProfile.passwordsDontMatch'));
      return;
    }

    setPasswordLoading(true);
    try {
      await signInWithEmailAndPassword(auth, user!.email!, currentPassword);
    } catch {
      setPasswordLoading(false);
      setPasswordError(t('editProfile.currentPasswordWrong'));
      return;
    }

    try {
      await fbUpdatePassword(auth.currentUser!, newPassword);
      setPasswordLoading(false);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (e: any) {
      setPasswordLoading(false);
      setPasswordError(e.message);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-mia-orange/40';

  return (
    <div className="page-transition pb-24">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <h1 className="text-lg font-bold text-white">{t('editProfile.title')}</h1>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-6">
        {/* Tabs */}
        <div
          className="flex gap-1.5 mb-6 p-1.5 rounded-2xl"
          style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {([['profile', t('editProfile.profileInfo')], ['password', t('editProfile.changePassword')]] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={
                tab === key
                  ? { background: 'linear-gradient(135deg, rgba(255,138,0,0.15), rgba(255,46,201,0.15))', color: '#FF8A00', border: '1px solid rgba(255,138,0,0.2)' }
                  : { color: 'rgba(255,255,255,0.35)' }
              }>
              {label}
            </button>
          ))}
        </div>

        {/* ── Profile Info Tab ── */}
        {tab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ background: 'var(--card-bg)', border: '2px solid rgba(255,138,0,0.2)' }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white/60">
                      {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 2px 8px rgba(255,138,0,0.4)' }}>
                  <Camera size={14} className="text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <p className="text-[11px] text-white/30">{t('editProfile.cameraHint')}</p>
              {avatarFile && <p className="text-[11px] text-mia-orange">{avatarFile.name} {t('editProfile.selected')}</p>}
            </div>

            {profileError && (
              <div className="p-3 rounded-xl text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="p-3 rounded-xl text-sm text-green-300 flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <CheckCircle2 size={14} /> {t('editProfile.profileUpdated')}
              </div>
            )}

            <div>
              <label className="text-xs text-white/40 mb-1.5 block font-medium">{t('editProfile.email')}</label>
              <input
                type="text"
                value={user.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-2xl text-sm text-white/35 cursor-not-allowed"
                style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.04)' }}
              />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block font-medium">{t('editProfile.fullName')}</label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t('editProfile.fullNamePlaceholder')}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block font-medium">{t('editProfile.phone')}</label>
              <div className="relative">
                <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={t('editProfile.phonePlaceholder')}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 glow-btn"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
              {profileLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={15} />}
              {profileLoading ? t('editProfile.saving') : t('editProfile.saveChanges')}
            </button>
          </form>
        )}

        {/* ── Change Password Tab ── */}
        {tab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div
              className="p-4 rounded-2xl flex gap-3"
              style={{ background: 'rgba(0,209,255,0.04)', border: '1px solid rgba(0,209,255,0.1)' }}>
              <KeyRound size={16} className="text-mia-blue shrink-0 mt-0.5" />
              <p className="text-xs text-white/50 leading-relaxed">
                {t('editProfile.passwordDesc')}
              </p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl text-sm text-green-300 flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <CheckCircle2 size={14} /> {t('editProfile.passwordChanged')}
              </div>
            )}

            {(
              [
                { label: t('editProfile.currentPassword'), value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(s => !s) },
                { label: t('editProfile.newPassword'), value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(s => !s) },
                { label: t('editProfile.confirmNewPassword'), value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(s => !s) },
              ] as const
            ).map(field => (
              <div key={field.label}>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">{field.label}</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    type={field.show ? 'text' : 'password'}
                    value={field.value}
                    onChange={e => (field.set as (v: string) => void)(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`${inputClass} pl-11 pr-11`}
                  />
                  <button
                    type="button"
                    onClick={field.toggle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                    {field.show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}

            {newPassword.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-white/30">{t('editProfile.passwordStrength')}</p>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map(i => {
                    const strength = Math.min(Math.floor(newPassword.length / 3), 4);
                    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E'];
                    return (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i < strength ? colors[strength - 1] : 'rgba(255,255,255,0.08)' }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 glow-btn"
              style={{ background: 'linear-gradient(135deg, #7B2CFF, #00D1FF)' }}>
              {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={15} />}
              {passwordLoading ? t('editProfile.changing') : t('editProfile.changePasswordBtn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
