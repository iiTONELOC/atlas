import {SQL} from 'bun';

const mariaDB = new SQL(
  `mariadb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
);

// Example query to test the connection
async function testConnection() {
  try {
    const result = await mariaDB`SELECT NOW() AS currentTime`;
    console.log('Database connected successfully @', result[0].currentTime);
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

await testConnection();
