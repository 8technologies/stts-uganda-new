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
        is_grower
        is_merchant
        is_qds_producer
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
        receipt_id
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
          phone_number
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

const ASSIGN_INSPECTOR = gql`
  mutation AssignInspector($payload: AsignInspectorInput!) {
    assignInspector(payload: $payload) {
      success
      message
    }
  }
`;

const HALT_FORM = gql`
  mutation HaltForm($payload: HaltPayload!) {
    haltForm(payload: $payload) {
      success
      message
    }
  }
`;

const REJECT_FORM = gql`
  mutation RejectForm($payload: HaltPayload!) {
    rejectForm(payload: $payload) {
      success
      message
    }
  }
`;

const APPROVE_FORM = gql`
  mutation ApproveForm($payload: ApprovePayload!) {
    approveForm(payload: $payload) {
      success
      message
    }
  }
`;

const RECOMMEND = gql`
  mutation Recommend($payload: HaltPayload!) {
    recommend(payload: $payload) {
      success
      message
    }
  }
`;

const SAVE_QDS_FORMS = gql`
  mutation SaveQdsForm($payload: QDSApplicationFormInput!) {
    saveQdsForm(payload: $payload) {
      success
      message
      result {
        id
        user_id
        farm_location
        recommendation
        certification
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
        inspector_comment
        have_been_qds
        isolation_distance
        number_of_labors
        have_adequate_storage_facility
        is_not_used
        examination_category
        receipt_id
        recommendation_id
        form_type
      }
    }
  }
`;

// Crops module ------------------------------------------------------
const CREATE_CROP = gql`
  mutation CreateCrop($input: CreateCropInput!) {
    createCrop(input: $input) {
      success
      message
      crop {
        id
        name
        isQDS
        daysBeforeSubmission
        units
        varieties {
          id
        }
        createdAt
        updatedAt
      }
    }
  }
`;

const UPDATE_CROP = gql`
  mutation UpdateCrop($id: ID!, $input: UpdateCropInput!) {
    updateCrop(id: $id, input: $input) {
      success
      message
      crop {
        id
        name
        isQDS
        daysBeforeSubmission
        units
        varieties {
          id
        }
        createdAt
        updatedAt
      }
    }
  }
`;

const DELETE_CROP = gql`
  mutation DeleteCrop($id: ID!) {
    deleteCrop(id: $id) {
      success
      message
    }
  }
`;

// Import Permits ----------------------------------------------------
const CREATE_IMPORT_PERMIT = gql`
  mutation CreateImportPermit($input: CreateImportPermitInput!) {
    createImportPermit(input: $input) {
      success
      message
      permit {
        id
        applicantCategory
        stockQuantity
        countryOfOrigin
        supplierName
        supplierAddress
        createdAt
        updatedAt
      }
    }
  }
`;

const UPDATE_IMPORT_PERMIT = gql`
  mutation UpdateImportPermit($id: ID!, $input: UpdateImportPermitInput!) {
    updateImportPermit(id: $id, input: $input) {
      success
      message
      permit {
        id
        applicantCategory
        stockQuantity
        countryOfOrigin
        supplierName
        supplierAddress
        createdAt
        updatedAt
      }
    }
  }
`;

const DELETE_IMPORT_PERMIT = gql`
  mutation DeleteImportPermit($id: ID!) {
    deleteImportPermit(id: $id) {
      success
      message
    }
  }
`;

const ASSIGN_PERMIT_INSPECTOR = gql`
  mutation AssignPermitInspector($payload: AsignInspectorInput!) {
    assignPermitInspector(payload: $payload) {
      success
      message
    }
  }
`;

const HALT_PERMIT = gql`
  mutation HaltPermit($payload: HaltPayload!) {
    haltPermit(payload: $payload) {
      success
      message
    }
  }
`;

const REJECT_PERMIT = gql`
  mutation RejectPermit($payload: HaltPayload!) {
    rejectPermit(payload: $payload) {
      success
      message
    }
  }
`;

const APPROVE_PERMIT = gql`
  mutation ApprovePermit($payload: ApprovePermitPayload!) {
    approvePermit(payload: $payload) {
      success
      message
    }
  }
`;
// planting-returns uploads  ----------------------------------

const UPLOAD_PLANTING_RETURNS = gql`
  mutation CreatePlantingReturnUpload($input: PlantingReturnUploadInput!) {
  createPlantingReturnUpload(input: $input) {
    success
    message
    record {
      id
      sr8Number
      applicantName
      areaHa
      status
      createdAt
    }
  }
}
`;

//----------------------------------------------------------

// Planting Returns (SR8) -------------------------------------------
const CREATE_PLANTING_RETURN = gql`
  mutation CreatePlantingReturn($input: CreatePlantingReturnInput!) {
    createPlantingReturn(input: $input) {
      success
      message
      record {
        id
        sr8Number
        applicantName
        areaHa
        status
        createdAt
      }
    }
  }
`;

const UPDATE_PLANTING_RETURN = gql`
  mutation UpdatePlantingReturn($id: ID!, $input: UpdatePlantingReturnInput!) {
    updatePlantingReturn(id: $id, input: $input) {
      success
      message
      record { id sr8Number status updatedAt }
    }
  }
`;

const DELETE_PLANTING_RETURN = gql`
  mutation DeletePlantingReturn($id: ID!) {
    deletePlantingReturn(id: $id) {
      success
      message
    }
  }
`;

const ASSIGN_PLANTING_RETURN_INSPECTOR = gql`
  mutation AssignPlantingReturnInspector($input: AssignPlantingReturnInspectorInput!) {
    assignPlantingReturnInspector(input: $input) {
      success
      message
    }
  }
`;

const APPROVE_PLANTING_RETURN = gql`
  mutation ApprovePlantingReturn($input: ApprovePlantingReturnInput!) {
    approvePlantingReturn(input: $input) {
      success
      message
    }
  }
`;

const REJECT_PLANTING_RETURN = gql`
  mutation RejectPlantingReturn($input: RejectPlantingReturnInput!) {
    rejectPlantingReturn(input: $input) {
      success
      message
    }
  }
`;

const HALT_PLANTING_RETURN = gql`
  mutation HaltPlantingReturn($input: HaltPlantingReturnInput!) {
    haltPlantingReturn(input: $input) {
      success
      message
    }
  }
`;

// qds crop declarations -------------------------------------------

const CREATE_CROP_DECLARATION = gql`
  mutation SaveCropDeclaration($payload: CropDeclarationInput!) {
  saveCropDeclaration(payload: $payload) {
    success
    message
    data {
      id
      application_id
      source_of_seed
      user_id
      field_size
      seed_rate
      amount
      receipt_id
    }
  }
}
`;

const DELETE_CROP_DECLARATION = gql`
  mutation DeleteCropDeclaration($cropDeclarationId: ID!) {
    deleteCropDeclaration(crop_declaration_id: $cropDeclarationId) {
      success
      message
    }
  }
`;

const ASSIGN_CROP_DECLARATION_INSPECTOR = gql`
  mutation AssignCropDeclarationInspector($input: AssignCropDeclarationInspectorInput!) {
  assignCropDeclarationInspector(input: $input) {
    success
    message
  }
}
`;

const INITIALIZE_QDS_INSPECTION  = gql`
  mutation InitializeCropDecalrationInspection($input: InitializeCropDecalrationInspectionInput!) {
    initializeCropDecalrationInspection(input: $input) {
      success
      message
    }
  }
`;

const SUBMIT_QDS_INSPECTION_STAGE = gql`
  mutation SubmitCropDeclarationInspectionStage($input: SubmitCropDeclarationInspectionStageInput!) {
    submitCropDeclarationInspectionStage(input: $input) {
      success
      message
    }
  }
`;

//----------------------------------------------------------

const CREATE_STOCKEXAMINATION = gql`
  mutation SaveStockExamination($payload: StockExaminationInput!) {
    saveStockExamination(payload: $payload) {
      success
      message
      data {
        id
        created_at
        submittedAt
        user_id
        variety_id
        import_export_permit_id
        planting_return_id
        form_qds_id
        report
        status
        inspector_id
        status_comment
        remarks
        mother_lot
      }
    }
  }
`;

const SUBMIT_STOCK_EXAMINATION_INSPECTION = gql`
  mutation SubmitStockExaminationInspection($input: StockExaminationInspectionInput!) {
    submitStockExaminationInspection(input: $input) {
      success
      message
    }
  }
`;

const ASSIGN_STOCK_EXAMINATION_INSPECTOR = gql `
  mutation AssignStockExaminationInspector($input: AssignInspectorInput!) {
    assignStockExaminationInspector(input: $input) {
      success
      message
    }
  }
`;

//----------------------------------------------------------  

const SAVE_SEED_LAB_REQUEST = gql`
  mutation SaveSeedLabRequest($input: SeedLabInput!) {
  saveSeedLabRequest(input: $input) {
    success
    message
    data {
      id
      user_id
      variety_id
      stock_examination_id
      collection_date
      receipt_id
      applicant_remark
      inspector_id
      status
      inspector_report
      deleted
      created_at
    }
  }
}
`;

const ASSIGN_LAB_INSPECTOR = gql`
  mutation AssignLabInspector($input: AssignLabInspectorInput!) {
    assignLabInspector(input: $input) {
      success
      message
    }
  }
`;

const SUBMIT_LAB_INSPECTION = gql`
  mutation SubmitLabInspection($input: LabInspectionInput!) {
    submitLabInspection(input: $input) {
      success
      message
    }
  }
`;

const RECEIVE_SEED_LAB_INSPECTION = gql`
  mutation ReceiveLabInspection($input: ReceiveLabInspectionInput!) {
    receiveLabInspection(input: $input) {
      success
      message
    }
  }
`;

const SUBMIT_LAB_TEST = gql`
  mutation SubmitLabTestReport($input: LabTestReportInput!) {
    submitLabTestReport(input: $input) {
      success
      message
    }
  }
`;

const CREATE_SEED_LABEL = gql`
  mutation SaveSeedLabelRequest($input: SeedLabelInput!) {
  saveSeedLabelRequest(input: $input) {
    success
    message
    data {
      id
      user_id
      seed_lab_id
      crop_variety_id
      CropVariety {
        id
        name
        cropId
      }
      seed_label_package
      quantity
      available_stock
      applicant_remark
      status
      status_comment
      receipt_id
      deleted
      created_at
      createdBy {
        id
        username
      }
      image_id
    }
  }
}
`;

const DELETE_SEED_LABEL = gql`
  mutation SubmitLabTestReport($input: LabTestReportInput!) {
    submitLabTestReport(input: $input) {
      success
      message
    }
  }
`;

const APPROVE_SEED_LABEL = gql`
  mutation ApproveSeedLabelRequest($approveSeedLabelRequestId: ID!) {
    approveSeedLabelRequest(id: $approveSeedLabelRequestId) {
      success
      message
    }
  }
`;
const PRINT_SEED_LABEL = gql`
  mutation PrintSeedLabelRequest($printSeedLabelRequestId: ID!) {
    printSeedLabelRequest(id: $printSeedLabelRequestId) {
      success
      message
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
  SAVE_SR6_FORMS,
  SAVE_QDS_FORMS,
  ASSIGN_INSPECTOR,
  HALT_FORM,
  REJECT_FORM,
  APPROVE_FORM,
  RECOMMEND,
  CREATE_CROP,
  UPDATE_CROP,
  DELETE_CROP,
  CREATE_IMPORT_PERMIT,
  UPDATE_IMPORT_PERMIT,
  DELETE_IMPORT_PERMIT,
  ASSIGN_PERMIT_INSPECTOR,
  HALT_PERMIT,
  REJECT_PERMIT,
  APPROVE_PERMIT,
  CREATE_PLANTING_RETURN,
  UPDATE_PLANTING_RETURN,
  DELETE_PLANTING_RETURN,
  ASSIGN_PLANTING_RETURN_INSPECTOR,
  APPROVE_PLANTING_RETURN,
  REJECT_PLANTING_RETURN,
  HALT_PLANTING_RETURN,
  CREATE_CROP_DECLARATION,
  DELETE_CROP_DECLARATION,
  ASSIGN_CROP_DECLARATION_INSPECTOR,
  INITIALIZE_QDS_INSPECTION,
  SUBMIT_QDS_INSPECTION_STAGE,

  //-----
  UPLOAD_PLANTING_RETURNS,

  //--------------------------------
  CREATE_STOCKEXAMINATION,
  SUBMIT_STOCK_EXAMINATION_INSPECTION,
  ASSIGN_STOCK_EXAMINATION_INSPECTOR,

  //------------------------------
  SAVE_SEED_LAB_REQUEST,
  ASSIGN_LAB_INSPECTOR,
  SUBMIT_LAB_INSPECTION,
  RECEIVE_SEED_LAB_INSPECTION,
  SUBMIT_LAB_TEST,

  //--------------------------------
  CREATE_SEED_LABEL,
  DELETE_SEED_LABEL,
  APPROVE_SEED_LABEL,
  PRINT_SEED_LABEL,

};

// ---- Plant Inspection (SR10) placeholder mutations ----
export const INITIALIZE_PLANTING_INSPECTION = gql`
  mutation InitializePlantingReturnInspection($input: InitializePlantingReturnInspectionInput!) {
    initializePlantingReturnInspection(input: $input) {
      success
      message
    }
  }
`;

export const SUBMIT_PLANTING_INSPECTION_STAGE = gql`
  mutation SubmitPlantingInspectionStage($input: SubmitPlantingInspectionStageInput!) {
    submitPlantingInspectionStage(input: $input) {
      success
      message
    }
  }
`;

export const CREATE_ORDER = gql`
  mutation CreateOrder($payload: OrderInput!) {
    createOrder(payload: $payload) {
      success
      message
      data {
        id
        status
        createdAt
      }
    }
  }
`;
