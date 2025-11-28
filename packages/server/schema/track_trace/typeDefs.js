const trackTraceTypeDefs = `#graphql
  type TrackTraceSeedDetails {
    id: ID
    status: String
    crop: String
    variety: String
    quantity: String
    labelPackage: String
    applicant: String
    createdAt: String
  }

  type TrackTraceSeedLab {
    id: ID
    lotNumber: String
    status: String
    labTestNumber: String
    inspector: String
    collectedAt: String
    receivedAt: String
  }

  type TrackTraceMotherLot {
    id: ID
    lotNumber: String
    seedClass: String
    yieldAmount: String
    fieldSize: String
    inspector: String
    status: String
    createdAt: String
  }

  type TrackTraceResult {
    lotNumber: String!
    seedDetails: TrackTraceSeedDetails
    seedLab: TrackTraceSeedLab
    motherLot: TrackTraceMotherLot
  }

  extend type Query {
    trackTrace(lotNumber: String!): TrackTraceResult
  }
`;

export default trackTraceTypeDefs;
