const SSHManager = require('./sshManager');

class PM2SyncService {
  constructor() {
    this.sshManager = new SSHManager();
  }

  /**
   * Get all PM2 processes and compare with database
   */
  async syncPM2WithDatabase(database) {
    try {
      // Get PM2 processes from Lightsail
      const pm2Processes = await this.sshManager.getPM2Status();
      
      // Get projects from database
      await database.connect();
      const dbProjects = await database.getProjects();
      
      // Create a map of database projects by name
      const dbProjectMap = new Map(dbProjects.map(p => [p.name, p]));
      
      // Find PM2 processes not in database
      const unmappedProcesses = pm2Processes.filter(process => {
        const processName = process.name;
        return !dbProjectMap.has(processName);
      });
      
      // Find database projects not running in PM2
      const pm2ProcessNames = new Set(pm2Processes.map(p => p.name));
      const notRunningProjects = dbProjects.filter(project => {
        return !pm2ProcessNames.has(project.name);
      });
      
      return {
        pm2Processes,
        dbProjects,
        unmappedProcesses,
        notRunningProjects,
        totalPM2: pm2Processes.length,
        totalDB: dbProjects.length,
        unmappedCount: unmappedProcesses.length
      };
    } catch (error) {
      console.error('PM2 Sync error:', error);
      throw error;
    }
  }

  /**
   * Auto-create database entries for unmapped PM2 processes
   */
  async autoMapPM2Processes(database, unmappedProcesses) {
    try {
      const mapped = [];
      
      for (const process of unmappedProcesses) {
        // Try to detect project path from PM2 process info
        const projectPath = process.pm2_env?.pm_cwd || `/home/bitnami/${process.name}`;
        
        const projectData = {
          name: process.name,
          path: projectPath,
          pm2Name: process.name,
          description: `Auto-detected from PM2`,
          type: 'mern',
          buildSteps: [],
          deploySteps: []
        };
        
        const created = await database.createProject(projectData);
        mapped.push(created);
      }
      
      return mapped;
    } catch (error) {
      console.error('Auto-map error:', error);
      throw error;
    }
  }
}

module.exports = new PM2SyncService();
