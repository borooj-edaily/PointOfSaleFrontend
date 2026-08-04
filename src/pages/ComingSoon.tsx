import { getCurrentUser, logout } from "../api/authApi";

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
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
      <h1>{title}</h1>
      {user && <p>Signed in as {user.fullName} ({user.role})</p>}
      <button onClick={logout}>Sign out</button>
    </div>
  );
}