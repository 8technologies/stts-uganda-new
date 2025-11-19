const plantingReturnsTypeDefs = `#graphql
  scalar DateTime
  scalar Upload

  type PlantingReturn {
    id: ID!
    sr8Number: String

    # Grower / applicant
    applicantName: String
    growerNumber: String
    contactPhone: String
    receipt_id: String

    # Field
    gardenNumber: String
    fieldName: String
    location: PlantingReturnLocation

    # Crop & variety
    cropId: ID
    varietyId: ID
    crop: Crop
    variety: CropVariety
    seedClass: String

    # Planting & production
    areaHa: Float
    dateSown: DateTime
    expectedHarvest: DateTime
    seedSource: String
    seedLotCode: String
    intendedMerchant: String
    seedRatePerHa: String

    # Workflow
    status: String
    statusComment: String
    scheduledVisitDate: String
    inspector: User
    createdBy: User

    createdAt: DateTime
    updatedAt: DateTime
  }

  type PlantingReturnLocation {
        district: String
        subcounty: String
        parish: String
        village: String
        gpsLat: Float
        gpsLng: Float
    }

  type PlantingReturnEdge {
    items: [PlantingReturn!]!
    total: Int!
  }

  # planting returns uploads------------------------------------
  type PlantingReturnUpload {
    id: ID!
    user_id: String!
    amount_enclosed: Int
    payment_receipt: String!
    sub_grower_file: String!
    registered_dealer: String
  }

  input PlantingReturnUploadInput {
    # id: ID!
    # user_id: String!
    amount_enclosed: Int
    payment_receipt: Upload!
    sub_grower_file: Upload!
    registered_dealer: String
  }

  # -----------------------------------------------------------------

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
    receipt: Upload
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
    receipt: Upload

    # Scheduling
    scheduledVisitDate: String
  }


  input AssignPlantingReturnInspectorInput {
    id: ID
    ids: [ID!]
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

 type Query {
    plantingReturns(filter: PlantingReturnFilter, pagination: PaginationInput): PlantingReturnEdge
    plantingReturn(id: ID!): PlantingReturn

    plantingReturnUploads: [PlantingReturnUpload!]!
    plantingReturnUpload(id: ID!): PlantingReturnUpload
  }

 type Mutation {
    createPlantingReturn(input: CreatePlantingReturnInput!): PlantingReturnPayload
    updatePlantingReturn(id: ID!, input: UpdatePlantingReturnInput!): PlantingReturnPayload
    deletePlantingReturn(id: ID!): BasicPayload

    createPlantingReturnUpload(input: PlantingReturnUploadInput!): PlantingReturnPayload

    assignPlantingReturnInspector(input: AssignPlantingReturnInspectorInput!): BasicPayload
    approvePlantingReturn(input: ApprovePlantingReturnInput!): BasicPayload
    rejectPlantingReturn(input: RejectPlantingReturnInput!): BasicPayload
    haltPlantingReturn(input: HaltPlantingReturnInput!): BasicPayload
  }
`;

export default plantingReturnsTypeDefs;
