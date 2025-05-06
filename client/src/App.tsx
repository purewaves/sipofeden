import React, { Suspense, lazy } from "react";
import { Route, Router, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ToastProvider, SimpleToaster } from "./components/ui/toast-simple";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminJuices from "./pages/AdminJuices";
import AdminOrders from "./pages/AdminOrders";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import AdminLayout from "./components/admin/AdminLayout";
import LoadingSpinner from "./components/ui/loading-spinner";

// Lazy loaded components
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Bundle = lazy(() => import("./pages/Bundle"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const AdminSubscriptions = lazy(() => import("./pages/AdminSubscriptions"));
const AdminBundles = lazy(() => import("./pages/AdminBundles"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          {/* Main Layout Routes */}
          <Route path="/">
            <Layout>
              <Home />
            </Layout>
          </Route>
          
          <Route path="/shop">
            <Layout>
              <Shop />
            </Layout>
          </Route>
          
          <Route path="/shop/:id">
            {(params) => (
              <Layout>
                <ProductDetail id={parseInt(params.id)} />
              </Layout>
            )}
          </Route>
          
          <Route path="/cart">
            <Layout>
              <Cart />
            </Layout>
          </Route>
          
          <Route path="/checkout">
            <Layout>
              <Checkout />
            </Layout>
          </Route>
          
          <Route path="/order-success/:id">
            {(params) => (
              <Layout>
                <Suspense fallback={<LoadingSpinner size="large" />}>
                  <OrderSuccess orderId={parseInt(params.id)} />
                </Suspense>
              </Layout>
            )}
          </Route>
          
          <Route path="/subscriptions">
            <Layout>
              <Suspense fallback={<LoadingSpinner size="large" />}>
                <Subscriptions />
              </Suspense>
            </Layout>
          </Route>
          
          <Route path="/bundle">
            <Layout>
              <Suspense fallback={<LoadingSpinner size="large" />}>
                <Bundle />
              </Suspense>
            </Layout>
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin">
            <Admin />
          </Route>
          
          <Route path="/admin/dashboard">
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </Route>
          
          <Route path="/admin/juices">
            <AdminLayout>
              <AdminJuices />
            </AdminLayout>
          </Route>
          
          <Route path="/admin/orders">
            <AdminLayout>
              <AdminOrders />
            </AdminLayout>
          </Route>
          
          <Route path="/admin/subscriptions">
            <AdminLayout>
              <Suspense fallback={<LoadingSpinner size="large" />}>
                <AdminSubscriptions />
              </Suspense>
            </AdminLayout>
          </Route>
          
          <Route path="/admin/bundles">
            <AdminLayout>
              <Suspense fallback={<LoadingSpinner size="large" />}>
                <AdminBundles />
              </Suspense>
            </AdminLayout>
          </Route>
          
          <Route path="/admin/customers">
            <AdminLayout>
              <Suspense fallback={<LoadingSpinner size="large" />}>
                <AdminCustomers />
              </Suspense>
            </AdminLayout>
          </Route>
          
          <Route path="/admin/settings">
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </Route>
          
          {/* 404 Page */}
          <Route path="/:rest*">
            <Layout>
              <NotFound />
            </Layout>
          </Route>
        </Router>
        <SimpleToaster />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
