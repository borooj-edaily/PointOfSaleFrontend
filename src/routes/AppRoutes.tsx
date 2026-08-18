import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "../pages/Login";
import Unauthorized from "../pages/Unauthorized";
import AdminDashboard from "../pages/AdminDashboard";
import StaffHome from "../pages/Staffhome";
import AddProductsPage from "../pages/AddProductsPage";
import ProductManagementPage from "../pages/ProductManagementPage";
import StockManagementPage from "../pages/StockManagementPage";
import { CashierCartPage } from "../features/cashier/CashierCartPage";
import { ExchangeScreen } from "../features/exchange/ExchangeScreen";
import { ProtectedRoute } from "./ProtectedRoute";
import { PermissionRoute } from "./PermissionRoute";
import { RoleRoute } from "./Roleroute";
import AuditLogsPage from "../pages/AuditLogsPage";
import CategoryManagementPage from "../pages/CategoryManagementPage";
import { ReturnScreen } from "../features/returns/ReturnScreen";
import UserManagementPage from "../pages/UserManagementPage";
import ShiftManagementPage from "../pages/ShiftManagementPage";
import InvoiceHistoryPage from "../pages/Invoicehistorypage";
import ReportsPage from "../pages/ReportsPage";
import DebtsPage from "../pages/DebtsPage";
import CustomersPage from "../pages/CustomersPage";

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
  path: "/returns",
  element: (
    <ProtectedRoute>
      <ReturnScreen />
    </ProtectedRoute>
  ),
},


{
  path: "/categories",
  element: (
    <PermissionRoute permission="manage_products">
      <CategoryManagementPage />
    </PermissionRoute>
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
  path: "/audit-logs",
  element: (
    <RoleRoute role="Admin">
      <AuditLogsPage />
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
        <ProductManagementPage />
      </PermissionRoute>
    ),
  },
  {
    path: "/products/add",
    element: (
      <PermissionRoute permission="manage_products">
        <AddProductsPage />
      </PermissionRoute>
    ),
  },
  {
    path: "/users",
    element: (
      <RoleRoute role="Admin">
        <UserManagementPage />
      </RoleRoute>
    ),
  },
  {
    path: "/shifts",
    element: (
      <ProtectedRoute>
        <ShiftManagementPage />
      </ProtectedRoute>
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
        <ReportsPage />
      </PermissionRoute>
    ),
  },
  {
    path: "/invoices",
    element: (
      <ProtectedRoute>
        <InvoiceHistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/debts",
    element: (
      <PermissionRoute permission="record_debt">
        <DebtsPage />
      </PermissionRoute>
    ),
  },
{
    path: "/customers",
    element: (
      <PermissionRoute permission="record_debt">
        <CustomersPage />
      </PermissionRoute>
    ),
  },
  {
    path: "/customers/:id",
    element: (
      <PermissionRoute permission="record_debt">
        <CustomersPage />
      </PermissionRoute>
    ),
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}