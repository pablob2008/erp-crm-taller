import { Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import ProtectedRoute from "@/components/ProtectedRoute"
import DashboardLayout from "@/components/DashboardLayout"
import DashboardPage from "@/pages/DashboardPage"
import OrdersPage from "@/pages/OrdersPage"
import NewWorkOrderPage from "@/pages/NewWorkOrderPage"
import WorkOrderDetailsPage from "@/pages/WorkOrderDetailsPage"
import CustomersPage from "@/pages/CustomersPage"
import InventoryPage from "@/pages/InventoryPage"
import FinancePage from "@/pages/FinancePage"
import POSPage from "@/pages/POSPage"
import SettingsPage from "@/pages/SettingsPage"
import LoginPage from "@/pages/LoginPage"
import PendingApprovalPage from "@/pages/PendingApprovalPage"
import OnboardingPage from "@/pages/OnboardingPage"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
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
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  )
}

export default App

