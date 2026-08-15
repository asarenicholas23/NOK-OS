import React, { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ShieldCheck, Mail, Lock, Sparkles, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess("Authenticated successfully!");
    } catch (signInErr: any) {
      console.error("Sign in failed:", signInErr);
      setError(
        "Invalid credentials, or no account exists for this address. Contact your workspace admin to be added as a team member."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen-view" className="min-h-screen bg-[#15151A] text-[#F2F0EB] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Back to Public Site link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/home"
          className="neu-raised-sm px-4 py-2 rounded-xl text-xs font-mono text-[#8A8A93] hover:text-[#F2F0EB] inline-flex items-center space-x-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Agency Site</span>
        </Link>
      </div>

      <div className="w-full max-w-md z-10 space-y-6 pt-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 rounded-2xl neu-pressed text-[#B08D57] mb-2">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F0EB] font-display">
            NOK OS Brand Control Panel
          </h1>
          <p className="text-xs text-[#8A8A93] max-w-xs mx-auto">
            Authorized brand access portal for enterprise clients and team members.
          </p>
        </div>

        {/* Credentials Form Box */}
        <div className="neu-raised-lg rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A8A93]">
              Identity Verification
            </span>
            <span className="text-[10px] font-mono text-[#B08D57] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Secure Auth
            </span>
          </div>

          {error && (
            <div className="p-3 neu-pressed rounded-xl flex items-start space-x-2 text-rose-400 text-xs animate-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 neu-pressed rounded-xl text-emerald-400 text-xs animate-in slide-in-from-top-1 duration-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-medium text-[#8A8A93] uppercase">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A93]" />
                <input
                  id="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 neu-pressed-deep rounded-xl text-xs text-[#F2F0EB] placeholder-[#8A8A93]/50 focus:outline-none focus:ring-1 focus:ring-[#B08D57] transition-all font-mono"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-medium text-[#8A8A93] uppercase">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A93]" />
                <input
                  id="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 neu-pressed-deep rounded-xl text-xs text-[#F2F0EB] placeholder-[#8A8A93]/50 focus:outline-none focus:ring-1 focus:ring-[#B08D57] transition-all font-mono"
                  required
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 neu-gold-filled rounded-xl text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#15151A]" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Access Brand Workspace</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info line */}
        <p className="text-center text-[10px] font-mono text-[#8A8A93]">
          NOK OS • ACCRA, GHANA // VERSION 2.4.0
        </p>
      </div>
    </div>
  );
};

