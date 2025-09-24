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
      receipt_id
      accept_declaration
      valid_from
      valid_until
      status
      status_comment
      inspector_comment
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
        id
        name
        district
      }
      user {
        name
        username
        company_initials
        phone_number
        email
        district
        premises_location
      }
    }
  }
`;

const LOAD_SR6_FORMS = gql`
  query Sr6_applications {
    sr6_applications {
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
      # registration_number
      valid_from
      valid_until
      status
      inspector_id
      status_comment
      recommendation
      have_adequate_storage
      seed_grower_in_past
      type
      receipt_id
      other_documents
      user {
        username
        name
        company_initials
        email
        premises_location
        district
        phone_number
      }
      inspector {
        name
        district
      }
    }
  }
`;

const LOAD_QDS_FORMS = gql`
  query Qds_applications {
    qds_applications {
      id
      user_id
      farm_location
      recommendation
      certification
      receipt_id
      recommendation_id
      years_of_experience
      dealers_in
      previous_grower_number
      cropping_history
      have_adequate_isolation
      have_adequate_labor
      aware_of_minimum_standards
      signature_of_applicant
      grower_number
      seed_board_registration_number
      valid_from
      valid_until
      status
      inspector_id
      status_comment
      inspector_comment
      have_been_qds
      isolation_distance
      number_of_labors
      have_adequate_storage_facility
      is_not_used
      examination_category
      user {
        username
        name
        company_initials
        email
        premises_location
        district
        phone_number
      }
      inspector {
        name
        district
      }
    }
  }
`;

const LOAD_INSPECTORS = gql`
  query Inspectors {
    inspectors {
      id
      username
      name
      company_initials
      email
      district
    }
  }
`;

export {
  LOAD_USERS,
  ME,
  ROLES,
  REGISTER,
  LOAD_SR4_FORMS,
  LOAD_SR6_FORMS,
  LOAD_QDS_FORMS,
  LOAD_INSPECTORS
};
