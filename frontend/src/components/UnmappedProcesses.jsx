import React, { useState } from 'react';
import { autoMapPM2 } from '../api';
import './UnmappedProcesses.css';

function UnmappedProcesses({ processes, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAutoMap = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await autoMapPM2();
      if (result.data.success) {
        setMessage({
          type: 'success',
          text: `✓ Mapped ${result.data.count} process(es) to database`
        });
        setTimeout(() => {
          onRefresh();
        }, 1000);
      } else {
        setMessage({
          type: 'error',
          text: result.data.error || 'Failed to map processes'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unmapped-processes">
      <div className="unmapped-header">
        <div>
          <h2>⚠️ Unmapped PM2 Processes ({processes.length})</h2>
          <p className="unmapped-subtitle">
            Found {processes.length} PM2 process(es) running but not in database
          </p>
        </div>
        <button 
          className="auto-map-btn" 
          onClick={handleAutoMap}
          disabled={loading}
        >
          {loading ? '⏳ Mapping...' : '🔗 Auto-Map All'}
        </button>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="unmapped-list">
        {processes.map((process, index) => (
          <div key={index} className="unmapped-item">
            <div className="unmapped-icon">📦</div>
            <div className="unmapped-info">
              <div className="unmapped-name">{process.name}</div>
              <div className="unmapped-details">
                <span className="detail-item">
                  <strong>Status:</strong> {process.pm2_env?.status || 'unknown'}
                </span>
                <span className="detail-item">
                  <strong>PID:</strong> {process.pid || 'N/A'}
                </span>
                <span className="detail-item">
                  <strong>Memory:</strong> {process.monit?.memory ? (process.monit.memory / 1024 / 1024).toFixed(0) + ' MB' : 'N/A'}
                </span>
                <span className="detail-item">
                  <strong>CPU:</strong> {process.monit?.cpu || 0}%
                </span>
              </div>
              {process.pm2_env?.pm_cwd && (
                <div className="unmapped-path">
                  📁 {process.pm2_env.pm_cwd}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UnmappedProcesses;
