import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import ProtectedRoute from "@/components/ProtectedRoute"
import DashboardLayout from "@/components/DashboardLayout"
import { PageLoader } from "@/components/ui/page-loader"

// ─── Route-based Code Splitting (Dynamic Imports) ─────────────────────────────
const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const OrdersPage = lazy(() => import("@/pages/OrdersPage"))
const NewWorkOrderPage = lazy(() => import("@/pages/NewWorkOrderPage"))
const WorkOrderDetailsPage = lazy(() => import("@/pages/WorkOrderDetailsPage"))
const CustomersPage = lazy(() => import("@/pages/CustomersPage"))
const CustomerProfilePage = lazy(() => import("@/pages/CustomerProfilePage"))
const InventoryPage = lazy(() => import("@/pages/InventoryPage"))
const FinancePage = lazy(() => import("@/pages/FinancePage"))
const POSPage = lazy(() => import("@/pages/POSPage"))
const SettingsPage = lazy(() => import("@/pages/SettingsPage"))
const LoginPage = lazy(() => import("@/pages/LoginPage"))
const PendingApprovalPage = lazy(() => import("@/pages/PendingApprovalPage"))
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"))

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Suspense fallback={<PageLoader fullscreen message="Iniciando ERP Taller..." />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/new" element={<NewWorkOrderPage />} />
              <Route path="/orders/:id" element={<WorkOrderDetailsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerProfilePage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/pos" element={<POSPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ThemeProvider>
  )
}

export default App
