import React, { useState, useEffect } from 'react';
import './ProjectManager.css';

function ProjectManager({ onClose, onProjectAdded, editProject = null }) {
  const [mode, setMode] = useState('existing'); // 'existing' or 'clone'
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    pm2Name: '',
    description: '',
    type: 'mern',
    buildSteps: [],
    deploySteps: [],
    gitUrl: ''
  });

  // Load project data when editing
  useEffect(() => {
    if (editProject) {
      setFormData({
        name: editProject.name || '',
        path: editProject.path || '',
        pm2Name: editProject.pm2Name || '',
        description: editProject.description || '',
        type: editProject.type || 'mern',
        buildSteps: editProject.buildSteps || [],
        deploySteps: editProject.deploySteps || [],
        gitUrl: ''
      });
    }
  }, [editProject]);
  const [buildStep, setBuildStep] = useState('');
  const [deployStep, setDeployStep] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cloneOutput, setCloneOutput] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addBuildStep = () => {
    if (buildStep.trim()) {
      setFormData(prev => ({
        ...prev,
        buildSteps: [...prev.buildSteps, { type: 'command', command: buildStep.trim() }]
      }));
      setBuildStep('');
    }
  };

  const removeBuildStep = (index) => {
    setFormData(prev => ({
      ...prev,
      buildSteps: prev.buildSteps.filter((_, i) => i !== index)
    }));
  };

  const addDeployStep = () => {
    if (deployStep.trim()) {
      setFormData(prev => ({
        ...prev,
        deploySteps: [...prev.deploySteps, { type: 'command', command: deployStep.trim() }]
      }));
      setDeployStep('');
    }
  };

  const removeDeployStep = (index) => {
    setFormData(prev => ({
      ...prev,
      deploySteps: prev.deploySteps.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCloneOutput(null);

    try {
      let response;
      const payload = {
        ...formData,
        pm2Name: formData.pm2Name || formData.name
      };

      if (editProject) {
        // Update existing project
        response = await fetch(`/api/projects/${editProject.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (mode === 'clone') {
        // Clone new project
        if (!formData.gitUrl) {
          setError('Git URL is required for cloning');
          setLoading(false);
          return;
        }
        response = await fetch('/api/projects/clone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Add existing project
        response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (data.success) {
        if (data.cloneOutput) {
          setCloneOutput(data.cloneOutput);
          setTimeout(() => {
            onProjectAdded();
            onClose();
          }, 2000);
        } else {
          onProjectAdded();
          onClose();
        }
      } else {
        setError(data.error || (editProject ? 'Failed to update project' : 'Failed to create project'));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-manager-overlay" onClick={onClose}>
      <div className="project-manager" onClick={(e) => e.stopPropagation()}>
        <div className="manager-header">
          <h2>{editProject ? '✏️ Edit Project' : '➕ Add New Project'}</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          {error && <div className="form-error">{error}</div>}
          {cloneOutput && (
            <div className="form-success">
              ✓ Repository cloned successfully!
              <pre className="clone-output">{cloneOutput}</pre>
            </div>
          )}

          {!editProject && (
            <div className="form-section">
              <h3>Project Mode</h3>
              <div className="mode-selector">
              <label className={`mode-option ${mode === 'existing' ? 'active' : ''}`}>
                <input
                  type="radio"
                  value="existing"
                  checked={mode === 'existing'}
                  onChange={(e) => setMode(e.target.value)}
                />
                <span>📁 Add Existing Project</span>
              </label>
              <label className={`mode-option ${mode === 'clone' ? 'active' : ''}`}>
                <input
                  type="radio"
                  value="clone"
                  checked={mode === 'clone'}
                  onChange={(e) => setMode(e.target.value)}
                />
                <span>🔗 Clone New Project</span>
              </label>
            </div>
            </div>
          )}

          <div className="form-section">
            <h3>Basic Information</h3>
            
            {mode === 'clone' && !editProject && (
              <div className="form-group">
                <label>Git Repository URL *</label>
                <input
                  type="text"
                  name="gitUrl"
                  value={formData.gitUrl}
                  onChange={handleChange}
                  placeholder="git@github.com:username/repo.git or https://github.com/username/repo.git"
                  required={mode === 'clone'}
                />
                <small className="field-hint">SSH or HTTPS git clone URL</small>
              </div>
            )}
            
            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., my-awesome-app"
                required
              />
            </div>

            <div className="form-group">
              <label>{mode === 'clone' ? 'Target Path' : 'Project Path'} *</label>
              <input
                type="text"
                name="path"
                value={formData.path}
                onChange={handleChange}
                placeholder="e.g., /home/bitnami/v0_demo/my-awesome-app"
                required
              />
              {mode === 'clone' && (
                <small className="field-hint">Full path where the repository will be cloned</small>
              )}
            </div>

            <div className="form-group">
              <label>PM2 Process Name</label>
              <input
                type="text"
                name="pm2Name"
                value={formData.pm2Name}
                onChange={handleChange}
                placeholder="Leave empty to use project name"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the project"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Project Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="mern">MERN (Frontend + Backend)</option>
                <option value="nextjs">Next.js</option>
                <option value="node">Node.js</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Build Steps (Optional)</h3>
            <p className="section-hint">Commands to run during build (executed in order)</p>
            
            <div className="steps-input">
              <input
                type="text"
                value={buildStep}
                onChange={(e) => setBuildStep(e.target.value)}
                placeholder="e.g., npm install"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBuildStep())}
              />
              <button type="button" onClick={addBuildStep} className="add-step-btn">
                + Add
              </button>
            </div>

            <div className="steps-list">
              {formData.buildSteps.map((step, index) => (
                <div key={index} className="step-item">
                  <span className="step-number">{index + 1}.</span>
                  <span className="step-command">{step.command}</span>
                  <button
                    type="button"
                    onClick={() => removeBuildStep(index)}
                    className="remove-step-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Deploy Steps (Optional)</h3>
            <p className="section-hint">Commands to run during deployment (executed in order)</p>
            
            <div className="steps-input">
              <input
                type="text"
                value={deployStep}
                onChange={(e) => setDeployStep(e.target.value)}
                placeholder="e.g., git pull"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeployStep())}
              />
              <button type="button" onClick={addDeployStep} className="add-step-btn">
                + Add
              </button>
            </div>

            <div className="steps-list">
              {formData.deploySteps.map((step, index) => (
                <div key={index} className="step-item">
                  <span className="step-number">{index + 1}.</span>
                  <span className="step-command">{step.command}</span>
                  <button
                    type="button"
                    onClick={() => removeDeployStep(index)}
                    className="remove-step-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? (editProject ? 'Updating...' : 'Creating...') : (editProject ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectManager;
