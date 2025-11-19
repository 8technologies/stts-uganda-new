const ImportPermitTypeDefs = `#graphql
    scalar DateTime
    scalar Upload

    type ImportPermitAttachment {
        id: ID!
        permitId: ID!
        fileName: String!
        filePath: String!      # server-resolved path
        mimeType: String
        fileSize: Int
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    type ImportPermitItem {
        id: ID!
        permitId: ID!
        cropId: ID!
        varietyId: ID!
        crop: Crop!            # resolve via cropId
        variety: CropVariety!  # resolve via varietyId
        category: SeedCategory!
        weight: Float!
        measure: WeightMeasure!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    type ImportPermit {
        id: ID!
        applicantCategory: ApplicantCategory!
        stockQuantity: Float!
        countryOfOrigin: String!
        supplierName: String!
        supplierAddress: String!
        consignment: [ConsignmentDoc!]!     # multi-select from UI
        attachments: [ImportPermitAttachment!]!
        inspectorId: ID
        permitNumber: String
        validFrom: DateTime
        validUntil: DateTime
        statusComment: String
        status: StatusType!
        permitType: PermitType!
        createdBy: User!
        items: [ImportPermitItem!]!
        inspector: User
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    enum PermitType {
        import
        export
    }

     "Applicant category from the UI"
    enum ApplicantCategory {
        SEED_MERCHANT
        SEED_DEALER
        SEED_PRODUCER
        RESEARCHER
    }

    "Per-item seed purpose"
    enum SeedCategory {
        COMMERCIAL
        RESEARCH
        OWN_USE
    }

    "Unit of measure for item weight"
    enum WeightMeasure {
        KGS
        TUBES
        BAGS
        SUCKERS
    }

    "Documents to accompany the consignment"
    enum ConsignmentDoc {
        ISTA_CERTIFICATE
        PHYTOSANITARY_CERTIFICATE
    }

    input ImportPermitItemInput {
        cropId: ID!
        varietyId: ID!
        category: SeedCategory!
        weight: Float!
        measure: WeightMeasure!
    }

    input CreateImportPermitInput {
        applicantCategory: ApplicantCategory!
        stockQuantity: Float!
        countryOfOrigin: String!
        supplierName: String!
        supplierAddress: String!
        consignment: [ConsignmentDoc!]!
        items: [ImportPermitItemInput!]!
        attachments: [Upload!]              # optional, file upload support
        type: PermitType = import
    }

    input UpdateImportPermitInput {
        applicantCategory: ApplicantCategory
        stockQuantity: Float
        countryOfOrigin: String
        supplierName: String
        supplierAddress: String
        consignment: [ConsignmentDoc!]
        items: [ImportPermitItemInput!]     # used when replaceChildren = true
        replaceChildren: Boolean = true
        attachmentsAdd: [Upload!]
        attachmentsRemoveIds: [ID!]
        type: PermitType = import
    }

    input ImportPermitFilter {
        applicantCategory: ApplicantCategory
        country: String
        search: String
        type: PermitType = import
    }

    type ImportPermitListResult {
        items: [ImportPermit!]!
        total: Int!
    }

    type ImportPermitMutationResponse {
        success: Boolean!
        message: String
        permit: ImportPermit
    }

    type Query {
        importPermits(filter: ImportPermitFilter, pagination: PaginationInput): ImportPermitListResult!
        importPermit(id: ID!): ImportPermit
       
    }

     type Mutation {
        createImportPermit(input: CreateImportPermitInput!): ImportPermitMutationResponse!
        updateImportPermit(id: ID!, input: UpdateImportPermitInput!): ImportPermitMutationResponse!
        deleteImportPermit(id: ID!): DeleteResponse!
        assignPermitInspector(payload: AsignInspectorInput!) : ResponseMessage
        haltPermit(payload: HaltPayload!): ResponseMessage 
        rejectPermit(payload: HaltPayload!): ResponseMessage 
        approvePermit(payload: ApprovePermitPayload!): ResponseMessage
    }

    input ApprovePermitPayload {
        form_id: String!

    }

`;

export default ImportPermitTypeDefs;
