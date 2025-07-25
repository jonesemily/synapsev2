module.exports = (sequelize, DataTypes) => {
  const LearningPathTopics = sequelize.define('LearningPathTopics', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    learningPathId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'learning_paths',
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
    sequenceOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    targetMasteryScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.8,
      validate: {
        min: 0.0,
        max: 1.0
      }
    },
    estimatedTimeMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    actualTimeMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'learning_path_topics',
    timestamps: true,
    indexes: [
      { fields: ['learningPathId', 'topicId'], unique: true },
      { fields: ['sequenceOrder'] },
      { fields: ['isCompleted'] }
    ]
  });

  return LearningPathTopics;
};