import { gql } from "@apollo/client";

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
      is_grower
      is_merchant
      is_qds_producer
    }
  }
`;

const LOAD_CROPS = gql`
  query Crops($filter: CropFilter, $pagination: PaginationInput) {
    crops(filter: $filter, pagination: $pagination) {
      total
      items {
        id
        name
        isQDS
        daysBeforeSubmission
        units
        createdAt
        updatedAt
        varieties {
          id
        }
      }
    }
  }
`;

const LOAD_CROP = gql`
  query Crop($id: ID!) {
    crop(id: $id) {
      id
      name
      isQDS
      daysBeforeSubmission
      units
      createdAt
      updatedAt
      varieties {
        id
        name
      }
      inspectionTypes {
        id
        stageName
        order
        required
        periodAfterPlantingDays
      }
    }
  }
`;

const LOAD_IMPORT_PERMITS = gql`
  query ImportPermits(
    $filter: ImportPermitFilter
    $pagination: PaginationInput
  ) {
    importPermits(filter: $filter, pagination: $pagination) {
      total
      items {
        id
        applicantCategory
        stockQuantity
        countryOfOrigin
        supplierName
        supplierAddress
        permitNumber
        status
        statusComment
        inspector {
          id
          name
          email
          image
        }
        createdAt
        updatedAt
        createdBy {
          id
          username
          image
          name
          email
        }
      }
    }
  }
`;

const LOAD_IMPORT_PERMIT = gql`
  query ImportPermit($id: ID!) {
    importPermit(id: $id) {
      id
      applicantCategory
      status
      statusComment
      permitNumber
      validFrom
      validUntil
      stockQuantity
      countryOfOrigin
      supplierName
      supplierAddress
      consignment
      inspector {
        id
        name
        email
        image
      }
      items {
        id
        cropId
        varietyId
        category
        weight
        measure
        crop {
          id
          name
        }
        variety {
          id
          name
        }
      }
      attachments {
        id
        fileName
        filePath
        mimeType
        fileSize
        createdAt
        updatedAt
      }
      createdAt
      updatedAt
      createdBy {
        id
        username
        name
        email
      }
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
      is_grower
      is_merchant
      is_qds_producer
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
      seed_board_registration_number
      # registration_number
      valid_from
      valid_until
      status
      inspector_id
      status_comment
      recommendation
      have_adequate_storage
      seed_grower_in_past
      inspector_comment
      type
      receipt_id
      created_at
      updated_at
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
      created_at
      updated_at
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

// Planting Returns (SR8)
const LOAD_PLANTING_RETURNS = gql`
  query PlantingReturns(
    $filter: PlantingReturnFilter
    $pagination: PaginationInput
  ) {
    plantingReturns(filter: $filter, pagination: $pagination) {
      total
      items {
        id
        sr8Number
        applicantName
        growerNumber
        contactPhone
        gardenNumber
        receipt_id
        fieldName
        location {
          district
          subcounty
          parish
          village
          gpsLat
          gpsLng
        }
        crop {
          id
          name
        }
        variety {
          id
          name
        }
        seedClass
        areaHa
        dateSown
        expectedHarvest
        seedSource
        seedLotCode
        intendedMerchant
        seedRatePerHa
        status
        statusComment
        scheduledVisitDate
        inspector {
          id
          name
          email
          image
        }
        createdBy {
          id
          name
          email
          image
        }
        createdAt
        updatedAt
      }
    }
  }
`;

const LOAD_PLANTING_RETURN = gql`
  query PlantingReturn($id: ID!) {
    plantingReturn(id: $id) {
      id
      sr8Number
      applicantName
      growerNumber
      contactPhone
      gardenNumber
      fieldName
      location {
        district
        subcounty
        parish
        village
        gpsLat
        gpsLng
      }
      crop {
        id
        name
      }
      variety {
        id
        name
      }
      seedClass
      areaHa
      dateSown
      expectedHarvest
      seedSource
      seedLotCode
      intendedMerchant
      seedRatePerHa
      status
      statusComment
      scheduledVisitDate
      inspector {
        id
        name
        email
        image
      }
      createdBy {
        id
        name
        email
        image
      }
      createdAt
      updatedAt
    }
  }
`;

const LOAD_CROP_DECLARATIONS = gql`
  query CropDeclarations(
    $filter: CropDeclarationFilter
    $pagination: PaginationInput
  ) {
    cropDeclarations(filter: $filter, pagination: $pagination) {
      items {
        id
        application_id
        source_of_seed
        field_size
        seed_rate
        amount
        receipt_id
        inspector_id
        status
        status_comment
        valid_from
        valid_until
        created_at
        updated_at
        crops {
          id
          crop_id
          variety_id
          variety_name
          crop_name
        }
        inspector {
          id
          name

          username
        }
        createdBy {
          id
          name
          image
          username
        }
      }
      total
    }
  }
`;

const LOAD_CROP_DECLARATION = gql`
  query CropDeclaration($cropDeclarationId: ID!) {
    cropDeclaration(id: $cropDeclarationId) {
      id
      application_id
      source_of_seed
      field_size
      seed_rate
      amount
      receipt_id
      inspector_id
      status
      status_comment
      valid_from
      valid_until
      created_at
      updated_at
      inspector {
        id
        username
      }
      crops {
        id
        crop_declaration_id
        crop_id
        variety_id
        variety_name
        crop_name
      }
      createdBy {
        id
        name
        username
      }
    }
  }
`;

const LOAD_QDS_INSPECTION = gql`
  query CropDecalrationInspection(
    $cropDecalrationInspectionId: ID!
    $cropId: ID!
  ) {
    CropDecalrationInspection(
      id: $cropDecalrationInspectionId
      cropId: $cropId
    ) {
      id
      CropDecalrationId
      stages {
        id
        CropDecalrationId
        CropDecalrationCropId
        inspectionTypeId
        stageName
        order
        required
        status
        dueDate
        submittedAt
        reportUrl
        comment
        inputs
      }
    }
  }
`;

const LOAD_STOCK_EXAMINATIONS = gql`
  query StockExaminations {
    stockExaminations {
      id
      created_at
      submittedAt
      user_id
      variety_id
      import_export_permit_id
      planting_return_id
      form_qds_id
      report
      seed_class
      field_size
      yield
      status
      category
      inspector_id
      status_comment
      remarks
      mother_lot
      user {
        username
        id
      }
      inspector {
        id
        username
      }
    }
  }
`;

const LOAD_STOCK_EXAMINATION = gql`
  query StockExamination($stockExaminationId: ID!) {
    stockExamination(id: $stockExaminationId) {
      id
      created_at
      submittedAt
      user_id
      category
      variety_id
      import_export_permit_id
      planting_return_id
      form_qds_id
      report
      seed_class
      field_size
      yield
      status
      inspector_id
      status_comment
      remarks
      mother_lot
      user {
        username
        id
      }
      inspector {
        id
        username
      }
    }
  }
`;

const LOAD_STOCK_RECORDS = gql`
  query StockRecords {
    stockRecords {
      id
      user_id
      seed_lab_id
      crop_variety_id
      seed_class
      source
      stock_examination_id
      quantity
      is_deposit
      is_transfer
      created_at
      updated_at
      lot_number
      Owner{
        username
        name
      }

      CropVariety {
        name
      }
    }
  }
`;

//------------------------------------------
const LOAD_SEED_LABS = gql`
  query GetLabInspections {
    getLabInspections {
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
      lab_test_number
      lot_number
      lab_test_report
      deleted
      created_at
      createdBy {
        username
        name
      }
      variety {
        id
        cropId
        name
      }
      inspector {
        username
        name
      }
    }
  }
`;

const LOAD_SEED_LABELS = gql`
  query GetSeedLabels {
    getSeedLabels {
      id
      user_id
      seed_lab_id
      crop_variety_id
      CropVariety {
        cropId
        id
        name
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
        district
        name
      }
      image_id
      Crop {
        name
        id
      }
      SeedLab {
        id
        lab_test_report
        lot_number
      }
    }
  }
`;

const LOAD_SEED_LABEL_BY_ID = gql`
  query GetSeedLabel($getSeedLabelId: ID!) {
    getSeedLabel(id: $getSeedLabelId) {
      id
      user_id
      seed_lab_id
      crop_variety_id
      CropVariety {
        cropId
        id
        name
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
`;

const DASHBOARD_STATS = gql`
  query DashboardStats {
    dashboardStats {
      registeredUsers
      userPermits
      pendingPermits
      cropDeclarations
      printedLabels
      pendingLabels
      myActiveForms
      myActivePermits
      myApprovedPlantingReturns
      assignedForms
      assignedPermits
      assignedPlantingReturns
      pendingInspections
      receivedLabRequests
      haltedLabRequests
      marketableSeed
      nonMarketableSeed
      totalInspections
      scheduledVisits
      pendingCorrectiveActions
      inspections {
        label
        value
      }
      seedStock {
        label
        total
      }
      recentActivities {
        id
        title
        entity
        status
        category
        timestamp
      }
    }
  }
`;

const TRACK_TRACE = gql`
 query TrackTrace($lotNumber: String!) {
  trackTrace(lotNumber: $lotNumber) {
    lotNumber
    seedDetails {
      id
      status
      crop
      variety
      quantity
      labelPackage
      applicant
      createdAt
    }
    seedLab {
      id
      lotNumber
      status
      labTestNumber
      inspector
      collectedAt
      receivedAt
      testResults
    }
    motherLot {
      id
      lotNumber
      seedClass
      motherLot
      yieldAmount
      fieldSize
      inspector
      status
      createdAt
    }
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
  LOAD_INSPECTORS,
  LOAD_CROPS,
  LOAD_CROP,
  LOAD_IMPORT_PERMITS,
  LOAD_IMPORT_PERMIT,
  LOAD_PLANTING_RETURNS,
  LOAD_PLANTING_RETURN,
  LOAD_CROP_DECLARATIONS,
  LOAD_CROP_DECLARATION,
  LOAD_QDS_INSPECTION,

  // -------------------------
  LOAD_STOCK_EXAMINATIONS,
  LOAD_STOCK_EXAMINATION,
  LOAD_STOCK_RECORDS,

  // -------------------------
  LOAD_SEED_LABS,
  LOAD_SEED_LABELS,
  LOAD_SEED_LABEL_BY_ID,
  DASHBOARD_STATS,
  TRACK_TRACE,
};

// ---- Plant Inspection (SR10) placeholder queries ----
// Single inspection timeline for a planting return
export const LOAD_PLANTING_INSPECTION = gql`
  query PlantingReturnInspection($id: ID!) {
    plantingReturnInspection(id: $id) {
      id
      plantingReturnId
      stages {
        id
        inspectionTypeId
        stageName
        order
        required
        status
        dueDate
        submittedAt
        reportUrl
        comment
        inputs
      }
    }
  }
`;

export const PRODUCTS = gql`
query Products($filter: ProductFilterInput) {
  products(filter: $filter) {
    id
    name
    description
    price
    unit
    category_id
    seller_id
    stock
    quantity
    metadata
    deleted
    created_at
    updated_at
    Seller {
      username
      name
      email
    }
    CropVariety {
      name
    }
    Crop {
      name
    }
  }
}
`;

export const ORDERS = gql`
  query GetOrders {
  getOrders {
    id
    product_id
    quantity
    buyer_id
    seller_id
    comment
    status
    created_at
    Buyer {
      username
      name
    }
    Seller {
      username
      name
      id
    }
  }
}`;
