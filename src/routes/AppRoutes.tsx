import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CashierCartPage } from "../features/cashier/CashierCartPage";
import { ExchangeScreen } from "../features/exchange/ExchangeScreen";

const router = createBrowserRouter([
  {
    path: "/",
    element: <CashierCartPage />,
  },
  {
    path: "/exchange",
    element: <ExchangeScreen />,
  },
  // Add more routes here as other pages are built, e.g.:
  // { path: "/products", element: <ProductsPage /> },
  // { path: "/reports", element: <ReportsPage /> },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
