import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';

const panicSteps = [
  'Derin nefes al, sağlam bir mobilyanın yanına çök/kapan/tutun.',
  'Başını ve enseni kolunla koru, pencerelerden uzak kal.',
  'Dayanıklı koltuk, masa veya beyaz eşya yanında hayat üçgeni oluşturmaya çalış.',
  'Asansör veya merdivenleri kullanma; sarsıntı bitene kadar bulunduğun yerde kal.',
  "Ulaşabiliyorsan Acil Durum Kişileri listene 'Yardıma ihtiyacım var' bildirimi gönder.",
  'Güvendeysen toplanma alanına çık ve burada tekrar haber ver.',
];

const emergencyNumbers = [
  { label: 'AFAD 122', value: '122' },
  { label: '112 Acil', value: '112' },
  { label: 'Alo Deprem 184', value: '184' },
];

const HIGHLIGHT_KEYWORDS = [
  'çök/kapan/tutun',
  'çök/kapan',
  'Başını ve enseni kolunla koru',
  'pencerelerden uzak kal',
  'hayat üçgeni',
  'Asansör veya merdivenleri kullanma',
  'bulunduğun yerde kal',
  'Yardıma ihtiyacım var',
  'toplanma alanına çık',
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const EmergencyStatusScreen = ({ navigation }) => {
  const handleSelectStatus = (status) => {
    navigation.navigate('Alert', { status });
  };

  const handleDial = (number) => {
    Linking.openURL(`tel:${number}`).catch(() => {});
  };

  const highlightFragments = useMemo(() => {
    const pattern = new RegExp(`(${HIGHLIGHT_KEYWORDS.map(escapeRegex).join('|')})`, 'gi');
    return panicSteps.map((step) =>
      step.split(pattern).filter(Boolean).map((chunk) => ({
        text: chunk,
        highlight: HIGHLIGHT_KEYWORDS.some((keyword) => keyword.toLowerCase() === chunk.toLowerCase()),
      }))
    );
  }, []);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Panik Anında Ne Yapmalı?</Text>
          {panicSteps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.step}>
                {highlightFragments[index].map((fragment, fragmentIndex) => (
                  <Text
                    key={`${fragment.text}-${fragmentIndex}`}
                    style={fragment.highlight ? styles.stepHighlight : undefined}
                  >
                    {fragment.text}
                  </Text>
                ))}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title={'Yardıma ihtiyacım\nvar'}
            onPress={() => handleSelectStatus('Yardıma ihtiyacım var')}
            colorScheme={{ start: '#f97316', end: '#dc2626', shadow: '#7f1d1d', ripple: 'rgba(249, 115, 22, 0.35)' }}
            style={styles.helpButton}
            textStyle={styles.helpButtonText}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#0f1114',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f2933',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: '#991b1b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepBadgeText: {
    color: '#f8fafc',
    fontWeight: '800',
  },
  step: {
    flex: 1,
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 22,
    fontWeight: '700',
  },
  stepHighlight: {
    color: '#f97316',
    fontWeight: '800',
  },
  actions: {
    marginTop: 0,
    paddingBottom: 12,
  },
  helpButton: {
    marginTop: 8,
    paddingVertical: 40,
    borderRadius: 36,
    marginHorizontal: 24,
  },
  helpButtonText: {
    fontSize: 26,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

export default EmergencyStatusScreen;
