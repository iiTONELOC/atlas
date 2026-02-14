import {readFileSync} from 'node:fs';
import {join} from 'node:path';

// Load GraphQL schema from .graphql file
const schemaPath = join(import.meta.dirname, 'schema.graphql');
export const typeDefs = readFileSync(schemaPath, 'utf-8');
