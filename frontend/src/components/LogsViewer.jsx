import React, { useState, useEffect } from 'react';
import { getProcessLogs } from '../api';
import './LogsViewer.css';

function LogsViewer({ projectName, onClose }) {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lines, setLines] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = async () => {
    try {
      setError(null);
      const result = await getProcessLogs(projectName, lines);
      if (result.data.success) {
        setLogs(result.data.logs || 'No logs available');
      } else {
        setError(result.data.error || 'Failed to fetch logs');
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [projectName, lines]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, projectName, lines]);

  const handleLinesChange = (e) => {
    setLines(parseInt(e.target.value));
    setLoading(true);
  };

  return (
    <div className="logs-viewer-overlay" onClick={onClose}>
      <div className="logs-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="logs-header">
          <h3>📄 Logs: {projectName}</h3>
          <div className="logs-controls">
            <label>
              Lines:
              <select value={lines} onChange={handleLinesChange}>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </label>
            
            <label className="auto-refresh">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>

            <button onClick={fetchLogs} className="refresh-logs-btn">
              🔄 Refresh
            </button>

            <button onClick={onClose} className="close-btn">
              ✕
            </button>
          </div>
        </div>

        <div className="logs-content">
          {loading ? (
            <div className="logs-loading">
              <div className="spinner"></div>
              <p>Loading logs...</p>
            </div>
          ) : error ? (
            <div className="logs-error">
              <p>⚠️ {error}</p>
              <button onClick={fetchLogs}>Retry</button>
            </div>
          ) : (
            <pre className="logs-text">{logs}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default LogsViewer;
