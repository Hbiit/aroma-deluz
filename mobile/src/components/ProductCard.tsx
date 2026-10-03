import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../theme';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { items, addItem, updateQty } = useCart();

  const cartItem = items.find((i) => i.id === product.id);
  const qtyInCart = cartItem ? cartItem.qty : 0;

  // Format price
  const formattedPrice = `₦${(product.price_kobo / 100).toLocaleString('en-NG')}`;

  // Image source resolution
  const imageUrl = product.image_url?.startsWith('http')
    ? product.image_url
    : `https://aroma-deluz.vercel.app${product.image_url || '/product-lamour.jpg'}`;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price_kobo: product.price_kobo,
      image_url: imageUrl,
    });
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(product)}
        style={styles.imageContainer}
      >
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        {product.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {product.category.toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2} onPress={() => onPress(product)}>
          {product.name}
        </Text>

        {product.tagline && (
          <Text style={styles.tagline} numberOfLines={1}>
            {product.tagline}
          </Text>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formattedPrice}</Text>
          {product.size_label && (
            <Text style={styles.sizeLabel}>{product.size_label}</Text>
          )}
        </View>

        {/* Add to Cart / Quantity controls */}
        {qtyInCart === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={handleAddToCart}
          >
            <Text style={styles.addButtonText}>ADD TO CART</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyContainer}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQty(product.id, -1)}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.qtyCountContainer}>
              <Text style={styles.qtyCountText}>{qtyInCart} in Cart</Text>
            </View>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQty(product.id, 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#1A0F30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: THEME.colors.cream,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(26, 15, 48, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: THEME.colors.gold,
  },
  categoryText: {
    color: THEME.colors.goldBright,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  body: {
    padding: 12,
  },
  name: {
    color: THEME.colors.purpleInk,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: THEME.fonts.serif,
  },
  tagline: {
    color: THEME.colors.grayText,
    fontSize: 11,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  price: {
    color: THEME.colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  sizeLabel: {
    color: THEME.colors.grayText,
    fontSize: 11,
  },
  addButton: {
    backgroundColor: THEME.colors.purpleDeep,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  addButtonText: {
    color: THEME.colors.goldBright,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cream,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: THEME.colors.purpleDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 16,
    fontWeight: '700',
  },
  qtyCountContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyCountText: {
    color: THEME.colors.purpleInk,
    fontSize: 12,
    fontWeight: '600',
  },
});
