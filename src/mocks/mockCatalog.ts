import type { Product, User } from "../types/catalog";

// TEMPORARY: replace with real API calls (Person B's products endpoint,
// Person A's users endpoint) during card 7 (final integration).
export const mockProducts: Product[] = [
  { id: 1, name: "Pepsi Can", pricePerPiece: 2.5, pricePerPackage: 55, piecesPerPackage: 24, stockInPieces: 100 },
  { id: 2, name: "Bread Loaf", pricePerPiece: 1.0, pricePerPackage: null, piecesPerPackage: null, stockInPieces: 50 },
  { id: 3, name: "Milk 1L", pricePerPiece: 3.75, pricePerPackage: null, piecesPerPackage: null, stockInPieces: 30 },
];

export const mockCurrentUser: User = {
  id: 1,
  fullName: "Test Cashier",
  role: "Cashier",
};
