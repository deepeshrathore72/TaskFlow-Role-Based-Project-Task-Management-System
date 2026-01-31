require('dotenv').config();

// Support both DATABASE_URL and individual credentials
const getDatabaseConfig = (environment) => {
  // If DATABASE_URL is provided (for online databases like Neon, Supabase, etc.)
  if (process.env.DATABASE_URL) {
    const dialectOptions = {};
    
    // Check if using Neon with pooler (channel_binding parameter)
    if (process.env.DATABASE_URL.includes('channel_binding')) {
      // Neon pooler connections - don't use SSL in dialect options
      // SSL is handled by the connection string parameters
    } else {
      // Other providers - use standard SSL configuration
      dialectOptions.ssl = {
        require: true,
        rejectUnauthorized: false,
      };
    }

    return {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      logging: environment === 'development' ? console.log : false,
      dialectOptions,
    };
  }

  // Otherwise use individual credentials (for local database)
  const baseConfig = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: environment === 'development' ? false : false,
  };

  // Add SSL for production even with individual credentials
  if (environment === 'production') {
    baseConfig.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }

  return baseConfig;
};

module.exports = {
  development: getDatabaseConfig('development'),
  production: getDatabaseConfig('production'),
};
