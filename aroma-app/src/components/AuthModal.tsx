import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';

import { GoogleAuthModal } from './GoogleAuthModal';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { user, signIn, signUp, getGoogleAuthUrl, completeGoogleAuth, signOut } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In-App Google OAuth State
  const [googleAuthVisible, setGoogleAuthVisible] = useState(false);
  const [googleAuthUrl, setGoogleAuthUrl] = useState<string | null>(null);

  // Open In-App Google OAuth Sheet
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await getGoogleAuthUrl();
      if (res.url) {
        setGoogleAuthUrl(res.url);
        setGoogleAuthVisible(true);
      } else {
        setErrorMessage(res.error || 'Could not initiate Google authentication');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Intercepted Google OAuth Tokens (intercepts localhost:3000 seamlessly)
  const handleGoogleAuthSuccess = async (tokens: {
    access_token?: string;
    refresh_token?: string;
    code?: string;
  }) => {
    setGoogleAuthVisible(false);
    setLoading(true);
    try {
      const res = await completeGoogleAuth(tokens);
      if (res.success) {
        setSuccessMessage('Signed in with Google successfully! Bag is now synced.');
        setTimeout(() => onClose(), 800);
      } else {
        setErrorMessage(res.error || 'Google authentication failed');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const res = await signUp(email, password, name);
        if (res.success) {
          setSuccessMessage('Account created successfully! Bag is now synced.');
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          setErrorMessage(res.error || 'Failed to create account');
        }
      } else {
        const res = await signIn(email, password);
        if (res.success) {
          setSuccessMessage('Signed in successfully! Bag is now synced.');
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          setErrorMessage(res.error || 'Invalid email or password');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Image
              source={require('../../assets/header-wordmark.png')}
              style={styles.headerWordmark}
              resizeMode="contain"
            />
            <Text style={styles.title}>
              {user ? 'YOUR LUXURY ACCOUNT' : isRegister ? 'CREATE AN ACCOUNT' : 'WELCOME BACK'}
            </Text>
            <Text style={styles.subtitle}>
              {user
                ? 'Your shopping bag is synced with web and mobile.'
                : 'Sign in with your store account or Google to access your synced bag.'}
            </Text>
          </View>

          {user ? (
            <View style={styles.userView}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userName}>{user.name || 'Valued Client'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>

              <View style={styles.syncNotice}>
                <Text style={styles.syncNoticeIcon}>✨</Text>
                <Text style={styles.syncNoticeText}>
                  Instant Bag Sync Active: Any product added here will appear immediately on
                  the website, and vice versa.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleSignOut}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={THEME.colors.gold} />
                ) : (
                  <Text style={styles.signOutBtnText}>SIGN OUT</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              {/* Luxury Google Sign In Button */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={handleGoogleSignIn}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Image
                  source={require('../../assets/google-g-logo.png')}
                  style={styles.googleLogo}
                  resizeMode="contain"
                />
                <Text style={styles.googleBtnText}>
                  {isRegister ? 'Sign up with Google' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR WITH EMAIL</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Tab Selector */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, !isRegister && styles.tabActive]}
                  onPress={() => {
                    setIsRegister(false);
                    setErrorMessage(null);
                  }}
                >
                  <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>
                    SIGN IN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, isRegister && styles.tabActive]}
                  onPress={() => {
                    setIsRegister(true);
                    setErrorMessage(null);
                  }}
                >
                  <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>
                    REGISTER
                  </Text>
                </TouchableOpacity>
              </View>

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {successMessage && (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}

              {isRegister && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FULL NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={THEME.colors.goldBright} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isRegister ? 'CREATE ACCOUNT & SYNC' : 'SIGN IN & SYNC BAG'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* In-App Google OAuth Sheet (intercepts localhost:3000 redirects seamlessly) */}
      <GoogleAuthModal
        visible={googleAuthVisible}
        authUrl={googleAuthUrl}
        onClose={() => setGoogleAuthVisible(false)}
        onSuccess={handleGoogleAuthSuccess}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 18, 41, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: THEME.colors.ivory,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    color: THEME.colors.purpleInk,
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerWordmark: {
    width: 180,
    height: 44,
    marginBottom: 10,
  },
  title: {
    color: THEME.colors.purpleInk,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: THEME.fonts.serif,
  },
  subtitle: {
    color: THEME.colors.grayText,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  userView: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.purpleDeep,
    borderWidth: 2,
    borderColor: THEME.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    color: THEME.colors.goldBright,
    fontSize: 24,
    fontWeight: '700',
  },
  userName: {
    color: THEME.colors.purpleInk,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: THEME.fonts.serif,
  },
  userEmail: {
    color: THEME.colors.grayText,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  syncNotice: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.cream,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    gap: 8,
  },
  syncNoticeIcon: {
    fontSize: 20,
  },
  syncNoticeText: {
    flex: 1,
    color: THEME.colors.purpleInk,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  signOutBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    backgroundColor: THEME.colors.cardBg,
  },
  signOutBtnText: {
    color: THEME.colors.purpleDeep,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.cream,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: THEME.colors.purpleDeep,
  },
  tabText: {
    color: THEME.colors.purpleInk,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: THEME.colors.goldBright,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#34D399',
  },
  successText: {
    color: '#065F46',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: THEME.colors.purpleInk,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  input: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.colors.purpleInk,
  },
  submitBtn: {
    backgroundColor: THEME.colors.purpleDeep,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  submitBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 164, 92, 0.45)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleBtnText: {
    color: THEME.colors.purpleInk,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.grayText,
    letterSpacing: 1.2,
  },

  /* In-App Google Modal */
  googleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 18, 41, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  googleModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  googleModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  googleModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  googleModalSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 16,
  },
  googleField: {
    marginBottom: 12,
  },
  googleFieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  googleFieldInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  googleActionBtn: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  googleActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  googleDismissBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  googleDismissBtnText: {
    color: '#6B7280',
    fontSize: 11,
  },
});
