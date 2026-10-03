import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { CatalogScreen } from './src/screens/CatalogScreen';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar barStyle="light-content" backgroundColor="#241441" />
        <CatalogScreen />
      </CartProvider>
    </AuthProvider>
  );
}
