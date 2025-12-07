import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, PanResponder } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import PROVINCES from '../logic/provinces';
import { getProfilePreferences, setProfilePreferences } from '../logic/profileStore';
import { computeTabOrder } from '../navigation/tabOrder';

const THRESHOLD_OPTIONS = [5, 6, 7];
const CITY_OPTIONS = PROVINCES;

const ProfileScreen = ({ navigation }) => {
  const storedPrefs = getProfilePreferences();
  const defaultCity = storedPrefs.city || CITY_OPTIONS[0] || 'İstanbul';

  const [profile, setProfile] = useState({
    city: defaultCity,
    name: storedPrefs.name || '',
    surname: storedPrefs.surname || '',
    age: '',
    address: '',
    threshold: storedPrefs.threshold || 5,
  });

  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const horizontalSwipe = Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy) * 1.4;
        return horizontalSwipe;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        const direction = dx <= -70 ? 'left' : dx >= 70 ? 'right' : null;
        if (!direction) {
          return;
        }
        const routeNames = navigation?.getState?.()?.routeNames || [];
        const order = computeTabOrder(routeNames);
        const currentIndex = order.indexOf('Profile');
        if (currentIndex === -1) {
          return;
        }
        const target = direction === 'left' ? order[currentIndex + 1] : order[currentIndex - 1];
        if (!target) {
          return;
        }
        if (target === 'EarthquakeFeed') {
          navigation.navigate('EarthquakeFeed', { city: profile.city || defaultCity });
          return;
        }
        navigation.navigate(target);
      },
    })
  ).current;

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const validateAndSave = () => {
    if (!profile.name.trim() || !profile.surname.trim()) {
      setError('Ad ve soyad alanları zorunludur.');
      return;
    }

    const numericAge = Number(profile.age);
    if (!profile.age.trim() || Number.isNaN(numericAge) || numericAge < 10) {
      setError('Lütfen 10 ve üzeri geçerli bir yaş gir.');
      return;
    }

    if (!profile.address.trim()) {
      setError('Adres bilgisi boş bırakılamaz.');
      return;
    }

    if (!profile.city.trim()) {
      setError('Bir şehir seçmelisin.');
      return;
    }

    if (!profile.threshold) {
      setError('Deprem şiddeti eşiği seçmelisin.');
      return;
    }

    setError('');
    setSaved(true);
    setProfilePreferences({
      city: profile.city,
      threshold: profile.threshold,
      name: profile.name,
      surname: profile.surname,
    });
  };

  return (
    <ScreenWrapper>
      <View style={styles.gestureWrapper} {...(swipeResponder?.panHandlers || {})}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name ? profile.name[0].toUpperCase() : 'P'}
              {profile.surname ? profile.surname[0].toUpperCase() : ''}
            </Text>
          </View>
          <View>
            <Text style={styles.headerLabel}>Profilim</Text>
            <Text style={styles.headerValue}>
              {profile.name && profile.surname ? `${profile.name} ${profile.surname}` : 'Bilgilerini ekle'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
          <View style={styles.fieldRow}>
            <TextInput
              style={styles.input}
              placeholder="Ad"
              placeholderTextColor="#9ca3af"
              value={profile.name}
              onChangeText={(text) => handleInputChange('name', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Soyad"
              placeholderTextColor="#9ca3af"
              value={profile.surname}
              onChangeText={(text) => handleInputChange('surname', text)}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Yaş"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            value={profile.age}
            onChangeText={(text) => handleInputChange('age', text.replace(/[^0-9]/g, ''))}
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Adres"
            placeholderTextColor="#9ca3af"
            multiline
            value={profile.address}
            onChangeText={(text) => handleInputChange('address', text)}
          />

          <Text style={styles.label}>Şehrim</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setCityModalVisible(true)} activeOpacity={0.85}>
            <Text style={styles.selectorValue}>{profile.city}</Text>
            <Text style={styles.selectorHint}>Değiştir</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Deprem Şiddeti Eşiğim</Text>
          <Text style={styles.helper}>
            Eşik değeri 5.0'dan başlar. Belirlediğin değer ve üzerindeki sarsıntılarda önce sana, yanıt gelmezse yakınlarına
            otomatik bildirim gider.
          </Text>

          <View style={styles.chipsRow}>
            {THRESHOLD_OPTIONS.map((value) => {
              const active = Number(profile.threshold) === value;
              const label = value === 7 ? '7.0+' : `${value}.0`;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.thresholdChip, active && styles.dangerChipActive]}
                  onPress={() => handleInputChange('threshold', value)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.thresholdValue, active && styles.dangerChipText]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.thresholdWarning}>
            5.0 ve üzeri eşikler AFAD duyurularıyla uyumludur. Şimdilik 7.0+ maksimum eşik olarak destekleniyor.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {saved ? <Text style={styles.successText}>Profil bilgilerin güncellendi.</Text> : null}

          <PrimaryButton title="Bilgileri Kaydet" onPress={validateAndSave} />
        </View>

        <Text style={styles.disclaimer}>
          Deprem verileri AFAD, Kandilli, USGS, EMSC ve IRIS kataloglarından otomatik çekilir; yine de resmi AFAD
          duyurularını ve yerel yönetim bildirimlerini takip et.
        </Text>
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
                    onPress={() => {
                      handleInputChange('city', city);
                      setCityModalVisible(false);
                    }}
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
  gestureWrapper: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingBottom: 160,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  headerLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#f8fafc',
    fontSize: 12,
  },
  headerValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#0f1114',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2933',
    marginBottom: 20,
    shadowColor: 'rgba(15, 23, 42, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#120a0f',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#1f2933',
    color: '#f8fafc',
    marginBottom: 12,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  helper: {
    fontSize: 13,
    color: '#f59e0b',
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  selector: {
    backgroundColor: '#120a0f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#991b1b',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  selectorHint: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  thresholdChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2933',
    backgroundColor: '#0f1114',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  thresholdValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e5e7eb',
  },
  dangerChipActive: {
    backgroundColor: '#b91c1c',
    borderColor: '#b91c1c',
  },
  dangerChipText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  thresholdWarning: {
    fontSize: 12,
    color: '#f59e0b',
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 8,
    fontWeight: '600',
  },
  successText: {
    color: '#16a34a',
    marginBottom: 8,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 40,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f1114',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  modalList: {
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2933',
  },
  modalItemActive: {
    backgroundColor: '#120a0f',
  },
  modalItemText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  modalItemTextActive: {
    fontWeight: '700',
  },
});

export default ProfileScreen;
