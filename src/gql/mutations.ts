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
// Alias for clarity in user management module
const CREATE_USER = SIGNUP;

const ADD_ROLE = gql`
  mutation SaveRole($payload: RoleInput!) {
    saveRole(payload: $payload) {
      success
      message
    }
  }
`;

const UPDATE_ROLE_PERMISSIONS = gql`
  mutation UpdateRolePermissions($payload: RolePermissionInput!) {
    updateRolePermissions(payload: $payload) {
      success
      message
    }
  }
`;

const DELETE_ROLE = gql`
  mutation DeleteRole($roleId: ID!) {
    deleteRole(role_id: $roleId) {
      success
      message
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($userId: String!) {
    deleteUser(user_id: $userId) {
      success
      message
    }
  }
`;

export { LOGIN, SIGNUP, CREATE_USER, ADD_ROLE, UPDATE_ROLE_PERMISSIONS, DELETE_ROLE, DELETE_USER };
