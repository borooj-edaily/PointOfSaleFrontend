import { Link } from "react-router-dom";
import { getCurrentUser, logout } from "../api/authApi";

export default function Unauthorized() {
  const user = getCurrentUser();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        background: "#0f172a",
        color: "white",
      }}
    >
      <h1>ما عندك صلاحية توصل لهاي الصفحة</h1>
      {user && (
        <p>
          مسجّل دخول كـ {user.fullName} ({user.role})
        </p>
      )}
      <div style={{ display: "flex", gap: "1rem" }}>
        <Link
          to="/dashboard"
          style={{
            background: "#059669",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          رجوع للوحة التحكم
        </Link>
        <button onClick={logout}>تسجيل خروج</button>
      </div>
    </div>
  );
}