import { lazy, Suspense, useState, useCallback } from 'react';
import { AuthProvider } from './lib/auth';
import { DataProvider } from './lib/data';
import { StoreProvider } from './store/StoreContext';
import { RouterProvider, Routes, Route } from './lib/router';
import { ToastProvider } from './components/Toast';
import { SplashScreen } from './components/SplashScreen';
import { BottomNav } from './components/BottomNav';
import { RippleEffect } from './components/RippleEffect';
import { PWAUpdateBanner } from './components/PWAUpdateBanner';
import { PageSkeleton, ListPageSkeleton } from './components/Skeleton';
import { ErrorBoundary } from './components/ErrorBoundary';

// Route-based code splitting — each page is a separate chunk
const HomePage               = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const CategoriesPage         = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const ProductDetailPage      = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage               = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage           = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage       = lazy(() => import('./pages/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const OrdersPage             = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const WishlistPage           = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const ProfilePage            = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LoginPage              = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignUpPage             = lazy(() => import('./pages/SignUpPage').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage     = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const EditProfilePage        = lazy(() => import('./pages/EditProfilePage').then(m => ({ default: m.EditProfilePage })));
const AddressesPage          = lazy(() => import('./pages/AddressesPage').then(m => ({ default: m.AddressesPage })));
const NotificationsPage      = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const CouponsPage            = lazy(() => import('./pages/CouponsPage').then(m => ({ default: m.CouponsPage })));
const SettingsPage           = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SearchPage             = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const PaymentPage            = lazy(() => import('./pages/PaymentPage').then(m => ({ default: m.PaymentPage })));
const TransactionHistoryPage = lazy(() => import('./pages/TransactionHistoryPage').then(m => ({ default: m.TransactionHistoryPage })));
const ContactPage            = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const PrivacyPolicyPage      = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage              = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const RefundPolicyPage       = lazy(() => import('./pages/RefundPolicyPage').then(m => ({ default: m.RefundPolicyPage })));
const NotFoundPage           = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

function CustomerShell() {
  return (
    <div className="min-h-screen bg-mia-black">
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/"                element={<HomePage />} />
            <Route path="/categories"      element={<CategoriesPage />} />
            <Route path="/product/:id"     element={<ProductDetailPage />} />
            <Route path="/cart"            element={<CartPage />} />
            <Route path="/checkout"        element={<CheckoutPage />} />
            <Route path="/order-success"   element={<OrderSuccessPage />} />
            <Route path="/orders"          element={<Suspense fallback={<ListPageSkeleton />}><OrdersPage /></Suspense>} />
            <Route path="/wishlist"        element={<Suspense fallback={<ListPageSkeleton />}><WishlistPage /></Suspense>} />
            <Route path="/profile"         element={<Suspense fallback={<ListPageSkeleton />}><ProfilePage /></Suspense>} />
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/signup"          element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/edit-profile"    element={<Suspense fallback={<ListPageSkeleton />}><EditProfilePage /></Suspense>} />
            <Route path="/addresses"       element={<Suspense fallback={<ListPageSkeleton />}><AddressesPage /></Suspense>} />
            <Route path="/notifications"   element={<Suspense fallback={<ListPageSkeleton />}><NotificationsPage /></Suspense>} />
            <Route path="/coupons"         element={<Suspense fallback={<ListPageSkeleton />}><CouponsPage /></Suspense>} />
            <Route path="/settings"        element={<Suspense fallback={<ListPageSkeleton />}><SettingsPage /></Suspense>} />
            <Route path="/search"          element={<SearchPage />} />
            <Route path="/payment"         element={<Suspense fallback={<ListPageSkeleton />}><PaymentPage /></Suspense>} />
            <Route path="/transactions"    element={<Suspense fallback={<ListPageSkeleton />}><TransactionHistoryPage /></Suspense>} />
            <Route path="/contact"         element={<Suspense fallback={<ListPageSkeleton />}><ContactPage /></Suspense>} />
            <Route path="/privacy-policy"  element={<Suspense fallback={<ListPageSkeleton />}><PrivacyPolicyPage /></Suspense>} />
            <Route path="/terms"           element={<Suspense fallback={<ListPageSkeleton />}><TermsPage /></Suspense>} />
            <Route path="/refund-policy"   element={<Suspense fallback={<ListPageSkeleton />}><RefundPolicyPage /></Suspense>} />
            <Route path="*"               element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <PWAUpdateBanner />
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
