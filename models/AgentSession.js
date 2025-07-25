module.exports = (sequelize, DataTypes) => {
  const AgentSession = sequelize.define('AgentSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    agentType: {
      type: DataTypes.ENUM(
        'CONTENT_CURATOR',
        'LEARNING_STRATEGIST', 
        'PRACTICE_COACH',
        'RESEARCH_ASSISTANT',
        'CONVERSATION_COACH'
      ),
      allowNull: false
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    context: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    messages: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'FAILED', 'TIMEOUT'),
      defaultValue: 'ACTIVE'
    },
    startTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    executionTimeMs: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tokensUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    cost: {
      type: DataTypes.DECIMAL(10, 6),
      defaultValue: 0.0
    },
    resultData: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'agent_sessions',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['agentType'] },
      { fields: ['status'] },
      { fields: ['startTime'] },
      { fields: ['sessionId'] }
    ]
  });

  AgentSession.associate = (models) => {
    AgentSession.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AgentSession;
};