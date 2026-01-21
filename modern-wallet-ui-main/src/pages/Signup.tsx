import { useState } from "react";
import { User, Mail, Lock, Shield, Sparkles, ArrowRight, CheckCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertMessage } from "@/components/AlertMessage";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; // Ensure this path matches your file structure

export default function Signup() {
  const navigate = useNavigate();
  const { register, isLoading: authLoading, error: authError } = useAuth();
  
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccess(null);

    // Client-side validation
    if (form.password !== form.confirm) {
      setLocalError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    // Use the register function from useAuth hook
    const isSuccess = await register(form.full_name, form.email, form.password);

    // Around line 52 - UPDATE THESE LINES
if (isSuccess) {
  // 1. Update message to tell user they need to log in
  setSuccess("✅ Account created successfully! Redirecting to login...");
  
  // Clear form on success
  setForm({ full_name: "", email: "", password: "", confirm: "" });

  // 2. Change navigate from "/bank/dashboard" to "/"
  setTimeout(() => {
    navigate("/"); // Redirect to the Login page (root path)
  }, 2000);
}
    // Note: useAuth manages the 'authError' state which is displayed below
  };

  // Combine local validation errors and API errors from the hook
  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-green-900 to-teal-900 relative overflow-hidden p-4">
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Back to Login */}
      <Link
        to="/"
        className="absolute top-8 left-8 inline-flex items-center gap-2 text-emerald-200 hover:text-emerald-100 group transition-colors z-20"
      >
        <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
          <ArrowRight className="h-4 w-4 rotate-180" />
        </div>
        <span className="text-sm font-medium">Back to Login</span>
      </Link>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl">
        <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-0 hover:opacity-30 transition-opacity duration-700"></div>
        
        <div className="relative grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-emerald-900/40 via-green-900/30 to-teal-900/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl shadow-emerald-900/30 overflow-hidden">
          
          {/* Left Panel - Brand/Info */}
          <div className="p-12 flex flex-col justify-center items-center text-center bg-gradient-to-br from-emerald-900/60 to-teal-900/60 border-r border-emerald-500/20">
            <div className="mb-8">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/40 shadow-lg shadow-emerald-900/20 inline-block">
                <Shield className="h-12 w-12 text-emerald-200" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-200 via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-4">
              SecureBank
            </h1>
            
            <p className="text-emerald-200/80 text-lg mb-6 max-w-sm">
              Join thousands who trust their finances with us
            </p>
            
            <div className="space-y-4 w-full max-w-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-emerald-100">Bank-level security</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-emerald-100">Instant account setup</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-emerald-100">24/7 customer support</span>
              </div>
            </div>
            
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Trusted Since 2025</span>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="p-10 space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-emerald-300/70">Join SecureBank in less than 2 minutes</p>
            </div>

            {/* Alerts */}
            <div className="space-y-3">
              {displayError && (
                <AlertMessage type="error" message={displayError} onClose={() => setLocalError(null)} />
              )}
              {success && (
                <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />
              )}
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-emerald-100/80 text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  Full Name
                </Label>
                <div className="relative group">
                  <Input
                    name="full_name"
                    placeholder="Enter your full name"
                    required
                    disabled={authLoading}
                    value={form.full_name}
                    onChange={handleChange}
                    className="pl-12 h-14 rounded-xl bg-white/5 text-white border-emerald-500/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-300/70" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-emerald-100/80 text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-400" />
                  Email Address
                </Label>
                <div className="relative group">
                  <Input
                    name="email"
                    type="email"
                    placeholder="example@securebank.com"
                    required
                    disabled={authLoading}
                    value={form.email}
                    onChange={handleChange}
                    className="pl-12 h-14 rounded-xl bg-white/5 text-white border-emerald-500/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-300/70" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-emerald-100/80 text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  Password
                </Label>
                <div className="relative group">
                  <Input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={authLoading}
                    value={form.password}
                    onChange={handleChange}
                    className="pl-12 h-14 rounded-xl bg-white/5 text-white border-emerald-500/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-300/70" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-emerald-100/80 text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  Confirm Password
                </Label>
                <div className="relative group">
                  <Input
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={authLoading}
                    value={form.confirm}
                    onChange={handleChange}
                    className="pl-12 h-14 rounded-xl bg-white/5 text-white border-emerald-500/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-300/70" />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={authLoading}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold flex items-center justify-center gap-3 shadow-lg"
              >
                {authLoading ? (
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                    <span>Creating Your Account...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    <span className="text-base">Create Secure Account</span>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-emerald-500/20">
              <p className="text-sm text-emerald-300/70">
                Already have an account?{" "}
                <Link to="/" className="text-emerald-200 font-semibold hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// import { useState } from "react";
// import { User, Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { AlertMessage } from "@/components/AlertMessage";

// export default function Signup() {
//   const [form, setForm] = useState({
//     full_name: "",
//     email: "",
//     password: "",
//     confirm: "",
//   });

//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSignup = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setSuccess(null);

//     // Client-side validation
//     if (form.password !== form.confirm) {
//       setError("Passwords do not match.");
//       return;
//     }

//     if (form.password.length < 6) {
//       setError("Password must be at least 6 characters.");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const res = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           full_name: form.full_name,
//           email: form.email,
//           password: form.password,
//         }),
//       });

//       const result = await res.json();

//       if (!res.ok) {
//         // Your backend raises HTTPException(400/500, detail="...")
//         setError(result.detail || "Registration failed.");
//       } else {
//         // Your backend returns {"success": True, "data": {"message": "..."}}
//         setSuccess(result.data?.message || "Account created! You now have a default Checking account.");
        
//         // Clear form on success
//         setForm({ full_name: "", email: "", password: "", confirm: "" });

//         setTimeout(() => {
//           window.location.href = "/bank/login";
//         }, 2000);
//       }
//     } catch (err) {
//       setError("Network error. The SecureBank server could not be reached.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background p-6">
//       <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-card shadow-xl rounded-2xl overflow-hidden border border-border">

//         {/* LEFT SIDE — BRAND PANEL */}
//         <div className="hidden md:flex flex-col justify-center items-center bg-primary text-primary-foreground p-12 space-y-6">
//           <div className="bg-white/20 p-6 rounded-2xl backdrop-blur-md">
//             <ShieldCheck className="h-12 w-12" />
//           </div>
//           <h1 className="text-3xl font-bold tracking-tight">SecureBank</h1>
//           <div className="space-y-2 text-center">
//             <h2 className="text-xl font-medium">Safe. Simple. Secure.</h2>
//             <p className="text-primary-foreground/80 max-w-sm">
//               Open your free account in minutes and start managing your money with bank-level encryption.
//             </p>
//           </div>
//         </div>

//         {/* RIGHT SIDE — FORM */}
//         <div className="p-10 space-y-6">
//           <div className="space-y-2 text-center md:text-left">
//             <div className="md:hidden flex justify-center mb-4">
//                <ShieldCheck className="h-10 w-10 text-primary" />
//             </div>
//             <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
//             <p className="text-sm text-muted-foreground">Enter your details to join SecureBank</p>
//           </div>

//           {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
//           {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}

//           <form className="space-y-4" onSubmit={handleSignup}>
//             {/* Full Name */}
//             <div className="space-y-2">
//               <Label htmlFor="full_name">Full Name</Label>
//               <div className="relative">
//                 <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   id="full_name"
//                   name="full_name"
//                   placeholder="John Doe"
//                   required
//                   disabled={isLoading}
//                   value={form.full_name}
//                   onChange={handleChange}
//                   className="pl-10"
//                 />
//               </div>
//             </div>

//             {/* Email */}
//             <div className="space-y-2">
//               <Label htmlFor="email">Email Address</Label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   id="email"
//                   name="email"
//                   type="email"
//                   placeholder="example@securebank.com"
//                   required
//                   disabled={isLoading}
//                   value={form.email}
//                   onChange={handleChange}
//                   className="pl-10"
//                 />
//               </div>
//             </div>

//             {/* Password */}
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   id="password"
//                   name="password"
//                   type="password"
//                   autoComplete="new-password"
//                   required
//                   disabled={isLoading}
//                   value={form.password}
//                   onChange={handleChange}
//                   className="pl-10"
//                 />
//               </div>
//             </div>

//             {/* Confirm Password */}
//             <div className="space-y-2">
//               <Label htmlFor="confirm">Confirm Password</Label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   id="confirm"
//                   name="confirm"
//                   type="password"
//                   autoComplete="new-password"
//                   required
//                   disabled={isLoading}
//                   value={form.confirm}
//                   onChange={handleChange}
//                   className="pl-10"
//                 />
//               </div>
//             </div>

//             <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
//               {isLoading ? (
//                 "Creating your vault..."
//               ) : (
//                 <span className="flex items-center gap-2">
//                   Create Account <ArrowRight className="h-4 w-4" />
//                 </span>
//               )}
//             </Button>
//           </form>

//           <div className="text-center pt-2">
//             <p className="text-sm text-muted-foreground">
//               Already have an account?{" "}
//               <a href="/bank/login" className="text-primary hover:underline font-semibold">
//                 Sign in here
//               </a>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }