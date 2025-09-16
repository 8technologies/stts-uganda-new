import { gql } from '@apollo/client';

const LOAD_USERS = gql`
  query Users {
    users {
      id
      username
      name
      company_initials
      phone_number
      premises_location
      email
      district
      image
      role_id
      role_name
      created_at
      updated_at
    }
  }
`;

const ME = gql`
  query Me {
    me {
      id
      username
      name
      company_initials
      email
      district
      premises_location
      phone_number
      image
      created_at
      updated_at
    }
  }
`;

const ROLES = gql`
  query Roles {
    roles {
      id
      name
      description
      permissions
    }
  }
`;

const REGISTER = gql`
  

  mutation Register($payload: RegisterInput!) {
    register(payload: $payload) {
      success
      message
      user {
        id
        username
        name
        company_initials
        email
        district
        premises_location
        phone_number
        image
        role_id
        role_name
        created_at
        updated_at
      }
    }
  }
`;

export { LOAD_USERS, ME, ROLES, REGISTER };
