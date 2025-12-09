require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const database = require('../services/database');

const projects = [
  {
    name: 'agent-feedback-loop-reviewer',
    path: '/home/bitnami/v0_demo/agent-feedback-loop-reviewer',
    pm2Name: 'agent-feedback-loop-reviewer',
    description: 'Agent Feedback Loop Reviewer - MERN Stack',
    type: 'mern',
    buildSteps: [
      'git pull',
      'cd frontend && npm install',
      'cd ../backend && npm install',
      'npm run build-frontend'
    ],
    deploySteps: [
      'git pull',
      'cd frontend && npm install',
      'cd ../backend && npm install',
      'npm run build-frontend'
    ]
  },
  {
    name: 'marina-rfi-hub',
    path: '/home/bitnami/v0_demo/marina-rfi-hub',
    pm2Name: 'marina-rfi-hub',
    description: 'Marina RFI Hub',
    type: 'next',
    buildSteps: [
      'git pull',
      'npm install',
      'npm run build'
    ],
    deploySteps: [
      'git pull',
      'npm install',
      'npm run build'
    ]
  },
  {
    name: 'marina-ai-video',
    path: '/home/bitnami/v0_demo/marina-ai-video',
    pm2Name: 'marina-ai-video',
    description: 'Marina AI Video',
    type: 'next',
    buildSteps: [
      'git pull',
      'npm install',
      'npm run build'
    ],
    deploySteps: [
      'git pull',
      'npm install',
      'npm run build'
    ]
  },
  {
    name: 'bulletin-checker',
    path: '/home/bitnami/v0_demo/bulletin-checker',
    pm2Name: 'bulletin-checker',
    description: 'Bulletin Checker',
    type: 'next',
    buildSteps: [
      'git pull',
      'npm install',
      'npm run build'
    ],
    deploySteps: [
      'git pull',
      'npm install',
      'npm run build'
    ]
  },
  {
    name: 'st-demo-1',
    path: '/home/bitnami/v0_demo/st-demo-1',
    pm2Name: 'st-demo-1',
    description: 'ST Demo 1',
    type: 'next',
    buildSteps: [
      'git pull',
      'npm install',
      'npm run build'
    ],
    deploySteps: [
      'git pull',
      'npm install',
      'npm run build'
    ]
  },
  {
    name: 'st-cyber-security-signup',
    path: '/home/bitnami/v0_demo/st-cyber-security-signup',
    pm2Name: 'st-cyber-security-signup',
    description: 'ST Cyber Security Signup',
    type: 'next',
    buildSteps: [
      'git pull',
      'npm install',
      'npm run build'
    ],
    deploySteps: [
      'git pull',
      'npm install',
      'npm run build'
    ]
  },
  {
    name: 'mcp-demo-st',
    path: '/home/bitnami/v0_demo/mcp-demo-st',
    pm2Name: 'mcp-demo-st',
    description: 'MCP Demo ST',
    type: 'next',
    buildSteps: [
      'git pull',
      'npm install',
      'npm run build'
    ],
    deploySteps: [
      'git pull',
      'npm install',
      'npm run build'
    ]
  },
  {
    name: 'mcp-demo-st-be',
    path: '/home/bitnami/v0_demo/mcp-demo-st-be',
    pm2Name: 'mcp-demo-st-be',
    description: 'MCP Demo ST Backend',
    type: 'node',
    buildSteps: [
      'git pull',
      'npm install'
    ],
    deploySteps: [
      'git pull',
      'npm install'
    ]
  },
  {
    name: 'aon-glp1-dashboard-st',
    path: '/home/bitnami/v0_demo/aon-glp1-dashboard-st',
    pm2Name: 'aon-glp1-dashboard-st',
    description: 'AON GLP1 Dashboard ST',
    type: 'next',
    buildSteps: [
      'git pull',
      'npm install',
      'npm run build'
    ],
    deploySteps: [
      'git pull',
      'npm install',
      'npm run build'
    ]
  },
  {
    name: 'mastercard-alm-academy',
    path: '/home/bitnami/v0_demo/mastercard-alm-academy',
    pm2Name: 'mastercard-alm-academy',
    description: 'Mastercard ALM Academy',
    type: 'next',
    buildSteps: [
      'git pull',
      'npm install',
      'npm run build'
    ],
    deploySteps: [
      'git pull',
      'npm install',
      'npm run build'
    ]
  },
  {
    name: 'st-aon-glp-2',
    path: '/home/bitnami/v0_demo/st-aon-glp-2',
    pm2Name: 'st-aon-glp-2',
    description: 'ST AON GLP 2',
    type: 'next',
    buildSteps: [
      'git pull',
      'npm install',
      'npm run build'
    ],
    deploySteps: [
      'git pull',
      'npm install',
      'npm run build'
    ]
  }
];

async function seedProjects() {
  try {
    console.log('🌱 Starting to seed projects...');
    
    await database.connect();
    console.log('✅ Connected to MongoDB');
    
    // Get existing projects
    const existingProjects = await database.getProjects();
    const existingNames = new Set(existingProjects.map(p => p.name));
    
    let added = 0;
    let skipped = 0;
    
    for (const project of projects) {
      if (existingNames.has(project.name)) {
        console.log(`⏭️  Skipping ${project.name} (already exists)`);
        skipped++;
      } else {
        await database.createProject(project);
        console.log(`✅ Added ${project.name}`);
        added++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Added: ${added}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${projects.length}`);
    console.log('\n✨ Seeding complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding projects:', error);
    process.exit(1);
  }
}

seedProjects();
