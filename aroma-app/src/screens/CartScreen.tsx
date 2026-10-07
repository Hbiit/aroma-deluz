import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface CartScreenProps {
  onOpenCheckout: () => void;
  onExploreProducts: () => void;
  onOpenAuth: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  onOpenCheckout,
  onExploreProducts,
  onOpenAuth,
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

  return (
    <View style={styles.container}>
      {/* Sync Status Banner */}
      <View style={styles.syncBanner}>
        <View style={styles.syncLeft}>
          <View
            style={[
              styles.syncDot,
              { backgroundColor: isSyncing ? THEME.colors.goldBright : THEME.colors.success },
            ]}
          />
          <Text style={styles.syncText}>
            {user
              ? `Bag Synced · ${user.email}`
              : 'Local Bag Active · Sign in to sync with Web'}
          </Text>
        </View>
        {!user && (
          <TouchableOpacity onPress={onOpenAuth} style={styles.signInBtn}>
            <Text style={styles.signInText}>SIGN IN</Text>
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
          <TouchableOpacity style={styles.shopNowBtn} onPress={onExploreProducts} activeOpacity={0.85}>
            <Text style={styles.shopNowBtnText}>DISCOVER COLLECTION</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
          {/* Shipping Bar */}
          <View style={styles.shippingBar}>
            <Text style={styles.shippingText}>
              {isFreeShipping
                ? '✓ Complimentary luxury shipping applied (Orders over ₦150,000)'
                : `Add ₦${(differenceToFreeShipping / 100).toLocaleString('en-NG')} for complimentary shipping`}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, (totalKobo / freeShippingThresholdKobo) * 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* Items */}
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

          {/* Summary Box */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ITEMS IN BAG</Text>
              <Text style={styles.summaryVal}>
                {items.length} {items.length === 1 ? 'item' : 'items'}{totalItems > items.length ? ` (${totalItems} pcs)` : ''}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SUBTOTAL</Text>
              <Text style={styles.summaryVal}>{totalFormatted}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>DELIVERY</Text>
              <Text style={[styles.summaryVal, isFreeShipping && { color: THEME.colors.goldBright }]}>
                {isFreeShipping ? 'COMPLIMENTARY' : 'Calculated at Checkout'}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>ESTIMATED TOTAL</Text>
              <Text style={styles.totalVal}>{totalFormatted}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearCart} activeOpacity={0.8}>
              <Text style={styles.clearBtnText}>CLEAR BAG</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkoutBtn} onPress={onOpenCheckout} activeOpacity={0.85}>
              <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.ivory,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: THEME.colors.purpleDeep,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    color: THEME.colors.white,
    fontSize: 11,
    fontWeight: '500',
  },
  signInBtn: {
    backgroundColor: THEME.colors.purpleSurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  signInText: {
    color: THEME.colors.goldBright,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  shippingBar: {
    backgroundColor: THEME.colors.purpleSurface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  shippingText: {
    color: THEME.colors.goldBright,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.gold,
    borderRadius: 2,
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 6,
    backgroundColor: THEME.colors.cream,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
    flex: 1,
    marginRight: 8,
  },
  removeBtn: {
    padding: 4,
  },
  removeBtnText: {
    color: THEME.colors.grayText,
    fontSize: 14,
    fontWeight: '700',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.gold,
    marginTop: 2,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: THEME.colors.cream,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
    paddingHorizontal: 8,
  },
  summaryCard: {
    backgroundColor: THEME.colors.purpleSurface,
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: THEME.colors.grayText,
    letterSpacing: 1,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 12,
    color: THEME.colors.white,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.gold,
    letterSpacing: 1,
  },
  totalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.goldBright,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  clearBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: THEME.colors.grayText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  checkoutBtn: {
    flex: 1,
    backgroundColor: THEME.colors.gold,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: THEME.colors.purpleInk,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
    fontFamily: THEME.fonts.serif,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.grayText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  shopNowBtn: {
    backgroundColor: THEME.colors.purpleDeep,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  shopNowBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
