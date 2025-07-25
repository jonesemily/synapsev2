# 🚀 Synapse v2 - Multi-Agent AI Learning Platform

An advanced AI learning platform with specialized agents for personalized education in AI and technology concepts.

## 🤖 Multi-Agent Architecture

### **Content Curator Agent (GPT-3.5)**
- Processes newsletters and articles into structured learning topics
- Extracts 2-3 key concepts with definitions and examples
- Provides conversational explanations for non-technical professionals

### **Learning Strategist Agent (GPT-4)**  
- Creates personalized 30-day learning roadmaps
- Analyzes learning patterns and knowledge gaps
- Adapts paths based on user progress and role requirements

### **Agent Orchestrator**
- Coordinates between specialized agents
- Manages task queues and session tracking
- Provides intelligent agent selection based on context

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis (optional, for production)
- OpenAI API key

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database**
```bash
# Create PostgreSQL database named 'synapse_dev'
createdb synapse_dev

# Initialize schema
npm run db:init
```

4. **Build and start**
```bash
npm run build
npm run dev
```

## 🧪 Testing the API

### Quick API Test
```bash
npm run test-api
```

### Manual Testing

1. **Health Check**
```bash
curl http://localhost:3000/api/health
```

2. **Register User**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PM",
    "experience": "Intermediate"
  }'
```

3. **Process Newsletter Content**
```bash
# Use the token from registration/login
curl -X POST http://localhost:3000/api/agents/process-newsletter \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "OpenAI has released GPT-4 Turbo with improved reasoning capabilities...",
    "source": "AI Newsletter"
  }'
```

4. **Generate Learning Path**
```bash
curl -X POST http://localhost:3000/api/agents/generate-learning-path \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "targetRole": "Senior Product Manager",
    "timeframe": 30
  }'
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/me` - Get user profile

### Agent Processing
- `POST /api/agents/process-newsletter` - Process content with Content Curator
- `POST /api/agents/generate-learning-path` - Create path with Learning Strategist
- `POST /api/agents/chat` - Chat with agents
- `GET /api/agents/capabilities` - Get agent information
- `GET /api/agents/stats` - Agent performance statistics

### Content
- `GET /api/topics` - Get all learning topics
- `GET /api/topics/:id` - Get specific topic
- `GET /api/learning-paths` - Get user's learning paths

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Express API     │    │   PostgreSQL    │
│   (React/TS)    │◄───┤  TypeScript      │◄───┤   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │ Agent           │
                       │ Orchestrator    │
                       └─────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼──────┐    ┌──────────▼───────┐    ┌─────────▼──────┐
│   Content    │    │    Learning      │    │   Practice     │
│   Curator    │    │   Strategist     │    │     Coach      │
│  (GPT-3.5)   │    │    (GPT-4)       │    │  (GPT-3.5)     │
└──────────────┘    └──────────────────┘    └────────────────┘
```

## 📊 Database Schema

- **Users** - User profiles and preferences
- **Topics** - Learning content with categorization
- **LearningPaths** - Personalized learning sequences  
- **UserProgress** - Learning tracking and analytics
- **AgentSessions** - Multi-agent interaction logs
- **PracticeScenarios** - Real-world practice exercises

## 🔧 Configuration

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_NAME=synapse_dev
DB_USERNAME=postgres
DB_PASSWORD=password

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=your-openai-key

# Models
CONTENT_CURATOR_MODEL=gpt-3.5-turbo
LEARNING_STRATEGIST_MODEL=gpt-4
```

## 🎯 Next Steps

- [ ] Implement Practice Coach Agent
- [ ] Add Research Assistant Agent  
- [ ] Create React frontend with dashboards
- [ ] Add learning analytics and visualization
- [ ] Implement knowledge graph system

## 🤝 Contributing

This is a modern TypeScript/Node.js application with a multi-agent AI architecture. The codebase is well-structured for extending with additional agents and features.

## 📄 License

MIT License - feel free to use this for your AI learning platform!# synapsev2
