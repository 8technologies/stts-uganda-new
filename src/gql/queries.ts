import { gql } from '@apollo/client';

const LOAD_USERS = gql`
  query Users {
    users {
      id
      username
      first_name
      email
    }
  }
`;

export { LOAD_USERS };
