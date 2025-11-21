import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import SafeSpotAdvice from '../components/SafeSpotAdvice';
import { getMockSafeSpotAdvice } from '../logic/mockSafeSpotAnalysis';
import { analyzeSafeSpotPhoto } from '../logic/safeSpotAnalyzer';

const SafeSpotScreen = () => {
  const [analysis, setAnalysis] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const advice = useMemo(
    () => analysis?.summary ?? getMockSafeSpotAdvice(),
    [analysis?.summary]
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

      setCapturedPhoto(photoUri);
      setIsAnalyzing(true);
      setStatusMessage('Fotoğraf inceleniyor...');
      setErrorMessage('');

      const aiResult = await analyzeSafeSpotPhoto(photoUri);
      setAnalysis(aiResult);

      setStatusMessage(
        aiResult.source === 'ai'
          ? 'Yapay zeka analizi tamamlandı.'
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

  const overlayStyle = (bounds) => ({
    left: `${bounds.x * 100}%`,
    top: `${bounds.y * 100}%`,
    width: `${bounds.width * 100}%`,
    height: `${bounds.height * 100}%`,
  });

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>Güvenli Alan Hatırlatması</Text>
          <Text style={styles.descriptionText}>
            Depremde cam, aynalar ve devrilebilecek mobilyalardan uzak dur. Sağlam duvar köşeleri ve dayanıklı
            mobilyaların yanları en güvenli bölgeler. Hayat üçgenini oluştur, başını kollarınla koru ve sarsıntı bitene
            kadar çök-kapan-tutun pozisyonunda kal.
          </Text>
        </View>

        <View style={styles.photoCard}>
          <Text style={styles.photoTitle}>Alanını kontrol et</Text>
          <Text style={styles.photoText}>
            Yapay zeka destekli analiz ile odandaki güvenli ve riskli bölgeleri işaretleyebilirsin.
          </Text>
          <PrimaryButton
            title={isAnalyzing ? 'Analiz ediliyor...' : 'Fotoğraf Çek ve Analiz Et'}
            onPress={handleAnalyzePhoto}
            disabled={isAnalyzing}
          />
          {isAnalyzing && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#be185d" size="small" />
              <Text style={styles.loadingText}>Fotoğraf inceleniyor...</Text>
            </View>
          )}
          {statusMessage ? <Text style={styles.photoHint}>{statusMessage}</Text> : null}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        {capturedPhoto && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Analiz edilen fotoğraf</Text>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
              {analysis?.safeZones?.map((zone) => (
                <View key={zone.id} style={[styles.overlayBox, overlayStyle(zone.bounds)]}>
                  <Text style={styles.overlayLabel}>{zone.label}</Text>
                </View>
              ))}
            </View>

            {analysis?.safeZones?.length ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Önerilen güvenli alanlar</Text>
                {analysis.safeZones.map((zone) => (
                  <View key={zone.id} style={styles.zoneRow}>
                    <View style={styles.zoneBadge} />
                    <View style={styles.zoneTextWrapper}>
                      <Text style={styles.zoneLabel}>{zone.label}</Text>
                      <Text style={styles.zoneGuidance}>{zone.guidance}</Text>
                    </View>
                    <Text style={styles.zoneConfidence}>{Math.round(zone.confidence * 100)}%</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {analysis?.risks?.length ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Dikkat edilecek bölgeler</Text>
                {analysis.risks.map((risk) => (
                  <View key={risk.id} style={styles.riskRow}>
                    <Text style={styles.riskLabel}>{risk.label}</Text>
                    <Text style={styles.riskDetail}>{risk.detail}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}

        <SafeSpotAdvice advice={advice} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  descriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 22,
    shadowColor: 'rgba(190, 24, 93, 0.08)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#9f1239',
  },
  photoCard: {
    backgroundColor: '#ffe4e6',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 16,
  },
  photoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#be185d',
    marginBottom: 10,
  },
  photoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9f1239',
    marginBottom: 14,
  },
  photoHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#be185d',
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
    color: '#be185d',
  },
  previewCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 18,
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
    aspectRatio: 3 / 2,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  overlayBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.9)',
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    padding: 4,
  },
  overlayLabel: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 12,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9a3412',
    marginBottom: 10,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 2,
  },
  zoneGuidance: {
    fontSize: 13,
    color: '#14532d',
    lineHeight: 18,
  },
  zoneConfidence: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
    marginLeft: 8,
  },
  riskRow: {
    marginBottom: 10,
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b45309',
  },
  riskDetail: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
});

export default SafeSpotScreen;
