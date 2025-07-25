import { UserProfile, LearningAnalytics, TopicCategory } from '../types';

const { 
  UserProgress, 
  LearningSession, 
  Topic, 
  User, 
  LearningPath,
  sequelize
} = require('../../models');

export class LearningAnalyticsEngine {
  
  /**
   * Calculate comprehensive learning analytics for a user
   */
  async calculateUserAnalytics(userId: string): Promise<LearningAnalytics> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get all user progress and sessions
      const [userProgress, learningSessions] = await Promise.all([
        UserProgress.findAll({
          where: { userId },
          include: [{ model: Topic, as: 'topic' }]
        }),
        LearningSession.findAll({
          where: { userId },
          include: [{ model: Topic, as: 'topic' }],
          order: [['startTime', 'DESC']]
        })
      ]);

      // Calculate basic metrics
      const totalTopicsCompleted = userProgress.filter(p => p.status === 'COMPLETED').length;
      const totalTimeSpentMinutes = userProgress.reduce((sum, p) => sum + p.timeSpentMinutes, 0);
      
      // Calculate learning velocity (topics per week)
      const learningVelocity = await this.calculateLearningVelocity(userId);
      
      // Calculate average confidence gain
      const averageConfidenceGain = await this.calculateAverageConfidenceGain(learningSessions);
      
      // Calculate streaks
      const { currentStreak, longestStreak } = await this.calculateLearningStreaks(userId);
      
      // Topics by category
      const topicsByCategory = await this.calculateTopicsByCategory(userProgress);
      
      // Weekly progress
      const weeklyProgress = await this.calculateWeeklyProgress(userId);
      
      // Skill gap analysis
      const skillGaps = await this.calculateSkillGaps(userId, user.role);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(userId, skillGaps, learningVelocity);

      return {
        userId,
        totalTopicsCompleted,
        totalTimeSpentMinutes,
        learningVelocity,
        averageConfidenceGain,
        currentStreak,
        longestStreak,
        topicsByCategory,
        weeklyProgress,
        skillGaps,
        recommendations
      };
    } catch (error) {
      console.error('Error calculating user analytics:', error);
      throw new Error(`Analytics calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate learning velocity (topics completed per week)
   */
  private async calculateLearningVelocity(userId: string): Promise<number> {
    try {
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const recentCompletions = await UserProgress.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: {
            [require('sequelize').Op.gte]: fourWeeksAgo
          }
        }
      });

      return recentCompletions / 4; // topics per week
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate average confidence gain from learning sessions
   */
  private async calculateAverageConfidenceGain(sessions: any[]): Promise<number> {
    const sessionsWithGain = sessions.filter(s => 
      s.confidenceBefore && s.confidenceAfter && s.confidenceAfter > s.confidenceBefore
    );

    if (sessionsWithGain.length === 0) return 0;

    const totalGain = sessionsWithGain.reduce((sum, s) => 
      sum + (s.confidenceAfter - s.confidenceBefore), 0
    );

    return totalGain / sessionsWithGain.length;
  }

  /**
   * Calculate current and longest learning streaks
   */
  private async calculateLearningStreaks(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
  }> {
    try {
      // Get all learning sessions ordered by date
      const sessions = await LearningSession.findAll({
        where: { 
          userId,
          completionStatus: 'COMPLETED'
        },
        order: [['startTime', 'DESC']],
        attributes: ['startTime']
      });

      if (sessions.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
      }

      const dates = sessions.map(s => s.startTime.toDateString());
      const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const today = new Date().toDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Calculate current streak
      for (let i = 0; i < uniqueDates.length; i++) {
        const sessionDate = new Date(uniqueDates[i]);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);

        if (sessionDate.toDateString() === expectedDate.toDateString()) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      tempStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i]);
        const previousDate = new Date(uniqueDates[i - 1]);
        const dayDiff = (previousDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24);

        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      return { currentStreak, longestStreak };
    } catch (error) {
      return { currentStreak: 0, longestStreak: 0 };
    }
  }

  /**
   * Calculate topics completed by category
   */
  private async calculateTopicsByCategory(userProgress: any[]): Promise<Record<TopicCategory, number>> {
    const categoryCount: Record<TopicCategory, number> = {
      AI_FUNDAMENTALS: 0,
      MACHINE_LEARNING: 0,
      NLP: 0,
      COMPUTER_VISION: 0,
      ETHICS: 0,
      BUSINESS_AI: 0,
      TOOLS: 0,
      TRENDS: 0
    };

    const completedProgress = userProgress.filter(p => p.status === 'COMPLETED');
    
    completedProgress.forEach(progress => {
      if (progress.topic && categoryCount.hasOwnProperty(progress.topic.category)) {
        categoryCount[progress.topic.category]++;
      }
    });

    return categoryCount;
  }

  /**
   * Calculate weekly learning progress
   */
  private async calculateWeeklyProgress(userId: string): Promise<Array<{
    week: string;
    topicsCompleted: number;
    timeSpent: number;
    averageConfidence: number;
  }>> {
    try {
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

      const sessions = await LearningSession.findAll({
        where: {
          userId,
          startTime: {
            [require('sequelize').Op.gte]: twelveWeeksAgo
          }
        },
        order: [['startTime', 'ASC']]
      });

      const weeklyData: Record<string, {
        topicsCompleted: number;
        timeSpent: number;
        confidenceSum: number;
        confidenceCount: number;
      }> = {};

      sessions.forEach(session => {
        const weekStart = this.getWeekStart(session.startTime);
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            topicsCompleted: 0,
            timeSpent: 0,
            confidenceSum: 0,
            confidenceCount: 0
          };
        }

        if (session.completionStatus === 'COMPLETED') {
          weeklyData[weekKey].topicsCompleted++;
        }

        weeklyData[weekKey].timeSpent += session.durationMinutes || 0;

        if (session.confidenceAfter) {
          weeklyData[weekKey].confidenceSum += session.confidenceAfter;
          weeklyData[weekKey].confidenceCount++;
        }
      });

      return Object.entries(weeklyData)
        .map(([week, data]) => ({
          week,
          topicsCompleted: data.topicsCompleted,
          timeSpent: data.timeSpent,
          averageConfidence: data.confidenceCount > 0 
            ? data.confidenceSum / data.confidenceCount 
            : 0
        }))
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-12); // Last 12 weeks
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate skill gaps based on role requirements
   */
  private async calculateSkillGaps(userId: string, userRole: string): Promise<Array<{
    category: TopicCategory;
    requiredLevel: number;
    currentLevel: number;
    gap: number;
  }>> {
    try {
      // Define required levels by role (1-10 scale)
      const roleRequirements: Record<string, Record<TopicCategory, number>> = {
        'PM': {
          AI_FUNDAMENTALS: 8,
          MACHINE_LEARNING: 6,
          NLP: 5,
          COMPUTER_VISION: 4,
          ETHICS: 9,
          BUSINESS_AI: 9,
          TOOLS: 7,
          TRENDS: 8
        },
        'Designer': {
          AI_FUNDAMENTALS: 7,
          MACHINE_LEARNING: 5,
          NLP: 6,
          COMPUTER_VISION: 8,
          ETHICS: 8,
          BUSINESS_AI: 6,
          TOOLS: 8,
          TRENDS: 7
        },
        'Executive': {
          AI_FUNDAMENTALS: 8,
          MACHINE_LEARNING: 5,
          NLP: 4,
          COMPUTER_VISION: 3,
          ETHICS: 10,
          BUSINESS_AI: 10,
          TOOLS: 5,
          TRENDS: 9
        },
        'Developer': {
          AI_FUNDAMENTALS: 9,
          MACHINE_LEARNING: 8,
          NLP: 7,
          COMPUTER_VISION: 7,
          ETHICS: 7,
          BUSINESS_AI: 6,
          TOOLS: 9,
          TRENDS: 6
        }
      };

      const requirements = roleRequirements[userRole] || roleRequirements['PM'];

      // Get user's current levels by category
      const userProgress = await UserProgress.findAll({
        where: { userId },
        include: [{ model: Topic, as: 'topic' }]
      });

      const currentLevels: Record<TopicCategory, number[]> = {
        AI_FUNDAMENTALS: [],
        MACHINE_LEARNING: [],
        NLP: [],
        COMPUTER_VISION: [],
        ETHICS: [],
        BUSINESS_AI: [],
        TOOLS: [],
        TRENDS: []
      };

      userProgress.forEach(progress => {
        if (progress.topic && progress.status === 'COMPLETED') {
          const category = progress.topic.category as TopicCategory;
          if (currentLevels[category]) {
            currentLevels[category].push(progress.masteryScore * 10);
          }
        }
      });

      // Calculate gaps
      const skillGaps = Object.entries(requirements).map(([category, requiredLevel]) => {
        const categoryLevels = currentLevels[category as TopicCategory];
        const currentLevel = categoryLevels.length > 0 
          ? categoryLevels.reduce((sum, level) => sum + level, 0) / categoryLevels.length
          : 0;

        return {
          category: category as TopicCategory,
          requiredLevel,
          currentLevel: Math.round(currentLevel),
          gap: Math.max(0, requiredLevel - currentLevel)
        };
      });

      return skillGaps.sort((a, b) => b.gap - a.gap);
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate personalized recommendations
   */
  private async generateRecommendations(
    userId: string, 
    skillGaps: any[], 
    learningVelocity: number
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Based on skill gaps
    const topGaps = skillGaps.slice(0, 3);
    topGaps.forEach(gap => {
      if (gap.gap > 2) {
        recommendations.push(
          `Focus on ${gap.category.replace('_', ' ').toLowerCase()} - you're ${gap.gap} points below the recommended level for your role`
        );
      }
    });

    // Based on learning velocity
    if (learningVelocity < 1) {
      recommendations.push(
        'Try to complete at least 1 topic per week to maintain steady progress'
      );
    } else if (learningVelocity > 3) {
      recommendations.push(
        'Great pace! Consider spending more time on practice scenarios to deepen your understanding'
      );
    }

    // Based on recent activity
    const recentActivity = await LearningSession.count({
      where: {
        userId,
        startTime: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    if (recentActivity === 0) {
      recommendations.push(
        'You haven\'t learned anything this week. Try to maintain a consistent learning schedule'
      );
    }

    // Fallback recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        'Keep up the great work! Consider exploring advanced topics in your strongest areas'
      );
    }

    return recommendations.slice(0, 5); // Max 5 recommendations
  }

  /**
   * Get the start of the week for a given date (Monday)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Calculate learning insights for dashboard
   */
  async calculateLearningInsights(userId: string): Promise<{
    insights: string[];
    achievements: string[];
    nextMilestones: string[];
  }> {
    try {
      const analytics = await this.calculateUserAnalytics(userId);
      const insights: string[] = [];
      const achievements: string[] = [];
      const nextMilestones: string[] = [];

      // Generate insights
      if (analytics.learningVelocity > 2) {
        insights.push(`You're learning ${analytics.learningVelocity.toFixed(1)} topics per week - that's above average!`);
      }

      if (analytics.currentStreak > 7) {
        insights.push(`Amazing ${analytics.currentStreak}-day learning streak! Consistency is key to mastery.`);
      }

      if (analytics.averageConfidenceGain > 3) {
        insights.push(`Your confidence increases by ${analytics.averageConfidenceGain.toFixed(1)} points on average per session.`);
      }

      // Generate achievements
      if (analytics.totalTopicsCompleted >= 10) {
        achievements.push('🎓 Completed 10+ topics');
      }

      if (analytics.currentStreak >= 7) {
        achievements.push('🔥 7-day learning streak');
      }

      if (analytics.totalTimeSpentMinutes >= 300) {
        achievements.push('⏰ 5+ hours of learning time');
      }

      // Generate next milestones
      const nextTopicMilestone = Math.ceil(analytics.totalTopicsCompleted / 5) * 5;
      if (nextTopicMilestone > analytics.totalTopicsCompleted) {
        nextMilestones.push(`Complete ${nextTopicMilestone} topics`);
      }

      const nextStreakMilestone = Math.ceil(analytics.currentStreak / 7) * 7;
      if (nextStreakMilestone > analytics.currentStreak) {
        nextMilestones.push(`Reach ${nextStreakMilestone}-day streak`);
      }

      return { insights, achievements, nextMilestones };
    } catch (error) {
      return { insights: [], achievements: [], nextMilestones: [] };
    }
  }

  /**
   * Get comparative analytics (how user compares to others with similar role)
   */
  async getComparativeAnalytics(userId: string): Promise<{
    percentile: number;
    comparison: string;
    benchmarks: Record<string, number>;
  }> {
    try {
      const user = await User.findByPk(userId);
      const userAnalytics = await this.calculateUserAnalytics(userId);

      // Get aggregated stats for users with similar role
      const similarUsers = await User.findAll({
        where: { role: user.role, isActive: true }
      });

      if (similarUsers.length < 2) {
        return {
          percentile: 50,
          comparison: 'Not enough data for comparison',
          benchmarks: {}
        };
      }

      // This would be more complex in production with proper aggregations
      const benchmarks = {
        averageTopicsCompleted: 15,
        averageLearningVelocity: 1.5,
        averageStreak: 5
      };

      // Calculate percentile (simplified)
      let percentile = 50;
      if (userAnalytics.totalTopicsCompleted > benchmarks.averageTopicsCompleted) {
        percentile += 25;
      }
      if (userAnalytics.learningVelocity > benchmarks.averageLearningVelocity) {
        percentile += 15;
      }
      if (userAnalytics.currentStreak > benchmarks.averageStreak) {
        percentile += 10;
      }

      percentile = Math.min(95, Math.max(5, percentile));

      const comparison = percentile > 75 
        ? 'You\'re performing better than most users with your role!'
        : percentile > 50 
          ? 'You\'re doing great! A bit above average.'
          : 'Keep going! There\'s room for improvement.';

      return { percentile, comparison, benchmarks };
    } catch (error) {
      return {
        percentile: 50,
        comparison: 'Unable to calculate comparison',
        benchmarks: {}
      };
    }
  }
}