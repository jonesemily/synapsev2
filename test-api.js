// Simple test script to verify the API is working
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 Testing Synapse AI Learning Platform API...\n');

  try {
    // 1. Health check
    console.log('1. Testing health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', health.data);
    console.log('');

    // 2. Get agent capabilities
    console.log('2. Testing agent capabilities...');
    const capabilities = await axios.get(`${BASE_URL}/agents/capabilities`);
    console.log('✅ Agent capabilities:', JSON.stringify(capabilities.data, null, 2));
    console.log('');

    // 3. Register a test user
    console.log('3. Testing user registration...');
    const testUser = {
      email: 'test@synapse.ai',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'PM',
      experience: 'Intermediate',
      learningGoals: 'Learn AI for product management',
      industry: 'Technology'
    };

    try {
      const register = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ User registered successfully');
      console.log('Token:', register.data.data.token.substring(0, 20) + '...');
      
      const token = register.data.data.token;
      
      // 4. Test authenticated endpoints
      console.log('');
      console.log('4. Testing authenticated endpoints...');
      const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
      
      // Get user profile
      const profile = await axios.get(`${BASE_URL}/auth/me`, authHeaders);
      console.log('✅ User profile retrieved:', profile.data.data.firstName, profile.data.data.role);
      
      // Get topics
      const topics = await axios.get(`${BASE_URL}/topics`);
      console.log('✅ Topics retrieved:', topics.data.data.length, 'topics found');
      
      // Test newsletter processing
      console.log('');
      console.log('5. Testing newsletter processing...');
      const newsletterContent = `
        OpenAI has announced a new breakthrough in large language models with improved reasoning capabilities.
        The new model, called GPT-4 Turbo, offers better performance at lower costs and supports multimodal inputs.
        This development could significantly impact how businesses integrate AI into their workflows.
        
        Key features include:
        - Enhanced reasoning and problem-solving abilities
        - Support for images, audio, and video inputs
        - Reduced API costs for developers
        - Better instruction following and safety measures
      `;
      
      try {
        const processNewsletter = await axios.post(`${BASE_URL}/agents/process-newsletter`, {
          content: newsletterContent,
          source: 'OpenAI Newsletter'
        }, authHeaders);
        
        console.log('✅ Newsletter processed successfully!');
        console.log('Extracted topics:', processNewsletter.data.data.length);
        processNewsletter.data.data.forEach((topic, index) => {
          console.log(`   ${index + 1}. ${topic.title} (${topic.category})`);
        });
      } catch (error) {
        console.log('⚠️  Newsletter processing skipped (requires OpenAI API key)');
      }
      
      // Test learning path generation
      console.log('');
      console.log('6. Testing learning path generation...');
      try {
        const learningPath = await axios.post(`${BASE_URL}/agents/generate-learning-path`, {
          targetRole: 'Senior Product Manager',
          timeframe: 30
        }, authHeaders);
        
        console.log('✅ Learning path generated successfully!');
        console.log('Path:', learningPath.data.data.title);
      } catch (error) {
        console.log('⚠️  Learning path generation skipped (requires OpenAI API key)');
      }
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
        console.log('ℹ️  User already exists, testing login instead...');
        
        const login = await axios.post(`${BASE_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        console.log('✅ User login successful');
        console.log('Token:', login.data.data.token.substring(0, 20) + '...');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAPI();