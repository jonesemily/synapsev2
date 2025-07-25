module.exports = (sequelize, DataTypes) => {
  const LearningSession = sequelize.define('LearningSession', {
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
    topicId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'topics',
        key: 'id'
      }
    },
    learningPathId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'learning_paths',
        key: 'id'
      }
    },
    sessionType: {
      type: DataTypes.ENUM('READING', 'PRACTICE', 'CHAT', 'ASSESSMENT', 'SCENARIO'),
      allowNull: false
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    confidenceBefore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10
      }
    },
    confidenceAfter: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10
      }
    },
    completionStatus: {
      type: DataTypes.ENUM('COMPLETED', 'PARTIAL', 'ABANDONED'),
      defaultValue: 'PARTIAL'
    },
    interactionData: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    feedback: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'learning_sessions',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['topicId'] },
      { fields: ['sessionType'] },
      { fields: ['startTime'] },
      { fields: ['completionStatus'] }
    ]
  });

  LearningSession.associate = (models) => {
    LearningSession.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    LearningSession.belongsTo(models.Topic, { foreignKey: 'topicId', as: 'topic' });
    LearningSession.belongsTo(models.LearningPath, { foreignKey: 'learningPathId', as: 'learningPath' });
  };

  return LearningSession;
};