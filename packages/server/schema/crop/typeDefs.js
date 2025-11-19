const cropTypeDefs = `#graphql

   scalar DateTime

    type Crop {
        id: ID!
        name: String!
        isQDS: Boolean!
        daysBeforeSubmission: Int!
        units: String!
        varieties: [CropVariety!]!
        inspectionTypes: [CropInspectionType!]!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    type CropVariety {
        id: ID!
        cropId: ID!
        name: String!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    type CropInspectionType {
        id: ID!
        cropId: ID!
        stageName: String!
        order: Int!
        required: Boolean!
        periodAfterPlantingDays: Int!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    input PaginationInput {
        page: Int = 1
        size: Int = 20
    }

    input CropFilter {
        search: String
        isQDS: Boolean
    }

    type CropListResult {
        items: [Crop!]!
        total: Int!
    }

    input CreateCropVarietyInput { name: String! }

    input CreateCropInspectionTypeInput {
        stageName: String!
        order: Int!
        required: Boolean!
        periodAfterPlantingDays: Int!
    }

    input CreateCropInput {
        name: String!
        isQDS: Boolean!
        daysBeforeSubmission: Int!
        units: String!
        varieties: [CreateCropVarietyInput!]!
        inspectionTypes: [CreateCropInspectionTypeInput!]!
    }

    input UpdateCropInput {
        name: String
        isQDS: Boolean
        daysBeforeSubmission: Int
        units: String
        "If provided and replaceChildren is true, fully replaces existing varieties"
        varieties: [CreateCropVarietyInput!]
        "If provided and replaceChildren is true, fully replaces existing inspection types"
        inspectionTypes: [CreateCropInspectionTypeInput!]
        replaceChildren: Boolean = true
    }

    type CropMutationResponse {
        success: Boolean!
        message: String
        crop: Crop
    }

    type DeleteResponse {
        success: Boolean!
        message: String
    }

    type Query {
        crops(filter: CropFilter, pagination: PaginationInput): CropListResult!
        crop(id: ID!): Crop
    }

    type Mutation {
        createCrop(input: CreateCropInput!): CropMutationResponse!
        updateCrop(id: ID!, input: UpdateCropInput!): CropMutationResponse!
        deleteCrop(id: ID!): DeleteResponse!

        addCropVariety(cropId: ID!, input: CreateCropVarietyInput!): CropMutationResponse!
        updateCropVariety(id: ID!, input: CreateCropVarietyInput!): CropMutationResponse!
        deleteCropVariety(id: ID!): DeleteResponse!

        addCropInspectionType(cropId: ID!, input: CreateCropInspectionTypeInput!): CropMutationResponse!
        updateCropInspectionType(id: ID!, input: CreateCropInspectionTypeInput!): CropMutationResponse!
        deleteCropInspectionType(id: ID!): DeleteResponse!
    }
`;

export default cropTypeDefs;
