const { sequelize } = require('../models');

async function initializeDatabase() {
  try {
    console.log('🔄 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('🔄 Synchronizing database schema...');
    await sequelize.sync({ force: false }); // Set to true to drop and recreate tables
    console.log('✅ Database schema synchronized successfully.');

    console.log('🔄 Running any pending migrations...');
    // Add migration logic here if needed

    console.log('✅ Database initialization completed successfully.');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase().then(() => {
    console.log('🎉 Database is ready for the multi-agent learning platform!');
    process.exit(0);
  });
}

module.exports = { initializeDatabase };