import { gql } from '@apollo/client';

const LOGIN = gql`

  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      success
      message
      token
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

const SIGNUP = gql`
  mutation CreateUser($payload: CreateUserInput!) {
    createUser(payload: $payload) {
      message
      success
      user {
        id
        username
        name
        company_initials
        phone_number
        premises_location
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

const SAVE_SR4_FORMS = gql`
  mutation SaveSr4Form($payload: SR4ApplicationFormInput!) {
    saveSr4Form(payload: $payload) {
      success
      message
      result {
        id
        user_id
        years_of_experience
        experienced_in
        dealers_in
        processing_of
        marketing_of
        have_adequate_land
        land_size
        equipment
        have_adequate_equipment
        have_contractual_agreement
        have_adequate_field_officers
        have_conversant_seed_matters
        have_adequate_land_for_production
        have_internal_quality_program
        source_of_seed
        receipt
        accept_declaration
        valid_from
        valid_until
        status
        status_comment
        recommendation
        inspector_id
        dealers_in_other
        marketing_of_other
        have_adequate_storage
        seed_board_registration_number
        type
        processing_of_other
        inspector {
          name
          district
        }
        user {
          name
          username
          company_initials
          email
          district
          premises_location
        }
      }
    }
  }
`;

const SAVE_SR6_FORMS = gql`
  mutation SaveSr6Form($payload: SR6ApplicationFormInput!) {
  saveSr6Form(payload: $payload) {
    success
    message
    result {
      id
      user_id
      years_of_experience
      dealers_in
      previous_grower_number
      cropping_history
      have_adequate_isolation
      have_adequate_labor
      aware_of_minimum_standards
      signature_of_applicant
      grower_number
      registration_number
      valid_from
      valid_until
      status
      inspector_id
      status_comment
      recommendation
      have_adequate_storage
      seed_grower_in_past
      type
    }
  }
}
`;

export {
  LOGIN,
  SIGNUP,
  CREATE_USER,
  ADD_ROLE,
  UPDATE_ROLE_PERMISSIONS,
  DELETE_ROLE,
  DELETE_USER,
  SAVE_SR4_FORMS,
  SAVE_SR6_FORMS
};
