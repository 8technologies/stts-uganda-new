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

const LOAD_SR4_FORMS = gql`
  query Sr4_applications {
    sr4_applications {
      id
      user_id
      name_of_applicant
      address
      phone_number
      company_initials
      premises_location
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
      created_at
      updated_at
      inspector {
        first_name
        other_names
      }
    }
  }
`;

export { LOAD_USERS, ME, ROLES, REGISTER, LOAD_SR4_FORMS };
