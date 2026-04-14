import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import { useTranslation } from '../i18n/index';

const HIGHLIGHT_KEYWORDS = [
  'çök/kapan/tutun',
  'çök/kapan',
  'Başını ve enseni kolunla koru',
  'pencerelerden uzak kal',
  'hayat üçgeni',
  'Asansör veya merdivenleri kullanma',
  'bulunduğun yerde kal',
  'Yardıma ihtiyacım var',
  'toplanma alanına çık'
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const EmergencyStatusScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const panicSteps = [
    t('panicStep1'), t('panicStep2'), t('panicStep3'),
    t('panicStep4'), t('panicStep5'), t('panicStep6'),
  ];

  const handleSelectStatus = (status) => {
    navigation.navigate('Alert', { status, autoShare: true });
  };

  const highlightFragments = useMemo(() => {
    const pattern = new RegExp(`(${HIGHLIGHT_KEYWORDS.map(escapeRegex).join('|')})`, 'gi');
    return panicSteps.map((step) =>
      step.split(pattern).filter(Boolean).map((chunk) => ({
        text: chunk,
        highlight: HIGHLIGHT_KEYWORDS.some((keyword) => keyword.toLowerCase() === chunk.toLowerCase()),
      }))
    );
  }, [panicSteps]);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('panicTitle')}</Text>
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
            title={t('helpNeeded')}
            onPress={() => handleSelectStatus(t('helpNeeded').replace('\n', ' '))}
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
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 36,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.1)', // Sky 400 tint for serious sequence
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: -2, // Tipografi hizalaması
  },
  stepBadgeText: {
    color: '#38BDF8', // Sky 400
    fontWeight: '900',
    fontSize: 14,
  },
  step: {
    flex: 1,
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    fontWeight: '500',
  },
  stepHighlight: {
    color: '#F8FAFC', // Slate 50
    fontWeight: '800',
  },
  actions: {
    marginTop: 0,
    paddingBottom: 24,
  },
  helpButton: {
    marginTop: 0,
    paddingVertical: 20,
    borderRadius: 24,
    marginHorizontal: 0,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
  },
  helpButtonText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

export default EmergencyStatusScreen;





