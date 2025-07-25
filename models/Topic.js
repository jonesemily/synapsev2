module.exports = (sequelize, DataTypes) => {
  const Topic = sequelize.define('Topic', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    category: {
      type: DataTypes.ENUM('AI_FUNDAMENTALS', 'MACHINE_LEARNING', 'NLP', 'COMPUTER_VISION', 'ETHICS', 'BUSINESS_AI', 'TOOLS', 'TRENDS'),
      allowNull: false
    },
    difficulty: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
      allowNull: false,
      defaultValue: 'Beginner'
    },
    estimatedTimeMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 15
    },
    definition: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    whyItMatters: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    realWorldExample: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    prerequisites: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: []
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sourceUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sourceType: {
      type: DataTypes.ENUM('NEWSLETTER', 'ARTICLE', 'RESEARCH', 'MANUAL'),
      defaultValue: 'MANUAL'
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    tableName: 'topics',
    timestamps: true,
    indexes: [
      { fields: ['category'] },
      { fields: ['difficulty'] },
      { fields: ['tags'] },
      { fields: ['slug'] },
      { fields: ['isActive'] }
    ]
  });

  Topic.associate = (models) => {
    Topic.hasMany(models.UserProgress, { foreignKey: 'topicId', as: 'userProgress' });
    Topic.belongsToMany(models.LearningPath, { 
      through: 'LearningPathTopics', 
      foreignKey: 'topicId',
      as: 'learningPaths'
    });
    Topic.hasMany(models.PracticeScenario, { foreignKey: 'topicId', as: 'scenarios' });
  };

  return Topic;
};