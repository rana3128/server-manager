import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import UnmappedProcesses from './components/UnmappedProcesses';
import { getPM2Status, getProjects, getMongoDBStatus, syncPM2 } from './api';

function App() {
  const [projects, setProjects] = useState([]);
  const [pm2Processes, setPm2Processes] = useState([]);
  const [unmappedProcesses, setUnmappedProcesses] = useState([]);
  const [mongoStatus, setMongoStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [projectsRes, pm2Res, mongoRes, syncRes] = await Promise.all([
        getProjects(),
        getPM2Status(),
        getMongoDBStatus(),
        syncPM2()
      ]);

      setProjects(projectsRes.data.projects || []);
      setPm2Processes(pm2Res.data.processes || []);
      setMongoStatus(mongoRes.data.mongodb || {});
      setUnmappedProcesses(syncRes.data.unmappedProcesses || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  return (
    <div className="App">
      <Header 
        onRefresh={handleRefresh}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        loading={loading}
      />
      
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      <div className="container">
        {unmappedProcesses.length > 0 && (
          <UnmappedProcesses 
            processes={unmappedProcesses}
            onRefresh={fetchData}
          />
        )}

        <Dashboard 
          projects={projects}
          pm2Processes={pm2Processes}
          onRefresh={fetchData}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default App;
