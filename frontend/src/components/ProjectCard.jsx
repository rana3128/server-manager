import React, { useState } from 'react';
import { restartProcess, stopProcess, startProcess, buildProject, deployProject, deleteProject } from '../api';
import DeleteConfirmModal from './DeleteConfirmModal';
import './ProjectCard.css';

function ProjectCard({ project, process, onRefresh, onViewLogs, onEdit }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showMessage = (msg, type = 'info') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAction = async (action, actionFn, successMsg) => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await actionFn();
      if (result.data.success) {
        showMessage(successMsg, 'success');
        setTimeout(onRefresh, 1000);
      } else {
        showMessage(result.data.error || `${action} failed`, 'error');
      }
    } catch (error) {
      showMessage(error.response?.data?.error || error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = () => {
    if (!process) return 'status-unknown';
    if (process.pm2_env?.status === 'online') return 'status-online';
    if (process.pm2_env?.status === 'stopping') return 'status-stopping';
    return 'status-offline';
  };

  const getStatusText = () => {
    if (!process) return '❓ Unknown';
    if (process.pm2_env?.status === 'online') return '✓ Online';
    if (process.pm2_env?.status === 'stopping') return '⏸ Stopping';
    return '✗ Offline';
  };



  const handleDelete = async () => {
    setLoading(true);
    setShowDeleteModal(false);
    
    try {
      const result = await deleteProject(project.id);
      if (result.data.success) {
        showMessage('Project deleted', 'success');
        setTimeout(onRefresh, 500);
      } else {
        showMessage(result.data.error || 'Delete failed', 'error');
      }
    } catch (error) {
      showMessage(error.response?.data?.error || error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-card">
      <div className="card-header">
        <h3>{project.name}</h3>
        <span className={`status-badge ${getStatusClass()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="card-info">
        <div className="info-row">
          <span className="info-label">Path:</span>
          <span className="info-text">{project.path}</span>
        </div>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="card-actions">
        <button
          className="btn btn-primary"
          onClick={() => handleAction('Restart', () => restartProcess(project.pm2Name), '✓ Restarted')}
          disabled={loading || !process}
        >
          🔄 Restart
        </button>

        <button
          className="btn btn-warning"
          onClick={() => handleAction('Build', () => buildProject(project.name), '✓ Built')}
          disabled={loading}
        >
          🔨 Build
        </button>

        <button
          className="btn btn-success"
          onClick={() => handleAction('Deploy', () => deployProject(project.name), '✓ Deployed')}
          disabled={loading}
        >
          🚀 Deploy
        </button>

        <button
          className="btn btn-info"
          onClick={() => onViewLogs(project.pm2Name)}
          disabled={!process}
        >
          📄 Logs
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => onEdit(project)}
          disabled={loading}
        >
          ✏️ Edit
        </button>

        <button
          className="btn btn-danger"
          onClick={() => setShowDeleteModal(true)}
          disabled={loading}
        >
          🗑️ Delete
        </button>
      </div>

      {showDeleteModal && (
        <DeleteConfirmModal
          projectName={project.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {loading && (
        <div className="card-loading">
          <div className="small-spinner"></div>
        </div>
      )}
    </div>
  );
}

export default ProjectCard;
