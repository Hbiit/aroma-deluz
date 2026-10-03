import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { THEME } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart, onOpenAuth }) => {
  const { user } = useAuth();
  const { totalItems, isSyncing } = useCart();

  return (
    <View style={styles.container}>
      {/* Announcement Strip */}
      <View style={styles.announcement}>
        <Text style={styles.announcementText}>
          COMPLIMENTARY DELIVERY ON ORDERS OVER ₦150,000 · LAGOS & WORLDWIDE
        </Text>
      </View>

      {/* Main Bar */}
      <View style={styles.navBar}>
        {/* Left: User status / Auth trigger */}
        <TouchableOpacity
          style={styles.authBtn}
          onPress={onOpenAuth}
          activeOpacity={0.8}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </Text>
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.authLabel} numberOfLines={1}>
              {user ? (user.name || user.email.split('@')[0]) : 'Sign In'}
            </Text>
            {user && (
              <View style={styles.syncRow}>
                <View
                  style={[
                    styles.syncDot,
                    { backgroundColor: isSyncing ? THEME.colors.goldBright : THEME.colors.success },
                  ]}
                />
                <Text style={styles.syncStatusText}>
                  {isSyncing ? 'Syncing...' : 'Live Sync'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Center: Brand Lockup */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>AROMA</Text>
          <Text style={styles.brandSubtitle}>DELUZ</Text>
        </View>

        {/* Right: Cart Button with badge */}
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={onOpenCart}
          activeOpacity={0.8}
        >
          <Text style={styles.cartIcon}>🛍️</Text>
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.purpleDarkest,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  announcement: {
    backgroundColor: THEME.colors.purpleInk,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  announcementText: {
    color: THEME.colors.goldBright,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 70,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.purpleSurface,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: THEME.colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  userMeta: {
    justifyContent: 'center',
  },
  authLabel: {
    color: THEME.colors.white,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 80,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncStatusText: {
    color: THEME.colors.goldBright,
    fontSize: 9,
    fontWeight: '500',
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    color: THEME.colors.gold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: THEME.fonts.serif,
  },
  brandSubtitle: {
    color: THEME.colors.goldBright,
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 4,
    marginTop: -2,
  },
  cartBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: THEME.colors.purpleSurface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cartIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: THEME.colors.gold,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: THEME.colors.purpleDarkest,
  },
  badgeText: {
    color: THEME.colors.purpleInk,
    fontSize: 10,
    fontWeight: '800',
  },
});
