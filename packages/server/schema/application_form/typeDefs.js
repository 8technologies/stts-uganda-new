const applicationFormsTypeDefs = `#graphql
    scalar Date
    scalar JSON
    scalar Upload


    type SR4ApplicationForm {
        id: ID
        user_id: String
        years_of_experience: String
        experienced_in: String
        dealers_in: String
        processing_of: String
        marketing_of: String
        have_adequate_land: Boolean
        land_size: String
        equipment: String
        have_adequate_equipment: Boolean
        have_contractual_agreement: Boolean
        have_adequate_field_officers: Boolean
        have_conversant_seed_matters: Boolean
        have_adequate_land_for_production: Boolean
        have_internal_quality_program: Boolean
        source_of_seed: String
        receipt_id: String
        accept_declaration: Boolean
        valid_from: Date
        valid_until: Date
        status: StatusType
        status_comment: String
        recommendation: String
        inspector_id: String
        inspector_comment: String
        dealers_in_other: String
        marketing_of_other: String
        have_adequate_storage: Boolean
        seed_board_registration_number: String
        type: Sr4Type
        processing_of_other: String
        inspector: User
        user: User
        created_at: DateTime,
        updated_at: DateTime
    }

    type SR6ApplicationForm {
        id: ID
        user_id:String
        years_of_experience: String
        dealers_in: String
        previous_grower_number: String
        cropping_history: String
        have_adequate_isolation: Boolean
        have_adequate_labor: Boolean
        aware_of_minimum_standards: Boolean
        signature_of_applicant: String
        grower_number: String
        seed_board_registration_number: String
        registration_number: String
        valid_from: Date
        valid_until: Date
        status: StatusType
        inspector_id: String
        inspector_comment: String
        status_comment: String
        recommendation: String
        have_adequate_storage: Boolean
        seed_grower_in_past: Boolean
        type: Sr6Type
        form_type: String!
        receipt_id: String
        other_documents: String
        inspector: User
        user: User
        created_at: DateTime,
        updated_at: DateTime
    }

    type QDsApplicationForm {
        id: ID
        user_id: String
        farm_location: String
        certification: String
        recommendation_id: String
        form_type: String!
        recommendation: String
        years_of_experience: String
        dealers_in: String
        previous_grower_number: String
        cropping_history: String
        have_adequate_isolation: Boolean
        have_adequate_labor: Boolean
        aware_of_minimum_standards: Boolean
        signature_of_applicant: String
        grower_number: String
        seed_board_registration_number: String
        valid_from: Date
        valid_until: Date
        status: StatusType
        inspector_id: String
        status_comment: String
        inspector_comment: String
        have_been_qds:Boolean
        isolation_distance: Int
        number_of_labors: Int
        have_adequate_storage_facility: Boolean
        receipt_id: String
        is_not_used: Boolean
        examination_category: Int
        inspector: User
        user: User
        created_at: DateTime,
        updated_at: DateTime

    }
    enum Sr4Type {
        seed_merchant
        seed_exporter_or_importer
    }

    enum Sr6Type {
        seed_breeder
        seed_producer
    }
    
    enum StatusType {
       pending
       approved
       rejected
       halted
       assigned_inspector
       recommended
    }

    enum FormType {
        sr4
        sr6
        qds
    }

    type Query {
        sr4_applications: [SR4ApplicationForm!]!
        sr4_application_details(id: ID!): SR4ApplicationForm
        sr6_applications:[SR6ApplicationForm!]!
        sr6_application_details(id: ID!): SR6ApplicationForm
        qds_applications:[QDsApplicationForm!]!
        qds_application_details(id: ID!): QDsApplicationForm
        inspectors: [User!]
    }

    type Mutation{
        saveSr4Form(payload: SR4ApplicationFormInput!) : Sr4ResponseMessage
        saveSr6Form(payload: SR6ApplicationFormInput!) : Sr6ResponseMessage
        saveQdsForm(payload: QDSApplicationFormInput!) : QdsResponseMessage
        assignInspector(payload: AsignInspectorInput!) : ResponseMessage
        haltForm(payload: HaltPayload!): ResponseMessage 
        rejectForm(payload: HaltPayload!): ResponseMessage 
        approveForm(payload: ApprovePayload!): ResponseMessage
        recommend(payload: HaltPayload!): ResponseMessage 
    }

    input ApprovePayload {
        form_id: String!
        form_type: FormType!
    }

    input HaltPayload {
        form_id: String!
        reason: String!
    }

    input AsignInspectorInput {
        inspector_id: String!
        form_id: String!
    }


    input SR4ApplicationFormInput {
        id: ID
        years_of_experience: String
        experienced_in: String
        dealers_in: String
        marketing_of: String
        have_adequate_land: Boolean
        land_size: String
        equipment: String
        have_adequate_equipment: Boolean
        have_contractual_agreement: Boolean
        have_adequate_field_officers: Boolean
        have_conversant_seed_matters: Boolean
        have_adequate_land_for_production: Boolean
        have_internal_quality_program: Boolean
        source_of_seed: String
        receipt: Upload
        # accept_declaration: Boolean
        # valid_from: Boolean
        # valid_until: Boolean
        status: StatusType
        # status_comment: String
        # recommendation: String
        # inspector_id: Int
        dealers_in_other: String
        marketing_of_other: String
        have_adequate_storage: Boolean
        # seed_board_registration_number: String
        type: Sr4Type
        # processing_of_other: String
    }

    input SR6ApplicationFormInput {
        id: ID
        years_of_experience: String
        dealers_in: String
        previous_grower_number: String
        cropping_history: String
        have_adequate_isolation: Boolean
        have_adequate_labor: Boolean
        aware_of_minimum_standards: Boolean
        signature_of_applicant: String
        grower_number: String
        status: StatusType
        inspector_id: String
        status_comment: String
        recommendation: String
        have_adequate_storage: Boolean
        seed_grower_in_past: Boolean
        type: String
        receipt: Upload
        other_documents: Upload
    }

    input QDSApplicationFormInput {
        id: ID
        receipt: Upload
        certification: Upload
        recommendation_id: Upload
        years_of_experience: String
        dealers_in: String
        previous_grower_number: String
        cropping_history: String
        have_adequate_isolation: Boolean
        have_adequate_labor: Boolean
        aware_of_minimum_standards: Boolean
        signature_of_applicant: String
        grower_number: String
        registration_number: String
        status: StatusType
        have_been_qds:Boolean
        isolation_distance: Int
        number_of_labors: Int
        have_adequate_storage_facility: Boolean
        is_not_used: Boolean
        examination_category: Int
    }

    type Sr4ResponseMessage{
        success: Boolean
        message: String
        result: SR4ApplicationForm
    }

    type Sr6ResponseMessage{
        success: Boolean
        message: String
        result: SR6ApplicationForm
    }
    
    type QdsResponseMessage{
        success: Boolean
        message: String
        result: QDsApplicationForm
    }

`;

export default applicationFormsTypeDefs;
