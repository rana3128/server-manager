const database = require('../services/database');

/**
 * Get all projects from DB
 */
async function getAllProjects() {
  await database.connect();
  const dbProjects = await database.getProjects();
  return dbProjects || [];
}

/**
 * Get project by name
 */
async function getProjectByName(projectName) {
  const projects = await getAllProjects();
  return projects.find(p => p.name === projectName);
}

/**
 * Get project by ID
 */
async function getProjectById(id) {
  const projects = await getAllProjects();
  return projects.find(p => p.id === id);
}

/**
 * Create new project
 */
async function createProject(projectData) {
  await database.connect();
  return await database.createProject(projectData);
}

/**
 * Update project
 */
async function updateProject(id, updates) {
  await database.connect();
  return await database.updateProject(id, updates);
}

/**
 * Delete project
 */
async function deleteProject(id) {
  await database.connect();
  return await database.deleteProject(id);
}

module.exports = {
  getAllProjects,
  getProjectByName,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
