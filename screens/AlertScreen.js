import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import { getProfilePreferences } from '../logic/profileStore';
import { getEmergencyContacts } from '../logic/contactsStore';

const EMERGENCY_NUMBERS = [
  { label: 'AFAD 122', value: '122' },
  { label: '112 Acil', value: '112' },
  { label: 'Alo Deprem 184', value: '184' },
];
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
  const { status = 'İyiyim', autoShare = false } = route.params || {};
  const [whatsAppHint, setWhatsAppHint] = useState('');
  const [autoShareTriggered, setAutoShareTriggered] = useState(false);
  const [recipientQueue, setRecipientQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [queueMessage, setQueueMessage] = useState('');
  const profile = getProfilePreferences();
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
    const contacts = getEmergencyContacts();
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

  useEffect(() => {
    if (autoShare && !autoShareTriggered) {
      handleWhatsAppShare();
      setAutoShareTriggered(true);
    }
  }, [autoShare, autoShareTriggered, handleWhatsAppShare]);

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
          {EMERGENCY_NUMBERS.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={styles.emergencyButton}
              onPress={() => handleDial(item.value)}
              activeOpacity={0.85}
            >
              <Text style={styles.emergencyButtonText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.emergencyHint}>Numaraya dokunduğunda telefon uygulaması açılır.</Text>
        </View>

        <View style={styles.whatsAppSection}>
          {hasQueue ? (
            <PrimaryButton
              title={nextButtonLabel}
              onPress={handleNextRecipient}
              colorScheme="mint"
              disabled={!hasNextRecipient}
              style={[styles.nextButton, !hasNextRecipient && styles.nextButtonDisabled]}
            />
          ) : null}
          <Text style={styles.whatsAppHint}>{whatsAppHint || defaultWhatsAppHint}</Text>
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
  },
  statusCard: {
    backgroundColor: '#0f1114',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f2933',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    letterSpacing: 0.5,
    color: '#f8fafc',
    marginBottom: 14,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#991b1b',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.6,
  },
  statusInfo: {
    fontSize: 15,
    lineHeight: 22,
    color: '#e5e7eb',
  },
  statusNote: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#f8fafc',
  },
  emergencyButtons: {
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: '#7f1d1d',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 12,
    marginHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(8, 145, 178, 0.35)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  emergencyHint: {
    textAlign: 'center',
    color: '#f8fafc',
    marginTop: 4,
    fontSize: 12,
  },
  note: {
    fontSize: 13,
    color: '#f59e0b',
    lineHeight: 20,
  },
  whatsAppSection: {
    marginVertical: 12,
    alignItems: 'center',
  },
  whatsAppHint: {
    marginTop: 8,
    textAlign: 'center',
    color: '#e5e7eb',
    fontSize: 13,
  },
  nextButton: {
    marginTop: 6,
    width: '85%',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
});

export default AlertScreen;
