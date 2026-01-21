import { BalanceCard } from "@/components/BalanceCard";
import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, ArrowLeftRight, Shield, TrendingUp, Clock, FileText, CreditCard, Bell, Settings, HelpCircle, Wallet, User, Sparkles, Home, Calendar, Lock, Target, PieChart, Activity } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { AlertMessage } from "@/components/AlertMessage";
import { useAuth } from "@/hooks/useAuth";
import { getBalance, getUserAccounts , getUserPayees} from "@/services/api";
import { ChatBot } from "@/components/ChatBot"; 
import type { Account } from "@/types/bank";

export default function Dashboard() {
  const { logout, userEmail, userId, fullName } = useAuth();

  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* --------------------------------------------------
     LOAD DASHBOARD DATA & SYNC AI CONTEXT
  -------------------------------------------------- */
  const loadDashboardData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    
    try {
      const [accRes, payeeRes] = await Promise.all([
        getUserAccounts(Number(userId)),
        getUserPayees(Number(userId))
      ]);

      if (accRes.success && accRes.data && accRes.data.length > 0) {
        setAccount(accRes.data[0]);
      } else {
        setError(accRes.error || "No accounts found.");
      }

      if (payeeRes.success && payeeRes.data) {
        localStorage.setItem(`payees_${userId}`, JSON.stringify(payeeRes.data));
        console.log("Chatbot context synced: Real payees from DB loaded.");
      }

    } catch (err) {
      setError("Connection error while loading dashboard.");
    } finally {
      setIsLoading(false);
      return;
    }
  }, [userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /* --------------------------------------------------
     REFRESH BALANCE
  -------------------------------------------------- */
  const refreshBalance = useCallback(async () => {
    if (!account) return;

    setIsRefreshing(true);
    const res = await getBalance(account.account_id);

    if (res.success && res.data) {
      setAccount((prev: Account | null) =>
        prev
          ? {
              ...prev,
              balance: res.data.balance,
              currency: res.data.currency,
            }
          : prev
      );

      setSuccess("Balance updated successfully");
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError(res.error || "Failed to refresh balance");
    }

    setIsRefreshing(false);
  }, [account]);

  /* --------------------------------------------------
     AUTO-REFRESH ON CHATBOT ACTIONS
  -------------------------------------------------- */
  useEffect(() => {
    const syncPayeesForAI = async () => {
      if (!userId) return;
      
      try {
        const response = await fetch(`/api/bank/users/${userId}/payees`);
        const data = await response.json();
        
        if (response.ok && Array.isArray(data)) {
          localStorage.setItem(`payees_${userId}`, JSON.stringify(data));
          console.log("Dashboard: Payees synced for Chatbot context.");
        }
      } catch (err) {
        console.error("Dashboard: Failed to sync payees for AI context", err);
      }
    };

    syncPayeesForAI();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-100 to-teal-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin"></div>
            <Shield className="absolute inset-0 m-auto h-8 w-8 text-emerald-500" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-emerald-800">Loading SecureBank</p>
            <p className="text-sm text-emerald-600/70">Securing your financial dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-cyan-50 to-slate-50 text-slate-800 overflow-hidden">
      {/* Animated Background Elements - Lighter version */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-200/10 rounded-full blur-3xl"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDgwNjAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0aDF2MWgtMXpNMzQgMzZoMXYxaC0xeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
      </div>

      <Navbar onLogout={logout} userEmail={userEmail} />

      <main className="container mx-auto px-4 py-8 max-w-7xl flex-1 relative z-10">
        {/* Enhanced Header Section - Lighter glass card */}
        <div className="mb-8">
          <div className="relative overflow-hidden group">
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-200/30 via-cyan-200/30 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
            
            <div className="relative bg-gradient-to-br from-white/80 via-emerald-50/60 to-cyan-50/60 backdrop-blur-xl rounded-2xl border border-emerald-200/40 p-6 shadow-xl shadow-emerald-100/30">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-300/40 shadow-lg shadow-emerald-100/30">
                      <User className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white"></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent">
                        Welcome back, {fullName || 'Valued Member'}
                      </h1>
                      <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <p className="text-slate-600/90 font-medium">{userEmail}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-white/60 to-emerald-100/40 border border-emerald-200/40">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-emerald-700">Session Active</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-white/60 hover:bg-white/80 border border-emerald-200/40 hover:border-emerald-300/60 transition-all duration-200 group/btn">
                      <Bell className="h-5 w-5 text-emerald-600 group-hover/btn:text-emerald-700 transition-colors" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/60 hover:bg-white/80 border border-emerald-200/40 hover:border-emerald-300/60 transition-all duration-200 group/btn">
                      <Settings className="h-5 w-5 text-emerald-600 group-hover/btn:text-emerald-700 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Account Type */}
                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-white/70 to-emerald-50/50 border border-emerald-200/30 hover:border-emerald-300/60 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100/50">
                      <Home className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700/70 mb-1">Account Type</p>
                      <p className="text-sm font-medium text-slate-800">Premium Banking</p>
                    </div>
                  </div>
                </div>

                {/* Member Since */}
                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-cyan-50/60 to-teal-50/50 border border-cyan-200/30 hover:border-cyan-300/60 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-200/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-100/50">
                      <Calendar className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-cyan-700/70 mb-1">Member Since</p>
                      <p className="text-sm font-medium text-slate-800">2025</p>
                    </div>
                  </div>
                </div>

                {/* Security Level */}
                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-white/70 to-teal-50/50 border border-teal-200/30 hover:border-teal-300/60 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-200/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-100/50">
                      <Lock className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-teal-700/70 mb-1">Security Level</p>
                      <p className="text-sm font-medium text-slate-800">Maximum Protection</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="mb-6 space-y-3">
          {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
          {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Left Column - Balance and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card - Lighter design */}
            {account && (
              <div className="relative group">
                <div className="absolute -inset-3 bg-gradient-to-r from-emerald-200/30 via-cyan-200/30 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-white/80 via-emerald-50/60 to-cyan-50/60 backdrop-blur-xl rounded-2xl border border-emerald-200/40 p-8 shadow-xl shadow-emerald-100/30">
                  {/* Balance Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-300/40 shadow-lg shadow-emerald-100/30">
                        <Wallet className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-800">Main Account</p>
                        <p className="text-sm text-emerald-600/70">Available Balance</p>
                      </div>
                    </div>
                    
                    {/* Refresh Button */}
                    <Button
                      onClick={refreshBalance}
                      variant="ghost"
                      size="sm"
                      className="rounded-full px-4 py-2 bg-white/60 hover:bg-emerald-100/50 border border-emerald-200/40 hover:border-emerald-300/60 text-emerald-700 hover:text-emerald-800 transition-all duration-200 group/refresh"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : "group-hover/refresh:rotate-180 transition-transform duration-500"}`} />
                      Refresh
                    </Button>
                  </div>
                  
                  {/* Balance Amount */}
                  <div className="mb-8">
                    <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-700 via-emerald-600 to-cyan-700 bg-clip-text text-transparent mb-2">
                      {account.currency} {account.balance?.toLocaleString()}
                    </p>
                    <p className="text-sm text-emerald-600/70">Current available funds</p>
                  </div>
                  
                  {/* Account Details */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-emerald-200/40">
                    <div>
                      <p className="text-xs text-emerald-600/60 mb-1">Account Number</p>
                      <p className="text-sm font-medium text-slate-800 font-mono">{account.account_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600/60 mb-1">Sort Code</p>
                      <p className="text-sm font-medium text-slate-800 font-mono">11-22-33</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Activity Card - Lighter */}
            <div className="bg-gradient-to-br from-white/80 via-emerald-50/60 to-cyan-50/60 backdrop-blur-xl rounded-2xl border border-emerald-200/40 p-6 shadow-xl shadow-emerald-100/30 hover:shadow-emerald-200/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  Account Overview
                </h2>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-100/50 text-emerald-700 border border-emerald-200/40">
                  Live Updates
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Available Balance Card */}
                <div className="group p-5 rounded-xl bg-gradient-to-br from-white/70 to-emerald-50/50 border border-emerald-200/30 hover:border-emerald-300/60 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-100/50 group-hover:bg-emerald-100/70 transition-colors">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700/70">Available Balance</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        {account?.currency} {account?.balance?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-600/60">Real-time balance</p>
                </div>

                {/* Account Status Card */}
                <div className="group p-5 rounded-xl bg-gradient-to-br from-cyan-50/60 to-teal-50/50 border border-cyan-200/30 hover:border-cyan-300/60 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-100/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-cyan-100/50 group-hover:bg-cyan-100/70 transition-colors">
                      <Shield className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-cyan-700/70">Account Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-sm font-medium text-cyan-700">Active & Verified</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-cyan-600/60">Account is fully operational</p>
                </div>

                {/* Last Update Card */}
                <div className="group p-5 rounded-xl bg-gradient-to-br from-white/70 to-teal-50/50 border border-teal-200/30 hover:border-teal-300/60 transition-all duration-300 hover:shadow-lg hover:shadow-teal-100/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-teal-100/50 group-hover:bg-teal-100/70 transition-colors">
                      <Clock className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-teal-700/70">Last Update</p>
                      <p className="text-sm font-medium text-slate-800 mt-1">
                        {new Date().toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-teal-600/60">Balance updated just now</p>
                </div>

                {/* Quick Transfer Card */}
                <div className="group p-5 rounded-xl bg-gradient-to-br from-emerald-50/60 to-cyan-50/50 border border-emerald-200/30 hover:border-emerald-300/60 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-100/50 group-hover:bg-emerald-100/70 transition-colors">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700/70">Quick Actions</p>
                      <p className="text-sm text-slate-800 mt-1">Send money instantly</p>
                    </div>
                  </div>
                  <Link to="/transfer" className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 group/link">
                    Transfer Money 
                    <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Security */}
          <div className="space-y-6">
            {/* Quick Actions Card - Lighter */}
            <div className="bg-gradient-to-br from-white/80 via-cyan-50/60 to-emerald-50/60 backdrop-blur-xl rounded-2xl border border-cyan-200/40 p-6 shadow-xl shadow-cyan-100/30 hover:shadow-cyan-200/30 transition-all duration-300">
              <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan-500" />
                Quick Actions
              </h2>

              <div className="space-y-3">
                <Button 
                  variant="ghost" 
                  size="lg" 
                  onClick={refreshBalance} 
                  className="w-full justify-start gap-3 text-slate-700 hover:bg-white/80 hover:text-slate-900 transition-all duration-300 h-14 rounded-xl border border-emerald-200/40 hover:border-cyan-300/60 group"
                >
                  <div className="p-2 rounded-lg bg-white/60 group-hover:bg-cyan-100/50 transition-colors">
                    <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Refresh Balance</p>
                    <p className="text-xs text-emerald-600/60">Get latest balance</p>
                  </div>
                </Button>

                <Button 
                  variant="ghost" 
                  size="lg" 
                  asChild 
                  className="w-full justify-start gap-3 text-slate-700 hover:bg-white/80 hover:text-slate-900 transition-all duration-300 h-14 rounded-xl border border-emerald-200/40 hover:border-emerald-300/60 group"
                >
                  <Link to="/transfer">
                    <div className="p-2 rounded-lg bg-white/60 group-hover:bg-emerald-100/50 transition-colors">
                      <ArrowLeftRight className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Transfer Money</p>
                      <p className="text-xs text-emerald-600/60">Send to other accounts</p>
                    </div>
                  </Link>
                </Button>

                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="w-full justify-start gap-3 text-slate-700 hover:bg-white/80 hover:text-slate-900 transition-all duration-300 h-14 rounded-xl border border-emerald-200/40 hover:border-teal-300/60 group"
                >
                  <div className="p-2 rounded-lg bg-white/60 group-hover:bg-teal-100/50 transition-colors">
                    <PieChart className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">View Analytics</p>
                    <p className="text-xs text-emerald-600/60">Spending insights</p>
                  </div>
                </Button>
              </div>
            </div>

            {/* Security Status Card - Lighter */}
            <div className="bg-gradient-to-br from-emerald-50/60 via-teal-50/50 to-cyan-50/60 backdrop-blur-xl rounded-2xl border border-emerald-300/40 p-6 shadow-xl shadow-teal-100/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100/50 to-cyan-100/50">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-800">Security Status</h3>
              </div>
              <p className="text-sm text-emerald-700/80 mb-4">
                Your account is protected with bank-level encryption and 2FA
              </p>
              <div className="w-full bg-white/60 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full h-2.5 w-4/5"></div>
              </div>
              <div className="flex justify-between mt-3">
                <p className="text-xs text-emerald-600/60">Security score: 85%</p>
                <p className="text-xs text-emerald-600">✓ Maximum</p>
              </div>
            </div>

            {/* Chatbot Info Card - Lighter */}
            <div className="bg-gradient-to-br from-white/80 via-emerald-50/60 to-cyan-50/60 backdrop-blur-xl rounded-2xl border border-emerald-200/40 p-6 shadow-xl shadow-emerald-100/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-100/50 to-emerald-100/50">
                  <Sparkles className="h-5 w-5 text-cyan-600" />
                </div>
                <h3 className="font-semibold text-slate-800">AI Assistant</h3>
              </div>
              <p className="text-sm text-slate-600/80 mb-4">
                Chat with our AI assistant for instant help with transfers, balance checks, and more.
              </p>
              <div className="text-xs text-emerald-600/60">
                <p className="mb-1">• Check your balance</p>
                <p className="mb-1">• Make transfers by voice</p>
                <p className="mb-1">• Get financial insights</p>
              </div>
              <p className="text-sm text-emerald-200/80 mb-4">
                Your account is protected with bank-level encryption and 2FA
              </p>
              <div className="w-full bg-emerald-900/50 rounded-full h-2">
                <div className="bg-emerald-400 rounded-full h-2 w-4/5"></div>
              </div>
              <p className="text-xs text-emerald-300/60 mt-2">Security score: 85%</p>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer - Lighter */}
      <footer className="bg-gradient-to-t from-white/90 via-emerald-50/40 to-transparent backdrop-blur-lg border-t border-emerald-200/30 mt-auto p-6 relative z-10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100/50 to-cyan-100/50">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">SecureBank</p>
                <p className="text-sm text-emerald-600/60">Banking Redefined • Since 2025</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="text-sm text-emerald-700/70 hover:text-emerald-800 transition-colors hover:underline">Privacy Policy</a>
              <a href="#" className="text-sm text-cyan-700/70 hover:text-cyan-800 transition-colors hover:underline">Support Center</a>
              <a href="#" className="text-sm text-teal-700/70 hover:text-teal-800 transition-colors hover:underline">Security</a>
            </div>
            
            <p className="text-sm text-emerald-600/60">© 2025 SecureBank. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Updated Chatbot with lighter styling */}
      <ChatBot userId={userId} userName={fullName} />
    </div>
  );
}
// import { BalanceCard } from "@/components/BalanceCard";
// import { useState, useCallback, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { RefreshCw, ArrowLeftRight, Shield, TrendingUp, Clock, FileText, CreditCard, Bell, Settings, HelpCircle, Wallet, User, Sparkles, Home, Calendar, Lock } from "lucide-react";
// import { Navbar } from "@/components/Navbar";
// import { Button } from "@/components/ui/button";
// import { AlertMessage } from "@/components/AlertMessage";
// import { useAuth } from "@/hooks/useAuth";
// import { getBalance, getUserAccounts , getUserPayees} from "@/services/api";
// import { ChatBot } from "@/components/ChatBot"; 
// import type { Account } from "@/types/bank";

// export default function Dashboard() {
//   // Destructured fullName to use in the UI and Chatbot
//   const { logout, userEmail, userId, fullName } = useAuth();

//   const [account, setAccount] = useState<Account | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);

// /* --------------------------------------------------
//    LOAD DASHBOARD DATA & SYNC AI CONTEXT
// -------------------------------------------------- */
// const loadDashboardData = useCallback(async () => {
//   if (!userId) return;

//   setIsLoading(true);
  
//   try {
//     // Parallel fetch for speed: Accounts and Payees
//     const [accRes, payeeRes] = await Promise.all([
//       getUserAccounts(Number(userId)),
//       getUserPayees(Number(userId))
//     ]);

//     // 1. Handle Account Data for UI
//     if (accRes.success && accRes.data && accRes.data.length > 0) {
//       setAccount(accRes.data[0]);
//     } else {
//       setError(accRes.error || "No accounts found.");
//     }

//     // 2. Sync Payees to LocalStorage for ChatBot context
//     if (payeeRes.success && payeeRes.data) {
//       // We use the same key the ChatBot handlesend() looks for: payees_61
//       localStorage.setItem(`payees_${userId}`, JSON.stringify(payeeRes.data));
//       console.log("Chatbot context synced: Real payees from DB loaded.");
//     }

//   } catch (err) {
//     setError("Connection error while loading dashboard.");
//   } finally {
//     setIsLoading(false);
//   }
// }, [userId]);

// useEffect(() => {
//   loadDashboardData();
// }, [loadDashboardData]);
//   /* --------------------------------------------------
//      REFRESH BALANCE
//   -------------------------------------------------- */
//   const refreshBalance = useCallback(async () => {
//     if (!account) return;

//     setIsRefreshing(true);
//     const res = await getBalance(account.account_id);

//     if (res.success && res.data) {
//       setAccount((prev: Account | null) =>
//         prev
//           ? {
//               ...prev,
//               balance: res.data.balance,
//               currency: res.data.currency,
//             }
//           : prev
//       );

//       setSuccess("Balance updated successfully");
//       setTimeout(() => setSuccess(null), 2000);
//     } else {
//       setError(res.error || "Failed to refresh balance");
//     }

//     setIsRefreshing(false);
//   }, [account]);

//   /* --------------------------------------------------
//      AUTO-REFRESH ON CHATBOT ACTIONS
//      Listens for the 'balanceUpdated' event from ChatBot.tsx
//   -------------------------------------------------- */
//   useEffect(() => {
//   const syncPayeesForAI = async () => {
//     if (!userId) return;
    
//     try {
//       // Fetch the latest payees from your Oracle DB via the API
//       const response = await fetch(`/api/bank/users/${userId}/payees`);
//       const data = await response.json();
      
//       if (response.ok && Array.isArray(data)) {
//         // Store them in the exact key the ChatBot looks for: payees_61
//         localStorage.setItem(`payees_${userId}`, JSON.stringify(data));
//         console.log("Dashboard: Payees synced for Chatbot context.");
//       }
//     } catch (err) {
//       console.error("Dashboard: Failed to sync payees for AI context", err);
//     }
//   };

//   syncPayeesForAI();
// }, [userId]);
//   // useEffect(() => {
//   //   const handleBalanceUpdate = () => {
//   //     console.log("Dashboard: Refreshing balance due to Chatbot activity...");
//   //     refreshBalance();
//   //   };

//   //   window.addEventListener("balanceUpdated", handleBalanceUpdate);

//   //   return () => {
//   //     window.removeEventListener("balanceUpdated", handleBalanceUpdate);
//   //   };
//   // }, [refreshBalance]);

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-green-900 to-teal-900">
//         <div className="flex flex-col items-center gap-6">
//           <div className="relative">
//             <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
//             <Shield className="absolute inset-0 m-auto h-8 w-8 text-emerald-400" />
//           </div>
//           <div className="text-center space-y-2">
//             <p className="text-lg font-medium text-emerald-100">Loading SecureBank</p>
//             <p className="text-sm text-emerald-300/70">Securing your financial dashboard...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-950 via-green-900 to-teal-900 text-white overflow-hidden">
//       {/* Animated Background Elements */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
//         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
//       </div>

//       <Navbar onLogout={logout} userEmail={userEmail} />

//       <main className="container mx-auto px-4 py-8 max-w-7xl flex-1 relative z-10">
//         {/* Enhanced Header Section */}
//         <div className="mb-8">
//           <div className="relative overflow-hidden group">
//             <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
            
//             <div className="relative bg-gradient-to-br from-emerald-900/40 via-green-900/30 to-teal-900/40 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-6 shadow-2xl shadow-emerald-900/30">
//               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
//                 <div className="flex items-center gap-4">
//                   <div className="relative">
//                     <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/40 shadow-lg shadow-emerald-900/20">
//                       <User className="h-8 w-8 text-emerald-200" />
//                     </div>
//                     <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-900"></div>
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2 mb-1">
//                       <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-200 via-emerald-100 to-teal-200 bg-clip-text text-transparent">
//                         {/* UPDATED: Greeting now includes Full Name */}
//                         Welcome back, {fullName || 'Valued Member'}
//                       </h1>
//                       <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
//                     </div>
//                     <p className="text-emerald-100/90 font-medium">{userEmail}</p>
//                   </div>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-3">
//                   <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-500/30">
//                     <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
//                     <span className="text-sm font-medium text-emerald-300">Active Session</span>
//                   </div>
                  
//                   <div className="flex items-center gap-2">
//                     <button className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 group/btn">
//                       <Bell className="h-5 w-5 text-emerald-300 group-hover/btn:text-emerald-200 transition-colors" />
//                     </button>
//                     <button className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 group/btn">
//                       <Settings className="h-5 w-5 text-emerald-300 group-hover/btn:text-emerald-200 transition-colors" />
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="group relative p-4 rounded-xl bg-gradient-to-br from-emerald-900/30 to-emerald-900/10 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300">
//                   <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//                   <div className="relative flex items-center gap-3">
//                     <div className="p-2 rounded-lg bg-emerald-500/20">
//                       <Home className="h-5 w-5 text-emerald-300" />
//                     </div>
//                     <div>
//                       <p className="text-xs font-medium text-emerald-200/70 mb-1">Account Type</p>
//                       <p className="text-sm font-medium text-white">Premium Banking</p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="group relative p-4 rounded-xl bg-gradient-to-br from-teal-900/30 to-teal-900/10 border border-teal-500/20 hover:border-teal-400/40 transition-all duration-300">
//                   <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//                   <div className="relative flex items-center gap-3">
//                     <div className="p-2 rounded-lg bg-teal-500/20">
//                       <Calendar className="h-5 w-5 text-teal-300" />
//                     </div>
//                     <div>
//                       <p className="text-xs font-medium text-teal-200/70 mb-1">Member Since</p>
//                       <p className="text-sm font-medium text-white">2025</p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="group relative p-4 rounded-xl bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-500/20 hover:border-green-400/40 transition-all duration-300">
//                   <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//                   <div className="relative flex items-center gap-3">
//                     <div className="p-2 rounded-lg bg-green-500/20">
//                       <Lock className="h-5 w-5 text-green-300" />
//                     </div>
//                     <div>
//                       <p className="text-xs font-medium text-green-200/70 mb-1">Security Level</p>
//                       <p className="text-sm font-medium text-white">Maximum</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="mb-6 space-y-3">
//           {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
//           {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
//           <div className="lg:col-span-2 space-y-6">
//             {account && (
//               <div className="relative group">
//                 <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
//                 <div className="relative bg-gradient-to-br from-emerald-900/40 via-green-900/30 to-teal-900/40 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-8 shadow-2xl shadow-emerald-900/30">
//                   <div className="flex items-center justify-between mb-8">
//                     <div className="flex items-center gap-4">
//                       <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/40">
//                         <Wallet className="h-8 w-8 text-emerald-200" />
//                       </div>
//                       <div>
//                         <p className="text-lg font-semibold text-emerald-100">Main Account</p>
//                         <p className="text-sm text-emerald-300/70">Available Balance</p>
//                       </div>
//                     </div>
                    
//                     <Button
//                       onClick={refreshBalance}
//                       variant="ghost"
//                       size="sm"
//                       className="rounded-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 hover:text-white transition-all duration-200 group/refresh"
//                     >
//                       <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : "group-hover/refresh:rotate-180 transition-transform duration-500"}`} />
//                       Refresh
//                     </Button>
//                   </div>
                  
//                   <div className="mb-8">
//                     <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-300 via-emerald-200 to-teal-300 bg-clip-text text-transparent mb-2">
//                       {account.currency} {account.balance?.toLocaleString()}
//                     </p>
//                     <p className="text-sm text-emerald-300/70">Current available funds</p>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4 pt-6 border-t border-emerald-500/20">
//                     <div>
//                       <p className="text-xs text-emerald-300/60 mb-1">Account Number</p>
//                       {/* UPDATED: Displays full 8-digit account number as verified in DB */}
//                       <p className="text-sm font-medium text-emerald-100">{account.account_number}</p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-emerald-300/60 mb-1">Sort Code</p>
//                       <p className="text-sm font-medium text-emerald-100">{account.sort_code}</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all duration-300">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-semibold text-white flex items-center gap-2">
//                   <TrendingUp className="h-5 w-5 text-emerald-400" />
//                   Account Overview
//                 </h2>
//                 <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
//                   Live Updates
//                 </span>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div className="group p-5 rounded-xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/20">
//                   <div className="flex items-center gap-3 mb-3">
//                     <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
//                       <CreditCard className="h-5 w-5 text-emerald-300" />
//                     </div>
//                     <div>
//                       <p className="text-xs font-medium text-emerald-200/70">Available Balance</p>
//                       <p className="text-2xl font-bold text-white mt-1">
//                         {account?.currency} {account?.balance?.toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                   <p className="text-xs text-emerald-300/60">Real-time balance</p>
//                 </div>

//                 <div className="group p-5 rounded-xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/20">
//                   <div className="flex items-center gap-3 mb-3">
//                     <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
//                       <Shield className="h-5 w-5 text-emerald-300" />
//                     </div>
//                     <div>
//                       <p className="text-xs font-medium text-emerald-200/70">Account Status</p>
//                       <div className="flex items-center gap-2 mt-1">
//                         <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
//                         <p className="text-sm font-medium text-emerald-400">Active & Verified</p>
//                       </div>
//                     </div>
//                   </div>
//                   <p className="text-xs text-emerald-300/60">Account is fully operational</p>
//                 </div>

//                 <div className="group p-5 rounded-xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/20">
//                   <div className="flex items-center gap-3 mb-3">
//                     <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
//                       <Clock className="h-5 w-5 text-emerald-300" />
//                     </div>
//                     <div>
//                       <p className="text-xs font-medium text-emerald-200/70">Last Update</p>
//                       <p className="text-sm font-medium text-white mt-1">
//                         {new Date().toLocaleString('en-US', {
//                           month: 'short',
//                           day: 'numeric',
//                           hour: '2-digit',
//                           minute: '2-digit'
//                         })}
//                       </p>
//                     </div>
//                   </div>
//                   <p className="text-xs text-emerald-300/60">Balance updated just now</p>
//                 </div>

//                 <div className="group p-5 rounded-xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/20">
//                   <div className="flex items-center gap-3 mb-3">
//                     <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
//                       <FileText className="h-5 w-5 text-emerald-300" />
//                     </div>
//                     <div>
//                       <p className="text-xs font-medium text-emerald-200/70">Quick Actions</p>
//                       <p className="text-sm text-white mt-1">Send money instantly</p>
//                     </div>
//                   </div>
//                   <Link to="/transfer" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 group/link">
//                     Transfer Money 
//                     <span className="group-hover/link:translate-x-1 transition-transform">→</span>
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="space-y-6">
//             <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all duration-300">
//               <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
//                 <ArrowLeftRight className="h-5 w-5 text-emerald-400" />
//                 Quick Actions
//               </h2>

//               <div className="space-y-3">
//                 <Button variant="ghost" size="lg" onClick={refreshBalance} className="w-full justify-start gap-3 text-white hover:bg-white/10 hover:text-white transition-all duration-300 h-14 rounded-xl border border-white/10 hover:border-emerald-500/30 group">
//                   <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
//                     <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
//                   </div>
//                   <div className="text-left">
//                     <p className="font-medium">Refresh Balance</p>
//                     <p className="text-xs text-emerald-300/60">Get latest balance</p>
//                   </div>
//                 </Button>

//                 <Button variant="ghost" size="lg" asChild className="w-full justify-start gap-3 text-white hover:bg-white/10 hover:text-white transition-all duration-300 h-14 rounded-xl border border-white/10 hover:border-emerald-500/30 group">
//                   <Link to="/transfer">
//                     <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
//                       <ArrowLeftRight className="h-5 w-5" />
//                     </div>
//                     <div className="text-left">
//                       <p className="font-medium">Transfer Money</p>
//                       <p className="text-xs text-emerald-300/60">Send to other accounts</p>
//                     </div>
//                   </Link>
//                 </Button>

//                 <Button variant="ghost" size="lg" className="w-full justify-start gap-3 text-white hover:bg-white/10 hover:text-white transition-all duration-300 h-14 rounded-xl border border-white/10 hover:border-emerald-500/30 group">
//                   <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
//                     <FileText className="h-5 w-5" />
//                   </div>
//                   <div className="text-left">
//                     <p className="font-medium">View Statements</p>
//                     <p className="text-xs text-emerald-300/60">Monthly reports</p>
//                   </div>
//                 </Button>
//               </div>
//             </div>

//             <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-6 shadow-2xl shadow-emerald-900/20">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 rounded-lg bg-emerald-500/30">
//                   <Shield className="h-5 w-5 text-emerald-300" />
//                 </div>
//                 <h3 className="font-semibold text-white">Security Status</h3>
//               </div>
//               <p className="text-sm text-emerald-200/80 mb-4">Your account is protected with bank-level encryption and 2FA</p>
//               <div className="w-full bg-emerald-900/50 rounded-full h-2">
//                 <div className="bg-emerald-400 rounded-full h-2 w-4/5"></div>
//               </div>
//               <p className="text-xs text-emerald-300/60 mt-2">Security score: 85%</p>
//             </div>
//           </div>
//         </div>
//       </main>

//       <footer className="bg-gradient-to-t from-emerald-950/80 via-green-900/50 to-transparent backdrop-blur-lg border-t border-emerald-500/10 mt-auto p-6 relative z-10">
//         <div className="container mx-auto">
//           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
//             <div className="flex items-center gap-3">
//               <div className="p-2 rounded-lg bg-emerald-500/20"><Shield className="h-5 w-5 text-emerald-400" /></div>
//               <div>
//                 <p className="font-medium text-white">SecureBank</p>
//                 <p className="text-sm text-emerald-300/60">Trusted banking since 2025</p>
//               </div>
//             </div>
//             <div className="flex flex-wrap justify-center gap-6">
//               <a href="#" className="text-sm text-emerald-200/70 hover:text-emerald-300 transition-colors hover:underline">Privacy Policy</a>
//               <a href="#" className="text-sm text-emerald-200/70 hover:text-emerald-300 transition-colors hover:underline">Support Center</a>
//             </div>
//             <p className="text-sm text-emerald-300/60">© 2025 SecureBank. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>

//       {/* UPDATED: Passing userId and Name to personalize chatbot experience */}
//       <ChatBot userId={userId} userName={fullName} />
//     </div>
//   );
// }








// import { BalanceCard } from "@/components/BalanceCard";
// import { useState, useCallback, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { RefreshCw, ArrowLeftRight } from "lucide-react";
// import { Navbar } from "@/components/Navbar";
// import { Button } from "@/components/ui/button";
// import { AlertMessage } from "@/components/AlertMessage";
// import { useAuth } from "@/hooks/useAuth";
// import { getBalance, getUserAccounts } from "@/services/api";
// import type { Account } from "@/types/bank";

// export default function Dashboard() {
//   const { logout, userEmail, userId } = useAuth();

//   const [account, setAccount] = useState<Account | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   /* --------------------------------------------------
//      LOAD USER ACCOUNT
//   -------------------------------------------------- */
//   useEffect(() => {
//     async function load() {
//       if (!userId) return;

//       setIsLoading(true);
//       const res = await getUserAccounts(userId);

//       if (!res.success || !res.data || res.data.length === 0) {
//         setError("No accounts found.");
//         setIsLoading(false);
//         return;
//       }

//       setAccount(res.data[0]);
//       setIsLoading(false);
//     }

//     load();
//   }, [userId]);

//   /* --------------------------------------------------
//      REFRESH BALANCE
//   -------------------------------------------------- */
//   const refreshBalance = useCallback(async () => {
//     if (!account) return;

//     setIsRefreshing(true);
//     const res = await getBalance(account.account_id);

//     if (res.success && res.data) {
//       setAccount((prev) =>
//         prev
//           ? {
//               ...prev,
//               balance: res.data.balance,
//               currency: res.data.currency,
//             }
//           : prev
//       );

//       setSuccess("Balance updated");
//       setTimeout(() => setSuccess(null), 2000);
//     } else {
//       setError(res.error || "Failed to refresh balance");
//     }

//     setIsRefreshing(false);
//   }, [account]);

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-lg">
//         Loading...
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar onLogout={logout} userEmail={userEmail} />

//       <main className="container mx-auto px-4 py-8 max-w-7xl">
//         <h1 className="text-3xl font-bold mb-6">
//           Welcome back, {userEmail}
//         </h1>

//         {error && (
//           <AlertMessage
//             type="error"
//             message={error}
//             onClose={() => setError(null)}
//           />
//         )}

//         {success && (
//           <AlertMessage
//             type="success"
//             message={success}
//             onClose={() => setSuccess(null)}
//           />
//         )}

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* LEFT */}
//           <div className="lg:col-span-2 space-y-6">
//             {account && (
//               <BalanceCard
//                 balance={account.balance}
//                 currency={account.currency}
//                 onRefresh={refreshBalance}
//                 isRefreshing={isRefreshing}
//               />
//             )}

//             {/* ACCOUNT ACTIVITY */}
//             <div className="bg-card rounded-xl border p-6">
//               <h2 className="text-lg font-semibold mb-4">
//                 Account Activity
//               </h2>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 {/* BALANCE */}
//                 <div className="p-4 rounded-lg bg-muted">
//                   <p className="text-xs text-muted-foreground">
//                     Available Balance
//                   </p>
//                   <p className="text-lg font-semibold">
//                     {account?.currency} {account?.balance}
//                   </p>
//                 </div>

//                 {/* STATUS */}
//                 <div className="p-4 rounded-lg bg-muted">
//                   <p className="text-xs text-muted-foreground">
//                     Account Status
//                   </p>
//                   <p className="text-sm font-medium text-green-600">
//                     Active
//                   </p>
//                 </div>

//                 {/* LAST UPDATED */}
//                 <div className="p-4 rounded-lg bg-muted">
//                   <p className="text-xs text-muted-foreground">
//                     Last Balance Update
//                   </p>
//                   <p className="text-sm">
//                     {new Date().toLocaleString()}
//                   </p>
//                 </div>

//                 {/* TRANSFERS */}
//                 <div className="p-4 rounded-lg bg-muted">
//                   <p className="text-xs text-muted-foreground">
//                     Transfers
//                   </p>
//                   <p className="text-sm">
//                     Use <span className="font-medium">Transfer Money</span> to
//                     send funds
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* RIGHT */}
//           <div className="space-y-6">
//             <div className="bg-card rounded-xl border p-6">
//               <h2 className="text-lg font-semibold mb-4">
//                 Quick Actions
//               </h2>

//               <div className="space-y-3">
//                 <Button
//                   variant="outline"
//                   size="lg"
//                   className="w-full justify-start gap-3"
//                   onClick={refreshBalance}
//                 >
//                   <RefreshCw
//                     className={`h-5 w-5 ${
//                       isRefreshing ? "animate-spin" : ""
//                     }`}
//                   />
//                   Refresh Balance
//                 </Button>

//                 <Button
//                   variant="outline"
//                   size="lg"
//                   className="w-full justify-start gap-3"
//                   asChild
//                 >
//                   <Link to="/transfer">
//                     <ArrowLeftRight className="h-5 w-5" />
//                     Transfer Money
//                   </Link>
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }
