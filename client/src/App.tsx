import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Subscribe from "@/pages/Subscribe";
import Checkout from "@/pages/Checkout";
import JuiceChat from "@/pages/JuiceChat";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminLogin from "@/pages/Admin/Login";
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminProducts from "@/pages/Admin/Products";
import AdminOrders from "@/pages/Admin/Orders";
import AdminSubscriptions from "@/pages/Admin/Subscriptions";
import AdminProfile from "@/pages/Admin/Profile";

// Layout Components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/components/CartSidebar";

// Context Providers
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import { ChatAssistant } from "@/components/ChatAssistant";

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Header />}
      
      <main className="flex-grow">
        <Switch>
          {/* Customer Routes */}
          <Route path="/" component={Home} />
          <Route path="/shop" component={Shop} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/juice-chat" component={JuiceChat} />
          
          {/* Admin Routes */}
          <Route path="/admin" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/products" component={AdminProducts} />
          <Route path="/admin/orders" component={AdminOrders} />
          <Route path="/admin/subscriptions" component={AdminSubscriptions} />
          <Route path="/admin/profile" component={AdminProfile} />
          
          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </main>
      
      {!isAdminRoute && (
        <>
          <Footer />
          <CartSidebar />
          <ChatAssistant />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground" key={Date.now()}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <Router />
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
