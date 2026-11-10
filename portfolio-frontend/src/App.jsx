// frontend/src/App.jsx
import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

// Eager: the landing page holds the LCP (Hero) — keep it in the main bundle
import Home from "./pages/Home.jsx";

// Eager: tiny shared chrome — must render instantly on every route
import AdminProtectedRoute from "./components/AdminProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

// Lazy: everything else becomes its own chunk on demand
const Products      = lazy(() => import("./pages/Products.jsx"));
const Courses       = lazy(() => import("./pages/Courses.jsx"));
const CourseDetail  = lazy(() => import("./pages/CourseDetail.jsx"));
const NotFound      = lazy(() => import("./pages/NotFound.jsx"));

const AdminLogin            = lazy(() => import("./pages/AdminLogin.jsx"));
const AdminDashboard        = lazy(() => import("./pages/AdminDashboard.jsx"));
const AboutManagement       = lazy(() => import("./pages/admin/AboutManagement.jsx"));
const ContactMessages       = lazy(() => import("./pages/admin/ContactMessages.jsx"));
const ContactDetail         = lazy(() => import("./pages/admin/ContactDetail.jsx"));
const ProductManagement     = lazy(() => import("./pages/admin/ProductManagement.jsx"));
const ProductForm           = lazy(() => import("./pages/admin/ProductForm.jsx"));
const ExperienceManagement  = lazy(() => import("./pages/admin/ExperienceManagement.jsx"));
const ExperienceForm        = lazy(() => import("./pages/admin/ExperienceForm.jsx"));
const SocialLinksManagement = lazy(() => import("./pages/admin/SocialLinksManagement.jsx"));

const AdminLayout = lazy(() => import("./components/admin/AdminLayout.jsx"));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
      Loading…
    </div>
  );
}

function ScrollHandler() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));

      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}

function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>
        {/* Navbar/Footer stay put; only the page content shows the fallback */}
        <Suspense fallback={<PageFallback />}>{children}</Suspense>
      </main>
      <Footer />
    </>
  );
}

function AppRoutes() {
  return (
    <>
      <ScrollHandler />

      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />

        <Route
          path="/products"
          element={
            <MainLayout>
              <Products />
            </MainLayout>
          }
        />

        <Route
          path="/courses"
          element={
            <MainLayout>
              <Courses />
            </MainLayout>
          }
        />

        <Route
          path="/courses/:slug"
          element={
            <MainLayout>
              <CourseDetail />
            </MainLayout>
          }
        />

        {/* Admin login — lazy, wrapped in Suspense at the boundary */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<PageFallback />}>
              <AdminLogin />
            </Suspense>
          }
        />

        {/* Protected admin area */}
        <Route element={<AdminProtectedRoute />}>
          <Route
            path="/admin"
            element={
              <Suspense fallback={<PageFallback />}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="about" element={<AboutManagement />} />

            <Route path="contacts" element={<ContactMessages />} />
            <Route path="contacts/:id" element={<ContactDetail />} />

            <Route path="products" element={<ProductManagement />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />

            <Route path="experience" element={<ExperienceManagement />} />
            <Route path="experience/new" element={<ExperienceForm />} />
            <Route path="experience/:id/edit" element={<ExperienceForm />} />

            <Route path="social-links" element={<SocialLinksManagement />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Suspense fallback={<PageFallback />}>
              <NotFound />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}