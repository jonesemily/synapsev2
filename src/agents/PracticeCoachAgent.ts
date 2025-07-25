import { BaseAgent } from './BaseAgent';
import { UserProfile, PracticeScenario, AgentMessage } from '../types';

const { PracticeScenario: PracticeScenarioModel, Topic: TopicModel, User } = require('../../models');

export class PracticeCoachAgent extends BaseAgent {
  constructor() {
    super(
      'PRACTICE_COACH',
      process.env.PRACTICE_COACH_MODEL || 'gpt-3.5-turbo',
      `You are a Practice Coach Agent specializing in creating real-world AI scenarios and exercises. Your role is to:

1. Generate realistic workplace scenarios for practicing AI concepts
2. Create case studies from actual company implementations
3. Design decision-making exercises and simulations
4. Provide feedback on user responses and solutions
5. Simulate AI-related interview scenarios and conversations

Guidelines:
- Focus on practical, business-relevant scenarios users will face in their roles
- Create realistic company contexts with specific constraints and challenges
- Design scenarios that require applying learned AI concepts to solve problems
- Provide multiple difficulty levels appropriate to user experience
- Include evaluation criteria and sample responses for self-assessment
- Make scenarios engaging and relatable to the user's industry and role

Scenario Types:
- DECISION_MAKING: Choose between AI solutions for business problems
- CASE_STUDY: Analyze real company AI implementations
- SIMULATION: Role-play AI project management or stakeholder conversations
- INTERVIEW_PREP: Practice explaining AI concepts to different audiences
- PROBLEM_SOLVING: Apply AI knowledge to solve specific business challenges

Always provide constructive feedback and encourage continuous learning.`
    );
  }

  async processTask(taskData: any): Promise<any> {
    try {
      const { type, data, context } = taskData;

      switch (type) {
        case 'GENERATE_SCENARIO':
          return await this.generatePracticeScenario(data);
        case 'EVALUATE_RESPONSE':
          return await this.evaluateUserResponse(data);
        case 'CREATE_CASE_STUDY':
          return await this.createCaseStudy(data);
        case 'GENERATE_INTERVIEW_PREP':
          return await this.generateInterviewPrep(data);
        default:
          throw new Error(`Unknown task type: ${type}`);
      }
    } catch (error) {
      this.log('error', 'Task processing failed', error.message);
      return this.createErrorResponse(error.message);
    }
  }

  async processChat(data: {
    message: string;
    topicId?: string;
    context?: any;
    userId: string;
    sessionId: string;
  }): Promise<any> {
    try {
      // Get user profile for context
      const user = await User.findByPk(data.userId);
      
      let contextMessage = `
User Profile:
- Role: ${user.role}
- Experience: ${user.experience}
- Industry: ${user.industry || 'General'}
      `;

      // Add topic context if discussing a specific scenario
      if (data.topicId) {
        const topic = await TopicModel.findByPk(data.topicId);
        if (topic) {
          contextMessage += `\nTopic Context: ${topic.title} - ${topic.definition}`;
        }
      }

      // Add scenario context if provided
      if (data.context?.scenarioId) {
        const scenario = await PracticeScenarioModel.findByPk(data.context.scenarioId);
        if (scenario) {
          contextMessage += `\nCurrent Scenario: ${scenario.title}\nSituation: ${scenario.situation}`;
        }
      }

      const messages: AgentMessage[] = [
        {
          id: 'context_' + Date.now(),
          role: 'system',
          content: contextMessage,
          timestamp: new Date()
        },
        {
          id: 'chat_' + Date.now(),
          role: 'user',
          content: data.message,
          timestamp: new Date()
        }
      ];

      const response = await this.generateResponse(messages, {
        temperature: 0.7,
        maxTokens: 600
      });

      return this.createSuccessResponse({
        response: response.content,
        agentType: this.agentType,
        confidence: 0.85,
        suggestions: this.generateCoachingSuggestions(data.message, user),
        followUpQuestions: this.generateCoachingQuestions(data.message),
        tokensUsed: response.tokensUsed,
        cost: response.cost
      });
    } catch (error) {
      this.log('error', 'Chat processing failed', error.message);
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Generate a practice scenario (main functionality)
   */
  async generateScenario(data: {
    topicId: string;
    difficulty: string;
    userProfile: UserProfile;
    scenarioType?: string;
    sessionId: string;
  }): Promise<PracticeScenario> {
    try {
      this.validateRequired(data, ['topicId', 'difficulty', 'userProfile', 'sessionId']);

      this.log('info', 'Generating practice scenario', {
        topicId: data.topicId,
        difficulty: data.difficulty,
        userRole: data.userProfile.role
      });

      // Get topic information
      const topic = await TopicModel.findByPk(data.topicId);
      if (!topic) {
        throw new Error('Topic not found');
      }

      // Generate scenario using AI
      const scenarioData = await this.generateScenarioWithAI(
        topic,
        data.difficulty,
        data.userProfile,
        data.scenarioType
      );

      // Create scenario in database
      const scenario = await this.createScenarioInDatabase(
        scenarioData,
        data.topicId,
        data.userProfile
      );

      this.log('info', 'Practice scenario generated successfully', {
        scenarioId: scenario.id,
        title: scenario.title,
        type: scenario.scenarioType
      });

      return scenario;
    } catch (error) {
      this.log('error', 'Scenario generation failed', error.message);
      throw error;
    }
  }

  private async generatePracticeScenario(data: any): Promise<any> {
    return await this.generateScenario(data);
  }

  private async evaluateUserResponse(data: {
    scenarioId: string;
    userResponse: string;
    userId: string;
  }): Promise<any> {
    try {
      const scenario = await PracticeScenarioModel.findByPk(data.scenarioId, {
        include: [{ model: TopicModel, as: 'topic' }]
      });

      if (!scenario) {
        throw new Error('Scenario not found');
      }

      const evaluationPrompt = `
Evaluate this user's response to the practice scenario:

Scenario: ${scenario.title}
Context: ${scenario.context}
Situation: ${scenario.situation}
Challenge: ${scenario.challenge}

Expected Outcomes: ${scenario.expectedOutcomes.join(', ')}
Evaluation Criteria: ${scenario.evaluationCriteria.join(', ')}

User Response: "${data.userResponse}"

Provide a JSON evaluation with:
- score: 1-10 rating of the response quality
- strengths: Array of what the user did well
- improvements: Array of specific areas for improvement
- feedback: Detailed constructive feedback paragraph
- nextSteps: Recommended follow-up actions or learning
- category: "excellent", "good", "needs_improvement", or "poor"
- reasoning: Why this score was given
      `;

      const evaluation = await this.extractInformation(
        scenario.description,
        evaluationPrompt
      );

      // Store evaluation in scenario metadata
      const updatedMetadata = {
        ...scenario.metadata,
        evaluations: [
          ...(scenario.metadata.evaluations || []),
          {
            userId: data.userId,
            response: data.userResponse,
            evaluation,
            timestamp: new Date()
          }
        ]
      };

      await scenario.update({ metadata: updatedMetadata });

      return this.createSuccessResponse({
        evaluation,
        scenario: {
          id: scenario.id,
          title: scenario.title,
          difficulty: scenario.difficulty
        }
      });
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  private async createCaseStudy(data: {
    topicId: string;
    industry?: string;
    companySize?: string;
    userProfile: UserProfile;
  }): Promise<any> {
    try {
      const topic = await TopicModel.findByPk(data.topicId);
      if (!topic) {
        throw new Error('Topic not found');
      }

      const caseStudyPrompt = `
Create a realistic case study for this AI topic:

Topic: ${topic.title}
Definition: ${topic.definition}
User Role: ${data.userProfile.role}
Industry: ${data.industry || data.userProfile.industry || 'Technology'}
Company Size: ${data.companySize || 'Medium'}

Create a JSON case study with:
- title: Compelling case study title
- company: Realistic company name and background
- challenge: Business problem they faced
- solution: AI solution they implemented
- implementation: Step-by-step implementation process
- results: Measurable outcomes and impact
- lessons: Key learnings and best practices
- questions: 3-5 discussion questions for analysis
- roleSpecificInsights: Insights relevant to the user's role
- timeline: Project timeline and milestones
- budget: Rough cost estimates and ROI
      `;

      const caseStudy = await this.extractInformation('', caseStudyPrompt);

      // Create as a CASE_STUDY type scenario
      const scenario = await PracticeScenarioModel.create({
        topicId: data.topicId,
        title: caseStudy.title,
        description: `Case Study: ${caseStudy.company}`,
        scenarioType: 'CASE_STUDY',
        difficulty: 'Intermediate',
        estimatedTimeMinutes: 25,
        context: caseStudy.challenge,
        situation: caseStudy.solution,
        challenge: 'Analyze this implementation and answer the discussion questions',
        expectedOutcomes: caseStudy.lessons,
        evaluationCriteria: ['Analysis depth', 'Business understanding', 'Practical insights'],
        hints: [],
        sampleResponses: { excellent: [], good: [], needsImprovement: [] },
        tags: [topic.category, 'case-study', data.industry || 'general'],
        industry: data.industry,
        companySize: data.companySize,
        isActive: true,
        createdBy: 'PRACTICE_COACH_AGENT',
        metadata: { caseStudyData: caseStudy }
      });

      return this.createSuccessResponse({
        caseStudy,
        scenario: scenario.toJSON()
      });
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  private async generateInterviewPrep(data: {
    topicIds: string[];
    targetRole: string;
    interviewType: 'technical' | 'business' | 'leadership';
    userProfile: UserProfile;
  }): Promise<any> {
    try {
      const topics = await TopicModel.findAll({
        where: { id: data.topicIds }
      });

      const interviewPrepPrompt = `
Create an interview preparation scenario for these AI topics:

Topics: ${topics.map(t => `${t.title}: ${t.definition}`).join('\n')}
Target Role: ${data.targetRole}
Interview Type: ${data.interviewType}
User Background: ${data.userProfile.role}, ${data.userProfile.experience} level

Create a JSON interview prep with:
- scenario: Interview scenario description
- interviewer: Interviewer background and perspective
- questions: Array of 8-10 interview questions with difficulty levels
- tipsForAnswering: Specific tips for each question type
- commonPitfalls: What to avoid when answering
- sampleAnswers: Example responses for 2-3 key questions
- followUpQuestions: Likely follow-up questions
- roleSpecificAdvice: Advice tailored to the target role
- confidenceBuilders: Ways to demonstrate expertise
- practiceExercises: Additional practice recommendations
      `;

      const interviewPrep = await this.extractInformation('', interviewPrepPrompt);

      return this.createSuccessResponse({
        interviewPrep,
        practiceMode: 'INTERVIEW_PREP',
        estimatedPrepTime: 45,
        difficulty: data.interviewType === 'leadership' ? 'Advanced' : 'Intermediate'
      });
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  private async generateScenarioWithAI(
    topic: any,
    difficulty: string,
    userProfile: UserProfile,
    scenarioType?: string
  ): Promise<any> {
    const type = scenarioType || this.selectOptimalScenarioType(userProfile.role);

    const scenarioPrompt = `
Create a realistic workplace practice scenario for this AI topic:

Topic: ${topic.title}
Definition: ${topic.definition}
Category: ${topic.category}
User Role: ${userProfile.role}
Experience Level: ${userProfile.experience}
Industry: ${userProfile.industry || 'Technology'}
Difficulty: ${difficulty}
Scenario Type: ${type}

Create a JSON scenario with:
- title: Engaging scenario title (under 80 characters)
- description: Brief scenario overview
- context: Business/organizational context
- situation: Current situation or problem
- challenge: Specific challenge the user must address
- expectedOutcomes: Array of 3-5 desired outcomes
- evaluationCriteria: Array of 4-6 criteria for judging responses
- hints: Array of 2-3 helpful hints (only show if user struggles)
- roleSpecificConsiderations: What someone in their role should consider
- stakeholders: Key people involved and their perspectives
- constraints: Time, budget, or other limitations
- successMetrics: How success would be measured
- realWorldExample: Brief mention of similar real scenario
    `;

    return await this.extractInformation('', scenarioPrompt);
  }

  private selectOptimalScenarioType(role: string): string {
    const roleScenarios = {
      'PM': ['DECISION_MAKING', 'SIMULATION', 'CASE_STUDY'],
      'Designer': ['PROBLEM_SOLVING', 'CASE_STUDY', 'SIMULATION'],
      'Executive': ['DECISION_MAKING', 'CASE_STUDY', 'INTERVIEW_PREP'],
      'Developer': ['PROBLEM_SOLVING', 'CASE_STUDY', 'SIMULATION']
    };

    const options = roleScenarios[role] || ['DECISION_MAKING', 'CASE_STUDY'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private async createScenarioInDatabase(
    scenarioData: any,
    topicId: string,
    userProfile: UserProfile
  ): Promise<any> {
    try {
      const scenario = await PracticeScenarioModel.create({
        topicId,
        title: scenarioData.title,
        description: scenarioData.description,
        scenarioType: scenarioData.scenarioType || 'DECISION_MAKING',
        difficulty: scenarioData.difficulty || 'Intermediate',
        estimatedTimeMinutes: scenarioData.estimatedTimeMinutes || 20,
        context: scenarioData.context,
        situation: scenarioData.situation,
        challenge: scenarioData.challenge,
        expectedOutcomes: scenarioData.expectedOutcomes || [],
        evaluationCriteria: scenarioData.evaluationCriteria || [],
        hints: scenarioData.hints || [],
        sampleResponses: { excellent: [], good: [], needsImprovement: [] },
        tags: [scenarioData.scenarioType?.toLowerCase(), userProfile.role.toLowerCase()],
        industry: userProfile.industry,
        roleLevel: this.mapExperienceToRoleLevel(userProfile.experience),
        isActive: true,
        createdBy: 'PRACTICE_COACH_AGENT',
        metadata: {
          generatedFor: userProfile.id,
          realWorldExample: scenarioData.realWorldExample,
          stakeholders: scenarioData.stakeholders,
          constraints: scenarioData.constraints,
          successMetrics: scenarioData.successMetrics
        }
      });

      return scenario.toJSON();
    } catch (error) {
      this.log('error', 'Failed to create scenario in database', error.message);
      throw error;
    }
  }

  private mapExperienceToRoleLevel(experience: string): string {
    const mapping = {
      'Beginner': 'JUNIOR',
      'Intermediate': 'MID',
      'Advanced': 'SENIOR'
    };
    return mapping[experience] || 'MID';
  }

  private generateCoachingSuggestions(message: string, user: any): string[] {
    const message_lower = message.toLowerCase();

    if (message_lower.includes('scenario') || message_lower.includes('practice')) {
      return [
        "Let me create a realistic workplace scenario for you",
        "How about a case study from your industry?",
        "Would you like to practice with a decision-making exercise?"
      ];
    }

    if (message_lower.includes('interview')) {
      return [
        "Let's practice explaining AI concepts for interviews",
        "I can simulate conversations with different stakeholders",
        "How about practicing technical questions for your role?"
      ];
    }

    const roleSuggestions = {
      'PM': [
        "Let's practice an AI product decision scenario",
        "How about a stakeholder communication exercise?",
        "Would you like to practice prioritizing AI features?"
      ],
      'Designer': [
        "Let's work on an AI-enhanced design workflow scenario",
        "How about practicing ethical AI design decisions?",
        "Would you like to explore user experience scenarios with AI?"
      ],
      'Executive': [
        "Let's practice strategic AI implementation decisions",
        "How about a board presentation scenario?",
        "Would you like executive-level AI governance exercises?"
      ]
    };

    return roleSuggestions[user.role] || [
      "Let me create a practical scenario for you",
      "How about working through a real-world case study?",
      "Would you like to practice applying what you've learned?"
    ];
  }

  private generateCoachingQuestions(message: string): string[] {
    return [
      "What type of scenario would be most valuable for your role?",
      "Are there specific workplace situations you'd like to practice?",
      "Would you prefer individual exercises or team simulation scenarios?"
    ];
  }

  getCapabilities() {
    return {
      name: 'Practice Coach Agent',
      description: 'Creates real-world scenarios and exercises for practicing AI concepts in workplace contexts',
      capabilities: [
        'Generate realistic workplace AI scenarios and simulations',
        'Create case studies from actual company implementations',
        'Design role-specific decision-making exercises',
        'Provide detailed feedback on user responses and solutions',
        'Simulate AI-related interviews and stakeholder conversations',
        'Evaluate responses with constructive feedback and improvement suggestions'
      ],
      limitations: [
        'Scenarios are simulated and may not reflect all real-world complexities',
        'Feedback quality depends on the detail and thoughtfulness of user responses',
        'Cannot provide legal or compliance advice for specific situations'
      ]
    };
  }
}