import React, { useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { THEME } from '../theme';

interface GoogleAuthModalProps {
  visible: boolean;
  authUrl: string | null;
  onClose: () => void;
  onSuccess: (tokens: { access_token?: string; refresh_token?: string; code?: string }) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  visible,
  authUrl,
  onClose,
  onSuccess,
}) => {
  const handledRef = useRef(false);

  // Reset handled flag when visible changes
  React.useEffect(() => {
    if (visible) {
      handledRef.current = false;
    }
  }, [visible]);

  const handleIntercept = (url: string): boolean => {
    if (!url || handledRef.current) return true;

    // Detect OAuth completion redirect (localhost:3000 fallback, aromadeluz://, or web callback)
    const isRedirect =
      url.includes('localhost:3000') ||
      url.startsWith('aromadeluz://') ||
      url.includes('aroma-deluz.vercel.app/auth/callback') ||
      (url.includes('access_token=') && url.includes('refresh_token='));

    if (isRedirect) {
      handledRef.current = true;

      // Extract tokens from query and hash fragment
      const [baseAndQuery, hash] = url.split('#');
      const [, query] = baseAndQuery.split('?');

      const params: Record<string, string> = {};
      const parseParams = (str?: string) => {
        if (!str) return;
        str.split('&').forEach((part) => {
          const [k, v] = part.split('=');
          if (k && v !== undefined) {
            params[decodeURIComponent(k)] = decodeURIComponent(v);
          }
        });
      };

      parseParams(query);
      parseParams(hash);

      if (params.access_token || params.code) {
        onSuccess(params);
        return false; // Intercept and stop loading localhost:3000
      }
    }
    return true;
  };

  if (!visible || !authUrl) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Sign In with Google</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* In-App OAuth WebView */}
        <WebView
          source={{ uri: authUrl }}
          userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36"
          onShouldStartLoadWithRequest={(req) => {
            const allow = handleIntercept(req.url);
            return allow;
          }}
          onNavigationStateChange={(nav) => {
            handleIntercept(nav.url);
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME.colors.gold} />
              <Text style={styles.loadingText}>Connecting to Google...</Text>
            </View>
          )}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          incognito={false}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.purpleDarkest,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    backgroundColor: THEME.colors.purpleDarkest,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: THEME.colors.ivory,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: THEME.fonts.serif,
    letterSpacing: 0.5,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: THEME.colors.purpleDeep,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  closeText: {
    color: THEME.colors.goldBright,
    fontSize: 13,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: THEME.colors.purpleDarkest,
    fontWeight: '500',
  },
});
