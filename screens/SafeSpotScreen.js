import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import SafeSpotAdvice from '../components/SafeSpotAdvice';
import { getMockSafeSpotAdvice } from '../logic/mockSafeSpotAnalysis';
import { analyzeSafeSpotPhoto } from '../logic/safeSpotAnalyzer';
import { useTranslation } from '../i18n/index';

// Çök-kapan-tutun pozisyonunda kişi figürü
const FetalFigure = () => (
  <View style={fetalStyles.wrapper}>
    {/* Baş */}
    <View style={fetalStyles.head} />
    {/* Gövde — eğilmiş */}
    <View style={fetalStyles.body}>
      <View style={fetalStyles.spine} />
      {/* Dizler çekilmiş */}
      <View style={fetalStyles.knees} />
    </View>
    <Text style={fetalStyles.label}>OK</Text>
  </View>
);

const fetalStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  head: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34D399',
    marginBottom: 2,
  },
  body: {
    alignItems: 'center',
  },
  spine: {
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#34D399',
    transform: [{ rotate: '30deg' }],
  },
  knees: {
    width: 10,
    height: 6,
    borderRadius: 5,
    backgroundColor: '#34D399',
    marginTop: -3,
    transform: [{ rotate: '-20deg' }],
  },
  label: {
    fontSize: 8,
    fontWeight: '900',
    color: '#34D399',
    marginTop: 3,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

const SafeSpotScreen = () => {
  const { t } = useTranslation();
  const [analysis, setAnalysis] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [imageDimensions, setImageDimensions] = useState(null); // orijinal piksel boyutu
  const [containerSize, setContainerSize] = useState(null);     // ekrandaki kutu boyutu
  const [statusMessage, setStatusMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const openAiAnalysis = analysis;
  const openAiIsAi = openAiAnalysis?.source === 'ai';

  const handleContainerLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  // En yüksek güven skoruna sahip, bounds'u olan zone = cenin figürü gösterilecek yer
  const safestZoneId = useMemo(() => {
    const zones = openAiAnalysis?.safeZones?.filter((z) => z.bounds) ?? [];
    if (!zones.length) return null;
    return zones.reduce((best, z) => (z.confidence > best.confidence ? z : best), zones[0])?.id;
  }, [openAiAnalysis]);

  const advice = useMemo(
    () => analysis?.summary ?? getMockSafeSpotAdvice(),
    [analysis]
  );

  const requestCameraPermissions = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(t('permRequired'), t('cameraPermMsg'));
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermissions = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(t('permRequired'), t('galleryPermMsg'));
      return false;
    }
    return true;
  };

  const analyzePhoto = async (photoUri, dims) => {
    setCapturedPhoto(photoUri);
    setImageDimensions(dims ?? null);
    setIsAnalyzing(true);
    setStatusMessage(t('analyzingPhoto'));
    setErrorMessage('');

    try {
      const aiResult = await analyzeSafeSpotPhoto(photoUri, dims);
      setAnalysis(aiResult);

      const hasAnyAiResult = aiResult?.source === 'ai';
      setStatusMessage(hasAnyAiResult ? t('aiAnalysisDone') : t('showingSample'));
    } catch (error) {
      console.warn('Safe spot analysis failed:', error);
      setErrorMessage(t('analysisFailed'));
      Alert.alert(t('errorOccurred'), t('analysisProblem'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePickFromGallery = async () => {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false,
        base64: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert(t('error'), t('photoPickFailed'));
        return;
      }

      await analyzePhoto(asset.uri, { width: asset.width, height: asset.height });
    } catch (error) {
      console.warn('Gallery error:', error);
      Alert.alert(t('error'), t('galleryError'));
    }
  };

  const handleAnalyzePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
        base64: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert(t('error'), t('photoPickFailed'));
        return;
      }

      await analyzePhoto(asset.uri, { width: asset.width, height: asset.height });
    } catch (error) {
      console.warn('Camera error:', error);
      Alert.alert(t('error'), t('cameraError'));
    }
  };

  // Piksel koordinatlarını ekran üzerindeki konuma çevirir.
  // resizeMode="contain" ile görüntü letterbox'lanabilir; offsetX/Y bunu telafi eder.
  const overlayStyle = useCallback((bounds) => {
    if (!bounds || !imageDimensions || !containerSize) return { display: 'none' };
    const { width: origW, height: origH } = imageDimensions;
    const { width: contW, height: contH } = containerSize;
    if (!origW || !origH || !contW || !contH) return { display: 'none' };

    const scale = Math.min(contW / origW, contH / origH);
    const displayW = origW * scale;
    const displayH = origH * scale;
    const offsetX = (contW - displayW) / 2;
    const offsetY = (contH - displayH) / 2;

    return {
      left: offsetX + bounds.x * scale,
      top: offsetY + bounds.y * scale,
      width: bounds.width * scale,
      height: bounds.height * scale,
    };
  }, [imageDimensions, containerSize]);

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.photoCard}>
          <Text style={styles.photoTitle}>{t('checkYourSpace')}</Text>
          <Text style={styles.photoText}>{t('checkSpaceDesc')}</Text>
          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <PrimaryButton
                title={isAnalyzing ? t('analyzingPhoto') : t('takePhoto')}
                onPress={handleAnalyzePhoto}
                disabled={isAnalyzing}
                style={styles.tallButton}
              />
            </View>
            <View style={styles.buttonWrapper}>
              <PrimaryButton
                title={isAnalyzing ? t('analyzingPhoto') : t('fromGallery')}
                onPress={handlePickFromGallery}
                disabled={isAnalyzing}
                style={styles.tallButton}
              />
            </View>
          </View>
          {isAnalyzing && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#f8fafc" size="small" />
              <Text style={styles.loadingText}>{t('reviewingPhoto')}</Text>
            </View>
          )}
          {statusMessage ? <Text style={styles.photoHint}>{statusMessage}</Text> : null}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        {capturedPhoto && (
          <View>
            {/* OpenAI Analiz Sonucu */}
            {openAiAnalysis && (
              <View style={styles.previewCard}>
                <View style={styles.providerHeader}>
                  <Text style={styles.providerTitle}>
                    {openAiAnalysis.provider || (openAiIsAi ? t('aiAnalysisLabel') : t('generalGuideLabel'))}
                  </Text>
                  {openAiAnalysis.error && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorTitle}>{t('errorOccurred')}</Text>
                      <Text style={styles.providerError}>{openAiAnalysis.error}</Text>
                    </View>
                  )}
                </View>
                {!openAiIsAi && openAiAnalysis.notice ? (
                  <View style={styles.noticeBox}>
                    <Text style={styles.noticeText}>{openAiAnalysis.notice}</Text>
                  </View>
                ) : null}
                <View style={styles.imageWrapper} onLayout={handleContainerLayout}>
                  <Image
                    source={{ uri: capturedPhoto }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                  {openAiIsAi &&
                    openAiAnalysis.safeZones?.map((zone) =>
                      zone.bounds ? (
                        <View
                          key={zone.id}
                          style={[
                            styles.overlayBox,
                            overlayStyle(zone.bounds),
                            zone.id === safestZoneId && styles.overlayBoxSafest,
                          ]}
                        >
                          {zone.id === safestZoneId ? (
                            <FetalFigure />
                          ) : (
                            <Text style={styles.overlayLabel}>{zone.label}</Text>
                          )}
                        </View>
                      ) : null
                    )}
                </View>

                {openAiAnalysis.safeZones?.length ? (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>
                      {openAiIsAi ? 'Önerilen güvenli alanlar' : 'Genel güvenli alan rehberi'}
                    </Text>
                    {openAiAnalysis.safeZones.map((zone) => (
                      <View key={zone.id} style={styles.zoneRow}>
                        <View style={styles.zoneBadge} />
                        <View style={styles.zoneTextWrapper}>
                          <Text style={styles.zoneLabel}>{zone.label}</Text>
                          <Text style={styles.zoneGuidance}>{zone.guidance}</Text>
                        </View>
                        {openAiIsAi ? (
                          <Text style={styles.zoneConfidence}>{Math.round(zone.confidence * 100)}%</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {openAiAnalysis.risks?.length ? (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>
                      {openAiIsAi ? 'Dikkat edilecek bölgeler' : 'Genel risk uyarıları'}
                    </Text>
                    {openAiAnalysis.risks.map((risk) => (
                      <View key={risk.id} style={styles.riskRow}>
                        <Text style={styles.riskLabel}>{risk.label}</Text>
                        <Text style={styles.riskDetail}>{risk.detail}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            )}

          </View>
        )}

        {!capturedPhoto && <SafeSpotAdvice advice={advice} />}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 220,
  },
  photoCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
    marginTop: 45,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  buttonWrapper: {
    flex: 1,
  },
  tallButton: {
    paddingVertical: 24,
    borderRadius: 20,
  },
  photoTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  photoText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#94A3B8',
    marginBottom: 20,
  },
  photoHint: {
    marginTop: 14,
    fontSize: 13,
    color: '#34D399',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: '#FCA5A5',
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  previewCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 20,
    width: '100%',
    alignSelf: 'center',
    marginTop: 45,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#38BDF8',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  providerHeader: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  providerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#38BDF8',
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FCA5A5',
    marginBottom: 8,
  },
  providerError: {
    fontSize: 14,
    color: '#FECACA',
    lineHeight: 22,
  },
  noticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 14,
    color: '#FDE68A',
    lineHeight: 22,
    fontWeight: '600',
  },
  overlayBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.7)',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  overlayBoxSafest: {
    borderWidth: 3,
    borderColor: 'rgba(52, 211, 153, 0.9)',
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  overlayLabel: {
    color: '#0369A1',
    fontWeight: '900',
    fontSize: 13,
    backgroundColor: 'rgba(186, 230, 253, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  zoneBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#38BDF8',
    marginTop: 6,
    marginRight: 12,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  zoneTextWrapper: {
    flex: 1,
  },
  zoneLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 6,
  },
  zoneGuidance: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
  },
  zoneConfidence: {
    fontSize: 14,
    fontWeight: '900',
    color: '#38BDF8',
    marginLeft: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  riskRow: {
    marginBottom: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FCA5A5',
    marginBottom: 6,
  },
  riskDetail: {
    fontSize: 14,
    color: '#FECACA',
    lineHeight: 24,
  },
});

export default SafeSpotScreen;
