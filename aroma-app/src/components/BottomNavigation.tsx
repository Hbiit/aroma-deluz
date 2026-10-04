import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { THEME } from '../theme';
import { useCart } from '../context/CartContext';

export type NavTab = 'home' | 'categories' | 'cart' | 'account';

interface BottomNavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { totalItems } = useCart();

  const tabs: Array<{ id: NavTab; label: string; icon: string }> = [
    { id: 'home', label: 'Home', icon: '✦' },
    { id: 'categories', label: 'Categories', icon: '⚜' },
    { id: 'cart', label: 'Cart', icon: '🛍' },
    { id: 'account', label: 'Account', icon: '👤' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabBtn}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text
                style={[
                  styles.tabIcon,
                  isActive ? styles.tabIconActive : styles.tabIconInactive,
                ]}
              >
                {tab.icon}
              </Text>
              {tab.id === 'cart' && totalItems > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalItems}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.purpleDarkest,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 10,
    height: Platform.OS === 'ios' ? 84 : 64,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabIconActive: {
    color: THEME.colors.gold,
  },
  tabIconInactive: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: THEME.colors.goldBright,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 2,
    backgroundColor: THEME.colors.gold,
    borderRadius: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: THEME.colors.gold,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: THEME.colors.purpleDarkest,
  },
  badgeText: {
    color: THEME.colors.purpleInk,
    fontSize: 9,
    fontWeight: '900',
  },
});
