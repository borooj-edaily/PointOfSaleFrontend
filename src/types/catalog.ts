export interface Product {
  id: number;
  name: string;
  pricePerPiece: number;
  pricePerPackage: number | null;
  piecesPerPackage: number | null;
  stockInPieces: number;
  isActive: boolean;
}

export interface User {
  id: number;
  fullName: string;
  role: "Admin" | "Cashier";
}