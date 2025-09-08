import { gql } from '@apollo/client';

const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    message
    success
    token
    user {
      id
      username
      first_name
      other_names
      email
      district
      image
      created_at
      updated_at
    }
  }
}
`;

const SIGNUP = gql`
  mutation CreateUser($payload: CreateUserInput!) {
    createUser(payload: $payload) {
      message
      success
      user {
        id
        username
        first_name
        other_names
        email
        district
        image
      }
    }
  }
`;

export { LOGIN, SIGNUP };
