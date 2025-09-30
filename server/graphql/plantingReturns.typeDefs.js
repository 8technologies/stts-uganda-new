// GraphQL type definitions for Planting Returns (SR8)
// These are provided standalone so you can merge into your server schema.

const typeDefs = /* GraphQL */ `
  scalar DateTime

  # Basic refs
  type UserRef {
    id: ID!
    name: String
    email: String
    image: String
  }

  type CropRef {
    id: ID!
    name: String
  }

  type VarietyRef {
    id: ID!
    name: String
  }

  type PlantingReturnLocation {
    district: String
    subcounty: String
    parish: String
    village: String
    gpsLat: Float
    gpsLng: Float
  }

  type PlantingReturn {
    id: ID!
    sr8Number: String

    # Grower / applicant
    applicantName: String
    growerNumber: String
    contactPhone: String

    # Field
    gardenNumber: String
    fieldName: String
    location: PlantingReturnLocation

    # Crop & variety
    cropId: ID
    varietyId: ID
    crop: CropRef
    variety: VarietyRef
    seedClass: String

    # Planting & production
    areaHa: Float
    dateSown: String
    expectedHarvest: String
    seedSource: String
    seedLotCode: String
    intendedMerchant: String
    seedRatePerHa: String

    # Workflow
    status: String
    statusComment: String
    scheduledVisitDate: String
    inspector: UserRef
    createdBy: UserRef

    createdAt: DateTime
    updatedAt: DateTime
  }

  type PlantingReturnEdge {
    items: [PlantingReturn!]!
    total: Int!
  }

  input PlantingReturnFilter {
    status: String
    search: String
    district: String
    cropId: ID
    varietyId: ID
    createdById: ID
  }

  input PlantingReturnLocationInput {
    district: String
    subcounty: String
    parish: String
    village: String
    gpsLat: Float
    gpsLng: Float
  }

  input CreatePlantingReturnInput {
    applicantName: String
    growerNumber: String
    contactPhone: String

    gardenNumber: String
    fieldName: String
    location: PlantingReturnLocationInput

    cropId: ID
    varietyId: ID
    seedClass: String

    areaHa: Float
    dateSown: String
    expectedHarvest: String
    seedSource: String
    seedLotCode: String
    intendedMerchant: String
    seedRatePerHa: String
  }

  input UpdatePlantingReturnInput {
    applicantName: String
    growerNumber: String
    contactPhone: String

    gardenNumber: String
    fieldName: String
    location: PlantingReturnLocationInput

    cropId: ID
    varietyId: ID
    seedClass: String

    areaHa: Float
    dateSown: String
    expectedHarvest: String
    seedSource: String
    seedLotCode: String
    intendedMerchant: String
    seedRatePerHa: String

    # Scheduling
    scheduledVisitDate: String
  }

  input AssignPlantingReturnInspectorInput {
    id: ID!
    inspectorId: ID!
    scheduledVisitDate: String
    comment: String
  }

  input ApprovePlantingReturnInput {
    id: ID!
    comment: String
  }

  input RejectPlantingReturnInput {
    id: ID!
    comment: String
  }

  input HaltPlantingReturnInput {
    id: ID!
    comment: String
  }

  type PlantingReturnPayload {
    success: Boolean!
    message: String
    record: PlantingReturn
  }

  type BasicPayload {
    success: Boolean!
    message: String
  }

  extend type Query {
    plantingReturns(filter: PlantingReturnFilter, pagination: PaginationInput): PlantingReturnEdge
    plantingReturn(id: ID!): PlantingReturn
  }

  extend type Mutation {
    createPlantingReturn(input: CreatePlantingReturnInput!): PlantingReturnPayload
    updatePlantingReturn(id: ID!, input: UpdatePlantingReturnInput!): PlantingReturnPayload
    deletePlantingReturn(id: ID!): BasicPayload

    assignPlantingReturnInspector(input: AssignPlantingReturnInspectorInput!): BasicPayload
    approvePlantingReturn(input: ApprovePlantingReturnInput!): BasicPayload
    rejectPlantingReturn(input: RejectPlantingReturnInput!): BasicPayload
    haltPlantingReturn(input: HaltPlantingReturnInput!): BasicPayload
  }
`;

export default typeDefs;

