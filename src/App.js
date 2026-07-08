import React, { useState, Suspense, lazy, Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

/* Context providers */
import { LanguageProvider } from './locales/LanguageContext';
import { ThemeProvider }  from './context/ThemeContext';
import { AuthProvider }   from './auth/AuthContext';
import { CartProvider }   from './store/CartContext';

/* Guards */
import PrivateRoute from './components/PrivateRoute';
import AdminRoute   from './components/AdminRoute';

/* Components */
import LoadingScreen from './components/LoadingScreen';

/* Lazy loaded pages */
const Landing       = lazy(() => import('./portfolio/Landing'));
const UnifiedAdmin   = lazy(() => import('./admin/UnifiedAdmin'));
const Signin        = lazy(() => import('./auth/Signin'));
const Signup        = lazy(() => import('./auth/Signup'));
const VerifyEmail   = lazy(() => import('./auth/VerifyEmail'));
const ResetPassword = lazy(() => import('./auth/ResetPassword'));
const ThreeDService = lazy(() => import('./3d/Index'));
const ProjectList   = lazy(() => import('./project/Index'));
const ProjectDetail = lazy(() => import('./project/ProjectDetail'));
const Storefront    = lazy(() => import('./store/Storefront'));
const ProductDetail = lazy(() => import('./store/ProductDetail'));
const Cart          = lazy(() => import('./store/Cart'));
const Profile       = lazy(() => import('./store/Profile'));
const Terms         = lazy(() => import('./store/Terms'));
const Eula          = lazy(() => import('./store/Eula'));
const Track         = lazy(() => import('./store/Track'));
const NotFound      = lazy(() => import('./components/NotFound'));
const MemberProfile = lazy(() => import('./portfolio/MemberProfile'));

import Navbar        from './components/Navbar';
import { useLocation } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', background: '#0a0a0a', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#d4a017' }}>Something went wrong.</h2>
          <p style={{ color: '#ccc', maxWidth: '500px' }}>
            We've encountered an unexpected error. Please refresh the page or contact support if the issue persists.
          </p>
          {this.state.error && (
            <pre style={{ background: '#1a1a1a', border: '1px solid #333', padding: '15px', color: '#ff4a4a', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: '600px', marginTop: '20px' }}>
              {this.state.error.toString()}
            </pre>
          )}
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', background: '#d4a017', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function NavigationWrapper() {
  const location = useLocation();
  const hideNavbar = ['/signin', '/signup', '/verify-email', '/reset-password', '/admin'].some(p => location.pathname.startsWith(p));
  return !hideNavbar ? <Navbar /> : null;
}

export default function App() {
  const [appReady, setAppReady] = useState(false);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <Router>
            <AuthProvider>
              <CartProvider>
              {!appReady && <LoadingScreen onDone={() => setAppReady(true)} />}

              <div style={{ visibility: appReady ? 'visible' : 'hidden' }}>
                <a href="#main-content" className="sr-only" style={{ position: 'absolute', top: 0, left: 0, zIndex: 99999 }}>
                  Skip to content
                </a>
                <NavigationWrapper />
                <div id="main-content">
                  <Suspense fallback={
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh' }}>
                      <div className="spinner" />
                    </div>
                  }>
                  <Routes>
                  {/* ── Portfolio ── */}
                  <Route path="/"      element={<Landing />} />

                  {/* ── Auth (universal) ── */}
                  <Route path="/signin" element={<Signin />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* ── Services (Placeholders) ── */}
                  <Route path="/3d"       element={<ThreeDService />} />
                  <Route path="/services/3d-printing" element={<ThreeDService />} />
                  <Route path="/project"          element={<ProjectList />} />
                  <Route path="/project/:id"      element={<ProjectDetail />} />
                  <Route path="/projects/:id"     element={<ProjectDetail />} />

                  {/* ── Unified Admin Console ── */}
                  <Route
                    path="/admin/*"
                    element={
                      <AdminRoute>
                        <UnifiedAdmin />
                      </AdminRoute>
                    }
                  />

                  {/* ── Store ── */}
                  <Route path="/store"              element={<Storefront />} />
                  <Route path="/store/product/:id"  element={<ProductDetail />} />
                  <Route path="/products/:id"       element={<ProductDetail />} />
                  <Route path="/store/terms"        element={<Terms />} />
                  <Route path="/store/eula"         element={<Eula />} />
                  <Route path="/store/track"        element={<Track />} />

                  <Route
                    path="/store/cart"
                    element={
                      <PrivateRoute>
                        <Cart />
                      </PrivateRoute>
                    }
                  />

                  <Route
                    path="/store/profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />



                  {/* ── Member Profile Card ── */}
                  <Route path="/:memberEndpoint" element={<MemberProfile />} />

                  {/* ── 404 ── */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
                </div>
              </div>
            </CartProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  </ErrorBoundary>
  );
}
