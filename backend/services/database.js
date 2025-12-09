const { MongoClient } = require('mongodb');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.connected = false;
  }

  async connect() {
    if (this.connected) return this.db;

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB || 'lightsail_manager';

    try {
      this.client = new MongoClient(mongoUri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.connected = true;
      console.log(`📦 Connected to MongoDB: ${dbName}`);
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw new Error('MongoDB is required. Please ensure MongoDB is running and MONGODB_URI is correct in .env');
    }
  }

  async getProjects() {
    if (!this.connected) await this.connect();
    const collection = this.db.collection('projects');
    return await collection.find({}).toArray();
  }

  async createProject(project) {
    if (!this.connected) await this.connect();
    const collection = this.db.collection('projects');
    
    // Generate new ID
    const allProjects = await this.getProjects();
    const maxId = allProjects.reduce((max, p) => {
      const num = parseInt(p.id);
      return num > max ? num : max;
    }, 0);
    
    const newProject = {
      ...project,
      id: String(maxId + 1),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await collection.insertOne(newProject);
    return newProject;
  }

  async updateProject(id, updates) {
    if (!this.connected) await this.connect();
    const collection = this.db.collection('projects');
    await collection.updateOne(
      { id },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    return await collection.findOne({ id });
  }

  async deleteProject(id) {
    if (!this.connected) await this.connect();
    const collection = this.db.collection('projects');
    const result = await collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
    }
  }
}

module.exports = new Database();
