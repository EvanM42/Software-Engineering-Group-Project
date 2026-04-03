import { useState } from "react";

export default function Navbar({ onSearch, onViewChange, currentView, onLogout }) {
  const [query, setQuery] = useState("");

  function handleSearch(e) {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  }

  return (
    <nav className="navbar">
      <div className="nav-left">
        <h2>UGA Transit</h2>
      </div>

      <div className="nav-right">

        <button
          className={currentView === "stops" ? "active" : ""}
          onClick={() => onViewChange("stops")}
        >
          Stops
        </button>

        <button
          className={currentView === "saved" ? "active" : ""}
          onClick={() => onViewChange("saved")}
        >
          Saved
        </button>

        <button onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}