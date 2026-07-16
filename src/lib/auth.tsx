import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  User as FbUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  user: FbUser | null;
  session: null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (data: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FbUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const snap = await getDoc(doc(db, 'profiles', userId));
    if (snap.exists()) {
      setProfile({ id: snap.id, ...snap.data() } as Profile);
    } else {
      setProfile(null);
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
      }
      setLoading(false);
    });
    return () => unsub();
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await fbUpdateProfile(cred.user, { displayName: fullName });
      await setDoc(doc(db, 'profiles', cred.user.uid), {
        full_name: fullName,
        phone: '',
        avatar_url: '',
        role: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;

      // Check if profile already exists; if not, create one (new user registration)
      const profileRef = doc(db, 'profiles', user.uid);
      const existing = await getDoc(profileRef);
      if (!existing.exists()) {
        await setDoc(profileRef, {
          full_name: user.displayName || '',
          phone: user.phoneNumber || '',
          avatar_url: user.photoURL || '',
          email: user.email || '',
          role: 'customer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        ...data,
        updated_at: new Date().toISOString(),
      });
      await fetchProfile(user.uid);
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider value={{
      user,
      session: null,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      resetPassword,
      updateProfile,
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
