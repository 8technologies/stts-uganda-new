const cropDeclarationInspectionTypeDefs = `#graphql
  scalar DateTime
  scalar JSON

  type CropDeclarationInspectionStage {
    id: ID!
    CropDecalrationId: ID!
    CropDecalrationCropId: ID!
    inspectionTypeId: ID
    stageName: String
    order: Int
    required: Boolean
    status: String
    dueDate: DateTime
    submittedAt: DateTime
    reportUrl: String
    comment: String
    inputs: JSON
  }

  type CropDecalrationInspection {
    id: ID!
    CropDecalrationId: ID!
    stages: [CropDeclarationInspectionStage!]!
  }

  input InitializeCropDecalrationInspectionInput {
    cropDeclarationId: ID!
    cropDeclarationCropId: ID!
  }

  input SubmitCropDeclarationInspectionStageInput {
    CropDeclarationId: ID!
    cropDeclarationCropId: ID!
    taskId: ID
    inspectionTypeId: ID!
    decision: String!
    comment: String
    inputs: JSON
  }

  extend type Query {
    CropDecalrationInspection(id: ID!, cropId: ID!): CropDecalrationInspection
  }

  extend type Mutation {
    initializeCropDecalrationInspection(input: InitializeCropDecalrationInspectionInput!): BasicPayload
    submitCropDeclarationInspectionStage(input: SubmitCropDeclarationInspectionStageInput!): BasicPayload
  }
`;

export default cropDeclarationInspectionTypeDefs;
