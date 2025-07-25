module.exports = (sequelize, DataTypes) => {
  const LearningPath = sequelize.define('LearningPath', {
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
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('PERSONALIZED', 'ROLE_BASED', 'SKILL_BASED', 'INDUSTRY_SPECIFIC'),
      defaultValue: 'PERSONALIZED'
    },
    targetRole: {
      type: DataTypes.STRING,
      allowNull: true
    },
    targetSkill: {
      type: DataTypes.STRING,
      allowNull: true
    },
    estimatedDays: {
      type: DataTypes.INTEGER,
      defaultValue: 30
    },
    difficulty: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED'),
      defaultValue: 'ACTIVE'
    },
    progress: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
      validate: {
        min: 0.0,
        max: 1.0
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        createdBy: 'LEARNING_STRATEGIST_AGENT',
        adaptationCount: 0,
        lastAdapted: null
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'learning_paths',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['targetRole'] }
    ]
  });

  LearningPath.associate = (models) => {
    LearningPath.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    LearningPath.belongsToMany(models.Topic, { 
      through: 'LearningPathTopics', 
      foreignKey: 'learningPathId',
      as: 'topics'
    });
    LearningPath.hasMany(models.LearningSession, { foreignKey: 'learningPathId', as: 'sessions' });
  };

  return LearningPath;
};