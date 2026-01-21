import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Transfer from "@/pages/Transfer";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LLOGIN PAGE */}
        <Route path="/" element={<Login />} />

        {/* DASHBOARD */}
        <Route path="/bank/dashboard" element={<Dashboard />} />

        {/* TRANSFER PAGE */}
        <Route path="/transfer" element={<Transfer />} />

        <Route path="/bank/signup" element={<Signup />} />


        {/* 404 FALLBACK */}
        <Route path="*" element={<div>400004 - Not found</div>} />

      </Routes>
    </BrowserRouter>
  );
}
