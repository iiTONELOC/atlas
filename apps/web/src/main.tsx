import React from 'react';
import ReactDOM from 'react-dom/client';
import {ApolloProvider} from '@apollo/client/react';
import {ApolloClient, HttpLink, InMemoryCache} from '@apollo/client';
import App from './App';
import './index.css';

// GraphQL Client
const client = new ApolloClient({
  link: new HttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
  }),
  cache: new InMemoryCache(),
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
);
