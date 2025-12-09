const express = require('express');
const router = express.Router();
const SSHManager = require('../services/sshManager');
const pm2SyncService = require('../services/pm2SyncService');
const database = require('../services/database');
const { 
  getProjectByName, 
  getProjectById,
  getAllProjects,
  createProject,
  updateProject,
  deleteProject
} = require('../utils/projectConfig');

const sshManager = new SSHManager();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/projects
 * Get list of all configured projects
 */
router.get('/projects', async (req, res) => {
  try {
    const projects = await getAllProjects();
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/pm2/sync
 * Sync PM2 processes with database and return unmapped processes
 */
router.get('/pm2/sync', async (req, res) => {
  try {
    const syncData = await pm2SyncService.syncPM2WithDatabase(database);
    res.json({ success: true, ...syncData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/pm2/auto-map
 * Auto-create database entries for unmapped PM2 processes
 */
router.post('/pm2/auto-map', async (req, res) => {
  try {
    const syncData = await pm2SyncService.syncPM2WithDatabase(database);
    const mapped = await pm2SyncService.autoMapPM2Processes(database, syncData.unmappedProcesses);
    res.json({ success: true, mapped, count: mapped.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/projects', async (req, res) => {
  try {
    const { name, path, pm2Name, description, type, buildSteps, deploySteps } = req.body;
    
    if (!name || !path) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project name and path are required' 
      });
    }
    
    // Check if project already exists
    const existing = await getProjectByName(name);
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        error: 'Project with this name already exists' 
      });
    }
    
    const project = await createProject({
      name,
      path,
      pm2Name: pm2Name || name,
      description: description || '',
      type: type || 'mern',
      buildSteps: buildSteps || [],
      deploySteps: deploySteps || []
    });
    
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/projects/clone
 * Clone a new project from git repository
 */
router.post('/projects/clone', async (req, res) => {
  try {
    const { gitUrl, targetPath, name, pm2Name, description, type, buildSteps, deploySteps } = req.body;
    
    if (!gitUrl || !targetPath) {
      return res.status(400).json({ 
        success: false, 
        error: 'gitUrl and targetPath are required' 
      });
    }
    
    // Clone the repository
    const cloneResult = await sshManager.cloneRepository(gitUrl, targetPath);
    
    if (!cloneResult.success) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to clone repository',
        details: cloneResult.error
      });
    }
    
    // Create project entry in database
    const projectData = {
      name: name || targetPath.substring(targetPath.lastIndexOf('/') + 1),
      path: targetPath,
      pm2Name: pm2Name || name || targetPath.substring(targetPath.lastIndexOf('/') + 1),
      description: description || `Cloned from ${gitUrl}`,
      type: type || 'other',
      buildSteps: buildSteps || [],
      deploySteps: deploySteps || [],
      gitUrl
    };
    
    const project = await createProject(projectData);
    
    res.json({ 
      success: true, 
      project,
      cloneOutput: cloneResult.output
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const project = await updateProject(id, updates);
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteProject(id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/pm2/status
 * Get PM2 status for all processes
 */
router.get('/pm2/status', async (req, res) => {
  try {
    const status = await sshManager.getPM2Status();
    res.json({ success: true, processes: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/pm2/status/:processName
 * Get PM2 status for a specific process
 */
router.get('/pm2/status/:processName', async (req, res) => {
  try {
    const { processName } = req.params;
    const status = await sshManager.getPM2ProcessStatus(processName);
    
    if (!status) {
      return res.status(404).json({ 
        success: false, 
        error: `Process '${processName}' not found` 
      });
    }
    
    res.json({ success: true, process: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/pm2/restart/:processName
 * Restart a PM2 process
 */
router.post('/pm2/restart/:processName', async (req, res) => {
  try {
    const { processName } = req.params;
    const result = await sshManager.restartProcess(processName);
    res.json({ success: result.success, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/pm2/stop/:processName
 * Stop a PM2 process
 */
router.post('/pm2/stop/:processName', async (req, res) => {
  try {
    const { processName } = req.params;
    const result = await sshManager.stopProcess(processName);
    res.json({ success: result.success, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/pm2/start/:processName
 * Start a PM2 process
 */
router.post('/pm2/start/:processName', async (req, res) => {
  try {
    const { processName } = req.params;
    const result = await sshManager.startProcess(processName);
    res.json({ success: result.success, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/logs/:processName
 * Get logs for a specific process
 */
router.get('/logs/:processName', async (req, res) => {
  try {
    const { processName } = req.params;
    const lines = parseInt(req.query.lines) || 100;
    const result = await sshManager.getProcessLogs(processName, lines);
    res.json({ success: result.success, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/build/:projectName
 * Build a project
 */
router.post('/build/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const project = await getProjectByName(projectName);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: `Project '${projectName}' not found` 
      });
    }
    
    // Use custom build steps if defined
    let result;
    if (project.buildSteps && project.buildSteps.length > 0) {
      result = await sshManager.executeCustomSteps(project.path, project.buildSteps, project.pm2Name);
    } else {
      result = await sshManager.buildProject(project.path, project.name);
    }
    
    res.json({ success: result.success, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/deploy/:projectName
 * Deploy a project (git pull, build, restart)
 */
router.post('/deploy/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const project = await getProjectByName(projectName);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: `Project '${projectName}' not found` 
      });
    }
    
    // Use custom deploy steps if defined
    let result;
    if (project.deploySteps && project.deploySteps.length > 0) {
      result = await sshManager.executeCustomSteps(project.path, project.deploySteps, project.pm2Name);
    } else {
      result = await sshManager.deployProject(project.path, project.pm2Name);
    }
    
    res.json({ success: result.success, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/deploy-script/:projectName
 * Run deploy.sh script for a project
 */
router.post('/deploy-script/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const project = await getProjectByName(projectName);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: `Project '${projectName}' not found` 
      });
    }
    
    const result = await sshManager.runDeployScript(project.path);
    res.json({ success: result.success, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/system/mongodb
 * Get MongoDB status (local)
 */
router.get('/system/mongodb', async (req, res) => {
  try {
    // Check local MongoDB connection status
    const isConnected = database.db && database.db.topology && database.db.topology.isConnected();
    res.json({ 
      success: true, 
      mongodb: {
        running: isConnected,
        connected: isConnected,
        message: isConnected ? 'Connected' : 'Disconnected'
      }
    });
  } catch (error) {
    res.json({ 
      success: true, 
      mongodb: {
        running: false,
        connected: false,
        error: error.message
      }
    });
  }
});

module.exports = router;
