import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "../pages/Login";
import ComingSoon from "../pages/ComingSoon";
import AdminDashboard from "../pages/AdminDashboard";
import AddProductsPage from "../pages/AddProductsPage";
import { CashierCartPage } from "../features/cashier/CashierCartPage";
import { ExchangeScreen } from "../features/exchange/ExchangeScreen";
import { ProtectedRoute } from "./ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
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
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/products",
    element: (
      <ProtectedRoute>
        <AddProductsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute>
        <ComingSoon title="Reports" />
      </ProtectedRoute>
    ),
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}