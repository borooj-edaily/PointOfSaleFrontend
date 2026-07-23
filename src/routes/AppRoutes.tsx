import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CashierCartPage } from "../features/cashier/CashierCartPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <CashierCartPage />,
  },
  // Add more routes here as other pages are built, e.g.:
  // { path: "/products", element: <ProductsPage /> },
  // { path: "/reports", element: <ReportsPage /> },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
