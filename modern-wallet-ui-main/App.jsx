import { useState } from "react";

function App() {
  const [balance, setBalance] = useState(null);
  const [inputId, setInputId] = useState("");

  async function checkBalance() {
    try {
      const res = await fetch(`/api/check_balance/${inputId}`);
      const data = await res.json();
      setBalance(JSON.stringify(data, null, 2));
    } catch (err) {
      setBalance("Error connecting to API");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Test API – Check Balance</h1>

      <input 
        placeholder="Enter Account ID" 
        value={inputId}
        onChange={(e) => setInputId(e.target.value)}
      />

      <button onClick={checkBalance}>Check Balance</button>

      <pre>{balance}</pre>
    </div>
  );
}

export default App;
