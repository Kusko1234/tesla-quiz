import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";
import CustomerRegistration from "@/pages/CustomerRegistration";
import QuizPage from "@/pages/QuizPage";
import ThankYou from "@/pages/ThankYou";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { setupSyncListener, syncOfflineSubmissions } from "@/lib/sync-service";

function App() {
  useEffect(() => {
    // Register Service Worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed:', err));
    }

    // Setup sync listener
    setupSyncListener();

    // Try to sync on app load if online
    if (navigator.onLine) {
      syncOfflineSubmissions();
    }
  }, []);
  return (
    <ThemeProvider defaultTheme="light" storageKey="quiz-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<CustomerRegistration />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;