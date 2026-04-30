import { supabase } from '../lib/supabase';

let currentUser = null;

export const getCurrentUser = () => currentUser;

export const isAnonymousUser = () => {
  if (!currentUser) return false;
  return currentUser.is_anonymous === true || !currentUser.email;
};

export const initAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      currentUser = session.user;
      return session.user;
    }

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

// Anonim kullanıcıya email + şifre ekler. Email'e OTP kodu gider.
export const linkEmailWithPassword = async (email, password) => {
  const trimmedEmail = String(email || '').trim().toLowerCase();
  if (!trimmedEmail || !password) {
    throw new Error('Email ve şifre gereklidir.');
  }
  const { error } = await supabase.auth.updateUser({
    email: trimmedEmail,
    password,
  });
  if (error) throw error;
  return { email: trimmedEmail };
};

// Email'e gelen 6 haneli kodu doğrular. Anonim hesap kalıcıya dönüşür.
export const verifyEmailOtp = async (email, token) => {
  const trimmedEmail = String(email || '').trim().toLowerCase();
  const trimmedToken = String(token || '').trim();
  if (!trimmedEmail || !trimmedToken) {
    throw new Error('Email ve kod gereklidir.');
  }
  const { data, error } = await supabase.auth.verifyOtp({
    email: trimmedEmail,
    token: trimmedToken,
    type: 'email_change',
  });
  if (error) throw error;
  if (data?.user) currentUser = data.user;
  return data?.user || null;
};

// Mevcut hesaba email + şifre ile giriş.
export const signInWithPassword = async (email, password) => {
  const trimmedEmail = String(email || '').trim().toLowerCase();
  if (!trimmedEmail || !password) {
    throw new Error('Email ve şifre gereklidir.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });
  if (error) throw error;
  if (data?.user) currentUser = data.user;
  return data?.user || null;
};

// Yeni cihaz/yeni kullanıcı için OTP yeniden gönder.
export const resendEmailOtp = async (email) => {
  const trimmedEmail = String(email || '').trim().toLowerCase();
  const { error } = await supabase.auth.resend({
    type: 'email_change',
    email: trimmedEmail,
  });
  if (error) throw error;
};

// Çıkış. Sonrasında anonim oturum yeniden başlatılır.
export const signOut = async () => {
  await supabase.auth.signOut();
  currentUser = null;
  const { data } = await supabase.auth.signInAnonymously();
  currentUser = data?.user || null;
  return currentUser;
};
