export interface Account {
  account_id: number;     // ✅ FIXED
  user_id: number;
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
  status: string;
}

export interface BalanceResponse {
  balance: number;
  currency: string;
}
