import React from 'react';
import './Header.css';

function Header({ onRefresh, autoRefresh, setAutoRefresh, loading }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>🚀 Lightsail Manager</h1>
          <span className="subtitle">AWS Lightsail MERN Projects Dashboard</span>
        </div>
        
        <div className="header-right">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (10s)</span>
          </label>
          
          <button 
            className="refresh-btn" 
            onClick={onRefresh}
            disabled={loading}
          >
            <span className={loading ? 'spinning' : ''}>🔄</span>
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
