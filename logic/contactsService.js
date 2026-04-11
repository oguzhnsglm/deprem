import { supabase } from '../lib/supabase';

export const loadContacts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('[Contacts] loadContacts başarısız:', error.message);
    return [];
  }
};

export const addContact = async (userId, contact) => {
  try {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: userId,
        name: contact.name,
        relation: contact.relation,
        phone: contact.phone,
        email: contact.email || null,
        closeness: contact.closeness,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('[Contacts] addContact başarısız:', error.message);
    return null;
  }
};

export const deleteContact = async (contactId) => {
  try {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.warn('[Contacts] deleteContact başarısız:', error.message);
    return false;
  }
};
