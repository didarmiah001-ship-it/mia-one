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
    const collectionName = 'admins';
    const docPath = `admins/${userId}`;

    console.log('[AdminAuth] Firestore lookup:', {
      collection: collectionName,
      documentPath: docPath,
      authenticatedUid: userId,
      requestedUid: userId,
    });

    try {
      const snap = await getDoc(doc(db, collectionName, userId));

      console.log('[AdminAuth] Firestore result:', {
        exists: snap.exists(),
        id: snap.id,
        data: snap.exists() ? snap.data() : null,
      });

      if (snap.exists()) {
        const data = snap.data();
        if (data.active === true && data.role === 'admin') {
          setProfile({ id: snap.id, email: data.email || '', role: data.role, active: data.active });
          setAuthError(null);
        } else {
          setProfile(null);
          setAuthError(`Admin check failed: active=${data.active}, role=${data.role}. Required: active=true, role=admin.`);
        }
      } else {
        setProfile(null);
        setAuthError(`No admin document found at path: ${docPath}`);
      }
    } catch (err: any) {
      console.error('[AdminAuth] Firestore error:', {
        collection: collectionName,
        documentPath: docPath,
        authenticatedUid: userId,
        requestedUid: userId,
        errorCode: err?.code,
        errorMessage: err?.message,
        fullError: err,
      });
      setProfile(null);
      setAuthError(err?.message || 'Failed to verify admin status.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.uid);
  }, [user, fetchProfile]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      console.log('[AdminAuth] onAuthStateChanged:', {
        user: fbUser ? { uid: fbUser.uid, email: fbUser.email } : null,
      });
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
