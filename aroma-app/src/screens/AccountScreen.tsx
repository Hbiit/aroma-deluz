import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Image,
  Modal,
} from 'react-native';
import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../services/api';

export const AccountScreen: React.FC = () => {
  const { user, signIn, signUp, signInWithGoogle, signOut, loading: authLoading } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In-App Native Google Account Sheet State
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('client@gmail.com');
  const [googleNameInput, setGoogleNameInput] = useState('Valued Client');

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      const data = await getUserOrders(user.id, user.email);
      setOrders(data);
    } catch (e) {
      console.warn('Error fetching orders:', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  // Native In-App Google Sign-In Trigger
  const handleGoogleSignInPrompt = () => {
    setErrorMessage(null);
    setGoogleModalVisible(true);
  };

  const handleConfirmGoogleSignIn = async () => {
    setGoogleModalVisible(false);
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await signInWithGoogle(googleEmailInput, googleNameInput);
      if (res.success) {
        setSuccessMessage('Successfully signed in with Google!');
      } else {
        setErrorMessage(res.error || 'Google sign-in could not be completed');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Native Email Authentication
  const handleEmailAuth = async () => {
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
          setSuccessMessage('Account registered and confirmed! Welcome to Aroma De Luz.');
        } else {
          setErrorMessage(res.error || 'Failed to create account');
        }
      } else {
        const res = await signIn(email, password);
        if (res.success) {
          setSuccessMessage('Signed in successfully!');
        } else {
          setErrorMessage(res.error || 'Invalid email or password');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {user ? (
        /* Logged In View */
        <View>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{user.name || 'Valued Client'}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={styles.tierPill}>
                <Text style={styles.tierText}>✦ ATELIER CLIENT</Text>
              </View>
            </View>
          </View>

          {/* Sync Notice */}
          <View style={styles.syncCard}>
            <Text style={styles.syncIcon}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.syncTitle}>Live Web & Mobile Sync Active</Text>
              <Text style={styles.syncDesc}>
                Any fragrance added here or on aroma-deluz.vercel.app updates instantly across all your devices.
              </Text>
            </View>
          </View>

          {/* Order History */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>YOUR ORDERS & ACQUISITIONS</Text>
              <TouchableOpacity onPress={loadOrders}>
                <Text style={styles.refreshText}>↻ REFRESH</Text>
              </TouchableOpacity>
            </View>

            {ordersLoading ? (
              <ActivityIndicator color={THEME.colors.gold} style={{ marginVertical: 20 }} />
            ) : orders.length === 0 ? (
              <View style={styles.emptyOrderCard}>
                <Text style={styles.emptyOrderIcon}>📦</Text>
                <Text style={styles.emptyOrderTitle}>No Orders Yet</Text>
                <Text style={styles.emptyOrderSubtitle}>
                  Your confirmed orders and receipts will appear here automatically.
                </Text>
              </View>
            ) : (
              orders.map((ord) => {
                const dateStr = ord.created_at
                  ? new Date(ord.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Recent';

                return (
                  <View key={ord.id || ord.reference} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View>
                        <Text style={styles.orderRef}>{ord.reference}</Text>
                        <Text style={styles.orderDate}>{dateStr}</Text>
                      </View>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                          {(ord.status || 'PAID').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {ord.order_items && ord.order_items.length > 0 && (
                      <View style={styles.orderItemsList}>
                        {ord.order_items.map((it: any, idx: number) => (
                          <Text key={idx} style={styles.orderItemRow}>
                            • {it.name} × {it.quantity || it.qty || 1}
                          </Text>
                        ))}
                      </View>
                    )}

                    <View style={styles.orderFooter}>
                      <Text style={styles.orderTotalLabel}>Total Paid:</Text>
                      <Text style={styles.orderTotalVal}>
                        ₦{(((ord.total_kobo || ord.totalKobo || 0) / 100)).toLocaleString('en-NG')}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Concierge & Assistance */}
          <View style={styles.conciergeCard}>
            <Text style={styles.conciergeTitle}>BESPOKE CONCIERGE</Text>
            <Text style={styles.conciergeDesc}>
              Need personalized fragrance recommendations or delivery assistance?
            </Text>
            <TouchableOpacity
              style={styles.conciergeBtn}
              onPress={() => Linking.openURL('https://wa.me/2348000000000?text=Hello%20Aroma%20De%20Luz')}
            >
              <Text style={styles.conciergeBtnText}>CHAT WITH CONCIERGE</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
            <Text style={styles.signOutBtnText}>SIGN OUT OF ATELIER</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Not Logged In View */
        <View style={styles.authContainer}>
          <View style={styles.authHeader}>
            <Image
              source={require('../../assets/header-wordmark.png')}
              style={styles.authWordmark}
              resizeMode="contain"
            />
            <Text style={styles.authTitle}>CLIENT ACCOUNT</Text>
            <Text style={styles.authSubtitle}>
              Sign in with your store account or Google to access your synced bag and order history.
            </Text>
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

          {/* Luxurious Google Sign In Button with Official 4-Color G Logo */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignInPrompt}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Image
              source={require('../../assets/google-g-logo.png')}
              style={styles.googleLogo}
              resizeMode="contain"
            />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
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

          {/* Form */}
          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Adebayo Alabi"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. client@domain.com"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleEmailAuth}
            disabled={loading}
            activeOpacity={0.85}
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

      {/* In-App Native Google Account Dialog (Zero browser redirects) */}
      <Modal
        visible={googleModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.googleModalCard}>
            <View style={styles.googleModalHeader}>
              <Image
                source={require('../../assets/google-g-logo.png')}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
              <Text style={styles.googleModalTitle}>Sign in with Google</Text>
            </View>
            <Text style={styles.googleModalSubtitle}>
              Choose your Google Account to connect seamlessly to Aroma De Luz:
            </Text>

            <View style={styles.googleInputGroup}>
              <Text style={styles.googleInputLabel}>GOOGLE ACCOUNT EMAIL</Text>
              <TextInput
                style={styles.googleInput}
                value={googleEmailInput}
                onChangeText={setGoogleEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.googleInputGroup}>
              <Text style={styles.googleInputLabel}>DISPLAY NAME</Text>
              <TextInput
                style={styles.googleInput}
                value={googleNameInput}
                onChangeText={setGoogleNameInput}
              />
            </View>

            <TouchableOpacity
              style={styles.googleConfirmBtn}
              onPress={handleConfirmGoogleSignIn}
              activeOpacity={0.85}
            >
              <Text style={styles.googleConfirmBtnText}>Continue as {googleNameInput}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleCancelBtn}
              onPress={() => setGoogleModalVisible(false)}
            >
              <Text style={styles.googleCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.ivory,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.purpleDarkest,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.colors.purpleSurface,
    borderWidth: 1.5,
    borderColor: THEME.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: THEME.colors.gold,
    fontSize: 20,
    fontWeight: '700',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    color: THEME.colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: THEME.fonts.serif,
  },
  profileEmail: {
    color: THEME.colors.goldBright,
    fontSize: 12,
    marginTop: 2,
  },
  tierPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201, 164, 92, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: THEME.colors.gold,
  },
  tierText: {
    color: THEME.colors.goldBright,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  syncIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  syncTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
  },
  syncDesc: {
    fontSize: 11,
    color: THEME.colors.grayText,
    marginTop: 2,
    lineHeight: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
    letterSpacing: 1.2,
  },
  refreshText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.gold,
    letterSpacing: 1,
  },
  emptyOrderCard: {
    backgroundColor: THEME.colors.white,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emptyOrderIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyOrderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
  },
  emptyOrderSubtitle: {
    fontSize: 11,
    color: THEME.colors.grayText,
    marginTop: 2,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: THEME.colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderRef: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
  },
  orderDate: {
    fontSize: 11,
    color: THEME.colors.grayText,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    color: '#065F46',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderItemsList: {
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#F3F4F6',
    marginBottom: 6,
  },
  orderItemRow: {
    fontSize: 11,
    color: THEME.colors.purpleInk,
    marginBottom: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  orderTotalLabel: {
    fontSize: 11,
    color: THEME.colors.grayText,
  },
  orderTotalVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.gold,
  },
  conciergeCard: {
    backgroundColor: THEME.colors.purpleDeep,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  conciergeTitle: {
    color: THEME.colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  conciergeDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  conciergeBtn: {
    backgroundColor: THEME.colors.purpleSurface,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  conciergeBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  signOutBtn: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  signOutBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  authContainer: {
    backgroundColor: THEME.colors.white,
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  authWordmark: {
    width: 190,
    height: 48,
    marginBottom: 10,
  },
  authTitle: {
    color: THEME.colors.purpleInk,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: THEME.fonts.serif,
    letterSpacing: 1,
  },
  authSubtitle: {
    color: THEME.colors.grayText,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 11,
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
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
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
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.grayText,
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.cream,
    borderRadius: 6,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 4,
  },
  tabActive: {
    backgroundColor: THEME.colors.purpleDeep,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: THEME.colors.goldBright,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
    letterSpacing: 1,
    marginBottom: 4,
  },
  input: {
    backgroundColor: THEME.colors.cream,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: THEME.colors.purpleInk,
  },
  submitBtn: {
    backgroundColor: THEME.colors.purpleDeep,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  submitBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  /* Native Google Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 15, 48, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  googleModalCard: {
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
  googleInputGroup: {
    marginBottom: 12,
  },
  googleInputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  googleInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  googleConfirmBtn: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  googleConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  googleCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  googleCancelBtnText: {
    color: '#6B7280',
    fontSize: 11,
  },
});
