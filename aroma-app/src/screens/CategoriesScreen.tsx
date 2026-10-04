import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../theme';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';

interface CategoriesScreenProps {
  products: Product[];
  loading: boolean;
  onSelectProduct: (product: Product) => void;
  onOpenCart: () => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  products,
  loading,
  onSelectProduct,
  onOpenCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', title: 'ALL PIECES', desc: 'The entire olfactory universe' },
    { id: 'candles', title: 'ARTISANAL CANDLES', desc: 'Hand-poured coconut-soy wax' },
    { id: 'perfumes', title: 'BESPOKE PERFUMES', desc: 'Extrait de parfum compositions' },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.tagline?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.notes_heart?.some((n) => n.toLowerCase().includes(query)) ||
      p.notes_base?.some((n) => n.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by scent, note (e.g. Vanilla, Oud)..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryPillsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>
            {categories.find((c) => c.id === selectedCategory)?.title}
          </Text>
          <Text style={styles.categoryCount}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Creation' : 'Creations'} Available
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={THEME.colors.gold} size="large" style={{ marginTop: 40 }} />
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⚜</Text>
            <Text style={styles.emptyTitle}>No matching fragrances</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search terms or category selection.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredProducts.map((product) => (
              <View key={product.id} style={styles.gridItem}>
                <ProductCard product={product} onPress={() => onSelectProduct(product)} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.ivory,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: THEME.colors.purpleDarkest,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.purpleSurface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.white,
    fontSize: 13,
    padding: 0,
  },
  clearSearch: {
    color: THEME.colors.gold,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  categoryPillsRow: {
    backgroundColor: THEME.colors.purpleDeep,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.colors.purpleSurface,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  pillActive: {
    backgroundColor: THEME.colors.gold,
    borderColor: THEME.colors.goldBright,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: THEME.colors.goldBright,
  },
  pillTextActive: {
    color: THEME.colors.purpleInk,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  categoryHeader: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
    fontFamily: THEME.fonts.serif,
    letterSpacing: 1.5,
  },
  categoryCount: {
    fontSize: 11,
    color: THEME.colors.grayText,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  grid: {
    gap: 16,
  },
  gridItem: {
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 32,
    color: THEME.colors.gold,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
    fontFamily: THEME.fonts.serif,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.grayText,
    marginTop: 4,
    textAlign: 'center',
  },
});
