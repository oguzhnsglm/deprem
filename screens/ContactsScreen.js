import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import ContactCard from '../components/ContactCard';
import PrimaryButton from '../components/PrimaryButton';
import { getCurrentUser } from '../logic/authStore';
import { loadContacts, addContact, deleteContact } from '../logic/contactsService';
import { useTranslation } from '../i18n/index';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactsScreen = () => {
  const { t } = useTranslation();
  const CLOSENESS_LEVELS = [
    { label: t('primarySupport'), value: 'primary' },
    { label: t('quickNews'), value: 'quick' },
    { label: t('informLabel'), value: 'inform' },
  ];
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [email, setEmail] = useState('');
  const [closeness, setCloseness] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }
    loadContacts(user.id).then((data) => {
      setContacts(data);
      setLoading(false);
    });
  }, []);

  const handleAddContact = async () => {
    const trimmedName = name.trim();
    const trimmedRelation = relation.trim();
    const trimmedEmail = email.trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');

    if (!trimmedName || !trimmedRelation) {
      setError(t('nameRelRequired'));
      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      setError(t('phoneFormatError'));
      return;
    }

    if (['0', '1'].includes(cleanPhone[0])) {
      setError(t('phoneStartError'));
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail.toLowerCase())) {
      setError(t('emailFormatError'));
      return;
    }

    if (!closeness) {
      setError(t('closenessSelectError'));
      return;
    }

    const formattedPhone = cleanPhone;
    const contactData = {
      name: trimmedName,
      relation: trimmedRelation,
      phone: formattedPhone,
      email: trimmedEmail,
      closeness,
    };

    setSaving(true);
    const user = getCurrentUser();
    if (user) {
      const saved = await addContact(user.id, contactData);
      setSaving(false);
      if (saved) {
        setContacts((prev) => [...prev, saved]);
      } else {
        setError(t('contactSaveFailed'));
        return;
      }
    } else {
      setSaving(false);
      setContacts((prev) => [...prev, { id: `${Date.now()}`, ...contactData }]);
    }

    setName('');
    setRelation('');
    setRawPhone('');
    setEmail('');
    setCloseness('');
    setError('');
  };

  const handleDeleteContact = async (contactId) => {
    const user = getCurrentUser();
    if (user) {
      await deleteContact(contactId);
    }
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  const toggleForm = () => {
    setShowForm((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
      return next;
    });
    setError('');
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', android: undefined })}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('contactsTitle')}</Text>
            <Text style={styles.subtitle}>{t('contactsSubtitle')}</Text>
          </View>

          {loading ? (
              <View style={styles.loaderRow}>
                <ActivityIndicator color="#f8fafc" />
                <Text style={styles.loaderText}>{t('loadingContacts')}</Text>
              </View>
            ) : null}

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
          >
            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>{t('howItWorks')}</Text>
              <Text style={styles.alertHint}>{t('howItWorksDesc')}</Text>
              {contacts.length === 0 ? (
                <Text style={styles.alertEmpty}>{t('noContactsYet')}</Text>
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
                onDelete={() => handleDeleteContact(contact.id)}
              />
            ))}

            <TouchableOpacity style={styles.inlineAddButton} onPress={toggleForm} activeOpacity={0.85}>
              <Text style={styles.inlineAddButtonText}>
                {showForm ? t('closeAddForm') : t('openAddForm')}
              </Text>
            </TouchableOpacity>

            {showForm ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>{t('addContactFormTitle')}</Text>

                <View style={styles.inputGroup}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t('nameSurnamePlaceholder')}
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                  />
                  <TextInput
                    value={relation}
                    onChangeText={setRelation}
                    placeholder={t('relationPlaceholder')}
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('emailPlaceholder')}
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  <TextInput
                    value={rawPhone}
                    onChangeText={(text) => {
                      const digitsOnly = text.replace(/\D/g, '');
                      if (digitsOnly.length <= 15) {
                        setRawPhone(digitsOnly);
                      }
                    }}
                    placeholder="5551234567"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                  <Text style={styles.segmentLabel}>{t('closenessLabel')}</Text>
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
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <PrimaryButton
                  title={saving ? t('saving') : t('saveContactBtn')}
                  onPress={saving ? undefined : handleAddContact}
                  colorScheme="mint"
                />
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
    paddingHorizontal: 20,
    paddingTop: 45, // Çentik payı eklendi
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  loaderText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 8,
    color: '#94A3B8',
    lineHeight: 22,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  list: {
    paddingBottom: 220, // Alt menü boşluğu
  },
  alertCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Slate 900
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8', // Sky 400
  },
  alertHint: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    lineHeight: 22,
  },
  alertEmpty: {
    marginTop: 14,
    color: '#FCA5A5',
    fontWeight: '700',
    fontSize: 13,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  alertName: {
    color: '#F1F5F9', // Slate 100
    fontWeight: '700',
  },
  alertRelation: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  inlineAddButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inlineAddButtonText: {
    color: '#F8FAFC',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  formCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#020617', // Deepest Slate
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
    fontSize: 15,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 14,
  },
  phonePrefix: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 16,
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 16,
    paddingVertical: 8,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  segmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  segmentChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)', // Sky 400 highlight
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  segmentChipText: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  segmentChipTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '600',
  },
});

export default ContactsScreen;

