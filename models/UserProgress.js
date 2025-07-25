module.exports = (sequelize, DataTypes) => {
  const UserProgress = sequelize.define('UserProgress', {
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
    status: {
      type: DataTypes.ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'MASTERED'),
      defaultValue: 'NOT_STARTED'
    },
    confidenceLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 10
      }
    },
    masteryScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
      validate: {
        min: 0.0,
        max: 1.0
      }
    },
    timeSpentMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    firstStudiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastStudiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    studyStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    nextReviewDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    learningVelocity: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
      comment: 'Topics per week'
    },
    difficultyRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    personalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    practiceAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    successfulPractices: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'user_progress',
    timestamps: true,
    indexes: [
      { fields: ['userId', 'topicId'], unique: true },
      { fields: ['status'] },
      { fields: ['masteryScore'] },
      { fields: ['lastStudiedAt'] },
      { fields: ['nextReviewDate'] }
    ]
  });

  UserProgress.associate = (models) => {
    UserProgress.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    UserProgress.belongsTo(models.Topic, { foreignKey: 'topicId', as: 'topic' });
  };

  return UserProgress;
};