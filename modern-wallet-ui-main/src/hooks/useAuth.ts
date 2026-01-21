import { useState, useEffect } from "react";
import { loginRequest, registerRequest } from "@/services/api";
import type { LoginSuccessResponse, LoginErrorResponse } from "@/types/auth";

export function useAuth() {
  const [userId, setUserId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------
  // LOAD SESSION ON PAGE LOAD
  // ---------------------------------------------------
  useEffect(() => {
    console.log("🔵 Checking localStorage for saved session...");

    const storedId = localStorage.getItem("userId");
    const storedEmail = localStorage.getItem("userEmail");

    if (storedId && storedEmail) {
      console.log("🟢 Session restored:", { storedId, storedEmail });
      setUserId(Number(storedId));
      setUserEmail(storedEmail);
      setIsAuthenticated(true);
    } else {
      console.warn("⚠ No saved session found.");
    }
  }, []);

  // ---------------------------------------------------
  // LOGIN FUNCTION
  // ---------------------------------------------------
  async function login(email: string, password: string) {
    setIsLoading(true);
    setError(null);

    console.log("🔵 Attempting login for:", email);

    const res: LoginSuccessResponse | LoginErrorResponse = await loginRequest(
      email,
      password
    );

    console.log("🟢 Login API response:", res);

    // ❌ ERROR CASE (success=false)
    if (!res.success) {
      const errMsg =
        (res as LoginErrorResponse).error || "Invalid login credentials";

      console.error("🔴 Login failed:", errMsg);

      setError(errMsg);
      setIsLoading(false);
      return false;
    }

    // ❌ MISSING USER DATA CASE
    if (!res.data) {
      console.error("🔴 Login failed: No user data returned in response.");
      setError("Login failed — no user data returned.");
      setIsLoading(false);
      return false;
    }

    // ✅ SUCCESS — Save session
    console.log("🟢 Login successful. Saving session...");

    localStorage.setItem("userId", res.data.user_id.toString());
    localStorage.setItem("userEmail", res.data.email);

    setUserId(res.data.user_id);
    setUserEmail(res.data.email);
    setIsAuthenticated(true);

    setIsLoading(false);
    return true;
  }


  async function register(full_name: string, email: string, password: string) {
    setIsLoading(true);
    setError(null);

    console.log("🔵 Attempting registration for:", email);

    const res = await registerRequest(full_name, email, password);

    console.log("🟢 Register API response:", res);

    if (!res.success) {
      const errMsg = res.error || "Registration failed";

      console.error("🔴 Registration failed:", errMsg);
      setError(errMsg);
      setIsLoading(false);
      return false;
    }

    console.log("🟢 Registration successful!");

    setIsLoading(false);
    return true;
  }

  // ---------------------------------------------------
  // LOGOUT FUNCTION
  // ---------------------------------------------------
  function logout() {
    console.log("🔵 Logging out user...");

    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");

    setUserId(null);
    setUserEmail(null);
    setIsAuthenticated(false);
  }

  return {
    userId,
    userEmail,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,    // <-- 🔥 NEW
    logout,
    setError,
  };
}
