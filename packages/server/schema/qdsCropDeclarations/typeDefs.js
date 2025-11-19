const cropDeclarationsTypeDefs = `#graphql
    scalar Date
    scalar JSON
    scalar Upload

    type CropDeclaration {
        id: ID!
        user_id: ID
        application_id: Int
        source_of_seed: String
        field_size: Int
        seed_rate: String
        amount: Int
        receipt_id: String
        inspector_id: String
        status: String
        status_comment: String
        valid_from: Date
        valid_until: Date
        created_at: Date
        updated_at: Date
        crops: [cropDeclarationCrop!]!
        inspector: User
        createdBy: User
    }

    type cropDeclarationCrop {
        id: ID!
        crop_declaration_id: ID!
        crop_id: ID!
        variety_id: ID!
        variety_name: String
        crop_name: String
    }

    type CropDeclarationEdge {
        items: [CropDeclaration!]!
        total: Int!
    }

    input AssignCropDeclarationInspectorInput {
        id: ID
        ids: [ID!]
        inspectorId: ID!
        # scheduledVisitDate: String
        comment: String
    }

    type Query {
        cropDeclarations(filter: CropDeclarationFilter, pagination: PaginationInput): CropDeclarationEdge
        cropDeclaration(id: ID!): CropDeclaration

    }

    type Mutation {
        saveCropDeclaration(payload: CropDeclarationInput!): CropDeclarationResponseMessage
        deleteCropDeclaration(crop_declaration_id: ID!): ResponseMessage

        assignCropDeclarationInspector(input: AssignCropDeclarationInspectorInput!): ResponseMessage
    
    }

    type ResponseMessage {
        success: Boolean!
        message: String
    }

    input CropDeclarationInput {
        id: ID
        source_of_seed: String
        field_size: Int
        seed_rate: String
        amount: Int
        receipt_id: Upload
        crops: [CropDeclarationCropInput!]!
    }

    input CropDeclarationCropInput {
        id: ID
        crop_declaration_id: ID
        crop_id: ID
        variety_id: ID
    }

    input CropDeclarationFilter {
        status: String
        search: String
        district: String
        cropId: ID
        varietyId: ID
        createdById: ID
    }

    type CropDeclarationResponseMessage {
        success: Boolean
        message: String
        data: CropDeclaration
    }

`;

export default cropDeclarationsTypeDefs;
