import { RefreshCw } from "lucide-react";

export function BalanceCard({
  balance,
  currency,
  onRefresh,
  isRefreshing
}: {
  balance: number | null;
  currency: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}) {

  // Correct formatting
  const displayBalance =
    balance === null
      ? "Loading..."
      : `${currency} ${balance.toFixed(2)}`;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg relative">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-80">Available Balance</p>
          <p className="text-lg font-medium opacity-90">Main Account</p>

          <p className="text-4xl font-bold mt-3">
            {displayBalance}
          </p>
        </div>

        <button onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-6 w-6 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}

