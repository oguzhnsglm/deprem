import React, { useState } from 'react';

import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';

import ScreenWrapper from '../components/ScreenWrapper';

import PrimaryButton from '../components/PrimaryButton';

import PROVINCES from '../logic/provinces';

import { getProfilePreferences, setProfilePreferences } from '../logic/profileStore';



const THRESHOLD_OPTIONS = [5, 6, 7];

const CITY_OPTIONS = PROVINCES;



const ProfileScreen = () => {

  const storedPrefs = getProfilePreferences();

  const [profile, setProfile] = useState({
    city: storedPrefs.city || CITY_OPTIONS[0] || 'Istanbul',
    name: storedPrefs.name || '',

    surname: storedPrefs.surname || '',

    age: '',

    address: '',

    city: storedPrefs.city || CITY_OPTIONS[0] || 'Ýstanbul',

    threshold: storedPrefs.threshold || 5,

  });

  const [error, setError] = useState('');

  const [saved, setSaved] = useState(false);

  const [cityModalVisible, setCityModalVisible] = useState(false);



  const handleInputChange = (field, value) => {

    setProfile((prev) => ({ ...prev, [field]: value }));

    setSaved(false);

  };



  const validateAndSave = () => {

    if (!profile.name.trim() || !profile.surname.trim()) {

      setError('Ad ve soyad alanlarý zorunludur.');

      return;

    }



    const numericAge = Number(profile.age);

    if (!profile.age.trim() || Number.isNaN(numericAge) || numericAge < 10) {

      setError('L?tfen 10 ve ?zeri ge?erli bir ya? gir.');

      return;

    }



    if (!profile.address.trim()) {

      setError('Adres bilgisi bo? b?rak?lamaz.');

      return;

    }



    if (!profile.city.trim()) {

      setError('Bir ?ehir se?melisin.');

      return;

    }



    if (!profile.threshold) {

      setError('Deprem ?iddeti e?i?i se?melisin.');

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

            placeholder="Yaþ"

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



          <Text style={styles.label}>Þehrim</Text>

          <TouchableOpacity style={styles.selector} onPress={() => setCityModalVisible(true)} activeOpacity={0.85}>

            <Text style={styles.selectorValue}>{profile.city}</Text>

            <Text style={styles.selectorHint}>Deðiþtir</Text>

          </TouchableOpacity>



          <Text style={styles.label}>Deprem Þiddeti Eþiðim</Text>

          <Text style={styles.helper}>

            Eþik deðeri 5.0'dan baþlar. Belirlediðin deðer ve üzerindeki sarsýntýlarda önce sana, yanýt gelmezse

            yakýnlarýna otomatik bildirim gider.

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

            5.0 ve üzeri eþikler AFAD duyurularýyla uyumludur. Þimdilik 7.0+ maksimum eþik olarak destekleniyor.

          </Text>



          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {saved ? <Text style={styles.successText}>Profil bilgilerin güncellendi.</Text> : null}
          {saved ? <Text style={styles.successText}>Profil bilgilerin g?ncellendi.</Text> : null}


          <PrimaryButton title="Bilgileri Kaydet" onPress={validateAndSave} />

        </View>



        <Text style={styles.disclaimer}>
          Deprem verileri AFAD, Kandilli, USGS, EMSC ve IRIS kataloglarindan otomatik cekilir; yine de resmi AFAD
          duyurularini ve yerel yonetim bildirimlerini takip et.

          duyurularýný ve yerel yönetim bildirimlerini takip et.

        </Text>

      </ScrollView>



      <Modal visible={cityModalVisible} animationType="slide" transparent onRequestClose={() => setCityModalVisible(false)}>

        <View style={styles.modalBackdrop}>

          <View style={styles.modalCard}>

            <Text style={styles.modalTitle}>?ehrini se?</Text>

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

    </ScreenWrapper>

  );

};



const styles = StyleSheet.create({

  scroll: {

    padding: 24,

    paddingBottom: 48,

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

    backgroundColor: '#f9a8d4',

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

    shadowColor: 'rgba(190, 24, 93, 0.12)',

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

    color: '#fca5a5',

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

    borderColor: '#feb4c6',

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

    backgroundColor: '#f87171',

    borderColor: '#f87171',

  },

  dangerChipText: {

    color: '#0f1114',

    fontWeight: '700',

  },

  thresholdWarning: {

    fontSize: 12,

    color: '#fca5a5',

    marginBottom: 12,

  },

  errorText: {

    color: '#dc2626',

    marginBottom: 8,

    fontWeight: '600',

  },

  successText: {

    color: '#166534',

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
