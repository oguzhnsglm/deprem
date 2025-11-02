import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import ContactCard from '../components/ContactCard';
import PrimaryButton from '../components/PrimaryButton';
import mockContacts from '../logic/mockContacts';

const formatTurkishPhone = (digits) => {
  if (digits.length <= 3) return `+90 ${digits}`.trim();
  if (digits.length <= 6) return `+90 ${digits.slice(0, 3)} ${digits.slice(3)}`.trim();
  if (digits.length <= 8) return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`.trim();
  return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`.trim();
};

const ContactsScreen = () => {
  const [contacts, setContacts] = useState(mockContacts);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const scrollRef = useRef(null);

  const handleAddContact = () => {
    const trimmedName = name.trim();
    const trimmedRelation = relation.trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');

    if (!trimmedName || !trimmedRelation) {
      setError('Lutfen ad ve iliski alanlarini doldurun.');
      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      setError('Telefon numarasi 10 haneli olmali ve sadece rakam icermelidir.');
      return;
    }

    if (['0', '1'].includes(cleanPhone[0])) {
      setError('Telefon numarasi 0 veya 1 ile baslayamaz.');
      return;
    }

    const formattedPhone = formatTurkishPhone(cleanPhone);

    setContacts((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        name: trimmedName,
        relation: trimmedRelation,
        phone: formattedPhone,
      },
    ]);

    setName('');
    setRelation('');
    setRawPhone('');
    setError('');
  };

  const toggleForm = () => {
    setShowForm((prev) => {
      const nextState = !prev;
      if (nextState) {
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollToEnd({ animated: true });
          }
        }, 150);
      }
      return nextState;
    });
    setError('');
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Yakinlarim</Text>
            <Text style={styles.subtitle}>
              Acil durumda ulasmak istedigin kisiler burada. Kartlara dokunup arama ya da mesaj planla.
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
          >
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                name={contact.name}
                relation={contact.relation}
                phone={contact.phone}
              />
            ))}
            <TouchableOpacity style={styles.inlineAddButton} onPress={toggleForm} activeOpacity={0.85}>
              <Text style={styles.inlineAddButtonText}>{showForm ? 'Formu Gizle' : 'Yeni Kisi Ekle'}</Text>
            </TouchableOpacity>
            {showForm ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Yeni Kisi Ekle</Text>
                <View style={styles.inputGroup}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ad Soyad"
                    placeholderTextColor="rgba(243, 232, 255, 0.6)"
                    style={styles.input}
                  />
                  <TextInput
                    value={relation}
                    onChangeText={setRelation}
                    placeholder="Iliski (Orn: Anne, Kardes, Komsu)"
                    placeholderTextColor="rgba(243, 232, 255, 0.6)"
                    style={styles.input}
                  />
                  <View style={styles.phoneRow}>
                    <Text style={styles.phonePrefix}>+90</Text>
                    <TextInput
                      value={rawPhone}
                      onChangeText={(text) => {
                        const digitsOnly = text.replace(/\D/g, '');
                        if (digitsOnly.length <= 10) {
                          setRawPhone(digitsOnly);
                        }
                      }}
                      placeholder="5551234567"
                      placeholderTextColor="rgba(243, 232, 255, 0.6)"
                      keyboardType="number-pad"
                      style={styles.phoneInput}
                    />
                  </View>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>
                <PrimaryButton title="Kisiyi Kaydet" onPress={handleAddContact} />
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fdf4ff',
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(237, 233, 254, 0.85)',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 20,
    shadowColor: '#0b021f',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 14,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4edff',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(20, 6, 50, 0.6)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f4edff',
    borderWidth: 1,
    borderColor: 'rgba(180, 144, 255, 0.35)',
    marginBottom: 12,
    fontSize: 15,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 6, 50, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(180, 144, 255, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  phonePrefix: {
    color: '#f5f3ff',
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    color: '#f5f3ff',
    fontSize: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    marginTop: 4,
  },
  list: {
    paddingBottom: 36,
  },
  inlineAddButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(121, 80, 198, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(211, 188, 255, 0.55)',
    shadowColor: '#150236',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  inlineAddButtonText: {
    color: '#f5f3ff',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

export default ContactsScreen;
