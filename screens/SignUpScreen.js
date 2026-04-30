import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTranslation } from '../i18n/index';
import { linkEmailWithPassword } from '../logic/authStore';

const SignUpScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!email.includes('@')) {
      setError(t('signUpInvalidEmail'));
      return;
    }
    if (password.length < 8) {
      setError(t('signUpPasswordTooShort'));
      return;
    }
    if (password !== password2) {
      setError(t('signUpPasswordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await linkEmailWithPassword(email, password);
      navigation.navigate('OtpVerification', { email, mode: 'signup' });
    } catch (err) {
      setError(err?.message || t('signUpGenericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.backText}>{t('back')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('signUpTitle')}</Text>
          <Text style={styles.subtitle}>{t('signUpSubtitle')}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('email')}</Text>
            <TextInput
              style={styles.input}
              placeholder="ornek@mail.com"
              placeholderTextColor="#475569"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('password')}</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <Text style={styles.hint}>{t('signUpPasswordHint')}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('passwordConfirm')}</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              secureTextEntry
              autoCapitalize="none"
              value={password2}
              onChangeText={setPassword2}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submit, loading && styles.submitDisabled]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#0a0f1e" /> : <Text style={styles.submitText}>{t('signUpSubmit')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('SignIn')} activeOpacity={0.7}>
            <Text style={styles.altLink}>{t('signUpAlreadyHaveAccount')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: 22, paddingTop: 40, paddingBottom: 80 },
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
  field: { marginBottom: 14 },
  label: { color: '#CBD5E1', fontSize: 13, fontWeight: '800', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
  },
  hint: { color: '#64748B', fontSize: 12, marginTop: 6 },
  error: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
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

export default SignUpScreen;
