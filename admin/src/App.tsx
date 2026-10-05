import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, ProtectedRoute } from "./lib/auth";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import BoardPage from "./pages/BoardPage";
import PortfolioPage from "./pages/PortfolioPage";
import CaseStudiesPage from "./pages/CaseStudiesPage";
import CaseStudyEditorPage from "./pages/CaseStudyEditorPage";
import BlogPage from "./pages/BlogPage";
import BlogEditorPage from "./pages/BlogEditorPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import ClientsPage from "./pages/ClientsPage";
import CategoriesPage from "./pages/CategoriesPage";
import IdentityPage from "./pages/IdentityPage";
import SettingsPage from "./pages/SettingsPage";
import SeoPage from "./pages/SeoPage";

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Guard({ children }: { children: JSX.Element }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter basename="/admin">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <Guard>
                  <Layout />
                </Guard>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/board" element={<BoardPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="case-studies" element={<CaseStudiesPage />} />
              <Route path="case-studies/new" element={<CaseStudyEditorPage />} />
              <Route path="case-studies/:id" element={<CaseStudyEditorPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="blog/new" element={<BlogEditorPage />} />
              <Route path="blog/:id" element={<BlogEditorPage />} />
              <Route path="testimonials" element={<TestimonialsPage />} />
              <Route path="clients" element={<ClientsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="identity" element={<IdentityPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="seo" element={<SeoPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
