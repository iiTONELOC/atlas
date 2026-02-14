import {UserRepository, User} from 'atlas-database';

export const resolvers = {
  Query: {
    hello: () => 'Hello from TrashScanner™ API!',
  },
  Mutation: {
    createUser: async (_parent: any, args: any, context: any) => {
      const {email, username, password} = args;
      const userRepo = new UserRepository(context.dataSource.getRepository(User));
      return await userRepo.create({
        credentials: {email, password},
        displayName: username,
      });
    },
  },
};
