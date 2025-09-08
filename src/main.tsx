import '@/components/keenicons/assets/styles.css';
import './styles/globals.css';

import axios from 'axios';
import ReactDOM from 'react-dom/client';

import { App } from './App';
import { setupAxios } from './auth';
import { ProvidersWrapper } from './providers';
import React from 'react';
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';

import { MAIN_URL } from './config/urls';

import { CombinedGraphQLErrors, CombinedProtocolErrors } from '@apollo/client/errors';

/**
 * Inject interceptors for axios.
 *
 * @see https://github.com/axios/axios#interceptors
 */
setupAxios(axios);

const link = new SetContextLink((prevContext, operation) => {
  // const token = store.getState().token.token;
  return {
    credentials: 'include',
    headers: {
      'x-apollo-operation-name': operation.operationName || 'Unknown',
      'apollo-require-preflight': 'true',
      Authorization: `Bearer `
    }
    // ...
  };
});

// Log any GraphQL errors, protocol errors, or network error that occurred
const errorLink = new ErrorLink(({ error, operation }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, locations, path }) =>
      console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
    );
  } else if (CombinedProtocolErrors.is(error)) {
    error.errors.forEach(({ message, extensions }) =>
      console.log(
        `[Protocol error]: Message: ${message}, Extensions: ${JSON.stringify(extensions)}`
      )
    );
  } else {
    console.error(`[Network error]: ${error}`);
  }
});

// Split links: use WebSocket for subscriptions and HTTP for everything else
// const splitLink = split(
//   ({ query }) => {
//     const definition = getMainDefinition(query);
//     return (
//       definition.kind === "OperationDefinition" &&
//       definition.operation === "subscription"
//     );
//   },
//   wsLink, // Use WebSocket for subscriptions
//   ApolloLink.from([errorLink, authLink, httpLink]) // Use HTTP for queries/mutations
// );

// Apollo Client instance
const client = new ApolloClient({
  link: new UploadHttpLink({
    uri: MAIN_URL
  }),
  cache: new InMemoryCache()
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <ProvidersWrapper>
        <App />
      </ProvidersWrapper>
    </ApolloProvider>
  </React.StrictMode>
);
