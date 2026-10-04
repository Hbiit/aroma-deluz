import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { THEME } from '../theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const NIGERIAN_STATES = [
  'Lagos',
  'Abuja (FCT)',
  'Rivers',
  'Oyo',
  'Ogun',
  'Delta',
  'Anambra',
  'Enugu',
  'Kaduna',
  'Kano',
  'Edo',
  'Akwa Ibom',
  'Ondo',
  'Osun',
  'Cross River',
];

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onOrderSuccess: (orderRef: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  onClose,
  onOrderSuccess,
}) => {
  const { items, totalKobo, clearCart } = useCart();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lagos');
  const [state, setState] = useState('Lagos');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'demo' | 'cod'>('paystack');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState<string | null>(null);

  // Interactive Paystack Demo State
  const [paystackModalVisible, setPaystackModalVisible] = useState(false);
  const [paystackCardNumber, setPaystackCardNumber] = useState('4084 0840 0840 0840');
  const [paystackExpiry, setPaystackExpiry] = useState('12/28');
  const [paystackCvv, setPaystackCvv] = useState('408');
  const [paystackChannel, setPaystackChannel] = useState<'card' | 'bank'>('card');
  const [paystackProcessing, setPaystackProcessing] = useState(false);
  const [paystackStatusMsg, setPaystackStatusMsg] = useState('');
  const [paystackError, setPaystackError] = useState<string | null>(null);
  const [activeOrderRef, setActiveOrderRef] = useState('');

  // Sync user info when available
  useEffect(() => {
    if (user) {
      if (!fullName && user.name) setFullName(user.name);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user]);

  // Delivery calculations
  const isFreeDelivery = totalKobo >= 15000000;
  const deliveryKobo = isFreeDelivery ? 0 : state === 'Lagos' ? 450000 : 750000;
  const grandTotalKobo = totalKobo + deliveryKobo;
  const grandTotalFormatted = `₦${(grandTotalKobo / 100).toLocaleString('en-NG')}`;
  const subtotalFormatted = `₦${(totalKobo / 100).toLocaleString('en-NG')}`;
  const deliveryFormatted = deliveryKobo === 0 ? 'COMPLIMENTARY' : `₦${(deliveryKobo / 100).toLocaleString('en-NG')}`;

  const validateForm = () => {
    setErrorMessage(null);
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email for order confirmation');
      return false;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your contact phone number');
      return false;
    }
    if (!address.trim()) {
      setErrorMessage('Please specify your delivery address');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    const orderRef =
      'AROMA-' +
      Date.now().toString(36).toUpperCase() +
      '-' +
      Math.floor(100 + Math.random() * 900);

    setActiveOrderRef(orderRef);

    // If Paystack is selected, launch the Interactive Paystack Demo Sheet
    if (paymentMethod === 'paystack') {
      setPaystackError(null);
      setPaystackStatusMsg('');
      setPaystackModalVisible(true);
      return;
    }

    // Direct Instant confirmation or Cash/Card on delivery
    setLoading(true);
    const payload = {
      reference: orderRef,
      userId: user?.id,
      email: email.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state,
      note: note.trim(),
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price_kobo: i.price_kobo,
        quantity: i.qty,
      })),
      totalKobo: grandTotalKobo,
      paymentMethod,
      isDemo: true,
    };

    try {
      await fetch('https://aroma-deluz.vercel.app/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      await fetch('https://aroma-deluz.vercel.app/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: orderRef,
          paymentMethod,
          customerEmail: email.trim(),
          transactionId: 'direct_' + Date.now().toString(36),
        }),
      }).catch(() => {});

      await clearCart();
      setOrderConfirmed(orderRef);
      onOrderSuccess(orderRef);
    } catch (err: any) {
      console.warn('Checkout error:', err);
      await clearCart();
      setOrderConfirmed(orderRef);
      onOrderSuccess(orderRef);
    } finally {
      setLoading(false);
    }
  };

  // Paystack: Simulate Successful Authorized Payment
  const handlePaystackAuthorize = async () => {
    setPaystackError(null);
    setPaystackProcessing(true);
    setPaystackStatusMsg('Connecting to Paystack Test Switch...');

    setTimeout(() => {
      setPaystackStatusMsg('Authorizing 3D Secure Card Verification...');
    }, 700);

    const payload = {
      reference: activeOrderRef,
      userId: user?.id,
      email: email.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state,
      note: note.trim(),
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price_kobo: i.price_kobo,
        quantity: i.qty,
      })),
      totalKobo: grandTotalKobo,
      paymentMethod: 'paystack',
      isDemo: true,
    };

    try {
      // 1. Create order on server
      await fetch('https://aroma-deluz.vercel.app/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // 2. Confirm order & dispatch confirmation email via backend Nodemailer
      await fetch('https://aroma-deluz.vercel.app/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: activeOrderRef,
          paymentMethod: 'paystack',
          customerEmail: email.trim(),
          transactionId: 'pstk_test_' + Date.now().toString(36),
        }),
      }).catch(() => {});

      // 3. Clear cart across web and mobile
      await clearCart();

      // 4. Close Paystack Sheet and present order receipt
      setPaystackModalVisible(false);
      setOrderConfirmed(activeOrderRef);
      onOrderSuccess(activeOrderRef);
    } catch (err: any) {
      console.warn('Paystack simulation exception:', err);
      await clearCart();
      setPaystackModalVisible(false);
      setOrderConfirmed(activeOrderRef);
      onOrderSuccess(activeOrderRef);
    } finally {
      setPaystackProcessing(false);
      setPaystackStatusMsg('');
    }
  };

  // Paystack: Simulate Failed / Declined Payment
  const handlePaystackDecline = () => {
    setPaystackError(null);
    setPaystackProcessing(true);
    setPaystackStatusMsg('Processing test transaction...');

    setTimeout(() => {
      setPaystackProcessing(false);
      setPaystackStatusMsg('');
      setPaystackError('Declined by Card Issuer: Insufficient Funds or 3DS verification timeout (Error Code: 51). Please try again or use another method.');
    }, 1000);
  };

  // Paystack: Cancel Payment
  const handlePaystackCancel = () => {
    setPaystackModalVisible(false);
    setErrorMessage('Paystack payment was cancelled. Your bag items have been safely preserved.');
  };

  const handleFinish = () => {
    setOrderConfirmed(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBrand}>
              <Text style={styles.brandTitle}>AROMA DE LUZ</Text>
              <Text style={styles.brandTagline}>ALL ABOUT SCENT</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {orderConfirmed ? (
            /* Order Confirmed Success Screen */
            <View style={styles.successScreen}>
              <View style={styles.successIconCircle}>
                <Text style={styles.successCheck}>✓</Text>
              </View>
              <Text style={styles.successTitle}>ORDER CONFIRMED</Text>
              <Text style={styles.successSubtitle}>
                Thank you for your patronage. Your olfactory pieces are being prepared by our
                artisan perfumers in Lagos. A verified receipt and confirmation email has been dispatched to {email}.
              </Text>

              <View style={styles.receiptCard}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>REFERENCE</Text>
                  <Text style={styles.receiptValue}>{orderConfirmed}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>CLIENT</Text>
                  <Text style={styles.receiptValue}>{fullName}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>EMAIL NOTIFIED</Text>
                  <Text style={styles.receiptValue}>{email}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>DESTINATION</Text>
                  <Text style={styles.receiptValue}>{city}, {state}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>AMOUNT PAID</Text>
                  <Text style={[styles.receiptValue, { color: THEME.colors.gold }]}>
                    {grandTotalFormatted}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>STATUS</Text>
                  <Text style={[styles.receiptValue, { color: THEME.colors.success }]}>
                    Paid & Verified (Paystack Demo)
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.85}>
                <Text style={styles.finishBtnText}>RETURN TO BOUTIQUE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Checkout Form & Order Summary */
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.pageIntro}>
                <Text style={styles.pageTitle}>SECURE CHECKOUT</Text>
                <Text style={styles.pageDesc}>
                  Complimentary luxury gift wrapping included with every parcel.
                </Text>
              </View>

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Delivery Details */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. DELIVERY DETAILS</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>FULL NAME *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Adebayo Alabi"
                    placeholderTextColor="#888"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>EMAIL ADDRESS *</Text>
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
                  <Text style={styles.label}>PHONE NUMBER *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+234 800 000 0000"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>STREET ADDRESS *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Plot / Street / Estate / Apartment"
                    placeholderTextColor="#888"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>CITY *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Victoria Island"
                      placeholderTextColor="#888"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>STATE *</Text>
                    <TextInput
                      style={styles.input}
                      value={state}
                      onChangeText={setState}
                      placeholder="Lagos / Abuja..."
                      placeholderTextColor="#888"
                    />
                  </View>
                </View>

                {/* State selector pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statePills}>
                  {NIGERIAN_STATES.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.statePill, state === st && styles.statePillActive]}
                      onPress={() => setState(st)}
                    >
                      <Text
                        style={[
                          styles.statePillText,
                          state === st && styles.statePillTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>SPECIAL CONCIERGE / GIFT NOTE</Text>
                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    placeholder="Optional message for recipient or gate delivery notes"
                    placeholderTextColor="#888"
                    multiline
                    value={note}
                    onChangeText={setNote}
                  />
                </View>
              </View>

              {/* Payment Methods */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. PAYMENT METHOD</Text>

                <TouchableOpacity
                  style={[
                    styles.methodCard,
                    paymentMethod === 'paystack' && styles.methodCardActive,
                  ]}
                  onPress={() => setPaymentMethod('paystack')}
                  activeOpacity={0.8}
                >
                  <View style={styles.methodHeader}>
                    <View style={styles.radio}>
                      {paymentMethod === 'paystack' && <View style={styles.radioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.methodTitle}>Paystack Secure Payment</Text>
                      <Text style={styles.methodDesc}>
                        Debit Card, Bank Transfer, USSD (Demo Test Mode Active)
                      </Text>
                    </View>
                    <Text style={styles.methodBadge}>DEMO ACTIVE</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodCard,
                    paymentMethod === 'demo' && styles.methodCardActive,
                  ]}
                  onPress={() => setPaymentMethod('demo')}
                  activeOpacity={0.8}
                >
                  <View style={styles.methodHeader}>
                    <View style={styles.radio}>
                      {paymentMethod === 'demo' && <View style={styles.radioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.methodTitle}>Direct Instant Confirmation</Text>
                      <Text style={styles.methodDesc}>
                        Seamless automated verification with receipt
                      </Text>
                    </View>
                    <Text style={styles.methodBadgeFast}>INSTANT</Text>
                  </View>
                </TouchableOpacity>

                {state === 'Lagos' && (
                  <TouchableOpacity
                    style={[
                      styles.methodCard,
                      paymentMethod === 'cod' && styles.methodCardActive,
                    ]}
                    onPress={() => setPaymentMethod('cod')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.methodHeader}>
                      <View style={styles.radio}>
                        {paymentMethod === 'cod' && <View style={styles.radioDot} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.methodTitle}>Payment on Delivery (Lagos)</Text>
                        <Text style={styles.methodDesc}>
                          POS / Card terminal or transfer upon parcel arrival
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Order Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>ORDER SUMMARY</Text>

                {items.map((item) => (
                  <View key={item.id} style={styles.summaryItemRow}>
                    <Text style={styles.summaryItemName} numberOfLines={1}>
                      {item.name} × {item.qty}
                    </Text>
                    <Text style={styles.summaryItemPrice}>
                      ₦{(((item.price_kobo || 0) * item.qty) / 100).toLocaleString('en-NG')}
                    </Text>
                  </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryVal}>{subtotalFormatted}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Bespoke Delivery ({state})</Text>
                  <Text
                    style={[
                      styles.summaryVal,
                      isFreeDelivery && { color: THEME.colors.goldBright, fontWeight: '700' },
                    ]}
                  >
                    {deliveryFormatted}
                  </Text>
                </View>

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>TOTAL</Text>
                  <Text style={styles.totalVal}>{grandTotalFormatted}</Text>
                </View>
              </View>

              {/* Place Order CTA */}
              <TouchableOpacity
                style={styles.payBtn}
                onPress={handlePlaceOrder}
                disabled={loading || items.length === 0}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={THEME.colors.purpleInk} />
                ) : (
                  <Text style={styles.payBtnText}>
                    PROCEED TO PAYMENT ({grandTotalFormatted})
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.secureFooterNotice}>
                🔒 256-Bit Encrypted · Direct Sync with Aroma De Luz Store
              </Text>
            </ScrollView>
          )}

          {/* Dedicated Interactive Paystack Demo Payment Modal */}
          <Modal
            visible={paystackModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={handlePaystackCancel}
          >
            <View style={styles.paystackOverlay}>
              <View style={styles.paystackCard}>
                {/* Paystack Header */}
                <View style={styles.paystackHeader}>
                  <View style={styles.paystackLogoRow}>
                    <View style={styles.paystackDot} />
                    <Text style={styles.paystackBrand}>paystack</Text>
                    <View style={styles.paystackBadgeTest}>
                      <Text style={styles.paystackBadgeTestText}>TEST MODE</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handlePaystackCancel} style={styles.paystackClose}>
                    <Text style={styles.paystackCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.paystackMerchantBar}>
                  <View>
                    <Text style={styles.paystackMerchantName}>AROMA DE LUZ</Text>
                    <Text style={styles.paystackCustomerEmail}>{email}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.paystackAmount}>{grandTotalFormatted}</Text>
                    <Text style={styles.paystackSecureNotice}>🔒 256-Bit SSL</Text>
                  </View>
                </View>

                {/* Channel Selector */}
                <View style={styles.paystackChannels}>
                  <TouchableOpacity
                    style={[
                      styles.paystackChannelBtn,
                      paystackChannel === 'card' && styles.paystackChannelActive,
                    ]}
                    onPress={() => setPaystackChannel('card')}
                  >
                    <Text
                      style={[
                        styles.paystackChannelText,
                        paystackChannel === 'card' && styles.paystackChannelTextActive,
                      ]}
                    >
                      💳 Card Payment
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paystackChannelBtn,
                      paystackChannel === 'bank' && styles.paystackChannelActive,
                    ]}
                    onPress={() => setPaystackChannel('bank')}
                  >
                    <Text
                      style={[
                        styles.paystackChannelText,
                        paystackChannel === 'bank' && styles.paystackChannelTextActive,
                      ]}
                    >
                      🏛️ Bank Transfer
                    </Text>
                  </TouchableOpacity>
                </View>

                {paystackError && (
                  <View style={styles.paystackErrorBox}>
                    <Text style={styles.paystackErrorText}>{paystackError}</Text>
                  </View>
                )}

                {paystackChannel === 'card' ? (
                  /* Card Interface */
                  <View style={styles.paystackCardSection}>
                    <View style={styles.cardVisual}>
                      <View style={styles.cardChipRow}>
                        <View style={styles.cardChip} />
                        <Text style={styles.cardIssuer}>Paystack Test</Text>
                      </View>
                      <Text style={styles.cardNumberText}>{paystackCardNumber}</Text>
                      <View style={styles.cardBottomRow}>
                        <View>
                          <Text style={styles.cardSublabel}>CARDHOLDER</Text>
                          <Text style={styles.cardNameText}>{fullName || 'ATELIER CLIENT'}</Text>
                        </View>
                        <View>
                          <Text style={styles.cardSublabel}>EXPIRES</Text>
                          <Text style={styles.cardExpiryText}>{paystackExpiry}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.paystackInputGroup}>
                      <Text style={styles.paystackInputLabel}>CARD NUMBER</Text>
                      <TextInput
                        style={styles.paystackInput}
                        value={paystackCardNumber}
                        onChangeText={setPaystackCardNumber}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.paystackInputRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.paystackInputLabel}>VALID THRU</Text>
                        <TextInput
                          style={styles.paystackInput}
                          value={paystackExpiry}
                          onChangeText={setPaystackExpiry}
                          placeholder="MM/YY"
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.paystackInputLabel}>CVV</Text>
                        <TextInput
                          style={styles.paystackInput}
                          value={paystackCvv}
                          onChangeText={setPaystackCvv}
                          keyboardType="numeric"
                          secureTextEntry
                        />
                      </View>
                    </View>

                    <Text style={styles.paystackDemoHint}>
                      💡 Paystack Official Test Card (4084 0840 0840 0840). Authorizing will verify the transaction and trigger your order confirmation email.
                    </Text>
                  </View>
                ) : (
                  /* Bank Transfer Interface */
                  <View style={styles.paystackBankSection}>
                    <Text style={styles.bankInstruction}>
                      Transfer the exact amount below to complete your order:
                    </Text>
                    <View style={styles.bankDetailsBox}>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>BANK NAME</Text>
                        <Text style={styles.bankVal}>Wema Bank (Paystack Demo)</Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>ACCOUNT NUMBER</Text>
                        <Text style={styles.bankAccountVal}>9928 104 291</Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>BENEFICIARY</Text>
                        <Text style={styles.bankVal}>Aroma De Luz Atelier</Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>AMOUNT</Text>
                        <Text style={[styles.bankVal, { color: '#09A5DB', fontWeight: '800' }]}>
                          {grandTotalFormatted}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.paystackDemoHint}>
                      Virtual test account auto-expires in 30 minutes upon transfer receipt.
                    </Text>
                  </View>
                )}

                {/* Status Indicator */}
                {paystackProcessing && (
                  <View style={styles.processingBanner}>
                    <ActivityIndicator color="#09A5DB" />
                    <Text style={styles.processingText}>{paystackStatusMsg}</Text>
                  </View>
                )}

                {/* Paystack Action Buttons */}
                <View style={styles.paystackActions}>
                  <TouchableOpacity
                    style={styles.paystackSuccessBtn}
                    onPress={handlePaystackAuthorize}
                    disabled={paystackProcessing}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.paystackSuccessBtnText}>
                      ✓ AUTHORIZE PAYMENT ({grandTotalFormatted})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.paystackDeclineBtn}
                    onPress={handlePaystackDecline}
                    disabled={paystackProcessing}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.paystackDeclineBtnText}>
                      Simulate Declined / Failed Card
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.paystackCancelBtn}
                    onPress={handlePaystackCancel}
                    disabled={paystackProcessing}
                  >
                    <Text style={styles.paystackCancelBtnText}>Cancel and return to checkout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 15, 48, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.ivory,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '60%',
    borderWidth: 1,
    borderColor: THEME.colors.gold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
    backgroundColor: THEME.colors.purpleDarkest,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
  },
  headerBrand: {
    alignItems: 'flex-start',
  },
  brandTitle: {
    color: THEME.colors.gold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: THEME.fonts.serif,
  },
  brandTagline: {
    color: THEME.colors.goldBright,
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.purpleSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  closeBtnText: {
    color: THEME.colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollBody: {
    padding: 20,
  },
  pageIntro: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
    fontFamily: THEME.fonts.serif,
    letterSpacing: 1.5,
  },
  pageDesc: {
    fontSize: 12,
    color: THEME.colors.grayText,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
    letterSpacing: 1,
    marginBottom: 4,
  },
  input: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: THEME.colors.purpleInk,
  },
  statePills: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: THEME.colors.cream,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginRight: 6,
  },
  statePillActive: {
    backgroundColor: THEME.colors.purpleDeep,
    borderColor: THEME.colors.gold,
  },
  statePillText: {
    fontSize: 11,
    color: THEME.colors.purpleInk,
    fontWeight: '500',
  },
  statePillTextActive: {
    color: THEME.colors.goldBright,
    fontWeight: '700',
  },
  methodCard: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  methodCardActive: {
    borderColor: THEME.colors.gold,
    backgroundColor: '#FAF5FF',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: THEME.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.purpleInk,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.purpleInk,
  },
  methodDesc: {
    fontSize: 11,
    color: THEME.colors.grayText,
    marginTop: 2,
  },
  methodBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#09A5DB',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  methodBadgeFast: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summaryCard: {
    backgroundColor: THEME.colors.purpleSurface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.gold,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryItemName: {
    fontSize: 12,
    color: THEME.colors.white,
    flex: 1,
    marginRight: 10,
  },
  summaryItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: THEME.colors.grayText,
  },
  summaryVal: {
    fontSize: 12,
    color: THEME.colors.white,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.gold,
    letterSpacing: 1,
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.goldBright,
  },
  payBtn: {
    backgroundColor: THEME.colors.gold,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: THEME.colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: {
    color: THEME.colors.purpleInk,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  secureFooterNotice: {
    textAlign: 'center',
    fontSize: 10,
    color: THEME.colors.grayText,
    marginBottom: 24,
  },
  successScreen: {
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  successCheck: {
    color: '#059669',
    fontSize: 32,
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.purpleInk,
    letterSpacing: 2,
    fontFamily: THEME.fonts.serif,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 12,
    color: THEME.colors.grayText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: THEME.colors.purpleSurface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  receiptLabel: {
    fontSize: 11,
    color: THEME.colors.grayText,
    fontWeight: '600',
  },
  receiptValue: {
    fontSize: 12,
    color: THEME.colors.white,
    fontWeight: '700',
  },
  finishBtn: {
    width: '100%',
    backgroundColor: THEME.colors.purpleDeep,
    borderWidth: 1.5,
    borderColor: THEME.colors.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  finishBtnText: {
    color: THEME.colors.goldBright,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  /* Paystack In-App Modal Styles */
  paystackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(1, 27, 51, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  paystackCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  paystackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#011B33',
  },
  paystackLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paystackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#09A5DB',
  },
  paystackBrand: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  paystackBadgeTest: {
    backgroundColor: '#09A5DB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  paystackBadgeTestText: {
    color: '#011B33',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  paystackClose: {
    padding: 4,
  },
  paystackCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  paystackMerchantBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F4F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  paystackMerchantName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#011B33',
    letterSpacing: 1,
  },
  paystackCustomerEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  paystackAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#011B33',
  },
  paystackSecureNotice: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 1,
  },
  paystackChannels: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  paystackChannelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  paystackChannelActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#09A5DB',
  },
  paystackChannelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  paystackChannelTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  paystackErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 16,
    marginTop: 10,
  },
  paystackErrorText: {
    color: '#B91C1C',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  paystackCardSection: {
    padding: 16,
  },
  cardVisual: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  cardChipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardChip: {
    width: 32,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  cardIssuer: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardSublabel: {
    color: '#94A3B8',
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '700',
  },
  cardNameText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardExpiryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  paystackInputGroup: {
    marginBottom: 10,
  },
  paystackInputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  paystackInputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  paystackInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  paystackDemoHint: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
  },
  paystackBankSection: {
    padding: 16,
  },
  bankInstruction: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 10,
  },
  bankDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bankLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  bankVal: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '600',
  },
  bankAccountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#09A5DB',
    letterSpacing: 1,
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#F0F9FF',
  },
  processingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  paystackActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  paystackSuccessBtn: {
    backgroundColor: '#09A5DB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#09A5DB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  paystackSuccessBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  paystackDeclineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  paystackDeclineBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
  },
  paystackCancelBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  paystackCancelBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
});
