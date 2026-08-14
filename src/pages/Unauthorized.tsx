import { Link } from "react-router-dom";
import { ShieldAlert, LogOut, ArrowRight } from "lucide-react";
import { getCurrentUser, logout } from "../api/authApi";

export default function Unauthorized() {
  const user = getCurrentUser();

  return (
    <div 
      className="pos-page relative flex min-h-screen items-center justify-center p-4 font-sans text-slate-100 select-none" 
      dir="rtl"
    >
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] pointer-events-none" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-amber-500/30 bg-black/50 p-8 text-center backdrop-blur-md shadow-2xl shadow-black/40">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-red-500/20 text-red-400 shadow-inner backdrop-blur-sm">
          <ShieldAlert size={40} />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black text-white drop-shadow-md">
            You do not have permission to access this page
          </h1>
          {user && (
            <p className="text-sm font-semibold text-slate-200 drop-shadow">
              Logged in as <span className="text-amber-400 font-extrabold">{user.fullName}</span>
              <span className="mx-1 text-xs text-slate-300 font-medium">({user.role})</span>
            </p>
          )}
        </div>

        <div className="mt-2 flex w-full flex-col gap-3">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 rounded-2xl border border-amber-400/50 bg-amber-500/30 px-4 py-3 text-sm font-bold text-amber-200 transition-all hover:bg-amber-500/40 hover:text-white active:scale-95 shadow-lg backdrop-blur-sm"
          >
            <ArrowRight size={18} />
            <span>Back to dashboard</span>
          </Link>
          
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/20 px-4 py-3 text-sm font-bold text-red-300 transition-all hover:bg-red-500/30 hover:text-white active:scale-95 shadow-lg backdrop-blur-sm cursor-pointer"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
