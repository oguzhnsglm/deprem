import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import { getProfilePreferences } from '../logic/profileStore';
import { getCurrentUser } from '../logic/authStore';
import { loadContacts } from '../logic/contactsService';
import { getCountryConfig } from '../logic/countryConfig';
const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';
const normalizePhoneDigits = (value) => String(value || '').replace(/\D/g, '');
const resolveWhatsAppPhone = (contact) => {
  const digits = normalizePhoneDigits(contact?.rawPhone || contact?.phone);
  if (!digits) {
    return null;
  }
  if (digits.length === 10) {
    return `90${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `90${digits.slice(1)}`;
  }
  if (digits.length >= 12 && digits.startsWith('90')) {
    return digits;
  }
  return digits;
};

const AlertScreen = ({ route }) => {
  const { status = 'İyiyim' } = route.params || {};
  const [whatsAppHint, setWhatsAppHint] = useState('');
  const [recipientQueue, setRecipientQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [queueMessage, setQueueMessage] = useState('');
  const profile = getProfilePreferences();
  const countryConfig = getCountryConfig(profile.country || 'TR');
  const emergencyNumbers = countryConfig.emergencyNumbers || [{ label: 'Acil', value: '112' }];
  const defaultWhatsAppHint =
    "WhatsApp üzerinden kayıtlı kişilerin sohbeti sırayla açılır; her sohbet için Gönder'e dokun. Sonraki kişi için Sıradaki kişi butonunu kullan.";
  const fullName = [profile.name, profile.surname]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ') || 'Yakının';

  const resolveLocationText = useCallback(async () => {
    if (!isNativePlatform) {
      return 'Konum tarayıcıda paylaşılamadı.';
    }

    try {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        return 'Konum izni verilmedi.';
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!coords) {
        return 'Konum alınamadı.';
      }

      const latitude = coords.latitude.toFixed(5);
      const longitude = coords.longitude.toFixed(5);
      return `${latitude}, ${longitude} (https://maps.google.com/?q=${coords.latitude},${coords.longitude})`;
    } catch (error) {
      return 'Konum alınamadı.';
    }
  }, []);

  const buildWhatsAppMessage = useCallback(
    (locationText, timeText) => {
      const timestamp = timeText || new Date().toLocaleString('tr-TR');
      const lines = [
        `${fullName} ${timestamp} saatinde acil durumda ve sizden yardım bekliyor.`,
        `Konum: ${locationText}`,
      ];
      return lines.join('\n');
    },
    [fullName]
  );

  const buildWhatsAppLinks = useCallback((message, phone) => {
    const encoded = encodeURIComponent(message);
    const phoneParam = phone ? `phone=${phone}&` : '';
    return {
      deepLink: `whatsapp://send?${phoneParam}text=${encoded}`,
      webLink: `https://api.whatsapp.com/send?${phoneParam}text=${encoded}`,
    };
  }, []);

  const openWhatsAppForRecipient = useCallback(
    async (recipient, message) => {
      const { deepLink, webLink } = buildWhatsAppLinks(message, recipient?.whatsappPhone);
      const shouldUseWeb = Platform.OS === 'web';
      const tryLink = shouldUseWeb ? webLink : deepLink;

      try {
        const canOpen = shouldUseWeb ? true : await Linking.canOpenURL(deepLink);
        await Linking.openURL(canOpen ? tryLink : webLink);
        return true;
      } catch (error) {
        setWhatsAppHint('WhatsApp açılamadı, linki manuel paylaşıp göndermeyi deneyebilirsin.');
        Linking.openURL(webLink).catch(() => {});
        return false;
      }
    },
    [buildWhatsAppLinks]
  );

  const handleWhatsAppShare = useCallback(async () => {
    const user = getCurrentUser();
    const contacts = user ? await loadContacts(user.id) : [];
    if (!contacts.length) {
      setWhatsAppHint('Acil durum kişisi bulunamadı. Önce kişi ekleyin.');
      setRecipientQueue([]);
      setQueueIndex(-1);
      setQueueMessage('');
      return;
    }

    const recipients = contacts
      .map((contact) => ({
        ...contact,
        whatsappPhone: resolveWhatsAppPhone(contact),
      }))
      .filter((contact) => contact.whatsappPhone);

    if (!recipients.length) {
      setWhatsAppHint('Acil durum kişileri için geçerli telefon bulunamadı.');
      setRecipientQueue([]);
      setQueueIndex(-1);
      setQueueMessage('');
      return;
    }

    const timeText = new Date().toLocaleString('tr-TR');
    const locationText = await resolveLocationText();
    const message = buildWhatsAppMessage(locationText, timeText);

    setRecipientQueue(recipients);
    setQueueMessage(message);
    setQueueIndex(0);
    setWhatsAppHint(`1/${recipients.length} kişi için WhatsApp açılıyor. Sonraki kişi için butona dokun.`);
    await openWhatsAppForRecipient(recipients[0], message);
  }, [buildWhatsAppMessage, openWhatsAppForRecipient, resolveLocationText]);

  const handleNextRecipient = useCallback(async () => {
    if (!recipientQueue.length) {
      setWhatsAppHint('Önce WhatsApp gönderimini başlat.');
      return;
    }

    const nextIndex = queueIndex + 1;
    if (nextIndex >= recipientQueue.length) {
      setWhatsAppHint('Tüm kişiler için WhatsApp açıldı.');
      return;
    }

    setQueueIndex(nextIndex);
    setWhatsAppHint(
      `${nextIndex + 1}/${recipientQueue.length} kişi için WhatsApp açılıyor. Sonraki kişi için butona dokun.`
    );
    await openWhatsAppForRecipient(recipientQueue[nextIndex], queueMessage);
  }, [openWhatsAppForRecipient, queueIndex, queueMessage, recipientQueue]);


  const handleDial = (number) => {
    Linking.openURL(`tel:${number}`).catch(() => {});
  };

  const hasQueue = recipientQueue.length > 0 && queueIndex >= 0;
  const hasNextRecipient = hasQueue && queueIndex < recipientQueue.length - 1;
  const nextButtonLabel = hasNextRecipient
    ? `Sıradaki kişi (${queueIndex + 2}/${recipientQueue.length})`
    : 'Sıradaki kişi';

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <Text style={styles.label}>Durumun kaydedildi</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
          <Text style={styles.statusInfo}>
            Bu bilgi panik anında paylaşım için hazırlandı. Yakının, hangi desteği vermesi gerektiğini saniyeler içinde
            öğrenebilir.
          </Text>
          <Text style={styles.statusNote}>
            Kaydettiğin acil durum kişilerine bildirim gönderildi. Eğer durum kritikse aşağıdaki acil numaralardan birini
            aramayı unutma.
          </Text>
        </View>

        <View style={styles.emergencyButtons}>
          <View style={styles.emergencyRow}>
            {emergencyNumbers.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.emergencyButton}
                onPress={() => handleDial(item.value)}
                activeOpacity={0.8}
              >
                <Text style={styles.emergencyButtonNumber}>{item.value}</Text>
                <Text style={styles.emergencyButtonLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.emergencyHint}>Numaraya dokunduğunda telefon uygulaması açılır.</Text>
        </View>

        <View style={styles.whatsAppSection}>
          {!hasQueue ? (
            <PrimaryButton
              title="Yakınlarıma bildirim gönder"
              onPress={handleWhatsAppShare}
              colorScheme={{ start: '#15803d', end: '#166534', shadow: '#14532d', ripple: 'rgba(21,128,61,0.35)' }}
              style={styles.notifyButton}
            />
          ) : (
            <PrimaryButton
              title={nextButtonLabel}
              onPress={handleNextRecipient}
              colorScheme="mint"
              disabled={!hasNextRecipient}
              style={[styles.nextButton, !hasNextRecipient && styles.nextButtonDisabled]}
            />
          )}
          {whatsAppHint ? <Text style={styles.whatsAppHint}>{whatsAppHint}</Text> : null}
        </View>

        <Text style={styles.note}>
          Bu ekran aile bireylerine gönderilecek bildirimin taslağıdır. Konum bilgilerinin otomatik paylaşımı ve acil bildirim
          entegrasyonları prototip sonrasında eklenecektir.
        </Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 45, // Çentik (notch) payı eklendi
  },
  statusCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Slate 900
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    letterSpacing: 0.5,
    color: '#94A3B8', // Slate 400
    marginBottom: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.1)', // Sky 400 tint
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#38BDF8', // Sky 400
    letterSpacing: 0.6,
  },
  statusInfo: {
    fontSize: 15,
    lineHeight: 24,
    color: '#D1D5DB', // Slate 300
    marginBottom: 16,
  },
  statusNote: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FCA5A5', // Red 300
    fontWeight: '600',
  },
  emergencyButtons: {
    marginBottom: 16,
  },
  emergencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  emergencyButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  emergencyButtonNumber: {
    color: '#FCA5A5',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emergencyButtonLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  emergencyHint: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 10,
    fontSize: 12,
  },
  whatsAppSection: {
    marginVertical: 16,
    alignItems: 'center',
  },
  notifyButton: {
    width: '90%',
    marginBottom: 8,
  },
  nextButton: {
    marginTop: 6,
    width: '90%',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  whatsAppHint: {
    marginTop: 10,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
  },
  note: {
    fontSize: 13,
    color: '#64748B', // Slate 500
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
});

export default AlertScreen;
