import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTranslation } from '../i18n/index';
import { PRIVACY_POLICY_SECTIONS, PRIVACY_POLICY_UPDATED_AT } from '../logic/privacyPolicy';
import { LEGAL_CONFIG } from '../logic/legalConfig';

const PrivacyPolicyScreen = ({ navigation }) => {
  const { t, lang } = useTranslation();
  const sections = PRIVACY_POLICY_SECTIONS[lang] || PRIVACY_POLICY_SECTIONS.tr;
  const openDeletionMail = () => {
    const subject = encodeURIComponent('Hesap ve veri silme talebi');
    const body = encodeURIComponent('Merhaba,\n\nHesabımın ve kişisel verilerimin silinmesini talep ediyorum.\n\nKullanıcı bilgisi:\n');
    Linking.openURL(`mailto:${LEGAL_CONFIG.contactEmail}?subject=${subject}&body=${body}`).catch(() => {});
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('privacyPolicyTitle')}</Text>
        <Text style={styles.updated}>{t('lastUpdated', { date: PRIVACY_POLICY_UPDATED_AT })}</Text>
        <Text style={styles.subtitle}>{t('privacyPolicySubtitle')}</Text>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>{t('privacyContactTitle')}</Text>
          <Text style={styles.contactText}>{t('developerName')}: {LEGAL_CONFIG.developerName}</Text>
          <Text style={styles.contactText}>{t('contactEmail')}: {LEGAL_CONFIG.contactEmail}</Text>
          <Text style={styles.contactText}>{t('privacyPolicyUrl')}: {LEGAL_CONFIG.privacyPolicyUrl}</Text>
          <Text style={styles.contactText}>
            {t('retentionSummary', {
              logs: LEGAL_CONFIG.serverLogRetentionDays,
              deletion: LEGAL_CONFIG.deletionRequestDays,
            })}
          </Text>
          <TouchableOpacity style={styles.deletionButton} onPress={openDeletionMail} activeOpacity={0.8}>
            <Text style={styles.deletionButtonText}>{t('requestDataDeletion')}</Text>
          </TouchableOpacity>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.body.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bodyText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 45,
    paddingBottom: 90,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
  },
  backButtonText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  updated: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  warningBox: {
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.2)',
    marginBottom: 18,
  },
  warningTitle: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  warningText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
    marginBottom: 18,
  },
  contactTitle: {
    color: '#7DD3FC',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  contactText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  deletionButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.26)',
  },
  deletionButtonText: {
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginTop: 8,
    marginRight: 10,
  },
  bodyText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
});

export default PrivacyPolicyScreen;
