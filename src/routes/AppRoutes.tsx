import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "../pages/Login";
import ComingSoon from "../pages/ComingSoon";
import Unauthorized from "../pages/Unauthorized";
import AdminDashboard from "../pages/AdminDashboard";
import StaffHome from "../pages/Staffhome";
import AddProductsPage from "../pages/AddProductsPage";
import StockManagementPage from "../pages/StockManagementPage";
import { CashierCartPage } from "../features/cashier/CashierCartPage";
import { ExchangeScreen } from "../features/exchange/ExchangeScreen";
import { ProtectedRoute } from "./ProtectedRoute";
import { PermissionRoute } from "./PermissionRoute";
import { RoleRoute } from "./Roleroute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/unauthorized",
    element: (
      <ProtectedRoute>
        <Unauthorized />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cashier",
    element: (
      <ProtectedRoute>
        <CashierCartPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/exchange",
    element: (
      <ProtectedRoute>
        <ExchangeScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <RoleRoute role="Admin">
        <AdminDashboard />
      </RoleRoute>
    ),
  },
  {
    path: "/home",
    element: (
      <ProtectedRoute>
        <StaffHome />
      </ProtectedRoute>
    ),
  },
  {
    path: "/products",
    element: (
      <PermissionRoute permission="manage_products">
        <AddProductsPage />
      </PermissionRoute>
    ),
  },
  {
    path: "/stock",
    element: (
      <PermissionRoute permission="manage_inventory">
        <StockManagementPage />
      </PermissionRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <PermissionRoute permission="view_reports">
        <ComingSoon title="Reports" />
      </PermissionRoute>
    ),
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}