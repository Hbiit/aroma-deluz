import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { THEME } from '../theme';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onOpenCart: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  visible,
  onClose,
  onOpenCart,
}) => {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const formattedPrice = `₦${(product.price_kobo / 100).toLocaleString('en-NG')}`;
  const imageUrl = product.image_url?.startsWith('http')
    ? product.image_url
    : `https://aroma-deluz.vercel.app${product.image_url || '/product-lamour.jpg'}`;

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price_kobo: product.price_kobo,
        image_url: imageUrl,
      },
      qty
    );
    onClose();
    onOpenCart();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

            <View style={styles.content}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {(product.category || 'EXCLUSIVE').toUpperCase()}
                </Text>
              </View>

              <Text style={styles.name}>{product.name}</Text>
              {product.tagline && <Text style={styles.tagline}>{product.tagline}</Text>}

              <Text style={styles.price}>{formattedPrice}</Text>

              <Text style={styles.description}>{product.description}</Text>

              {/* Fragrance Notes */}
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>OLFACTORY PYRAMID</Text>

                {product.notes_top && product.notes_top.length > 0 && (
                  <View style={styles.noteRow}>
                    <Text style={styles.noteLevel}>TOP NOTES:</Text>
                    <Text style={styles.noteItems}>{product.notes_top.join(', ')}</Text>
                  </View>
                )}

                {product.notes_heart && product.notes_heart.length > 0 && (
                  <View style={styles.noteRow}>
                    <Text style={styles.noteLevel}>HEART NOTES:</Text>
                    <Text style={styles.noteItems}>{product.notes_heart.join(', ')}</Text>
                  </View>
                )}

                {product.notes_base && product.notes_base.length > 0 && (
                  <View style={styles.noteRow}>
                    <Text style={styles.noteLevel}>BASE NOTES:</Text>
                    <Text style={styles.noteItems}>{product.notes_base.join(', ')}</Text>
                  </View>
                )}
              </View>

              {/* Quantity selector */}
              <View style={styles.actionSection}>
                <View style={styles.qtyContainer}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQty(Math.max(1, qty - 1))}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(qty + 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={handleAddToCart}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addBtnText}>ADD TO BAG · {formattedPrice}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 15, 48, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.ivory,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    position: 'relative',
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(26, 15, 48, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  closeBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 14,
    fontWeight: '700',
  },
  image: {
    width: '100%',
    height: 280,
    backgroundColor: THEME.colors.cream,
  },
  content: {
    padding: 20,
  },
  categoryBadge: {
    backgroundColor: THEME.colors.purpleDeep,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: THEME.colors.gold,
  },
  categoryText: {
    color: THEME.colors.goldBright,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  name: {
    color: THEME.colors.purpleInk,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: THEME.fonts.serif,
    marginBottom: 4,
  },
  tagline: {
    color: THEME.colors.grayText,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  price: {
    color: THEME.colors.gold,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  description: {
    color: THEME.colors.purpleInk,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  notesSection: {
    backgroundColor: THEME.colors.cream,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 24,
  },
  notesTitle: {
    color: THEME.colors.purpleInk,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  noteRow: {
    marginBottom: 8,
  },
  noteLevel: {
    color: THEME.colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  noteItems: {
    color: THEME.colors.purpleInk,
    fontSize: 12,
    marginTop: 2,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  qtyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: THEME.colors.purpleDeep,
    borderRadius: 4,
  },
  qtyBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 16,
    fontWeight: '700',
  },
  qtyText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
  },
  addBtn: {
    flex: 1,
    backgroundColor: THEME.colors.purpleDeep,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  addBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});
