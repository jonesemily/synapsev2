module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('PM', 'Designer', 'Executive', 'Developer', 'Other'),
      defaultValue: 'Other'
    },
    experience: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
      defaultValue: 'Beginner'
    },
    learningGoals: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        dailyTimeGoal: 30, // minutes
        difficulty: 'medium',
        topics: [],
        reminderTime: '09:00'
      }
    },
    lastActive: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['lastActive'] }
    ]
  });

  User.associate = (models) => {
    User.hasMany(models.LearningSession, { foreignKey: 'userId', as: 'sessions' });
    User.hasMany(models.UserProgress, { foreignKey: 'userId', as: 'progress' });
    User.hasMany(models.LearningPath, { foreignKey: 'userId', as: 'learningPaths' });
    User.hasMany(models.AgentSession, { foreignKey: 'userId', as: 'agentSessions' });
  };

  return User;
};