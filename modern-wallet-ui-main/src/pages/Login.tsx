import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Added Link for consistent routing
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertMessage } from "@/components/AlertMessage";
import { Mail, Lock, Eye, EyeOff, Shield, Sparkles, User, Key } from "lucide-react";

export default function Login() {
  const { login, error, setError, isLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // This calls the login function which now stores the fullName in the Auth state
    const success = await login(form.email, form.password);
    if (success) {
      navigate("/bank/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-green-900 to-teal-900 relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-emerald-400/5 rounded-full blur-2xl animate-pulse"></div>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Card Glow Effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-0 hover:opacity-30 transition-opacity duration-700"></div>
        
        {/* Glassmorphic Card */}
        <div className="relative bg-gradient-to-br from-emerald-900/40 via-green-900/30 to-teal-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl shadow-emerald-900/30 p-10">
          
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/40 shadow-lg shadow-emerald-900/20">
                <Shield className="h-10 w-10 text-emerald-200" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-200 via-emerald-100 to-teal-200 bg-clip-text text-transparent">
                  SecureBank
                </h1>
                <p className="text-emerald-300/70 text-lg mt-1">Premium Banking Portal</p>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Secure Access</span>
            </div>
          </div>

          {/* Alert */}
          {error && (
            <div className="mb-6">
              <AlertMessage type="error" message={error} onClose={() => setError(null)} />
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-emerald-100/80 text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-400" />
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="relative pl-12 h-14 rounded-xl bg-white/5 text-white placeholder-emerald-200/50 border-emerald-500/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-base"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <User className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-emerald-100/80 text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                Password
              </label>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="relative pl-12 pr-12 h-14 rounded-xl bg-white/5 text-white placeholder-emerald-200/50 border-emerald-500/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-base"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Key className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors group/eye"
                >
                  {showPassword ? 
                    <EyeOff className="h-5 w-5 text-emerald-300 group-hover/eye:text-emerald-200" /> : 
                    <Eye className="h-5 w-5 text-emerald-300 group-hover/eye:text-emerald-200" />
                  }
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 group/button mt-8"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <div className="p-2 rounded-lg bg-white/20 group-hover/button:bg-white/30 transition-colors">
                    <Shield className="h-5 w-5" />
                  </div>
                  <span>Sign In Securely</span>
                  <Sparkles className="h-4 w-4 ml-auto group-hover/button:rotate-180 transition-transform duration-500" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-emerald-500/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-900/20">
                <Shield className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs text-emerald-300/60">Security</p>
                  <p className="text-sm font-medium text-white">256-bit SSL</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-900/20">
                <Lock className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs text-emerald-300/60">Encryption</p>
                  <p className="text-sm font-medium text-white">Bank Grade</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-900/20">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs text-emerald-300/60">Privacy</p>
                  <p className="text-sm font-medium text-white">GDPR Compliant</p>
                </div>
              </div>
            </div>
            
            <p className="text-center text-emerald-300/70 text-sm">
              Don't have an account?{" "}
              <Link
                to="/bank/signup"
                className="text-emerald-200 font-semibold hover:text-emerald-100 hover:underline transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Security Footer Note */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-xs text-emerald-400/60">
          🔒 Your security is our priority. All data is encrypted end-to-end.
        </p>
      </div>
    </div>
  );
}
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/hooks/useAuth";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { AlertMessage } from "@/components/AlertMessage";
// import { Mail, Lock, Eye, EyeOff } from "lucide-react";

// export default function Login() {
//   const { login, error, setError, isLoading } = useAuth();
//   const navigate = useNavigate();

//   const [form, setForm] = useState({ email: "", password: "" });
//   const [showPassword, setShowPassword] = useState(false);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);

//     const success = await login(form.email, form.password);
//     if (success) navigate("/bank/dashboard");
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative overflow-hidden">
      
//       {/* Decorative Blobs */}
//       <div className="absolute w-96 h-96 bg-white/5 rounded-full top-[-100px] left-[-100px] animate-pulse"></div>
//       <div className="absolute w-96 h-96 bg-white/10 rounded-full bottom-[-120px] right-[-120px] animate-pulse"></div>

//       {/* Glassmorphic Card */}
//       <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-10">
//         <h1 className="text-4xl font-bold text-green-50 text-center mb-6 drop-shadow-lg">
//           SecureBank 🌿
//         </h1>
//         <p className="text-green-100 text-center mb-8">
//           Sign in to your account to manage your finances securely
//         </p>

//         {error && (
//           <AlertMessage type="error" message={error} onClose={() => setError(null)} />
//         )}

//         <form onSubmit={handleLogin} className="space-y-5">
//           {/* Email */}
//           <div className="relative">
//             <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-green-200/70" />
//             <Input
//               name="email"
//               type="email"
//               placeholder="Email"
//               value={form.email}
//               onChange={handleChange}
//               required
//               className="pl-12 h-12 rounded-xl border border-green-200/30 bg-white/5 text-green-50 placeholder-green-200/50 focus:border-green-200 focus:bg-white/10 focus:ring-green-200/40 transition"
//             />
//           </div>

//           {/* Password */}
//           <div className="relative">
//             <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-200/70" />
//             <Input
//               name="password"
//               type={showPassword ? "text" : "password"}
//               placeholder="Password"
//               value={form.password}
//               onChange={handleChange}
//               required
//               className="pl-12 pr-12 h-12 rounded-xl border border-green-200/30 bg-white/5 text-green-50 placeholder-green-200/50 focus:border-green-200 focus:bg-white/10 focus:ring-green-200/40 transition"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-4 top-1/2 -translate-y-1/2 text-green-200/70 hover:text-green-50"
//             >
//               {showPassword ? <EyeOff /> : <Eye />}
//             </button>
//           </div>

//           {/* Submit */}
//           <Button
//             type="submit"
//             disabled={isLoading}
//             className="w-full h-12 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white text-lg font-semibold rounded-xl shadow-lg transition-transform transform hover:scale-105"
//           >
//             {isLoading ? "Signing In..." : "Sign In"}
//           </Button>
//         </form>

//         {/* Footer */}
//         <p className="mt-6 text-center text-green-200 text-sm">
//           Don't have an account?{" "}
//           <a
//             href="/signup"
//             className="text-green-50 font-semibold hover:underline"
//           >
//             Create one now
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// }
