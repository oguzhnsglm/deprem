import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTranslation } from '../i18n/index';
import { resendEmailOtp, verifyEmailOtp } from '../logic/authStore';

const OtpVerificationScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const email = route?.params?.email || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async () => {
    setError('');
    setInfo('');
    if (code.length < 6) {
      setError(t('otpEnterFullCode'));
      return;
    }
    setLoading(true);
    try {
      await verifyEmailOtp(email, code);
      navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
    } catch (err) {
      setError(err?.message || t('otpInvalid'));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    try {
      await resendEmailOtp(email);
      setInfo(t('otpResent'));
    } catch (err) {
      setError(err?.message || t('otpResendFailed'));
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.backText}>{t('back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('otpTitle')}</Text>
        <Text style={styles.subtitle}>{t('otpSubtitle', { email })}</Text>

        <TextInput
          style={styles.codeInput}
          placeholder="000000"
          placeholderTextColor="#475569"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))}
          textAlign="center"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <TouchableOpacity
          style={[styles.submit, loading && styles.submitDisabled]}
          onPress={submit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#0a0f1e" /> : <Text style={styles.submitText}>{t('otpVerify')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={resend} disabled={resending} activeOpacity={0.7}>
          <Text style={styles.altLink}>{resending ? t('otpResending') : t('otpResend')}</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 22, paddingTop: 40 },
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
  backText: { color: '#CBD5E1', fontSize: 13, fontWeight: '800' },
  title: { color: '#F8FAFC', fontSize: 26, fontWeight: '900', marginBottom: 6 },
  subtitle: { color: '#94A3B8', fontSize: 14, lineHeight: 20, marginBottom: 24 },
  codeInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: 16,
    paddingVertical: 18,
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 8,
    marginBottom: 18,
  },
  error: { color: '#FCA5A5', fontSize: 13, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  info: { color: '#86EFAC', fontSize: 13, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  submit: {
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#0a0f1e', fontSize: 15, fontWeight: '900' },
  altLink: { color: '#7DD3FC', fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 18 },
});

export default OtpVerificationScreen;
