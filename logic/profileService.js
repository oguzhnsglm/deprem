import { supabase } from '../lib/supabase';
import { setProfilePreferences } from './profileStore';

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

    if (data) {
      setProfilePreferences({
        name: data.name || '',
        surname: data.surname || '',
        city: data.city || 'İstanbul',
        threshold: data.threshold || 3.0,
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

    setProfilePreferences({
      name: profile.name,
      surname: profile.surname,
      city: profile.city,
      threshold: profile.threshold,
    });

    return true;
  } catch (error) {
    console.warn('[Profile] saveProfile başarısız:', error.message);
    return false;
  }
};
