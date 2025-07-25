import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AgentOrchestrator } from './services/AgentOrchestrator';
import { AuthService } from './services/AuthService';
import { LearningAnalyticsEngine } from './services/LearningAnalyticsEngine';
import { ContentCuratorAgent } from './agents/ContentCuratorAgent';
import { LearningStrategistAgent } from './agents/LearningStrategistAgent';
import { PracticeCoachAgent } from './agents/PracticeCoachAgent';
import { ResearchAssistantAgent } from './agents/ResearchAssistantAgent';
import { authenticateToken, optionalAuth } from './middleware/auth';
// Simple database initialization
async function initializeDatabase() {
  try {
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.log('⚠️  Database not available, using in-memory storage');
  }
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Services
const authService = new AuthService();
const orchestrator = new AgentOrchestrator();
const analyticsEngine = new LearningAnalyticsEngine();

// Initialize agents
const contentCurator = new ContentCuratorAgent();
const learningStrategist = new LearningStrategistAgent();
const practiceCoach = new PracticeCoachAgent();
const researchAssistant = new ResearchAssistantAgent();

// Register agents with orchestrator
orchestrator.registerAgent('CONTENT_CURATOR', contentCurator);
orchestrator.registerAgent('LEARNING_STRATEGIST', learningStrategist);
orchestrator.registerAgent('PRACTICE_COACH', practiceCoach);
orchestrator.registerAgent('RESEARCH_ASSISTANT', researchAssistant);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Synapse AI Learning Platform is running!',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agent processing routes
app.post('/api/agents/process-newsletter', authenticateToken, async (req, res) => {
  try {
    const { content, source } = req.body;
    
    const result = await orchestrator.processLearningRequest(req.user!.userId, {
      type: 'NEWSLETTER_PROCESSING',
      data: { content, source },
      priority: 'MEDIUM'
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/agents/generate-learning-path', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { targetRole, timeframe } = req.body;
    
    // Get user profile
    const userProfile = await authService.getUserById(req.user!.userId);
    if (!userProfile) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get completed topics (placeholder - implement based on UserProgress)
    const completedTopics: any[] = []; // TODO: Query actual completed topics
    
    const result = await orchestrator.processLearningRequest(req.user!.userId, {
      type: 'LEARNING_PATH_GENERATION',
      data: { 
        userProfile, 
        completedTopics, 
        targetRole, 
        timeframe 
      },
      priority: 'HIGH'
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/agents/chat', authenticateToken, async (req, res) => {
  try {
    const { message, topicId, context, preferredAgent } = req.body;
    
    const result = await orchestrator.processLearningRequest(req.user!.userId, {
      type: 'CHAT',
      data: { 
        message, 
        topicId, 
        context, 
        preferredAgent 
      },
      priority: 'MEDIUM'
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/agents/generate-practice-scenario', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { topicId, difficulty, scenarioType } = req.body;
    
    // Get user profile
    const userProfile = await authService.getUserById(req.user!.userId);
    if (!userProfile) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const result = await orchestrator.processLearningRequest(req.user!.userId, {
      type: 'PRACTICE_SCENARIO',
      data: { 
        topicId, 
        difficulty, 
        userProfile,
        scenarioType 
      },
      priority: 'MEDIUM'
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/agents/conduct-research', authenticateToken, async (req, res) => {
  try {
    const { query, topics, depth } = req.body;
    
    // Get user profile for context
    const userProfile = await authService.getUserById(req.user!.userId);
    
    const result = await orchestrator.processLearningRequest(req.user!.userId, {
      type: 'RESEARCH_QUERY',
      data: { 
        query, 
        topics, 
        depth,
        userProfile 
      },
      priority: 'MEDIUM'
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Topics routes
app.get('/api/topics', optionalAuth, async (req, res) => {
  try {
    const { Topic } = require('../models');
    const topics = await Topic.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    res.json({ success: true, data: topics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/topics/:id', optionalAuth, async (req, res): Promise<void> => {
  try {
    const { Topic } = require('../models');
    const topic = await Topic.findByPk(req.params.id);
    
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }
    
    res.json({ success: true, data: topic });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Learning paths routes
app.get('/api/learning-paths', authenticateToken, async (req, res) => {
  try {
    const { LearningPath, Topic } = require('../models');
    const paths = await LearningPath.findAll({
      where: { userId: req.user!.userId },
      include: [{ model: Topic, as: 'topics' }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, data: paths });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analytics routes
app.get('/api/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const analytics = await analyticsEngine.calculateUserAnalytics(req.user!.userId);
    res.json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/analytics/insights', authenticateToken, async (req, res) => {
  try {
    const insights = await analyticsEngine.calculateLearningInsights(req.user!.userId);
    res.json({ success: true, data: insights });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/analytics/comparison', authenticateToken, async (req, res) => {
  try {
    const comparison = await analyticsEngine.getComparativeAnalytics(req.user!.userId);
    res.json({ success: true, data: comparison });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agent statistics
app.get('/api/agents/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await orchestrator.getAgentStatistics();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agent capabilities
app.get('/api/agents/capabilities', (req, res) => {
  const capabilities = {
    CONTENT_CURATOR: contentCurator.getCapabilities(),
    LEARNING_STRATEGIST: learningStrategist.getCapabilities(),
    PRACTICE_COACH: practiceCoach.getCapabilities(),
    RESEARCH_ASSISTANT: researchAssistant.getCapabilities()
  };
  
  res.json({ success: true, data: capabilities });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Initializing Synapse AI Learning Platform...');
    
    // Initialize database
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌟 Synapse AI Learning Platform v2.0 is ready!`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log('\n🤖 Active Agents:');
      console.log('   • Content Curator Agent (GPT-3.5) - Newsletter processing');
      console.log('   • Learning Strategist Agent (GPT-4) - Personalized roadmaps');
      console.log('   • Practice Coach Agent (GPT-3.5) - Scenario generation');
      console.log('   • Research Assistant Agent (GPT-3.5) - Trend analysis');
      console.log('\n📚 Available Endpoints:');
      console.log('   • POST /api/auth/register - User registration');
      console.log('   • POST /api/auth/login - User login');
      console.log('   • POST /api/agents/process-newsletter - Process content');
      console.log('   • POST /api/agents/generate-learning-path - Create learning path');
      console.log('   • POST /api/agents/generate-practice-scenario - Create scenarios');
      console.log('   • POST /api/agents/conduct-research - Research trends');
      console.log('   • POST /api/agents/chat - Chat with agents');
      console.log('   • GET /api/topics - Get all topics');
      console.log('   • GET /api/learning-paths - Get learning paths');
      console.log('   • GET /api/analytics/overview - Learning analytics');
      console.log('   • GET /api/analytics/insights - Learning insights');
      console.log('   • GET /api/agents/capabilities - Get agent info');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  await orchestrator.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  await orchestrator.shutdown();
  process.exit(0);
});

startServer();

export default app;