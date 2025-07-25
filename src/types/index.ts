// User and Authentication Types
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PM' | 'Designer' | 'Executive' | 'Developer' | 'Other';
  experience: 'Beginner' | 'Intermediate' | 'Advanced';
  learningGoals?: string;
  industry?: string;
  preferences: UserPreferences;
  lastActive: Date;
  isActive: boolean;
}

export interface UserPreferences {
  dailyTimeGoal: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  reminderTime: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Learning System Types
export interface Topic {
  id: string;
  title: string;
  slug: string;
  category: TopicCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTimeMinutes: number;
  definition: string;
  explanation: string;
  whyItMatters: string;
  realWorldExample: string;
  prerequisites: string[];
  tags: string[];
  metadata: Record<string, any>;
  isActive: boolean;
  sourceUrl?: string;
  sourceType: 'NEWSLETTER' | 'ARTICLE' | 'RESEARCH' | 'MANUAL';
  version: number;
}

export type TopicCategory = 
  | 'AI_FUNDAMENTALS' 
  | 'MACHINE_LEARNING' 
  | 'NLP' 
  | 'COMPUTER_VISION' 
  | 'ETHICS' 
  | 'BUSINESS_AI' 
  | 'TOOLS' 
  | 'TRENDS';

export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'PERSONALIZED' | 'ROLE_BASED' | 'SKILL_BASED' | 'INDUSTRY_SPECIFIC';
  targetRole?: string;
  targetSkill?: string;
  estimatedDays: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ARCHIVED';
  progress: number; // 0.0 to 1.0
  metadata: {
    createdBy: string;
    adaptationCount: number;
    lastAdapted?: Date;
  };
  topics: Topic[];
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  topicId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'MASTERED';
  confidenceLevel: number; // 1-10
  masteryScore: number; // 0.0-1.0
  timeSpentMinutes: number;
  firstStudiedAt?: Date;
  lastStudiedAt?: Date;
  completedAt?: Date;
  studyStreak: number;
  reviewCount: number;
  nextReviewDate?: Date;
  learningVelocity: number; // topics per week
  difficultyRating?: number; // 1-5
  personalNotes?: string;
  practiceAttempts: number;
  successfulPractices: number;
}

// Agent System Types
export type AgentType = 
  | 'CONTENT_CURATOR'
  | 'LEARNING_STRATEGIST' 
  | 'PRACTICE_COACH'
  | 'RESEARCH_ASSISTANT'
  | 'CONVERSATION_COACH';

export interface AgentSession {
  id: string;
  userId: string;
  agentType: AgentType;
  sessionId: string;
  context: Record<string, any>;
  messages: AgentMessage[];
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
  startTime: Date;
  endTime?: Date;
  executionTimeMs?: number;
  tokensUsed: number;
  cost: number;
  resultData: Record<string, any>;
  errorMessage?: string;
  metadata: Record<string, any>;
}

export interface AgentMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentTask {
  id: string;
  type: string;
  agentType: AgentType;
  userId: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

// Practice System Types
export interface PracticeScenario {
  id: string;
  topicId: string;
  title: string;
  description: string;
  scenarioType: 'DECISION_MAKING' | 'CASE_STUDY' | 'SIMULATION' | 'INTERVIEW_PREP' | 'PROBLEM_SOLVING';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTimeMinutes: number;
  context: string;
  situation: string;
  challenge: string;
  expectedOutcomes: string[];
  evaluationCriteria: string[];
  hints: string[];
  sampleResponses: {
    excellent: string[];
    good: string[];
    needsImprovement: string[];
  };
  tags: string[];
  industry?: string;
  companySize?: 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  roleLevel?: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  isActive: boolean;
  createdBy: 'PRACTICE_COACH_AGENT' | 'MANUAL' | 'IMPORTED';
  metadata: Record<string, any>;
}

// Analytics Types
export interface LearningAnalytics {
  userId: string;
  totalTopicsCompleted: number;
  totalTimeSpentMinutes: number;
  learningVelocity: number; // topics per week
  averageConfidenceGain: number;
  currentStreak: number;
  longestStreak: number;
  topicsByCategory: Record<TopicCategory, number>;
  weeklyProgress: Array<{
    week: string;
    topicsCompleted: number;
    timeSpent: number;
    averageConfidence: number;
  }>;
  skillGaps: Array<{
    category: TopicCategory;
    requiredLevel: number;
    currentLevel: number;
    gap: number;
  }>;
  recommendations: string[];
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ChatRequest {
  message: string;
  topicId?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  response: string;
  agentType: AgentType;
  confidence: number;
  suggestions: string[];
  followUpQuestions: string[];
  metadata: Record<string, any>;
}