import React, { useState } from "react";
import "./App.css";
import InventoryDashboard from "./InventoryDashboard"; // separate component

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ Hardcoded credentials
  const validUser = {
    username: "admin",
    password: "tiger123",
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === validUser.username && password === validUser.password) {
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Invalid username or password");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-600">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-80">
          <h2 className="text-2xl font-bold mb-6 text-center text-red-600">
            Tiger Mango Login
          </h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="p-2 border rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-2 border rounded-lg"
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <InventoryDashboard />;
}
