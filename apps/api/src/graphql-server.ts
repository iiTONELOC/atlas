import {ApolloServer} from '@apollo/server';
import {AppDataSource} from 'atlas-database';
import {typeDefs} from './schema';
import {resolvers} from './resolvers';

let apolloServer: ApolloServer | null = null;

export async function initializeGraphQLServer(): Promise<ApolloServer> {
  if (apolloServer) {
    return apolloServer;
  }

  // Initialize database
  await AppDataSource.initialize()
    .then(() => {
      console.log('✓ Database initialized');
    })
    .catch((error: Error) => {
      console.error('✗ Database initialization failed:', error);
      process.exit(1);
    });

  // Initialize Apollo Server
  apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  return apolloServer;
}

export function getDataSource() {
  return AppDataSource;
}
