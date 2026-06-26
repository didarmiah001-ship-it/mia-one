import { useState, useCallback } from 'react';
import { AuthProvider } from './lib/auth';
import { DataProvider } from './lib/data';
import { StoreProvider } from './store/StoreContext';
import { RouterProvider, Routes, Route } from './lib/router';
import { ToastProvider } from './components/Toast';
import { SplashScreen } from './components/SplashScreen';
import { BottomNav } from './components/BottomNav';
import { RippleEffect } from './components/RippleEffect';
import { MiaAgent } from './components/MiaAgent';
import { HomePage } from './pages/HomePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { EditProfilePage } from './pages/EditProfilePage';
import { AddressesPage } from './pages/AddressesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { CouponsPage } from './pages/CouponsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SearchPage } from './pages/SearchPage';
import { PaymentPage } from './pages/PaymentPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';

function CustomerShell() {
  return (
    <div className="min-h-screen bg-mia-black">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/addresses" element={<AddressesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/coupons" element={<CouponsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/transactions" element={<TransactionHistoryPage />} />
      </Routes>
      <MiaAgent />
      <BottomNav />
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <AuthProvider>
      <DataProvider>
        <StoreProvider>
          <RouterProvider>
            <ToastProvider>
              <RippleEffect />
              <CustomerShell />
            </ToastProvider>
          </RouterProvider>
        </StoreProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
