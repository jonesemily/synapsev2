module.exports = (sequelize, DataTypes) => {
  const PracticeScenario = sequelize.define('PracticeScenario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    topicId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'topics',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    scenarioType: {
      type: DataTypes.ENUM('DECISION_MAKING', 'CASE_STUDY', 'SIMULATION', 'INTERVIEW_PREP', 'PROBLEM_SOLVING'),
      allowNull: false
    },
    difficulty: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
      allowNull: false
    },
    estimatedTimeMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 15
    },
    context: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    situation: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    challenge: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    expectedOutcomes: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    evaluationCriteria: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    hints: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    sampleResponses: {
      type: DataTypes.JSONB,
      defaultValue: {
        excellent: [],
        good: [],
        needsImprovement: []
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    companySize: {
      type: DataTypes.ENUM('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'),
      allowNull: true
    },
    roleLevel: {
      type: DataTypes.ENUM('JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.ENUM('PRACTICE_COACH_AGENT', 'MANUAL', 'IMPORTED'),
      defaultValue: 'PRACTICE_COACH_AGENT'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'practice_scenarios',
    timestamps: true,
    indexes: [
      { fields: ['topicId'] },
      { fields: ['scenarioType'] },
      { fields: ['difficulty'] },
      { fields: ['industry'] },
      { fields: ['tags'] },
      { fields: ['isActive'] }
    ]
  });

  PracticeScenario.associate = (models) => {
    PracticeScenario.belongsTo(models.Topic, { foreignKey: 'topicId', as: 'topic' });
  };

  return PracticeScenario;
};