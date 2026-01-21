import axios from "axios";
import type { Account, BalanceResponse } from "@/types/bank";
import type { LoginSuccessResponse, LoginErrorResponse } from "@/types/auth";

const api = axios.create({
  baseURL: "https://uia037.dev.openconsultinguk.com/api",
});

/* --------------------------------------------------
   REGISTER
-------------------------------------------------- */
export async function registerRequest(
  full_name: string,
  email: string,
  password: string
) {
  try {
    // ❌ WRONG: const res = await api.post("/bank/users", {
    // ✅ FIXED:
    const res = await api.post("/auth/register", {
      full_name,
      email,
      password,
    });

    return { success: true, data: res.data };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.detail || "Registration failed",
    };
  }
}
/* --------------------------------------------------
   LOGIN
-------------------------------------------------- */
export async function loginRequest(
  email: string,
  password: string
): Promise<LoginSuccessResponse | LoginErrorResponse> {
  try {
    const res = await api.post<LoginSuccessResponse>("/auth/login", {
      email,
      password,
    });

    return res.data;
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.detail || "Login failed",
    };
  }
}

/* --------------------------------------------------
   GET USER ACCOUNTS
-------------------------------------------------- */
export async function getUserAccounts(userId: number): Promise<{
  success: boolean;
  data?: Account[];
  error?: string;
}> {
  try {
    const res = await api.get<{ success: boolean; data: Account[] }>(
      `/bank/users/${userId}/accounts`
    );

    return {
      success: res.data.success,
      data: res.data.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.detail || "Could not load accounts",
    };
  }
}

/* --------------------------------------------------
   GET USER PAYEES (Add this for Chatbot context)
-------------------------------------------------- */
export async function getUserPayees(userId: number): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    // This matches the logs showing GET /api/bank/users/61/payees
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/bank/users/${userId}/payees`
    );

    return {
      success: true,
      data: res.data, // This contains the list with Heet Patel, etc.
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.detail || "Could not load payees",
    };
  }
}

/* --------------------------------------------------
   DELETE PAYEE
-------------------------------------------------- */
export async function deletePayee(userId: number, payeeId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // This matches the FastAPI route: /bank/users/{user_id}/payees/{payee_id}
    const res = await api.delete<{ success: boolean }>(
      `/bank/users/${userId}/payees/${payeeId}`
    );

    return {
      success: res.data.success,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.detail || "Failed to delete payee from database",
    };
  }
}
/* --------------------------------------------------
   GET BALANCE ✅ FIXED
-------------------------------------------------- */
export async function getBalance(accountId: number): Promise<{
  success: boolean;
  data?: BalanceResponse;
  error?: string;
}> {
  try {
    const res = await api.get<{ success: boolean; data: BalanceResponse }>(
      `/bank/accounts/${accountId}/balance`
    );

    return {
      success: res.data.success,
      data: res.data.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.detail || "Could not fetch balance",
    };
  }
}
/* --------------------------------------------------
   GET TRANSACTIONS
-------------------------------------------------- */
export async function getTransactions(accountId: number): Promise<{
  success: boolean;
  data?: {
    transaction_id: number;
    amount: number;
    type: "debit" | "credit";
    description: string;
    created_at: string;
  }[];
  error?: string;
}> {
  try {
    const res = await api.get<{
      success: boolean;
      data: any[];
    }>(`/bank/accounts/${accountId}/transactions`);

    return {
      success: res.data.success,
      data: res.data.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err.response?.data?.detail || "Could not load transactions",
    };
  }
}


/* --------------------------------------------------
   TRANSFER MONEY
-------------------------------------------------- */
export async function transferMoney(data: {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  description: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const res = await api.post<{ success: boolean }>(
      "/bank/accounts/transfer",
      data
    );

    return {
      success: res.data.success,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.detail || "Transfer failed",
    };
  }
}

export default api;

/* --------------------------------------------------
   TRANSFER TO RECIPIENT
-------------------------------------------------- */
export async function transferToRecipient(data: {
  sender_account_id: number;
  recipient_name: string;
  recipient_account_number: string;
  recipient_sort_code: string;
  amount: number;
  description: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await api.post<{ success: boolean }>("/bank/accounts/transfer_to_recipient", data);
    return { success: res.data.success };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.detail || "Transfer failed" };
  }
}
