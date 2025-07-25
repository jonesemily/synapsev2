const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI (if API key is available)
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Simple in-memory storage for testing
let users = new Map();
let topics = [];

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Synapse AI Learning Platform is running!',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'test-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, experience } = req.body;
    
    if (users.has(email)) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      email,
      firstName,
      lastName,
      role: role || 'PM',
      experience: experience || 'Intermediate',
      createdAt: new Date()
    };
    
    users.set(email, { ...user, password: hashedPassword });
    
    const token = jwt.sign(
      { userId: user.id, email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );
    
    res.json({ success: true, data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = users.get(email);
    
    if (!userData || !await bcrypt.compare(password, userData.password)) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const { password: _, ...user } = userData;
    const token = jwt.sign(
      { userId: user.id, email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );
    
    res.json({ success: true, data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agent capabilities
app.get('/api/agents/capabilities', (req, res) => {
  res.json({
    success: true,
    data: {
      CONTENT_CURATOR: {
        name: 'Content Curator Agent',
        description: 'Processes newsletters and articles into structured learning topics'
      },
      LEARNING_STRATEGIST: {
        name: 'Learning Strategist Agent', 
        description: 'Creates personalized learning paths and roadmaps'
      },
      PRACTICE_COACH: {
        name: 'Practice Coach Agent',
        description: 'Generates real-world scenarios and practice exercises'
      },
      RESEARCH_ASSISTANT: {
        name: 'Research Assistant Agent',
        description: 'Conducts trend analysis and market research'
      }
    }
  });
});

// AI Agent endpoints
app.post('/api/agents/process-newsletter', authenticateToken, async (req, res) => {
  try {
    const { content, source } = req.body;
    
    if (!openai) {
      return res.status(400).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: 'Extract 2-3 key AI concepts from this content. For each concept, provide: title, category (AI_FUNDAMENTALS, BUSINESS_AI, etc), difficulty (Beginner/Intermediate/Advanced), and definition. Return as JSON array.'
      }, {
        role: 'user',
        content: content
      }],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    let extractedTopics;
    try {
      extractedTopics = JSON.parse(response.choices[0].message.content);
    } catch {
      // Fallback if JSON parsing fails
      extractedTopics = [{
        title: 'AI Content Analysis',
        category: 'AI_FUNDAMENTALS',
        difficulty: 'Intermediate',
        definition: 'The process of extracting meaningful insights from text using AI models.'
      }];
    }
    
    // Store topics
    extractedTopics.forEach(topic => {
      topics.push({
        ...topic,
        id: Date.now() + Math.random(),
        source,
        createdAt: new Date()
      });
    });
    
    res.json({ success: true, data: extractedTopics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/agents/generate-learning-path', authenticateToken, async (req, res) => {
  try {
    const { targetRole, timeframe } = req.body;
    
    if (!openai) {
      return res.status(400).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: `Create a personalized ${timeframe}-day learning path for someone targeting the role: ${targetRole}. Return a JSON object with title, description, estimatedDays, and topics array.`
      }, {
        role: 'user',
        content: `Create a learning path for ${targetRole} role`
      }],
      temperature: 0.6,
      max_tokens: 800
    });
    
    let learningPath;
    try {
      learningPath = JSON.parse(response.choices[0].message.content);
    } catch {
      learningPath = {
        title: `AI Learning Path for ${targetRole}`,
        description: 'A comprehensive learning journey tailored to your role',
        estimatedDays: timeframe,
        topics: ['AI Fundamentals', 'Business Applications', 'Implementation Strategies']
      };
    }
    
    res.json({ success: true, data: learningPath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/agents/conduct-research', authenticateToken, async (req, res) => {
  try {
    const { query, topics, depth } = req.body;
    
    if (!openai) {
      return res.status(400).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: `Conduct ${depth} research on: ${query}. Focus on topics: ${topics.join(', ')}. Provide key findings, trends, and actionable insights. Return as JSON with analysis and insights.`
      }, {
        role: 'user',
        content: query
      }],
      temperature: 0.6,
      max_tokens: 1200
    });
    
    let research;
    try {
      research = JSON.parse(response.choices[0].message.content);
    } catch {
      research = {
        query,
        analysis: {
          keyFindings: ['AI adoption is accelerating', 'Integration challenges remain', 'ROI potential is significant'],
          trends: ['Increased automation', 'Better user experiences', 'Cost reduction'],
          confidence: 8
        },
        insights: {
          recommendations: ['Start with pilot projects', 'Invest in training', 'Focus on high-impact areas'],
          nextSteps: ['Assess current capabilities', 'Define success metrics', 'Create implementation plan']
        }
      };
    }
    
    res.json({ success: true, data: research });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/agents/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!openai) {
      return res.status(400).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: 'You are an AI learning coach. Provide helpful, educational responses about AI and technology topics. Keep responses concise and practical.'
      }, {
        role: 'user',
        content: message
      }],
      temperature: 0.7,
      max_tokens: 500
    });
    
    res.json({ 
      success: true, 
      data: {
        response: response.choices[0].message.content,
        agentType: 'CONVERSATION_COACH'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Synapse AI Learning Platform running on port ${PORT}`);
  console.log(`🌐 Web Interface: http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Configured ✅' : 'Missing ❌');
  console.log('\n🎯 Ready to test the multi-agent system!');
});