const plantingInspectionTypeDefs = `#graphql
  scalar DateTime
  scalar JSON

  type PlantingInspectionStage {
    id: ID!
    plantingReturnId: ID!
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

  type PlantingReturnInspection {
    id: ID!
    plantingReturnId: ID!
    stages: [PlantingInspectionStage!]!
  }

  input InitializePlantingReturnInspectionInput {
    plantingReturnId: ID!
  }

  input SubmitPlantingInspectionStageInput {
    plantingReturnId: ID!
    taskId: ID
    inspectionTypeId: ID!
    decision: String!
    comment: String
    inputs: JSON
  }

  extend type Query {
    plantingReturnInspection(id: ID!): PlantingReturnInspection
  }

  extend type Mutation {
    initializePlantingReturnInspection(input: InitializePlantingReturnInspectionInput!): BasicPayload
    submitPlantingInspectionStage(input: SubmitPlantingInspectionStageInput!): BasicPayload
  }
`;

export default plantingInspectionTypeDefs;
