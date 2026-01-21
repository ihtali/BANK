import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { ArrowLeft, Send, DollarSign, User, Star, Trash2, Shield, Zap, Bookmark, Wallet, TrendingUp, Users, Activity, Target, Lock, CreditCard, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertMessage } from "@/components/AlertMessage";

import { useAuth } from "@/hooks/useAuth";
import { getUserAccounts, transferToRecipient, deletePayee } from "@/services/api";
import type { Account } from "@/types/bank";

interface SavedPayee {
  payeeId: number; 
  name: string;
  accountNumber: string;
  sortCode: string;
}

export default function Transfer() {
  const { logout, userEmail, userId } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recipientName, setRecipientName] = useState("");
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [recipientSortCode, setRecipientSortCode] = useState("");
  const [formattedSortCode, setFormattedSortCode] = useState("");
  const [amount, setAmount] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [savedPayees, setSavedPayees] = useState<SavedPayee[]>([]);
  const [shouldSavePayee, setShouldSavePayee] = useState(false);

  // Load Accounts and Payees
  useEffect(() => {
    async function loadInitialData() {
      if (!userId) return;

      const res = await getUserAccounts(userId);
      if (res.success && res.data) {
        setAccounts(res.data);
      } else {
        setError("Could not load your account details.");
      }

      try {
        const response = await fetch(`/api/bank/users/${userId}/payees`);
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map((p: any) => ({
            payeeId: p.PAYEE_ID || p.payee_id || p.ID,
            name: p.NAME || p.name || p.RECIPIENT_NAME,
            accountNumber: p.ACCOUNT_NUMBER || p.account_number,
            sortCode: p.SORT_CODE || p.sort_code
          }));
          setSavedPayees(mapped);
          localStorage.setItem(`payees_${userId}`, JSON.stringify(mapped));
        }
      } catch (err) {
        console.error("Backend fetch error:", err);
      }
    }

    loadInitialData();
  }, [userId]);

  const formatSortCode = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 2 === 0 && i < 6) formatted += '-';
      formatted += digits[i];
    }
    return formatted;
  };

  const handleSortCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatSortCode(value);
    setFormattedSortCode(formatted);
    setRecipientSortCode(formatted.replace(/\D/g, ''));
  };

  const handleSelectPayee = (payee: SavedPayee) => {
    setRecipientName(payee.name);
    setRecipientAccountNumber(payee.accountNumber);
    setFormattedSortCode(formatSortCode(payee.sortCode));
    setRecipientSortCode(payee.sortCode);
  };

  const removePayee = async (payeeId: number) => {
    if (!userId || !window.confirm("Delete this payee permanently?")) return;

    try {
      const res = await deletePayee(Number(userId), payeeId);
      if (res.success) {
        const updated = savedPayees.filter(p => p.payeeId !== payeeId);
        setSavedPayees(updated);
        localStorage.setItem(`payees_${userId}`, JSON.stringify(updated));
        setSuccess("Payee removed successfully.");
      } else {
        setError("Failed to delete payee from database.");
      }
    } catch (err) {
      setError("Error connecting to server for deletion.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!accounts[0]?.account_id) {
      setError("Account not loaded yet");
      return;
    }

    const senderAccountId = accounts[0].account_id;
    const amountValue = Number(amount);

    if (!recipientName.trim()) { setError("Enter recipient full name"); return; }
    if (recipientAccountNumber.length !== 8) { setError("Enter a valid 8-digit account number"); return; }
    if (recipientSortCode.length !== 6) { setError("Enter a valid 6-digit sort code"); return; }
    if (!amountValue || amountValue <= 0) { setError("Enter a valid amount"); return; }

    setIsLoading(true);

    try {
      const res = await transferToRecipient({
        sender_account_id: senderAccountId,
        recipient_name: recipientName,
        recipient_account_number: recipientAccountNumber,
        recipient_sort_code: recipientSortCode, // Send raw digits
        amount: amountValue,
        description: "Secure Web Transfer",
      });

      if (!res.success) {
        setError(res.error || "Transfer failed");
      } else {
        if (shouldSavePayee) {
          const isDuplicate = savedPayees.some(p => p.accountNumber === recipientAccountNumber);
          if (!isDuplicate) {
            await fetch(`/api/bank/users/${userId}/payees`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: recipientName,
                account_number: recipientAccountNumber,
                sort_code: recipientSortCode,
                nickname: recipientName
              }),
            });
            const refresh = await fetch(`/api/bank/users/${userId}/payees`);
            const newData = await refresh.json();
            const mapped = newData.map((p: any) => ({
              payeeId: p.PAYEE_ID || p.payee_id || p.ID,
              name: p.NAME || p.name || p.RECIPIENT_NAME,
              accountNumber: p.ACCOUNT_NUMBER || p.account_number,
              sortCode: p.SORT_CODE || p.sort_code
            }));
            setSavedPayees(mapped);
            localStorage.setItem(`payees_${userId}`, JSON.stringify(mapped));
          }
        }

        setSuccess("✅ Transfer successful! Funds will arrive instantly.");
        setRecipientName(""); setRecipientAccountNumber(""); setRecipientSortCode(""); setFormattedSortCode(""); setAmount(""); setShouldSavePayee(false);
      }
    } catch (err: any) {
      setError("Connection error during transfer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400/3 rounded-full blur-2xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDIwMTkiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0aDF2MWgtMXpNMzQgMzZoMXYxaC0xeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
      </div>

      <Navbar onLogout={logout} userEmail={userEmail} />

      <main className="container mx-auto px-4 py-8 max-w-6xl flex-1 relative z-10">
        {/* Back Navigation */}
        <Link to="/bank/dashboard" className="inline-flex items-center gap-2 text-slate-300 hover:text-emerald-100 mb-8 group transition-colors">
          <div className="p-2 rounded-lg bg-slate-800/40 group-hover:bg-emerald-600/30 transition-colors border border-slate-700/40">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600/40 to-cyan-600/40 border border-emerald-500/30 shadow-lg shadow-emerald-900/20">
                <Send className="h-10 w-10 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                  Secure Transfer
                </h1>
                <p className="text-slate-300/70 mt-1">Send money securely to any bank account</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-slate-800/60 to-emerald-900/40 border border-slate-600/40">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">Instant Transfers</span>
                </div>
              </div>
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-slate-800/60 to-teal-900/40 border border-slate-600/40">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">256-bit Encryption</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="group p-4 rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-700/20 border border-slate-600/30 hover:border-emerald-500/40 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600/30 group-hover:bg-emerald-600/40 transition-colors">
                  <Wallet className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300/70 mb-1">From Account</p>
                  <p className="text-sm font-medium text-white font-mono">
                    {accounts[0]?.account_number ? `•••• ${accounts[0].account_number.slice(-4)}` : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
            <div className="group p-4 rounded-xl bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border border-emerald-700/30 hover:border-cyan-500/40 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-600/30 group-hover:bg-cyan-600/40 transition-colors">
                  <TrendingUp className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-xs font-medium text-cyan-300/70 mb-1">Available Balance</p>
                  <p className="text-sm font-medium text-white">
                    {accounts[0]?.currency} {accounts[0]?.balance?.toLocaleString() || '0.00'}
                  </p>
                </div>
              </div>
            </div>
            <div className="group p-4 rounded-xl bg-gradient-to-br from-slate-800/40 to-emerald-900/20 border border-slate-600/30 hover:border-teal-500/40 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-600/30 group-hover:bg-teal-600/40 transition-colors">
                  <Users className="h-5 w-5 text-teal-300" />
                </div>
                <div>
                  <p className="text-xs font-medium text-teal-300/70 mb-1">Saved Payees</p>
                  <p className="text-sm font-medium text-white">{savedPayees.length} contacts</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="mb-8 space-y-3">
          {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
          {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Saved Payees */}
          <div className="lg:col-span-1 space-y-6">
            {/* Saved Payees Card */}
            {savedPayees.length > 0 ? (
              <div className="bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-emerald-900/30 backdrop-blur-xl rounded-2xl border border-slate-700/40 p-6 shadow-2xl shadow-emerald-900/20 h-fit">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600/30 to-cyan-600/30">
                      <Star className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Saved Payees</h3>
                      <p className="text-sm text-slate-300/60">Quick select recipients</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
                    {savedPayees.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {savedPayees.map((payee) => (
                    <div key={payee.payeeId} className="group">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-600/30 hover:border-emerald-500/40 hover:bg-slate-800/60 transition-all duration-300">
                        <button
                          onClick={() => handleSelectPayee(payee)}
                          className="flex-1 text-left group-hover:translate-x-1 transition-transform"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-700/40 group-hover:bg-emerald-600/30 transition-colors">
                              <User className="h-4 w-4 text-slate-300 group-hover:text-emerald-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">{payee.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-slate-400/60">Acct: ••••{payee.accountNumber.slice(-4)}</p>
                                <span className="text-xs text-slate-400/60">|</span>
                                <p className="text-xs text-slate-400/60">Sort: {formatSortCode(payee.sortCode)}</p>
                              </div>
                            </div>
                          </div>
                        </button>
                        <button 
                          onClick={() => removePayee(payee.payeeId)}
                          className="p-2 rounded-lg bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-300 ml-2 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove payee"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-emerald-900/30 backdrop-blur-xl rounded-2xl border border-slate-700/40 p-8 shadow-2xl shadow-emerald-900/20 text-center h-fit">
                <div className="p-3 rounded-xl bg-emerald-600/10 inline-block mb-4">
                  <Users className="h-10 w-10 text-slate-400/50" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Saved Payees</h3>
                <p className="text-sm text-slate-300/60 mb-4">Your saved recipients will appear here</p>
                <div className="text-xs text-slate-400/40">
                  💡 Check "Save recipient" after a transfer
                </div>
              </div>
            )}

            {/* Transfer Safety Card */}
            <div className="bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-cyan-900/40 backdrop-blur-xl rounded-2xl border border-emerald-700/40 p-6 shadow-2xl shadow-teal-900/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600/40 to-cyan-600/40">
                  <Shield className="h-5 w-5 text-emerald-300" />
                </div>
                <h4 className="font-semibold text-white">Transfer Safety</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5"></div>
                  <p className="text-sm text-slate-200/80">Real-time fraud detection</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 mt-1.5"></div>
                  <p className="text-sm text-slate-200/80">Encrypted end-to-end</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-teal-400 mt-1.5"></div>
                  <p className="text-sm text-slate-200/80">Instant confirmation</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5"></div>
                  <p className="text-sm text-slate-200/80">24/7 customer support</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Transfer Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Transfer Form Card */}
            <div className="bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-emerald-900/40 backdrop-blur-xl rounded-2xl border border-slate-700/40 p-8 shadow-2xl shadow-emerald-900/30">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600/30 to-cyan-600/30">
                    <Bookmark className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">New Transfer</h2>
                    <p className="text-sm text-slate-300/60">Fill in recipient details</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs text-emerald-400 font-medium">Secure Session</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Recipient Name */}
                <div className="space-y-3">
                  <Label className="text-slate-200/80 text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-400" />
                    Recipient Full Name
                  </Label>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Input
                      className="relative pl-12 h-14 rounded-xl bg-slate-800/30 text-white placeholder-slate-400/50 border-slate-600/30 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="Enter recipient's full name"
                      value={recipientName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRecipientName(e.target.value)}
                      required
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400/70" />
                  </div>
                </div>

                {/* Account Number & Sort Code */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-slate-200/80 text-sm font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-emerald-400" />
                      Account Number
                      <span className="text-xs text-slate-400/60 ml-auto">8 digits</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Input
                        className="relative pl-12 h-14 rounded-xl bg-slate-800/30 text-white placeholder-slate-400/50 border-slate-600/30 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="XXXXXXXX"
                        value={recipientAccountNumber}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setRecipientAccountNumber(e.target.value)}
                        maxLength={8}
                        required
                      />
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400/70" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-slate-200/80 text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-400" />
                      Sort Code
                      <span className="text-xs text-slate-400/60 ml-auto">XX-XX-XX</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Input
                        className="relative pl-12 h-14 rounded-xl bg-slate-800/30 text-white placeholder-slate-400/50 border-slate-600/30 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="12-34-56"
                        value={formattedSortCode}
                        onChange={handleSortCodeChange}
                        maxLength={8}
                        required
                      />
                      <Activity className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400/70" />
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-3">
                  <Label className="text-slate-200/80 text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    Amount
                    <span className="text-xs text-slate-400/60 ml-auto">{accounts[0]?.currency || "GBP"}</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Input
                      className="relative pl-12 h-14 rounded-xl bg-slate-800/30 text-white placeholder-slate-400/50 border-slate-600/30 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 text-lg font-semibold"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                      required
                    />
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400/70" />
                  </div>
                </div>

                {/* Save Payee Option */}
                <div className="group flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-slate-800/40 to-emerald-900/30 border border-slate-600/30 hover:border-emerald-500/40 transition-all duration-300">
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      id="savePayee"
                      checked={shouldSavePayee}
                      onChange={(e) => setShouldSavePayee(e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="savePayee" className="text-sm font-medium text-white cursor-pointer">
                      Save this recipient
                    </label>
                    <p className="text-sm text-slate-300/60 mt-1">
                      Store this payee in your secure cloud for future transfers. Accessible from any device.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-600/30">
                    <Star className="h-4 w-4 text-emerald-300" />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 group/button mt-8"
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      <span>Processing Secure Transfer...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-2 rounded-lg bg-white/20 group-hover/button:bg-white/30 transition-colors">
                        <Send className="h-5 w-5" />
                      </div>
                      <span className="text-base">Send Money Securely</span>
                      <Shield className="h-4 w-4 ml-auto group-hover/button:scale-110 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Info Footer */}
              <div className="mt-10 pt-6 border-t border-slate-700/40">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-xs text-slate-400/60">Speed</p>
                      <p className="text-sm font-medium text-white">Instant Processing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-xs text-slate-400/60">Security</p>
                      <p className="text-sm font-medium text-white">Bank-Grade Encryption</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40">
                    <Target className="h-4 w-4 text-teal-400" />
                    <div>
                      <p className="text-xs text-slate-400/60">Support</p>
                      <p className="text-sm font-medium text-white">24/7 Customer Care</p>
                    </div>
                  </div>
                </div>
              </div>

            {/* Transfer Limits Note */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-800/40 to-emerald-900/30 border border-slate-600/30 backdrop-blur-sm">
              <p className="text-sm text-center text-slate-200 flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Transfers are processed in real-time with 256-bit encryption. Daily transfer limit: {accounts[0]?.currency || "GBP"} 10,000
                <Shield className="h-4 w-4 text-emerald-400" />
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
// import { useState, useEffect, FormEvent, ChangeEvent } from "react";
// import { ArrowLeft, Send, CreditCard, DollarSign, User, Shield, Lock, Zap, TrendingUp, Wallet, Star, Trash2 } from "lucide-react";
// import { Link } from "react-router-dom";

// import { Navbar } from "@/components/Navbar";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { AlertMessage } from "@/components/AlertMessage";

// import { useAuth } from "@/hooks/useAuth";
// import { getUserAccounts, transferToRecipient } from "@/services/api";
// import type { Account } from "@/types/bank";

// // Define Payee Type to match our Database structure
// interface SavedPayee {
//   name: string;
//   accountNumber: string;
//   sortCode: string;
// }

// export default function Transfer() {
//   const { logout, userEmail, userId } = useAuth();

//   const [accounts, setAccounts] = useState<Account[]>([]);
//   const [recipientName, setRecipientName] = useState("");
//   const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
//   const [recipientSortCode, setRecipientSortCode] = useState("");
//   const [formattedSortCode, setFormattedSortCode] = useState("");
//   const [amount, setAmount] = useState("");

//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   // --- DATABASE DRIVEN PAYEES ---
//   const [savedPayees, setSavedPayees] = useState<SavedPayee[]>([]);
//   const [shouldSavePayee, setShouldSavePayee] = useState(false);

//   // Load Accounts and Payees from Backend on mount
//   useEffect(() => {
//     async function loadInitialData() {
//       if (!userId) return;

//       // 1. Load User Accounts
//       const res = await getUserAccounts(userId);
//       if (res.success && res.data) {
//         setAccounts(res.data);
//       } else {
//         setError("Could not load your account details.");
//       }

//       // 2. Load Payees from DATABASE (replacing localStorage)
//       try {
//         const response = await fetch(`/api/bank/users/${userId}/payees`);
//         if (response.ok) {
//           const data = await response.json();
//           // Map Oracle response (case-insensitive) to our interface
//           const mapped = data.map((p: any) => ({
//             name: p.NAME || p.name,
//             accountNumber: p.ACCOUNT_NUMBER || p.account_number,
//             sortCode: p.SORT_CODE || p.sort_code
//           }));
//           setSavedPayees(mapped);
//         }
//       } catch (err) {
//         console.error("Backend fetch error:", err);
//       }
//     }

//     loadInitialData();
//   }, [userId]);

//   const formatSortCode = (value: string) => {
//     const digits = value.replace(/\D/g, '');
//     let formatted = '';
//     for (let i = 0; i < digits.length; i++) {
//       if (i > 0 && i % 2 === 0 && i < 6) {
//         formatted += '-';
//       }
//       formatted += digits[i];
//     }
//     return formatted;
//   };

//   const handleSortCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     const formatted = formatSortCode(value);
//     setFormattedSortCode(formatted);
//     const rawDigits = formatted.replace(/\D/g, '');
//     setRecipientSortCode(rawDigits);
//   };

//   const handleSelectPayee = (payee: SavedPayee) => {
//     setRecipientName(payee.name);
//     setRecipientAccountNumber(payee.accountNumber);
//     setFormattedSortCode(formatSortCode(payee.sortCode));
//     setRecipientSortCode(payee.sortCode);
//   };

//   // --- UPDATED: REMOVE PAYEE (Logic for local UI update) ---
//   const removePayee = async (accNum: string) => {
//     // For now, we update the UI. You can add a DELETE fetch call here later.
//     const updated = savedPayees.filter(p => p.accountNumber !== accNum);
//     setSavedPayees(updated);
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setSuccess(null);

//     if (!accounts[0]?.account_id) {
//       setError("Account not loaded yet");
//       return;
//     }

//     const senderAccountId = accounts[0].account_id;
//     const amountValue = Number(amount);

//     // Validations
//     if (!recipientName.trim()) { setError("Enter recipient full name"); return; }
//     if (recipientAccountNumber.length !== 8) { setError("Enter a valid 8-digit account number"); return; }
//     if (recipientSortCode.length !== 6) { setError("Enter a valid 6-digit sort code"); return; }
//     if (!amountValue || amountValue <= 0) { setError("Enter a valid amount"); return; }

//     setIsLoading(true);

//     try {
//       const res = await transferToRecipient({
//         sender_account_id: senderAccountId,
//         recipient_name: recipientName,
//         recipient_account_number: recipientAccountNumber,
//         recipient_sort_code: recipientSortCode,
//         amount: amountValue,
//         description: "Secure Web Transfer",
//       });

//       if (!res.success) {
//         setError(res.error || "Transfer failed");
//       } else {
//         // --- NEW: SAVE PAYEE TO DATABASE VIA POST ---
//         if (shouldSavePayee) {
//           const isDuplicate = savedPayees.some(p => p.accountNumber === recipientAccountNumber);
//           if (!isDuplicate) {
//             await fetch(`/api/bank/users/${userId}/payees`, {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 name: recipientName,
//                 account_number: recipientAccountNumber,
//                 sort_code: recipientSortCode,
//                 nickname: recipientName
//               }),
//             });
//             // Re-fetch list to stay synced
//             const refresh = await fetch(`/api/bank/users/${userId}/payees`);
//             const newData = await refresh.json();
//             setSavedPayees(newData.map((p: any) => ({
//               name: p.NAME || p.name,
//               accountNumber: p.ACCOUNT_NUMBER || p.account_number,
//               sortCode: p.SORT_CODE || p.sort_code
//             })));
//           }
//         }

//         setSuccess("✅ Transfer successful! Your money has been sent securely.");
//         setRecipientName("");
//         setRecipientAccountNumber("");
//         setRecipientSortCode("");
//         setFormattedSortCode("");
//         setAmount("");
//         setShouldSavePayee(false);
//       }
//     } catch (err: any) {
//       setError(err.message || "Connection error during transfer");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-950 via-green-900 to-teal-900 text-white overflow-hidden">
//       {/* Background Orbs */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
//         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
//       </div>

//       <Navbar onLogout={logout} userEmail={userEmail} />

//       <main className="container mx-auto px-4 py-8 max-w-2xl flex-1 relative z-10">
//         <Link
//           to="/bank/dashboard"
//           className="inline-flex items-center gap-2 text-emerald-200 hover:text-emerald-100 mb-6 group transition-colors duration-200"
//         >
//           <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
//             <ArrowLeft className="h-4 w-4" />
//           </div>
//           <span className="text-sm font-medium">Back to Dashboard</span>
//         </Link>

//         <div className="mb-10 text-center">
//           <div className="inline-flex items-center gap-3 mb-4">
//             <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
//               <Send className="h-8 w-8 text-emerald-300" />
//             </div>
//             <div className="text-left">
//               <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">
//                 Secure Transfer
//               </h1>
//               <p className="text-emerald-200/80 text-lg">Database-Synced Banking</p>
//             </div>
//           </div>
//         </div>

//         <div className="mb-8 space-y-3">
//           {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}
//           {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}
//         </div>

//         {/* --- QUICK SELECT FROM DATABASE --- */}
//         {savedPayees.length > 0 && (
//           <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-emerald-500/20 backdrop-blur-sm">
//             <div className="flex items-center gap-2 mb-3 px-1">
//               <Star className="h-4 w-4 text-emerald-400" />
//               <h3 className="text-sm font-semibold text-emerald-100 uppercase tracking-wider">Saved Payees</h3>
//             </div>
//             <div className="flex flex-wrap gap-2">
//               {savedPayees.map((payee) => (
//                 <div key={payee.accountNumber} className="group flex items-center">
//                   <button
//                     onClick={() => handleSelectPayee(payee)}
//                     className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all text-sm text-emerald-100 flex items-center gap-2"
//                   >
//                     <User className="h-3 w-3 text-emerald-400" />
//                     {payee.name}
//                   </button>
//                   <button 
//                     onClick={() => removePayee(payee.accountNumber)}
//                     className="ml-1 p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
//                   >
//                     <Trash2 className="h-3 w-3" />
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Transfer Form */}
//         <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl relative">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="space-y-2">
//               <Label className="text-emerald-100/80 text-sm">Recipient Full Name</Label>
//               <Input
//                 className="bg-white/5 border-emerald-500/20 text-white h-12"
//                 placeholder="John Doe"
//                 value={recipientName}
//                 onChange={(e) => setRecipientName(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label className="text-emerald-100/80 text-sm">Account Number</Label>
//                 <Input
//                   className="bg-white/5 border-emerald-500/20 text-white h-12"
//                   placeholder="8 digits"
//                   value={recipientAccountNumber}
//                   onChange={(e) => setRecipientAccountNumber(e.target.value)}
//                   maxLength={8}
//                   required
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label className="text-emerald-100/80 text-sm">Sort Code</Label>
//                 <Input
//                   className="bg-white/5 border-emerald-500/20 text-white h-12"
//                   placeholder="12-34-56"
//                   value={formattedSortCode}
//                   onChange={handleSortCodeChange}
//                   maxLength={8}
//                   required
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label className="text-emerald-100/80 text-sm font-bold">Amount (GBP)</Label>
//               <div className="relative">
//                 <Input
//                   className="bg-white/10 border-emerald-400/30 text-white h-14 text-xl pl-10"
//                   type="number"
//                   step="0.01"
//                   placeholder="0.00"
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                   required
//                 />
//                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
//               </div>
//             </div>

//             <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
//               <input 
//                 type="checkbox" 
//                 id="savePayee"
//                 checked={shouldSavePayee}
//                 onChange={(e) => setShouldSavePayee(e.target.checked)}
//                 className="w-5 h-5 accent-emerald-500"
//               />
//               <label htmlFor="savePayee" className="text-sm text-emerald-100 cursor-pointer">
//                 Save this recipient to my Cloud Payees
//               </label>
//             </div>

//             <Button
//               type="submit"
//               className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-[1.01] transition-transform text-lg font-bold"
//               disabled={isLoading}
//             >
//               {isLoading ? "Processing Security Check..." : "Send Money Now"}
//             </Button>
//           </form>
//         </div>

//         <footer className="mt-8 text-center text-xs text-emerald-300/50">
//           <p>Protected by 256-bit bank-grade encryption</p>
//         </footer>
//       </main>
//     </div>
//   );
// }