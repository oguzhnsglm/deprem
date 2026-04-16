import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, PanResponder } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import { getProfilePreferences, setProfilePreferences } from '../logic/profileStore';
import { computeTabOrder, navigateTabRoute } from '../navigation/tabOrder';
import { getCurrentUser } from '../logic/authStore';
import { loadProfile, saveProfile } from '../logic/profileService';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n/index';
import { COUNTRY_LIST, getCountryConfig } from '../logic/countryConfig';
import {
  getCitiesForCountry,
  getDefaultRegionForCountry,
  resolveRegionLabelForCountry,
} from '../logic/worldCities';

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const { t, lang, setLang } = useTranslation();
  const storedPrefs = getProfilePreferences();
  const defaultCountry = storedPrefs.country || 'TR';
  const defaultCity = resolveRegionLabelForCountry(
    defaultCountry,
    storedPrefs.city || getDefaultRegionForCountry(defaultCountry) || 'İstanbul'
  );

  const [profile, setProfile] = useState({
    city: defaultCity,
    name: storedPrefs.name || '',
    surname: storedPrefs.surname || '',
    age: '',
    address: '',
    threshold: storedPrefs.threshold || 3.0,
    language: storedPrefs.language || 'tr',
    country: storedPrefs.country || 'TR',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isFilled, setIsFilled] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const activeCountryConfig = getCountryConfig(profile.country);
  const usesStateRegion = activeCountryConfig?.regionType === 'state';
  const regionLabel = usesStateRegion ? t('myRegion') : t('myCity');
  const selectRegionLabel = usesStateRegion ? t('selectRegion') : t('selectCity');

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setIsEditing(true);
      return;
    }
    loadProfile(user.id).then((data) => {
      if (data) {
        // country + language come from SecureStore via profileStore (not Supabase columns)
        const prefs = getProfilePreferences();
        const restoredLang = prefs.language || 'tr';
        const restoredCountry = prefs.country || 'TR';
        setProfile({
          name: data.name || '',
          surname: data.surname || '',
          age: data.age ? String(data.age) : '',
          address: data.address || '',
          city: resolveRegionLabelForCountry(restoredCountry, data.city || defaultCity),
          threshold: data.threshold || 3.0,
          language: restoredLang,
          country: restoredCountry,
        });
        setLang(restoredLang);
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
          navigateTabRoute(navigation, routeNames, 'Profile', 'EarthquakeFeed', { city: profile.city });
          return;
        }
        navigateTabRoute(navigation, routeNames, 'Profile', target);
      },
    })
  ).current;

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateAndSave = async () => {
    if (!profile.name.trim() || !profile.surname.trim()) {
      setError(t('nameRequired'));
      return;
    }
    const numericAge = Number(profile.age);
    if (!profile.age.trim() || Number.isNaN(numericAge) || numericAge < 10) {
      setError(t('ageError'));
      return;
    }
    if (!profile.address.trim()) {
      setError(t('addressRequired'));
      return;
    }
    setError('');
    setSaving(true);
    const user = getCurrentUser();
    if (user) {
      const ok = await saveProfile(user.id, profile);
      setSaving(false);
      if (!ok) {
        setError(t('saveFailed'));
        return;
      }
    } else {
      setSaving(false);
    }
    // Dil ve ülke tercihlerini global store'a yaz
    setProfilePreferences({ language: profile.language, country: profile.country });
    setLang(profile.language);
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
                {isFilled ? `${profile.name} ${profile.surname}` : t('profileTitle')}
              </Text>
              {isFilled ? (
                <Text style={styles.headerCity}>{profile.city}</Text>
              ) : (
                <Text style={styles.headerHint}>{t('addInfo')}</Text>
              )}
            </View>
            {isFilled && !isEditing ? (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
                <Text style={styles.editButtonText}>{t('edit')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* VIEW MODE */}
          {isFilled && !isEditing ? (
            <View style={styles.card}>
              <InfoRow label={t('nameLabel')} value={`${profile.name} ${profile.surname}`} />
              <View style={styles.divider} />
              <InfoRow label={t('age')} value={profile.age} />
              <View style={styles.divider} />
              <InfoRow label={regionLabel} value={profile.city} />
              <View style={styles.divider} />
              <InfoRow label={t('address')} value={profile.address} />
              <View style={styles.divider} />
              <InfoRow label={t('notifLabel')} value={t('andAbove', { val: Number(profile.threshold).toFixed(1) })} />
              <View style={styles.divider} />
              <InfoRow label={t('language')} value={SUPPORTED_LANGUAGES.find((l) => l.code === profile.language)?.label} />
              <View style={styles.divider} />
              <InfoRow label={t('country')} value={getCountryConfig(profile.country)?.name} />
              <View style={styles.divider} />
              <InfoRow label={t('dataSource')} value={getCountryConfig(profile.country)?.sourceLabel} />
            </View>
          ) : null}

          {/* EDIT MODE */}
          {isEditing ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('profileInfo')}</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.input}
                  placeholder={t('firstName')}
                  placeholderTextColor="#9ca3af"
                  value={profile.name}
                  onChangeText={(v) => handleInputChange('name', v)}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('lastName')}
                  placeholderTextColor="#9ca3af"
                  value={profile.surname}
                  onChangeText={(v) => handleInputChange('surname', v)}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder={t('age')}
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={profile.age}
                onChangeText={(v) => handleInputChange('age', v.replace(/[^0-9]/g, ''))}
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder={t('address')}
                placeholderTextColor="#9ca3af"
                multiline
                value={profile.address}
                onChangeText={(v) => handleInputChange('address', v)}
              />

              <Text style={styles.label}>{t('country')}</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setCountryModalVisible(true)} activeOpacity={0.85}>
                <Text style={styles.selectorValue}>{getCountryConfig(profile.country)?.name}</Text>
                <Text style={styles.selectorHint}>{t('change')}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>{regionLabel}</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setCityModalVisible(true)} activeOpacity={0.85}>
                <Text style={styles.selectorValue}>{profile.city}</Text>
                <Text style={styles.selectorHint}>{t('change')}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>{t('language')}</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setLangModalVisible(true)} activeOpacity={0.85}>
                <Text style={styles.selectorValue}>
                  {SUPPORTED_LANGUAGES.find((l) => l.code === profile.language)?.label}
                </Text>
                <Text style={styles.selectorHint}>{t('change')}</Text>
              </TouchableOpacity>

              <Text style={styles.label}>{t('notifThreshold')}</Text>
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
                    <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                ) : null}
                <View style={isFilled ? styles.saveButtonWrap : styles.saveButtonFull}>
                  <PrimaryButton
                    title={saving ? t('saving') : t('save')}
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
              <Text style={styles.modalTitle}>{selectRegionLabel}</Text>
              <ScrollView style={styles.modalList}>
                {getCitiesForCountry(profile.country).map((city) => {
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
              <PrimaryButton title={t('close')} onPress={() => setCityModalVisible(false)} />
            </View>
          </View>
        </Modal>

        <Modal visible={langModalVisible} animationType="slide" transparent onRequestClose={() => setLangModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
              <ScrollView style={styles.modalList}>
                {SUPPORTED_LANGUAGES.map((langItem) => {
                  const active = langItem.code === profile.language;
                  return (
                    <TouchableOpacity
                      key={langItem.code}
                      style={[styles.modalItem, active && styles.modalItemActive]}
                      onPress={() => { handleInputChange('language', langItem.code); setLangModalVisible(false); }}
                    >
                      <Text style={[styles.modalItemText, active && styles.modalItemTextActive]}>
                        {langItem.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <PrimaryButton title={t('close')} onPress={() => setLangModalVisible(false)} />
            </View>
          </View>
        </Modal>

        <Modal visible={countryModalVisible} animationType="slide" transparent onRequestClose={() => setCountryModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('selectCountry')}</Text>
              <ScrollView style={styles.modalList}>
                {COUNTRY_LIST.map((c) => {
                  const active = c.code === profile.country;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      style={[styles.modalItem, active && styles.modalItemActive]}
                      onPress={() => {
                        const cities = getCitiesForCountry(c.code);
                        handleInputChange('country', c.code);
                        handleInputChange('city', getDefaultRegionForCountry(c.code) || cities[0] || '');
                        setCountryModalVisible(false);
                      }}
                    >
                      <Text style={[styles.modalItemText, active && styles.modalItemTextActive]}>
                        {c.name}
                      </Text>
                      {active && (
                        <Text style={styles.sourceHintText}>{c.sourceLabel}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <PrimaryButton title={t('close')} onPress={() => setCountryModalVisible(false)} />
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  gestureWrapper: { flex: 1 },
  scroll: { padding: 20, paddingTop: 45, paddingBottom: 220 }, // Çentik (notch) ve alt boşluk

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(56, 189, 248, 0.1)', // Sky tint
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  avatarText: { color: '#38BDF8', fontSize: 24, fontWeight: '900' },
  headerText: { flex: 1 },
  headerName: { color: '#F8FAFC', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  headerCity: { color: '#38BDF8', fontSize: 13, fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }, // Sky 400
  headerHint: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Slate 900
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  editButtonText: { color: '#F8FAFC', fontSize: 13, fontWeight: '800' },

  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Slate 900
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)' },

  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#F8FAFC', marginBottom: 20, letterSpacing: 0.3 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  input: {
    flex: 1,
    backgroundColor: '#020617', // Deepest Slate
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#F8FAFC',
    marginBottom: 14,
    fontSize: 15,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  label: { fontSize: 12, fontWeight: '800', color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  selector: {
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorValue: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  selectorHint: { color: '#38BDF8', fontWeight: '800', fontSize: 13 },

  thresholdRow: { flexDirection: 'row', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  thresholdChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  thresholdChipActive: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' },
  thresholdText: { color: '#94A3B8', fontWeight: '700', fontSize: 14 },
  thresholdTextActive: { color: '#FCA5A5', fontWeight: '900' },

  errorText: { color: '#FCA5A5', marginBottom: 14, fontWeight: '700', fontSize: 13 },

  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  cancelButtonText: { color: '#F1F5F9', fontWeight: '800' },
  saveButtonWrap: { flex: 1 },
  saveButtonFull: { flex: 1 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0F172A', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, paddingTop: 32, maxHeight: '80%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#F8FAFC', marginBottom: 20, textAlign: 'center' },
  modalList: { marginBottom: 24 },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.03)' },
  modalItemActive: { backgroundColor: 'rgba(56, 189, 248, 0.08)', borderRadius: 12, borderBottomWidth: 0, marginTop: 4, marginBottom: 4 },
  modalItemText: { color: '#94A3B8', fontSize: 16, textAlign: 'center', fontWeight: '600' },
  modalItemTextActive: { fontWeight: '800', color: '#38BDF8' },
  sourceHintText: { color: '#38BDF8', fontSize: 11, textAlign: 'center', marginTop: 2, fontWeight: '600' },
});

export default ProfileScreen;
