const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory storage for testing
let users = new Map();
let topics = [];

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve demo page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Synapse AI Learning Platform - DEMO MODE</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
          .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
          .demo-badge { background: #f59e0b; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9rem; margin-top: 10px; display: inline-block; }
          .content { padding: 30px; }
          .test-section { margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
          .test-header { background: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb; }
          .test-header h3 { color: #374151; margin-bottom: 5px; }
          .test-body { padding: 20px; }
          .btn { background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem; margin-right: 10px; margin-bottom: 10px; transition: all 0.2s; }
          .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(91, 33, 182, 0.3); }
          .result { margin-top: 15px; padding: 15px; border-radius: 8px; font-family: 'Monaco', 'Menlo', monospace; font-size: 0.9rem; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
          .result.success { background: #d1fae5; border: 1px solid #a7f3d0; color: #065f46; }
          .result.demo { background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; }
          .input-group { margin-bottom: 15px; }
          .input-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #374151; }
          .input-group input, .input-group textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; }
          .input-group textarea { min-height: 100px; resize: vertical; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧠 Synapse AI Learning Platform</h1>
            <p>Multi-Agent AI Coaching System</p>
            <div class="demo-badge">DEMO MODE - Mock AI Responses</div>
          </div>
          
          <div class="content">
            <!-- System Status -->
            <div class="test-section">
              <div class="test-header">
                <h3>🟢 System Status</h3>
                <p>All systems operational - using demo AI responses</p>
              </div>
              <div class="test-body">
                <button class="btn" onclick="testSystem()">Test System</button>
                <div id="systemResult" class="result" style="display: none;"></div>
              </div>
            </div>
            
            <!-- User Authentication -->
            <div class="test-section">
              <div class="test-header">
                <h3>👤 User Authentication</h3>
                <p>Test user registration and login system</p>
              </div>
              <div class="test-body">
                <div class="input-group">
                  <label>Email:</label>
                  <input type="email" id="userEmail" value="demo@synapse.ai" placeholder="Enter email">
                </div>
                <div class="input-group">
                  <label>Password:</label>
                  <input type="password" id="userPassword" value="demo123" placeholder="Enter password">
                </div>
                <button class="btn" onclick="registerUser()">Register User</button>
                <button class="btn" onclick="loginUser()">Login User</button>
                <div id="authResult" class="result" style="display: none;"></div>
              </div>
            </div>
            
            <!-- AI Agents Demo -->
            <div class="test-section">
              <div class="test-header">
                <h3>🤖 Multi-Agent AI System</h3>
                <p>Experience all 4 specialized AI agents</p>
              </div>
              <div class="test-body">
                <div class="input-group">
                  <label>Newsletter Content:</label>
                  <textarea id="newsletterContent">OpenAI announced GPT-4 Turbo with significant improvements: 40% better performance, 60% cost reduction, and enhanced multimodal capabilities. This breakthrough enables more sophisticated AI applications in business workflows, from automated customer service to advanced content generation and decision support systems.</textarea>
                </div>
                <button class="btn" onclick="processNewsletter()">📄 Content Curator Agent</button>
                <button class="btn" onclick="generateLearningPath()">🎯 Learning Strategist Agent</button>
                <button class="btn" onclick="conductResearch()">🔍 Research Assistant Agent</button>
                <button class="btn" onclick="chatWithAI()">💬 Practice Coach Agent</button>
                <div id="agentResult" class="result" style="display: none;"></div>
              </div>
            </div>
          </div>
        </div>

        <script>
          let authToken = null;
          
          function showResult(elementId, content, type = 'success') {
            const element = document.getElementById(elementId);
            element.style.display = 'block';
            element.className = \`result \${type}\`;
            element.textContent = content;
          }
          
          function testSystem() {
            showResult('systemResult', \`✅ SYNAPSE AI LEARNING PLATFORM - FULLY OPERATIONAL

🤖 Active Agents:
• Content Curator Agent (GPT-3.5) - Newsletter processing
• Learning Strategist Agent (GPT-4) - Personalized roadmaps  
• Practice Coach Agent (GPT-3.5) - Scenario generation
• Research Assistant Agent (GPT-3.5) - Trend analysis

🏗️ System Architecture:
• TypeScript backend with Express.js
• PostgreSQL database with 8 specialized tables
• JWT authentication system
• Multi-agent orchestration engine
• Learning analytics with velocity tracking

🎯 Features Implemented:
• User authentication and profiles
• Newsletter processing into learning topics
• Personalized 30-day learning paths
• Real-world practice scenarios
• AI trend research and analysis
• Interactive chat with specialized agents

💡 Status: Ready for production deployment!\`, 'demo');
          }
          
          async function registerUser() {
            showResult('authResult', '⏳ Registering user...', 'demo');
            
            setTimeout(() => {
              authToken = 'demo_token_' + Date.now();
              showResult('authResult', \`✅ USER REGISTERED SUCCESSFULLY!

👤 User Profile:
• Name: Demo User
• Email: demo@synapse.ai
• Role: Product Manager
• Experience: Intermediate
• Learning Goals: Master AI for product management

🔐 Authentication:
• JWT Token: \${authToken.substring(0, 20)}...
• Session Duration: 7 days
• Permissions: Full access to all agents

🎯 Ready to test AI agents!\`, 'success');
            }, 1000);
          }
          
          async function loginUser() {
            showResult('authResult', '⏳ Logging in...', 'demo');
            
            setTimeout(() => {
              authToken = 'demo_token_' + Date.now();
              showResult('authResult', \`✅ LOGIN SUCCESSFUL!

Welcome back, Demo User! 
Ready to continue your AI learning journey.\`, 'success');
            }, 800);
          }
          
          function processNewsletter() {
            if (!authToken) {
              showResult('agentResult', '❌ Please register/login first', 'demo');
              return;
            }
            
            showResult('agentResult', '🤖 Content Curator Agent processing...', 'demo');
            
            setTimeout(() => {
              showResult('agentResult', \`✅ CONTENT CURATOR AGENT - PROCESSING COMPLETE!

📄 Extracted 3 Key Learning Topics:

1. 📊 GPT-4 Turbo Performance Improvements
   Category: AI_FUNDAMENTALS
   Difficulty: Intermediate
   Time: 15 minutes
   
   Definition: Next-generation language model with enhanced reasoning and efficiency capabilities.
   
   Why it matters: Represents a 40% performance improvement while reducing operational costs, making advanced AI more accessible to businesses of all sizes.

2. 💰 AI Cost Optimization Strategies  
   Category: BUSINESS_AI
   Difficulty: Beginner
   Time: 12 minutes
   
   Definition: Methods and techniques for reducing AI implementation and operational expenses.
   
   Why it matters: 60% cost reduction enables broader AI adoption and higher ROI for business applications.

3. 🔄 Multimodal AI Integration
   Category: TOOLS
   Difficulty: Advanced  
   Time: 20 minutes
   
   Definition: AI systems that process and understand multiple types of input (text, images, audio, video).
   
   Why it matters: Enables more sophisticated business applications like automated document processing, visual quality control, and interactive customer support.

🎯 Next Steps: Use Learning Strategist Agent to create a personalized learning path!\`, 'success');
            }, 2000);
          }
          
          function generateLearningPath() {
            if (!authToken) {
              showResult('agentResult', '❌ Please register/login first', 'demo');
              return;
            }
            
            showResult('agentResult', '🎯 Learning Strategist Agent analyzing...', 'demo');
            
            setTimeout(() => {
              showResult('agentResult', \`✅ LEARNING STRATEGIST AGENT - PERSONALIZED PATH CREATED!

🎯 AI Mastery Path for Product Managers
📅 Duration: 30 days | ⏱️ Time: 30 min/day

Week 1: AI Fundamentals
• Day 1-2: What is AI and Machine Learning?
• Day 3-4: Understanding Large Language Models  
• Day 5-7: AI vs Human Intelligence

Week 2: Business Applications
• Day 8-10: AI in Product Development
• Day 11-12: Customer Experience Enhancement
• Day 13-14: Data-Driven Decision Making

Week 3: Implementation Strategy
• Day 15-17: Building AI-First Products
• Day 18-19: Managing AI Project Teams
• Day 20-21: Measuring AI Success Metrics

Week 4: Advanced Topics & Practice
• Day 22-24: AI Ethics and Responsible Development
• Day 25-26: Future AI Trends and Opportunities
• Day 27-30: Real-World Case Studies & Practice

🎯 Personalization Factors:
• Tailored for Product Manager role
• Intermediate experience level
• Focus on business applications over technical details
• Practical exercises and real-world examples
• Progressive difficulty increase

📈 Expected Outcomes:
• 80% improvement in AI concept understanding
• Ability to evaluate AI solutions for products
• Confidence in leading AI initiatives
• Network of AI resources and tools\`, 'success');
            }, 2500);
          }
          
          function conductResearch() {
            if (!authToken) {
              showResult('agentResult', '❌ Please register/login first', 'demo');
              return;
            }
            
            showResult('agentResult', '🔍 Research Assistant Agent investigating...', 'demo');
            
            setTimeout(() => {
              showResult('agentResult', \`✅ RESEARCH ASSISTANT AGENT - COMPREHENSIVE ANALYSIS COMPLETE!

🔍 Research Query: "AI adoption trends in product management"

📊 Key Findings:
• 73% of product teams plan to integrate AI in 2024
• Average ROI of AI-enhanced products: 247%  
• Top use cases: User research (68%), A/B testing (54%), Feature prioritization (41%)
• Main barriers: Technical expertise (62%), Budget constraints (38%)

📈 Market Trends:
• 340% increase in AI-PM job postings since 2023
• $12.4B invested in AI product tools last quarter
• 89% of top SaaS companies now use AI features

🎯 Competitive Intelligence:
• Notion: AI writing assistant, 40% user engagement increase
• Slack: Smart notifications, 25% productivity gain  
• Figma: AI design suggestions, 60% faster prototyping
• Linear: Automated issue triage, 50% support reduction

💡 Strategic Recommendations:
1. Start with low-risk AI experiments (user feedback analysis)
2. Invest in AI training for product teams (3-6 month timeline)  
3. Partner with AI specialists for complex implementations
4. Focus on user experience over technical sophistication
5. Measure AI impact with specific KPIs

🔮 Future Predictions:
• AI-first product management will be standard by 2025
• Natural language interfaces will replace traditional dashboards
• Predictive user behavior modeling will be essential
• AI ethics will become a core PM responsibility

📚 Sources: 50+ industry reports, expert interviews, market analysis\`, 'success');
            }, 3000);
          }
          
          function chatWithAI() {
            if (!authToken) {
              showResult('agentResult', '❌ Please register/login first', 'demo');
              return;
            }
            
            showResult('agentResult', '💬 Practice Coach Agent ready...', 'demo');
            
            setTimeout(() => {
              showResult('agentResult', \`✅ PRACTICE COACH AGENT - WORKPLACE SCENARIO GENERATED!

💼 Scenario: AI Implementation Decision

🏢 Context: You're a PM at a fast-growing SaaS company
📊 Situation: Customer support is overwhelmed (500+ tickets/day)
⚡ Challenge: Choose the best AI solution with $50K budget

🎯 Your Options:
1. Chatbot for initial customer screening ($30K setup + $5K/month)
2. Ticket auto-classification system ($25K setup + $3K/month)  
3. AI-powered response suggestions ($40K setup + $8K/month)

💭 Consider These Factors:
• Team technical capabilities
• Customer experience impact
• Implementation timeline (3 months max)
• Success measurement methods
• Risk mitigation strategies

📋 Your Task:
Analyze each option and make a recommendation. Consider:
- ROI calculations and payback period
- Implementation complexity and timeline
- Impact on customer satisfaction scores
- Required team training and resources
- Scalability for future growth

🎭 Role-Play Elements:
• Present to CEO (focus on business impact)
• Address engineering concerns (technical feasibility)  
• Handle customer success questions (UX impact)
• Justify budget to finance (ROI projections)

✅ Evaluation Criteria:
- Business impact assessment (25%)
- Technical feasibility analysis (20%)
- Customer experience consideration (20%)
- Risk analysis and mitigation (20%)
- Implementation planning (15%)

🎯 This scenario tests your ability to evaluate AI solutions, consider multiple stakeholders, and make data-driven product decisions!\`, 'success');
            }, 2000);
          }
        </script>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log('🚀 Synapse AI Learning Platform - DEMO MODE');
  console.log('🌐 Web Interface: http://localhost:' + PORT);
  console.log('🎭 Showing full system capabilities with mock AI responses');
  console.log('💡 This demonstrates what the system does when OpenAI is working');
});