import { getCurrentUser, logout } from "../api/authApi";

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  const user = getCurrentUser();

  return (
    <div className="pos-page flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-white">
      <h1>{title}</h1>
      {user && <p>Signed in as {user.fullName} ({user.role})</p>}
      <button onClick={logout}>Sign out</button>
    </div>
  );
}
