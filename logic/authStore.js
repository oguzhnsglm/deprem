import { supabase } from '../lib/supabase';

let currentUser = null;

export const getCurrentUser = () => currentUser;

export const initAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      currentUser = session.user;
      return session.user;
    }

    // Oturum yok — anonim giriş yap
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;

    currentUser = data.user;
    return data.user;
  } catch (error) {
    console.warn('[Auth] initAuth başarısız:', error.message);
    return null;
  }
};

export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    callback(currentUser);
  });
  return subscription;
};
