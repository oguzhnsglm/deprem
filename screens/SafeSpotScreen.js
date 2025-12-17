import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import SafeSpotAdvice from '../components/SafeSpotAdvice';
import { getMockSafeSpotAdvice } from '../logic/mockSafeSpotAnalysis';
import { analyzeSafeSpotPhotoWithBothProviders } from '../logic/safeSpotAnalyzer';

const SafeSpotScreen = () => {
  const [analyses, setAnalyses] = useState({ openai: null, gemini: null });
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const openAiAnalysis = analyses.openai;
  const geminiAnalysis = analyses.gemini;
  const openAiIsAi = openAiAnalysis?.source === 'ai';
  const geminiIsAi = geminiAnalysis?.source === 'ai';

  const advice = useMemo(
    () => analyses.openai?.summary ?? analyses.gemini?.summary ?? getMockSafeSpotAdvice(),
    [analyses]
  );

  const requestCameraPermissions = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        'İzin gerekiyor',
        'Güvenli alan analizi için kamera izni vermen gerekiyor.'
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermissions = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        'İzin gerekiyor',
        'Güvenli alan analizi için galeri izni vermen gerekiyor.'
      );
      return false;
    }
    return true;
  };

  const analyzePhoto = async (photoUri) => {
    setCapturedPhoto(photoUri);
    setIsAnalyzing(true);
    setStatusMessage('Fotoğraf hem OpenAI hem Gemini ile analiz ediliyor...');
    setErrorMessage('');

    try {
      const aiResults = await analyzeSafeSpotPhotoWithBothProviders(photoUri);
      setAnalyses(aiResults);

      const hasAnyAiResult = aiResults.openai?.source === 'ai' || aiResults.gemini?.source === 'ai';
      setStatusMessage(
        hasAnyAiResult
          ? 'Yapay zeka analizleri tamamlandı.'
          : 'Örnek güvenli alan önerileri gösteriliyor.'
      );
    } catch (error) {
      console.warn('Güvenli alan analizi başarısız:', error);
      setErrorMessage('Analiz sırasında bir hata oluştu. Lütfen tekrar dene.');
      Alert.alert('Hata', 'Analiz sırasında bir sorun oluştu.');
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

      const photoUri = result.assets?.[0]?.uri;
      if (!photoUri) {
        Alert.alert('Hata', 'Fotoğraf seçilemedi.');
        return;
      }

      await analyzePhoto(photoUri);
    } catch (error) {
      console.warn('Galeri hatası:', error);
      Alert.alert('Hata', 'Galeriden fotoğraf seçilirken bir sorun oluştu.');
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

      const photoUri = result.assets?.[0]?.uri;
      if (!photoUri) {
        Alert.alert('Hata', 'Fotoğraf alınamadı.');
        return;
      }

      await analyzePhoto(photoUri);
    } catch (error) {
      console.warn('Kamera hatası:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir sorun oluştu.');
    }
  };

  const overlayStyle = (bounds) => {
    if (!bounds) {
      return {};
    }
    return {
      left: `${bounds.x * 100}%`,
      top: `${bounds.y * 100}%`,
      width: `${bounds.width * 100}%`,
      height: `${bounds.height * 100}%`,
    };
  };

  return (
    <ScreenWrapper>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.photoCard}>
          <Text style={styles.photoTitle}>Alanını kontrol et</Text>
          <Text style={styles.photoText}>
            Yapay zeka destekli analiz ile odandaki güvenli ve riskli bölgeleri işaretleyebilirsin.
          </Text>
          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <PrimaryButton
                title={isAnalyzing ? 'Analiz ediliyor...' : 'Fotoğraf Çek'}
                onPress={handleAnalyzePhoto}
                disabled={isAnalyzing}
                style={styles.tallButton}
              />
            </View>
            <View style={styles.buttonWrapper}>
              <PrimaryButton
                title={isAnalyzing ? 'Analiz ediliyor...' : 'Galeriden Seç'}
                onPress={handlePickFromGallery}
                disabled={isAnalyzing}
              />
            </View>
          </View>
          {isAnalyzing && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#f8fafc" size="small" />
              <Text style={styles.loadingText}>Fotoğraf inceleniyor...</Text>
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
                  <Text style={styles.providerTitle}>{openAiAnalysis.provider || 'OpenAI GPT-4'}</Text>
                  {openAiAnalysis.error && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorTitle}>⚠️ Hata Oluştu</Text>
                      <Text style={styles.providerError}>{openAiAnalysis.error}</Text>
                    </View>
                  )}
                </View>
                {!openAiIsAi && openAiAnalysis.notice ? (
                  <View style={styles.noticeBox}>
                    <Text style={styles.noticeText}>{openAiAnalysis.notice}</Text>
                  </View>
                ) : null}
                <View style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: capturedPhoto }} 
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  {openAiIsAi &&
                    openAiAnalysis.safeZones?.map((zone) =>
                      zone.bounds ? (
                        <View key={zone.id} style={[styles.overlayBox, overlayStyle(zone.bounds)]}>
                          <Text style={styles.overlayLabel}>{zone.label}</Text>
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

            {/* Gemini Analiz Sonucu */}
            {geminiAnalysis && (
              <View style={styles.previewCard}>
                <View style={styles.providerHeader}>
                  <Text style={styles.providerTitle}>{geminiAnalysis.provider || 'Google Gemini'}</Text>
                  {geminiAnalysis.error && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorTitle}>⚠️ Hata Oluştu</Text>
                      <Text style={styles.providerError}>{geminiAnalysis.error}</Text>
                    </View>
                  )}
                </View>
                {!geminiIsAi && geminiAnalysis.notice ? (
                  <View style={styles.noticeBox}>
                    <Text style={styles.noticeText}>{geminiAnalysis.notice}</Text>
                  </View>
                ) : null}
                <View style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: capturedPhoto }} 
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  {geminiIsAi &&
                    geminiAnalysis.safeZones?.map((zone) =>
                      zone.bounds ? (
                        <View
                          key={zone.id}
                          style={[styles.overlayBox, styles.geminiOverlay, overlayStyle(zone.bounds)]}
                        >
                          <Text style={styles.overlayLabel}>{zone.label}</Text>
                        </View>
                      ) : null
                    )}
                </View>

                {geminiAnalysis.safeZones?.length ? (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>
                      {geminiIsAi ? 'Önerilen güvenli alanlar' : 'Genel güvenli alan rehberi'}
                    </Text>
                    {geminiAnalysis.safeZones.map((zone) => (
                      <View key={zone.id} style={styles.zoneRow}>
                        <View style={styles.zoneBadge} />
                        <View style={styles.zoneTextWrapper}>
                          <Text style={styles.zoneLabel}>{zone.label}</Text>
                          <Text style={styles.zoneGuidance}>{zone.guidance}</Text>
                        </View>
                        {geminiIsAi ? (
                          <Text style={styles.zoneConfidence}>{Math.round(zone.confidence * 100)}%</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {geminiAnalysis.risks?.length ? (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>
                      {geminiIsAi ? 'Dikkat edilecek bölgeler' : 'Genel risk uyarıları'}
                    </Text>
                    {geminiAnalysis.risks.map((risk) => (
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  photoCard: {
    backgroundColor: '#0f1114',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2933',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  buttonWrapper: {
    flex: 1,
  },
  tallButton: {
    paddingVertical: 26,
  },
  photoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 10,
  },
  photoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#f59e0b',
    marginBottom: 14,
  },
  photoHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#f8fafc',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#991b1b',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#f8fafc',
  },
  previewCard: {
    backgroundColor: '#0f1114',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9a3412',
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },

  providerHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  providerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#9a3412',
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 6,
  },
  providerError: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
  },
  noticeBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fbbf24',
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  overlayBox: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 1)',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  geminiOverlay: {
    borderColor: 'rgba(239, 68, 68, 0.9)',
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  overlayLabel: {
    color: '#f97316',
    fontWeight: '700',
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9a3412',
    marginBottom: 14,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  zoneBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34d399',
    marginTop: 5,
    marginRight: 8,
  },
  zoneTextWrapper: {
    flex: 1,
  },
  zoneLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  zoneGuidance: {
    fontSize: 15,
    color: '#14532d',
    lineHeight: 22,
  },
  zoneConfidence: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f766e',
    marginLeft: 8,
  },
  riskRow: {
    marginBottom: 14,
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#b45309',
    marginBottom: 4,
  },
  riskDetail: {
    fontSize: 15,
    color: '#92400e',
    lineHeight: 22,
  },
});

export default SafeSpotScreen;
