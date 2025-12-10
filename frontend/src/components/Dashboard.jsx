import React, { useState } from 'react';
import ProjectCard from './ProjectCard';
import LogsViewer from './LogsViewer';
import ProjectManager from './ProjectManager';
import './Dashboard.css';

function Dashboard({ projects, pm2Processes, onRefresh, loading }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const getProcessForProject = (projectName) => {
    return pm2Processes.find(p => p.name === projectName);
  };

  const handleViewLogs = (projectName) => {
    setSelectedProject(projectName);
    setShowLogs(true);
  };

  const handleCloseLogs = () => {
    setShowLogs(false);
    setSelectedProject(null);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
  };

  const handleCloseEdit = () => {
    setEditingProject(null);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>🎯 Projects ({projects.length})</h2>
        <button 
          className="add-project-btn" 
          onClick={() => setShowAddProject(true)}
        >
          ➕ Add Project
        </button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects configured. Please check your .env file.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
              process={getProcessForProject(project.pm2Name)}
              onRefresh={onRefresh}
              onViewLogs={handleViewLogs}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {showLogs && (
        <LogsViewer
          projectName={selectedProject}
          onClose={handleCloseLogs}
        />
      )}

      {showAddProject && (
        <ProjectManager
          onClose={() => setShowAddProject(false)}
          onProjectAdded={onRefresh}
        />
      )}

      {editingProject && (
        <ProjectManager
          onClose={handleCloseEdit}
          onProjectAdded={onRefresh}
          editProject={editingProject}
        />
      )}
    </div>
  );
}

export default Dashboard;
