import './index.css';
import type {ReactNode} from 'react';
import {ApolloProvider} from '@apollo/client/react';
import {ApolloClient, HttpLink, InMemoryCache} from '@apollo/client';

const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
  }),
  cache: new InMemoryCache(),
});

export default function Wrapper({children}: {children: ReactNode}) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
