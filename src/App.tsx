import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/Layout/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { Landing } from "./pages/Landing";
import { Notifications } from "./pages/Notifications";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";
// Email verification artık gerekli değil
// import { EmailVerification } from "./pages/EmailVerification";
import { Terms } from "./pages/Terms";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ScrollToTop } from "./components/ScrollToTop";
import { useTokenRefresh } from "./hooks/useTokenRefresh";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 dakika
      gcTime: 10 * 60 * 1000, // 10 dakika (eski cacheTime)
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

const Profile = lazy(() =>
  import("./pages/Profile").then((m) => ({ default: m.Profile }))
);
const PredictionDetail = lazy(() =>
  import("./pages/PredictionDetail").then((m) => ({
    default: m.PredictionDetail,
  }))
);

const Predictions = lazy(() =>
  import("./pages/Predictions").then((m) => ({ default: m.Predictions }))
);
const DailyPosts = lazy(() =>
  import("./pages/DailyPosts").then((m) => ({ default: m.DailyPosts }))
);
const DailyPostDetail = lazy(() =>
  import("./pages/DailyPostDetail").then((m) => ({
    default: m.DailyPostDetail,
  }))
);
const Payments = lazy(() =>
  import("./pages/Payments").then((m) => ({ default: m.Payments }))
);
const Contact = lazy(() =>
  import("./pages/Contact").then((m) => ({ default: m.Contact }))
);
const AdminPanel = lazy(() =>
  import("./pages/AdminPanel").then((m) => ({ default: m.AdminPanel }))
);
const SuperAdminPanel = lazy(() =>
  import("./pages/SuperAdminPanel").then((m) => ({
    default: m.SuperAdminPanel,
  }))
);

function App() {
  useTokenRefresh();
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <ScrollToTop />
          <div className="App">
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-dark-900">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              }
            >
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* Email verification artık gerekli değil */}
                {/* <Route path="/verify-email" element={<EmailVerification />} /> */}

                {/* Protected routes */}
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />

                {/* Main app routes - with layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Home />} />

                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="prediction/:id" element={<PredictionDetail />} />
                  <Route path="predictions" element={<Predictions />} />
                  <Route path="daily-posts" element={<DailyPosts />} />
                  <Route path="daily-post/:id" element={<DailyPostDetail />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="admin" element={<AdminPanel />} />
                  <Route path="super-admin" element={<SuperAdminPanel />} />
                  <Route
                    path="settings"
                    element={
                      <div className="p-8">Ayarlar sayfası - Yakında</div>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                style: {
                  background: "#10B981",
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: "#EF4444",
                },
              },
            }}
          />
        </Router>
      </ErrorBoundary>
      {process.env.NODE_ENV !== "production" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;
