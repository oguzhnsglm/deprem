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

const formatTurkishPhone = (digits) => {
  if (digits.length <= 3) return `+90 ${digits}`.trim();
  if (digits.length <= 6) return `+90 ${digits.slice(0, 3)} ${digits.slice(3)}`.trim();
  if (digits.length <= 8) return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`.trim();
  return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`.trim();
};

const CLOSENESS_LEVELS = [
  { label: 'Birincil destek', value: 'Birincil destek' },
  { label: 'Hızlı haber', value: 'Hızlı haber' },
  { label: 'Bilgilendir', value: 'Bilgilendir' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactsScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [email, setEmail] = useState('');
  const [closeness, setCloseness] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const scrollRef = useRef(null);

  const handleAddContact = () => {
    const trimmedName = name.trim();
    const trimmedRelation = relation.trim();
    const trimmedEmail = email.trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');

    if (!trimmedName || !trimmedRelation) {
      setError('Lütfen ad ve ilişki alanlarını doldurun.');
      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      setError('Telefon numarası 10 haneli olmalı ve sadece rakam içermelidir.');
      return;
    }

    if (['0', '1'].includes(cleanPhone[0])) {
      setError('Telefon numarası 0 veya 1 ile başlayamaz.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail.toLowerCase())) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    if (!closeness) {
      setError('Lütfen yakınlık derecesi seçin.');
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
        email: trimmedEmail,
        closeness,
      },
    ]);

    setName('');
    setRelation('');
    setRawPhone('');
    setEmail('');
    setCloseness('');
    setError('');
  };

  const toggleForm = () => {
    setShowForm((prev) => {
      const nextState = !prev;
      if (nextState) {
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
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
            <Text style={styles.title}>Acil Durum Kişileri</Text>
            <Text style={styles.subtitle}>
              Panik anında tek dokunuşla ulaşmak istediğin destek kişileri. Kartlara dokunup arama ya da mesaj planla.
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
          >
            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>Acil Durum Uyarıcıları</Text>
              <Text style={styles.alertHint}>
                Profilindeki eşik aşıldığında önce sana bildirim gelir. 2 dakika içinde yanıt vermezsen buradaki kişilere konumun
                SMS ile gönderilir.
              </Text>
              {contacts.length === 0 ? (
                <Text style={styles.alertEmpty}>Listede kişi yok. En az bir kişi eklediğinden emin ol.</Text>
              ) : (
                contacts.slice(0, 3).map((contact) => (
                  <View key={contact.id} style={styles.alertRow}>
                    <Text style={styles.alertName}>{contact.name}</Text>
                    <Text style={styles.alertRelation}>{contact.relation}</Text>
                  </View>
                ))
              )}
            </View>

            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                name={contact.name}
                relation={contact.relation}
                phone={contact.phone}
                email={contact.email}
                closeness={contact.closeness}
              />
            ))}
            <TouchableOpacity style={styles.inlineAddButton} onPress={toggleForm} activeOpacity={0.85}>
              <Text style={styles.inlineAddButtonText}>{showForm ? 'Kişi ekleme formunu kapat' : 'Yeni kişi ekle'}</Text>
            </TouchableOpacity>
            {showForm ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Yeni kişi ekle</Text>
                <View style={styles.inputGroup}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ad Soyad"
                    placeholderTextColor="rgba(131, 24, 67, 0.5)"
                    style={styles.input}
                  />
                  <TextInput
                    value={relation}
                    onChangeText={setRelation}
                    placeholder="İlişki (Örn: Anne, Kardeş, Komşu)"
                    placeholderTextColor="rgba(131, 24, 67, 0.5)"
                    style={styles.input}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="E-posta"
                    placeholderTextColor="rgba(131, 24, 67, 0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
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
                      placeholderTextColor="rgba(131, 24, 67, 0.5)"
                      keyboardType="number-pad"
                      style={styles.phoneInput}
                    />
                  </View>
                  <Text style={styles.segmentLabel}>Yakınlık derecesi</Text>
                  <View style={styles.segmentRow}>
                    {CLOSENESS_LEVELS.map((level) => {
                      const isActive = closeness === level.value;
                      return (
                        <TouchableOpacity
                          key={level.value}
                          style={[styles.segmentChip, isActive && styles.segmentChipActive]}
                          onPress={() => setCloseness(level.value)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.segmentChipText, isActive && styles.segmentChipTextActive]}>
                            {level.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>
                <PrimaryButton title="Kişiyi Kaydet" onPress={handleAddContact} />
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
    color: '#831843',
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#9f1239',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 20,
    shadowColor: 'rgba(190, 24, 93, 0.15)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 14,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#be185d',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff1f2',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#831843',
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 12,
    fontSize: 15,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
  },
  phonePrefix: {
    color: '#be185d',
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    color: '#831843',
    fontSize: 16,
    paddingVertical: 8,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#be185d',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  segmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.5)',
    marginRight: 10,
    marginBottom: 10,
  },
  segmentChipActive: {
    backgroundColor: 'rgba(251, 113, 133, 0.25)',
    borderColor: '#fb7185',
  },
  segmentChipText: {
    color: '#be185d',
    fontWeight: '600',
  },
  segmentChipTextActive: {
    color: '#9d174d',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 2,
  },
  list: {
    paddingBottom: 36,
  },
  alertCard: {
    backgroundColor: '#fff0f4',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fda4af',
    marginBottom: 18,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#b91c1c',
  },
  alertHint: {
    fontSize: 13,
    color: '#9f1239',
    marginTop: 6,
  },
  alertEmpty: {
    marginTop: 10,
    color: '#b91c1c',
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  alertName: {
    color: '#831843',
    fontWeight: '700',
  },
  alertRelation: {
    color: '#be185d',
  },
  inlineAddButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ffe4e6',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  inlineAddButtonText: {
    color: '#831843',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ContactsScreen;
