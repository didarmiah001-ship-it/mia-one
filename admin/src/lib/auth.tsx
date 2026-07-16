import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import {
  User as FbUser,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { query, where, limit, getDocs, collection } from 'firebase/firestore';
import { clearOtpState } from './otp';

export interface AdminProfile {
  id: string;
  email: string;
  role: string;
  active: boolean;
  is_allowed_to_login: boolean;
}

interface FetchResult {
  ok: boolean;
  error: string | null;
}

interface AuthContextValue {
  user: FbUser | null;
  profile: AdminProfile | null;
  loading: boolean;
  isAdmin: boolean;
  authError: string | null;
  verifyCredentials: (email: string, password: string) => Promise<{ error: string | null }>;
  finalizeSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FbUser | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const manualSignInRef = useRef(false);

  const fetchProfile = useCallback(async (email: string): Promise<FetchResult> => {
    try {
      const q = query(collection(db, 'admins'), where('email', '==', email), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        if (data.active === true && data.is_allowed_to_login === true && data.role === 'admin') {
          setProfile({
            id: docSnap.id,
            email: data.email || '',
            role: data.role,
            active: data.active,
            is_allowed_to_login: data.is_allowed_to_login,
          });
          setAuthError(null);
          return { ok: true, error: null };
        } else {
          setProfile(null);
          const msg = `Admin check failed: active=${data.active}, is_allowed_to_login=${data.is_allowed_to_login}, role=${data.role}.`;
          setAuthError(msg);
          return { ok: false, error: msg };
        }
      } else {
        setProfile(null);
        const msg = `No admin document found for email: ${email}`;
        setAuthError(msg);
        return { ok: false, error: msg };
      }
    } catch (err: any) {
      setProfile(null);
      const msg = err?.message || 'Failed to verify admin status.';
      setAuthError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.email) await fetchProfile(user.email);
  }, [user, fetchProfile]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        if (manualSignInRef.current) {
          setLoading(false);
        } else {
          await fetchProfile(fbUser.email!);
        }
      } else {
        setProfile(null);
        setAuthError(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [fetchProfile]);

  const verifyCredentials = useCallback(async (email: string, password: string) => {
    try {
      manualSignInRef.current = true;
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const result = await fetchProfile(cred.user.email!);
      manualSignInRef.current = false;
      if (!result.ok) {
        await fbSignOut(auth);
        return { error: result.error || 'This account does not have admin privileges.' };
      }
      return { error: null };
    } catch (e: any) {
      manualSignInRef.current = false;
      return { error: e.message };
    }
  }, [fetchProfile]);

  const finalizeSignIn = useCallback(async (email: string, password: string) => {
    try {
      manualSignInRef.current = true;
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const result = await fetchProfile(cred.user.email!);
      manualSignInRef.current = false;
      if (!result.ok) {
        return { error: result.error || 'Admin verification failed.' };
      }
      return { error: null };
    } catch (e: any) {
      manualSignInRef.current = false;
      return { error: e.message };
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    clearOtpState();
    await fbSignOut(auth);
    setProfile(null);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin: profile?.active === true && profile?.is_allowed_to_login === true && profile?.role === 'admin',
      authError,
      verifyCredentials,
      finalizeSignIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
