import React from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { THEME } from '../theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenCheckout: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  visible,
  onClose,
  onOpenAuth,
  onOpenCheckout,
}) => {
  const { user } = useAuth();
  const {
    items,
    updateQty,
    removeItem,
    clearCart,
    totalItems,
    totalKobo,
    totalFormatted,
    isSyncing,
    syncNow,
  } = useCart();

  const freeShippingThresholdKobo = 15000000; // ₦150,000
  const isFreeShipping = totalKobo >= freeShippingThresholdKobo;
  const differenceToFreeShipping = freeShippingThresholdKobo - totalKobo;

  const handleCheckout = () => {
    if (items.length === 0) return;
    onClose();
    onOpenCheckout();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>YOUR SHOPPING BAG</Text>
              <Text style={styles.brandTagline}>AROMA DE LUZ · ALL ABOUT SCENT</Text>
              <Text style={styles.itemCountText}>
                {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'}{totalItems > items.length ? ` · ${totalItems} PCS` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sync Status Banner */}
          <View style={styles.syncBanner}>
            <View style={styles.syncStatusLeft}>
              <View
                style={[
                  styles.syncDot,
                  { backgroundColor: isSyncing ? THEME.colors.goldBright : THEME.colors.success },
                ]}
              />
              <Text style={styles.syncBannerText}>
                {user
                  ? isSyncing
                    ? 'Syncing with Web & Cloud...'
                    : 'Real-time Web & Mobile Sync Active'
                  : 'Signed out (Local Bag). Sign in to sync across devices.'}
              </Text>
            </View>
            {user ? (
              <TouchableOpacity onPress={syncNow} style={styles.syncBtn}>
                <Text style={styles.syncBtnText}>Refresh</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onOpenAuth} style={styles.syncBtn}>
                <Text style={styles.syncBtnText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cart Item List */}
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛍️</Text>
              <Text style={styles.emptyTitle}>Your Bag is Empty</Text>
              <Text style={styles.emptySubtitle}>
                Explore our luxury collection of artisanal scented candles and bespoke perfumes.
              </Text>
              <TouchableOpacity style={styles.shopNowBtn} onPress={onClose}>
                <Text style={styles.shopNowBtnText}>DISCOVER COLLECTION</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
              {items.map((item) => {
                const itemTotal = `₦${(((item.price_kobo || 0) * item.qty) / 100).toLocaleString('en-NG')}`;
                const itemImg = item.image_url?.startsWith('http')
                  ? item.image_url
                  : `https://aroma-deluz.vercel.app${item.image_url || '/product-lamour.jpg'}`;

                return (
                  <View key={item.id} style={styles.itemRow}>
                    <Image source={{ uri: itemImg }} style={styles.thumbnail} />
                    <View style={styles.itemDetails}>
                      <View style={styles.itemHeaderRow}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeItem(item.id)}
                          style={styles.removeBtn}
                        >
                          <Text style={styles.removeBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.itemPrice}>{itemTotal}</Text>

                      {/* Quantity Controller */}
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQty(item.id, -1)}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.qty}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQty(item.id, 1)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Footer Summary */}
          {items.length > 0 && (
            <View style={styles.footer}>
              {/* Shipping info */}
              <View style={styles.shippingBar}>
                <Text style={styles.shippingText}>
                  {isFreeShipping
                    ? '✓ Complimentary luxury shipping applied'
                    : `Add ₦${(differenceToFreeShipping / 100).toLocaleString('en-NG')} for complimentary shipping`}
                </Text>
              </View>

              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>SUBTOTAL</Text>
                <Text style={styles.subtotalValue}>{totalFormatted}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={clearCart}
                  activeOpacity={0.8}
                >
                  <Text style={styles.clearBtnText}>CLEAR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkoutBtn}
                  activeOpacity={0.8}
                  onPress={handleCheckout}
                >
                  <Text style={styles.checkoutBtnText}>CHECKOUT</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 15, 48, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.ivory,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '45%',
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
    backgroundColor: THEME.colors.purpleDarkest,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  headerTitle: {
    color: THEME.colors.gold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: THEME.fonts.serif,
  },
  brandTagline: {
    color: THEME.colors.goldBright,
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  itemCountText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.purpleSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: THEME.colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  syncBanner: {
    backgroundColor: THEME.colors.cream,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  syncStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncBannerText: {
    color: THEME.colors.purpleInk,
    fontSize: 11,
    fontWeight: '500',
  },
  syncBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.purpleDeep,
  },
  syncBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: THEME.colors.purpleInk,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: THEME.fonts.serif,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: THEME.colors.grayText,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  shopNowBtn: {
    backgroundColor: THEME.colors.purpleDeep,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  shopNowBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  itemList: {
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 6,
    backgroundColor: THEME.colors.cream,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    color: THEME.colors.purpleInk,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    fontFamily: THEME.fonts.serif,
  },
  removeBtn: {
    padding: 4,
  },
  removeBtnText: {
    color: THEME.colors.grayText,
    fontSize: 14,
  },
  itemPrice: {
    color: THEME.colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cream,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  qtyBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: THEME.colors.purpleDeep,
  },
  qtyBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 14,
    fontWeight: '700',
  },
  qtyText: {
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.purpleInk,
  },
  footer: {
    padding: 16,
    backgroundColor: THEME.colors.cream,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  shippingBar: {
    marginBottom: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  shippingText: {
    color: THEME.colors.purpleDeep,
    fontSize: 11,
    fontWeight: '600',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subtotalLabel: {
    color: THEME.colors.purpleInk,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  subtotalValue: {
    color: THEME.colors.gold,
    fontSize: 20,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.cardBg,
  },
  clearBtnText: {
    color: THEME.colors.purpleInk,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  checkoutBtn: {
    flex: 2,
    backgroundColor: THEME.colors.purpleDeep,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
