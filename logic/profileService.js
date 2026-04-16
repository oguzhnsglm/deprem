import { supabase } from '../lib/supabase';
import { setProfilePreferences } from './profileStore';
import * as SecureStore from 'expo-secure-store';

const COUNTRY_KEY = 'user_country';
const LANGUAGE_KEY = 'user_language';

/** Call once at startup (before navigation renders) to hydrate country + language from local storage */
export const loadLocalPreferences = async () => {
  try {
    const [country, language] = await Promise.all([
      SecureStore.getItemAsync(COUNTRY_KEY),
      SecureStore.getItemAsync(LANGUAGE_KEY),
    ]);
    if (country || language) {
      setProfilePreferences({
        ...(country ? { country } : {}),
        ...(language ? { language } : {}),
      });
    }
    return { country: country || 'TR', language: language || 'tr' };
  } catch {
    return { country: 'TR', language: 'tr' };
  }
};

export const loadProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // PGRST116 = satır bulunamadı, yeni kullanıcı için normal
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Load country + language from local secure store (not in Supabase schema)
    const [storedCountry, storedLanguage] = await Promise.all([
      SecureStore.getItemAsync(COUNTRY_KEY),
      SecureStore.getItemAsync(LANGUAGE_KEY),
    ]);

    if (data) {
      setProfilePreferences({
        name: data.name || '',
        surname: data.surname || '',
        city: data.city || 'İstanbul',
        threshold: data.threshold || 3.0,
        country: storedCountry || 'TR',
        language: storedLanguage || 'tr',
      });
    } else if (storedCountry || storedLanguage) {
      setProfilePreferences({
        country: storedCountry || 'TR',
        language: storedLanguage || 'tr',
      });
    }

    return data || null;
  } catch (error) {
    console.warn('[Profile] loadProfile başarısız:', error.message);
    return null;
  }
};

export const saveProfile = async (userId, profile) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: profile.name,
        surname: profile.surname,
        age: profile.age ? Number(profile.age) : null,
        address: profile.address || null,
        city: profile.city,
        threshold: Number(profile.threshold) || 3.0,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Persist country + language locally (not in Supabase schema)
    const saveLocally = [];
    if (profile.country) saveLocally.push(SecureStore.setItemAsync(COUNTRY_KEY, profile.country));
    if (profile.language) saveLocally.push(SecureStore.setItemAsync(LANGUAGE_KEY, profile.language));
    if (saveLocally.length) await Promise.all(saveLocally);

    setProfilePreferences({
      name: profile.name,
      surname: profile.surname,
      city: profile.city,
      threshold: profile.threshold,
      country: profile.country,
      language: profile.language,
    });

    return true;
  } catch (error) {
    console.warn('[Profile] saveProfile başarısız:', error.message);
    return false;
  }
};
