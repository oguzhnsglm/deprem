import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, PanResponder } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import PROVINCES from '../logic/provinces';
import { getProfilePreferences } from '../logic/profileStore';
import { computeTabOrder } from '../navigation/tabOrder';
import { getCurrentUser } from '../logic/authStore';
import { loadProfile, saveProfile } from '../logic/profileService';

const CITY_OPTIONS = PROVINCES;

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const storedPrefs = getProfilePreferences();
  const defaultCity = storedPrefs.city || CITY_OPTIONS[0] || 'İstanbul';

  const [profile, setProfile] = useState({
    city: defaultCity,
    name: storedPrefs.name || '',
    surname: storedPrefs.surname || '',
    age: '',
    address: '',
    threshold: storedPrefs.threshold || 3.0,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isFilled, setIsFilled] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setIsEditing(true);
      return;
    }
    loadProfile(user.id).then((data) => {
      if (data) {
        setProfile({
          name: data.name || '',
          surname: data.surname || '',
          age: data.age ? String(data.age) : '',
          address: data.address || '',
          city: data.city || defaultCity,
          threshold: data.threshold || 3.0,
        });
        setIsFilled(true);
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    });
  }, []);

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy) * 1.4;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        const direction = dx <= -70 ? 'left' : dx >= 70 ? 'right' : null;
        if (!direction) return;
        const routeNames = navigation?.getState?.()?.routeNames || [];
        const order = computeTabOrder(routeNames);
        const currentIndex = order.indexOf('Profile');
        if (currentIndex === -1) return;
        const target = direction === 'left' ? order[currentIndex + 1] : order[currentIndex - 1];
        if (!target) return;
        if (target === 'EarthquakeFeed') {
          navigation.navigate('EarthquakeFeed', { city: profile.city });
          return;
        }
        navigation.navigate(target);
      },
    })
  ).current;

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateAndSave = async () => {
    if (!profile.name.trim() || !profile.surname.trim()) {
      setError('Ad ve soyad zorunludur.');
      return;
    }
    const numericAge = Number(profile.age);
    if (!profile.age.trim() || Number.isNaN(numericAge) || numericAge < 10) {
      setError('10 ve üzeri geçerli bir yaş gir.');
      return;
    }
    if (!profile.address.trim()) {
      setError('Adres boş bırakılamaz.');
      return;
    }
    setError('');
    setSaving(true);
    const user = getCurrentUser();
    if (user) {
      const ok = await saveProfile(user.id, profile);
      setSaving(false);
      if (!ok) {
        setError('Kaydedilemedi, internet bağlantını kontrol et.');
        return;
      }
    } else {
      setSaving(false);
    }
    setIsFilled(true);
    setIsEditing(false);
  };

  const initials =
    (profile.name ? profile.name[0].toUpperCase() : '') +
    (profile.surname ? profile.surname[0].toUpperCase() : '') || 'P';

  return (
    <ScreenWrapper>
      <View style={styles.gestureWrapper} {...(swipeResponder?.panHandlers || {})}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* AVATAR + İSİM BAŞLIK */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerName}>
                {isFilled ? `${profile.name} ${profile.surname}` : 'Profilim'}
              </Text>
              {isFilled ? (
                <Text style={styles.headerCity}>{profile.city}</Text>
              ) : (
                <Text style={styles.headerHint}>Bilgilerini ekle</Text>
              )}
            </View>
            {isFilled && !isEditing ? (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
                <Text style={styles.editButtonText}>Düzenle</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* GÖRÜNTÜLEME MODU */}
          {isFilled && !isEditing ? (
            <View style={styles.card}>
              <InfoRow label="Ad Soyad" value={`${profile.name} ${profile.surname}`} />
              <View style={styles.divider} />
              <InfoRow label="Yaş" value={profile.age} />
              <View style={styles.divider} />
              <InfoRow label="Şehir" value={profile.city} />
              <View style={styles.divider} />
              <InfoRow label="Adres" value={profile.address} />
              <View style={styles.divider} />
              <InfoRow label="Bildirim Eşiği" value={`M ${Number(profile.threshold).toFixed(1)} ve üzeri`} />
            </View>
          ) : null}

          {/* DÜZENLEME MODU */}
          {isEditing ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Ad"
                  placeholderTextColor="#9ca3af"
                  value={profile.name}
                  onChangeText={(t) => handleInputChange('name', t)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Soyad"
                  placeholderTextColor="#9ca3af"
                  value={profile.surname}
                  onChangeText={(t) => handleInputChange('surname', t)}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Yaş"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={profile.age}
                onChangeText={(t) => handleInputChange('age', t.replace(/[^0-9]/g, ''))}
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Adres"
                placeholderTextColor="#9ca3af"
                multiline
                value={profile.address}
                onChangeText={(t) => handleInputChange('address', t)}
              />

              <Text style={styles.label}>Şehrim</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setCityModalVisible(true)} activeOpacity={0.85}>
                <Text style={styles.selectorValue}>{profile.city}</Text>
                <Text style={styles.selectorHint}>Değiştir</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Bildirim Eşiği</Text>
              <View style={styles.thresholdRow}>
                {[1.0, 2.0, 3.0, 4.0, 5.0].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.thresholdChip, profile.threshold === val && styles.thresholdChipActive]}
                    onPress={() => handleInputChange('threshold', val)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.thresholdText, profile.threshold === val && styles.thresholdTextActive]}>
                      M{val.toFixed(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.buttonRow}>
                {isFilled ? (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => { setIsEditing(false); setError(''); }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Vazgeç</Text>
                  </TouchableOpacity>
                ) : null}
                <View style={isFilled ? styles.saveButtonWrap : styles.saveButtonFull}>
                  <PrimaryButton
                    title={saving ? 'Kaydediliyor...' : 'Kaydet'}
                    onPress={saving ? undefined : validateAndSave}
                  />
                </View>
              </View>
            </View>
          ) : null}

        </ScrollView>

        <Modal visible={cityModalVisible} animationType="slide" transparent onRequestClose={() => setCityModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Şehrini seç</Text>
              <ScrollView style={styles.modalList}>
                {CITY_OPTIONS.map((city) => {
                  const active = city === profile.city;
                  return (
                    <TouchableOpacity
                      key={city}
                      style={[styles.modalItem, active && styles.modalItemActive]}
                      onPress={() => { handleInputChange('city', city); setCityModalVisible(false); }}
                    >
                      <Text style={[styles.modalItemText, active && styles.modalItemTextActive]}>{city}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <PrimaryButton title="Kapat" onPress={() => setCityModalVisible(false)} />
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  gestureWrapper: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 160 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#7f1d1d',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerText: { flex: 1 },
  headerName: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  headerCity: { color: '#f97316', fontSize: 13, fontWeight: '600', marginTop: 2 },
  headerHint: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1f2937',
  },
  editButtonText: { color: '#e5e7eb', fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: '#0f1114',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2933',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: { color: '#6b7280', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { color: '#f8fafc', fontSize: 15, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#1f2933' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc', marginBottom: 14 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  input: {
    flex: 1,
    backgroundColor: '#120a0f',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#1f2933',
    color: '#f8fafc',
    marginBottom: 12,
    fontSize: 15,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  label: { fontSize: 13, fontWeight: '700', color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  selector: {
    backgroundColor: '#120a0f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#991b1b',
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorValue: { color: '#f8fafc', fontSize: 15, fontWeight: '700' },
  selectorHint: { color: '#f97316', fontWeight: '600', fontSize: 13 },

  thresholdRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  thresholdChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2933',
    backgroundColor: '#120a0f',
  },
  thresholdChipActive: { backgroundColor: 'rgba(185,28,28,0.2)', borderColor: '#b91c1c' },
  thresholdText: { color: '#6b7280', fontWeight: '700', fontSize: 13 },
  thresholdTextActive: { color: '#f87171' },

  errorText: { color: '#dc2626', marginBottom: 10, fontWeight: '600', fontSize: 13 },

  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1f2937',
  },
  cancelButtonText: { color: '#e5e7eb', fontWeight: '700' },
  saveButtonWrap: { flex: 1 },
  saveButtonFull: { flex: 1 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f1114', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '75%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 12 },
  modalList: { marginBottom: 16 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2933' },
  modalItemActive: { backgroundColor: '#120a0f' },
  modalItemText: { color: '#f8fafc', fontSize: 16 },
  modalItemTextActive: { fontWeight: '700', color: '#f97316' },
});

export default ProfileScreen;
