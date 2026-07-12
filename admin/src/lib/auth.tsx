import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  User as FbUser,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface AdminProfile {
  id: string;
  email: string;
  role: string;
  active: boolean;
}

interface AuthContextValue {
  user: FbUser | null;
  profile: AdminProfile | null;
  loading: boolean;
  isAdmin: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FbUser | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const snap = await getDoc(doc(db, 'admins', userId));
      if (snap.exists()) {
        const data = snap.data();
        if (data.active === true && data.role === 'admin') {
          setProfile({ id: snap.id, email: data.email || '', role: data.role, active: data.active });
          setAuthError(null);
        } else {
          setProfile(null);
          setAuthError('Your admin account is inactive or does not have the admin role.');
        }
      } else {
        setProfile(null);
        setAuthError('No admin record found for this user.');
      }
    } catch (err: any) {
      setProfile(null);
      setAuthError(err?.message || 'Failed to verify admin status. Check Firestore security rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.uid);
  }, [user, fetchProfile]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        await fetchProfile(fbUser.uid);
      } else {
        setProfile(null);
        setAuthError(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
    setProfile(null);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin: profile?.active === true && profile?.role === 'admin',
      authError,
      signIn,
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
