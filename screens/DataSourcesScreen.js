import React, { useCallback } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTranslation } from '../i18n/index';
import { DATA_ATTRIBUTION_SOURCES } from '../logic/dataAttribution';

const DataSourcesScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const openUrl = useCallback((url) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('dataSourcesTitle')}</Text>
        <Text style={styles.subtitle}>{t('dataSourcesSubtitle')}</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{t('informationalOnlyTitle')}</Text>
          <Text style={styles.noticeText}>{t('informationalOnlyBody')}</Text>
        </View>

        {DATA_ATTRIBUTION_SOURCES.map((source) => (
          <View key={source.id} style={styles.sourceCard}>
            <View style={styles.sourceHeader}>
              <View style={styles.sourceTitleWrap}>
                <Text style={styles.category}>{source.category}</Text>
                <Text style={styles.sourceName}>{source.name}</Text>
              </View>
            </View>

            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>{t('dataSourceAttribution')}</Text>
              <Text style={styles.metaValue}>{source.attribution}</Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>{t('dataSourceUsage')}</Text>
              <Text style={styles.metaValue}>{source.usage}</Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>{t('dataSourceLicense')}</Text>
              <Text style={styles.metaValue}>{source.license}</Text>
            </View>

            <TouchableOpacity style={styles.linkButton} onPress={() => openUrl(source.url)} activeOpacity={0.8}>
              <Text style={styles.linkButtonText}>{t('officialSource')}</Text>
            </TouchableOpacity>
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
    paddingBottom: 80,
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
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  notice: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
    marginBottom: 18,
  },
  noticeTitle: {
    color: '#7DD3FC',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  noticeText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  sourceCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sourceTitleWrap: {
    flex: 1,
  },
  category: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 5,
  },
  sourceName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },
  metaBlock: {
    marginTop: 10,
  },
  metaLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metaValue: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.24)',
  },
  linkButtonText: {
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: '900',
  },
});

export default DataSourcesScreen;
