const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

class SSHManager {
  constructor() {
    this.host = process.env.LIGHTSAIL_HOST;
    this.port = parseInt(process.env.LIGHTSAIL_PORT) || 22;
    this.username = process.env.LIGHTSAIL_USER;
    this.privateKeyPath = process.env.LIGHTSAIL_KEY_PATH;
    this.privateKey = null;

    if (!this.privateKeyPath) {
      console.error('❌ LIGHTSAIL_KEY_PATH not set in .env file');
      console.error('Please add: LIGHTSAIL_KEY_PATH=./lightsail-mean-1.pem');
      return;
    }

    try {
      // Resolve path relative to project root (parent of backend)
      let keyPath;
      if (path.isAbsolute(this.privateKeyPath)) {
        keyPath = this.privateKeyPath;
      } else {
        // Go up one level from backend to project root
        keyPath = path.resolve(__dirname, '../..', this.privateKeyPath);
      }
      
      this.privateKey = fs.readFileSync(keyPath);
      console.log('✅ SSH key loaded successfully from:', keyPath);
    } catch (error) {
      console.error('❌ Failed to read SSH key:', error.message);
      const attemptedPath = path.isAbsolute(this.privateKeyPath) 
        ? this.privateKeyPath 
        : path.resolve(__dirname, '../..', this.privateKeyPath);
      console.error('Looking for key at:', attemptedPath);
      console.error('Please ensure the .pem file exists and LIGHTSAIL_KEY_PATH is set correctly in .env');
    }
  }

  /**
   * Execute a command via SSH and return the output
   */
  async executeCommand(command, timeout = 30000) {
    return new Promise((resolve, reject) => {
      if (!this.privateKey) {
        return reject(new Error('SSH key not loaded. Check LIGHTSAIL_KEY_PATH in .env'));
      }

      if (!this.host || !this.username) {
        return reject(new Error('SSH configuration incomplete. Check LIGHTSAIL_HOST and LIGHTSAIL_USER in .env'));
      }

      const conn = new Client();
      let output = '';
      let errorOutput = '';

      const timer = setTimeout(() => {
        conn.end();
        reject(new Error('Command execution timeout'));
      }, timeout);

      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            clearTimeout(timer);
            conn.end();
            return reject(err);
          }

          stream.on('close', (code, signal) => {
            clearTimeout(timer);
            conn.end();
            resolve({
              success: code === 0,
              code,
              signal,
              stdout: output,
              stderr: errorOutput
            });
          });

          stream.on('data', (data) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });
        });
      });

      conn.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      console.log('🔌 Connecting to SSH:', {
        host: this.host,
        port: this.port,
        username: this.username,
        hasKey: !!this.privateKey
      });

      conn.connect({
        host: this.host,
        port: this.port,
        username: this.username,
        privateKey: this.privateKey
      });
    });
  }

  /**
   * Get PM2 status for all processes
   */
  async getPM2Status() {
    try {
      // Set PM2_HOME to match the Lightsail environment
      const result = await this.executeCommand('export PM2_HOME=/tmp/.pm2 && npx pm2 jlist');
      if (result.success && result.stdout.trim()) {
        try {
          return JSON.parse(result.stdout);
        } catch (parseError) {
          console.error('PM2 jlist parse error:', parseError);
          console.error('Output:', result.stdout);
          throw new Error('Failed to parse PM2 output');
        }
      }
      throw new Error(result.stderr || 'Failed to get PM2 status');
    } catch (error) {
      throw new Error(`PM2 status error: ${error.message}`);
    }
  }



  /**
   * Get PM2 status for a specific process
   */
  async getPM2ProcessStatus(processName) {
    try {
      const processes = await this.getPM2Status();
      return processes.find(p => p.name === processName) || null;
    } catch (error) {
      throw new Error(`Failed to get process status: ${error.message}`);
    }
  }

  /**
   * Restart a PM2 process (or start if not running)
   */
  async restartProcess(processName) {
    try {
      // Check if process exists, restart if yes, start if no
      const result = await this.executeCommand(
        `export PM2_HOME=/tmp/.pm2 && if npx pm2 describe ${processName} > /dev/null 2>&1; then npx pm2 restart ${processName}; else echo "Process ${processName} not found, use start command instead"; exit 1; fi`
      );
      return {
        success: result.success,
        output: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      throw new Error(`Restart failed: ${error.message}`);
    }
  }

  /**
   * Stop a PM2 process
   */
  async stopProcess(processName) {
    try {
      const result = await this.executeCommand(`export PM2_HOME=/tmp/.pm2 && npx pm2 stop ${processName}`);
      return {
        success: result.success,
        output: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      throw new Error(`Stop failed: ${error.message}`);
    }
  }

  /**
   * Start a PM2 process
   */
  async startProcess(processName, projectPath = null) {
    try {
      let command;
      if (projectPath) {
        command = `export PM2_HOME=/tmp/.pm2 && cd ${projectPath} && npx pm2 start npm --name "${processName}" -- start`;
      } else {
        command = `export PM2_HOME=/tmp/.pm2 && npx pm2 start ${processName}`;
      }
      
      const result = await this.executeCommand(command);
      return {
        success: result.success,
        output: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      throw new Error(`Start failed: ${error.message}`);
    }
  }

  /**
   * Get logs for a specific process
   */
  async getProcessLogs(processName, lines = 100) {
    try {
      const result = await this.executeCommand(`export PM2_HOME=/tmp/.pm2 && npx pm2 logs ${processName} --lines ${lines} --nostream --raw`);
      return {
        success: result.success,
        logs: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }

  /**
   * Build a project (runs npm install and npm run build)
   */
  async buildProject(projectPath, projectName) {
    try {
      // Check if it's a MERN project with frontend/backend structure
      const checkStructure = await this.executeCommand(
        `cd ${projectPath} && if [ -d "frontend" ] && [ -d "backend" ]; then echo "MERN"; elif [ -f "next.config.mjs" ] || [ -f "next.config.js" ]; then echo "NEXT"; else echo "SINGLE"; fi`
      );

      const projectType = checkStructure.stdout.trim();
      let buildCommand = '';

      if (projectType === 'MERN') {
        // MERN project with separate frontend/backend
        buildCommand = `cd ${projectPath} && git pull && cd frontend && npm install && cd ../backend && npm install && npm run build-frontend`;
      } else if (projectType === 'NEXT') {
        // Next.js project
        buildCommand = `cd ${projectPath} && git pull && npm install && npm run build`;
      } else {
        // Single structure project
        buildCommand = `cd ${projectPath} && git pull && npm install && (npm run build || echo "No build script")`;
      }

      const result = await this.executeCommand(buildCommand, 180000); // 3 minute timeout for builds
      return {
        success: result.success,
        output: result.stdout,
        error: result.stderr,
        projectType
      };
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  /**
   * Deploy a project (git pull, build, restart)
   */
  async deployProject(projectPath, processName) {
    try {
      // Check if PM2 process exists, then restart or start accordingly
      const deployCommand = `cd ${projectPath} && git pull && npm install && (npm run build || npm run build-frontend || echo "No build needed") && export PM2_HOME=/tmp/.pm2 && if npx pm2 describe ${processName} > /dev/null 2>&1; then npx pm2 restart ${processName}; else npx pm2 start npm --name "${processName}" -- start; fi`;
      const result = await this.executeCommand(deployCommand, 180000); // 3 minute timeout
      
      return {
        success: result.success,
        output: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      throw new Error(`Deploy failed: ${error.message}`);
    }
  }

  /**
   * Run deploy.sh script if it exists
   */
  async runDeployScript(projectPath) {
    try {
      const deployCommand = `cd ${projectPath} && if [ -f "deploy.sh" ]; then ./deploy.sh; else echo "No deploy.sh found"; fi`;
      const result = await this.executeCommand(deployCommand, 180000);
      
      return {
        success: result.success,
        output: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      throw new Error(`Deploy script failed: ${error.message}`);
    }
  }

  /**
   * Clone a git repository
   */
  async cloneRepository(gitUrl, targetPath) {
    try {
      // Extract parent directory and project name from target path
      const parentDir = targetPath.substring(0, targetPath.lastIndexOf('/'));
      const projectName = targetPath.substring(targetPath.lastIndexOf('/') + 1);
      
      // Check if directory already exists
      const checkExists = await this.executeCommand(`if [ -d "${targetPath}" ]; then echo "EXISTS"; else echo "NOT_EXISTS"; fi`);
      
      if (checkExists.stdout.trim() === 'EXISTS') {
        throw new Error(`Directory ${targetPath} already exists`);
      }
      
      // Clone the repository
      const cloneCommand = `cd ${parentDir} && git clone ${gitUrl} ${projectName}`;
      const result = await this.executeCommand(cloneCommand, 120000); // 2 minute timeout
      
      return {
        success: result.success,
        output: result.stdout,
        error: result.stderr,
        path: targetPath
      };
    } catch (error) {
      throw new Error(`Clone failed: ${error.message}`);
    }
  }

  /**
   * Execute custom build/deploy steps
   */
  async executeCustomSteps(projectPath, steps, processName = null) {
    try {
      const commands = steps.map(step => {
        if (typeof step === 'string') {
          return step;
        }
        if (step.type === 'command') {
          return step.command;
        }
        return step;
      }).join(' && ');

      let fullCommand = `cd ${projectPath} && ${commands}`;
      
      // If processName is provided, add PM2 restart/start logic at the end
      if (processName) {
        fullCommand += ` && export PM2_HOME=/tmp/.pm2 && if npx pm2 describe ${processName} > /dev/null 2>&1; then npx pm2 restart ${processName}; else npx pm2 start npm --name "${processName}" -- start; fi`;
      }
      
      const result = await this.executeCommand(fullCommand, 180000);
      
      return {
        success: result.success,
        output: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      throw new Error(`Custom steps failed: ${error.message}`);
    }
  }
}

module.exports = SSHManager;
