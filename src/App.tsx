import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import CustomerRegistration from "@/pages/CustomerRegistration";
import QuizPage from "@/pages/QuizPage";
import ThankYou from "@/pages/ThankYou";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="quiz-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CustomerRegistration />} />
          <Route path="/quiz/:quizId" element={<QuizPage />} />
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