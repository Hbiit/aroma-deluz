import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { THEME } from '../theme';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { CartModal } from '../components/CartModal';
import { AuthModal } from '../components/AuthModal';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { getProducts } from '../services/api';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CatalogScreen: React.FC = () => {
  const { user } = useAuth();
  const { totalItems, isSyncing, syncNow } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'candles' | 'perfumes'>('all');

  // Modals state
  const [cartVisible, setCartVisible] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadData = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      console.warn('Error loading catalog products:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    syncNow();
    loadData();
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        onOpenCart={() => setCartVisible(true)}
        onOpenAuth={() => setAuthVisible(true)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.colors.gold}
          />
        }
      >
        {/* Editorial Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroEyebrow}>CRAFTED TO CAPTIVATE</Text>
          <Text style={styles.heroTitle}>Sensory Elegance</Text>
          <Text style={styles.heroSubtitle}>
            Immerse yourself in artisanal scents poured by hand in Lagos.
          </Text>

          {/* Sync indicator banner */}
          <View style={styles.cloudSyncPill}>
            <View
              style={[
                styles.syncPulseDot,
                { backgroundColor: isSyncing ? THEME.colors.goldBright : THEME.colors.success },
              ]}
            />
            <Text style={styles.cloudSyncText}>
              {user
                ? `Cart Synced with Web (${user.email})`
                : 'Local Cart Active · Sign In to Sync across Web & Mobile'}
            </Text>
          </View>
        </View>

        {/* Category Pills */}
        <View style={styles.categoryRow}>
          <TouchableOpacity
            style={[styles.categoryPill, selectedCategory === 'all' && styles.categoryPillActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[styles.categoryPillText, selectedCategory === 'all' && styles.categoryPillTextActive]}
            >
              ALL ITEMS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryPill, selectedCategory === 'candles' && styles.categoryPillActive]}
            onPress={() => setSelectedCategory('candles')}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === 'candles' && styles.categoryPillTextActive,
              ]}
            >
              SCENTED CANDLES
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryPill, selectedCategory === 'perfumes' && styles.categoryPillActive]}
            onPress={() => setSelectedCategory('perfumes')}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === 'perfumes' && styles.categoryPillTextActive,
              ]}
            >
              LUXURY PERFUMES
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Catalog Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.gold} />
            <Text style={styles.loadingText}>Unveiling the Fragrances...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No fragrances found in this collection.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={(p) => setSelectedProduct(p)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Quick Bar for Cart */}
      {totalItems > 0 && (
        <View style={styles.floatingBar}>
          <TouchableOpacity
            style={styles.floatingBtn}
            activeOpacity={0.9}
            onPress={() => setCartVisible(true)}
          >
            <View style={styles.floatingLeft}>
              <View style={styles.floatingBadge}>
                <Text style={styles.floatingBadgeText}>{totalItems}</Text>
              </View>
              <Text style={styles.floatingLabel}>VIEW SHOPPING BAG</Text>
            </View>
            <Text style={styles.floatingArrow}>→</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <CartModal
        visible={cartVisible}
        onClose={() => setCartVisible(false)}
        onOpenAuth={() => {
          setCartVisible(false);
          setAuthVisible(true);
        }}
      />

      <AuthModal
        visible={authVisible}
        onClose={() => setAuthVisible(false)}
      />

      <ProductDetailModal
        product={selectedProduct}
        visible={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenCart={() => setCartVisible(true)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.ivory,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  heroBanner: {
    backgroundColor: THEME.colors.purpleDeep,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  heroEyebrow: {
    color: THEME.colors.goldBright,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroTitle: {
    color: THEME.colors.gold,
    fontSize: 26,
    fontWeight: '700',
    fontFamily: THEME.fonts.serif,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: THEME.colors.ivory,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    marginBottom: 14,
  },
  cloudSyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.purpleDarkest,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 6,
  },
  syncPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  cloudSyncText: {
    color: THEME.colors.goldBright,
    fontSize: 10,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: THEME.colors.ivory,
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: THEME.colors.cream,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  categoryPillActive: {
    backgroundColor: THEME.colors.purpleDeep,
    borderColor: THEME.colors.gold,
  },
  categoryPillText: {
    color: THEME.colors.purpleInk,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  categoryPillTextActive: {
    color: THEME.colors.goldBright,
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: THEME.colors.purpleInk,
    marginTop: 12,
    fontSize: 13,
    fontFamily: THEME.fonts.serif,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: THEME.colors.grayText,
    fontSize: 14,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  floatingBtn: {
    backgroundColor: THEME.colors.purpleDeep,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    shadowColor: '#1A0F30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingBadge: {
    backgroundColor: THEME.colors.gold,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadgeText: {
    color: THEME.colors.purpleInk,
    fontSize: 12,
    fontWeight: '800',
  },
  floatingLabel: {
    color: THEME.colors.goldBright,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  floatingArrow: {
    color: THEME.colors.goldBright,
    fontSize: 16,
    fontWeight: '700',
  },
});
