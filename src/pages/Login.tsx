import { Eye, EyeOff, Lock, ShoppingCart, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import type { StoredUser } from "../types/auth";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await login({ username, password });

      localStorage.setItem("token", response.accessToken);

      const storedUser: StoredUser = {
        id: response.user.id,
        username: response.user.username,
        fullName: response.user.fullName,
        role: response.user.role,
        permissions: response.user.permissions,
      };
      localStorage.setItem("user", JSON.stringify(storedUser));

      switch (response.user.role) {
        case "Cashier":
          navigate("/cashier");
          break;
        case "Admin":
          navigate("/dashboard");
          break;
        case "InventoryOnly":
          navigate("/home");
          break;
        default:
          navigate("/home");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      dir="ltr" 
      className="relative flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        padding: "20px",
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1920&auto=format&fit=crop')`,
      }}
    >
      {/* Main centered container */}
      <div className="relative w-full max-w-xl" style={{ marginTop: "30px", marginBottom: "30px" }}>

        {/* Yellow top icons with clear spacing */}
        <div className="absolute -top-7 right-8 z-20 flex" style={{ gap: "12px" }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-2xl border-2 border-amber-300">
            <ShoppingCart size={26} className="stroke-[2.5]" />
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-2xl border-2 border-amber-300">
            <User size={26} className="stroke-[2.5]" />
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-2xl border-2 border-amber-300">
            <Lock size={26} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Transparent card with vertical alignment for evenly distributing elements inside the black box */}
        <div 
          className="relative rounded-3xl border border-white/15 bg-black/85 shadow-2xl backdrop-blur-2xl flex flex-col justify-between"
          style={{
            padding: "40px 35px",
            minHeight: "580px",
            boxSizing: "border-box"
          }}
        >
          {/* 1. Header section */}
          <div className="text-left" style={{ marginBottom: "30px" }}>
            <span className="text-sm font-black tracking-widest text-amber-400 uppercase block" style={{ marginBottom: "8px" }}>
              AL-ISRAA Supermarket
            </span>
                        <h1 className="signin-title text-4xl sm:text-5xl font-black text-white tracking-tight">
              Sign In
            </h1>
          </div>

          {/* 2. Input section */}
          <form onSubmit={handleLogin} className="flex-1 flex flex-col justify-center">
            
            {/* Username field with mandatory spacing below */}
            <div 
              className="flex w-full items-center overflow-hidden rounded-2xl bg-white shadow-xl"
              style={{ height: "64px", marginBottom: "28px" }}
            >
              <div className="flex h-full w-16 shrink-0 items-center justify-center bg-amber-400 text-slate-950">
                <User size={26} className="stroke-[2.5]" />
              </div>
              <input
                id="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="h-full w-full bg-transparent px-5 text-xl font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Password field with mandatory spacing below */}
            <div 
              className="flex w-full items-center overflow-hidden rounded-2xl bg-white shadow-xl"
              style={{ height: "64px", marginBottom: "28px" }}
            >
              <div className="flex h-full w-16 shrink-0 items-center justify-center bg-amber-400 text-slate-950">
                <Lock size={26} className="stroke-[2.5]" />
              </div>
              <input
                id="password"
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="h-full w-full bg-transparent px-5 text-xl font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="flex h-full items-center px-5 text-slate-500 hover:text-slate-900 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>

            {/* Error message */}
            {error && (
                           <div 
                className="rounded-2xl bg-red-500/20 p-4 text-center text-base font-black text-red-900 border border-red-500/40"
                style={{ marginBottom: "24px" }}
              >
                {error}
              </div>
            )}

            {/* 3. Footer button section */}
            <div className="flex justify-end" style={{ marginTop: "12px" }}>
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-amber-400 px-10 py-4 text-xl font-black text-slate-950 shadow-2xl transition-all hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-400/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ minWidth: "160px" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-6 w-6 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}