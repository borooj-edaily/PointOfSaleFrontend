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
          navigate("/reports");
          break;
        default:
          // "Custom" or any future role: send them somewhere logged-in rather
          // than silently bouncing back to the login screen.
          navigate("/cashier");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "حصل خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F1F2EF] px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-center gap-4 bg-[#1C2333] p-12 text-white lg:flex">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600">
            <ShoppingCart size={26} />
          </div>
          <h1 className="text-3xl font-bold leading-tight">نظام نقطة البيع</h1>
          <p className="text-sm leading-relaxed text-slate-300">
            إدارة المبيعات والمخزون والفواتير من مكان واحد.
          </p>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-12">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <ShoppingCart size={24} />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">أهلاً بعودتك</h2>
            <p className="mt-1.5 text-sm text-slate-500">سجّلي دخولك للمتابعة</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                اسم المستخدم
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 focus-within:border-emerald-400 focus-within:bg-white">
                <User size={16} className="shrink-0 text-slate-400" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسم المستخدم"
                  className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                كلمة المرور
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 focus-within:border-emerald-400 focus-within:bg-white">
                <Lock size={16} className="shrink-0 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="shrink-0 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}