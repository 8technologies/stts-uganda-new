const dashboardTypeDefs = `#graphql
  type DashboardInspectionSlice {
    label: String!
    value: Int!
  }

  type DashboardSeedStockPoint {
    label: String!
    total: Float!
  }

  type DashboardActivity {
    id: ID!
    title: String!
    entity: String
    status: String
    category: String!
    timestamp: String!
  }

  type DashboardStats {
    registeredUsers: Int!
    userPermits: Int!
    pendingPermits: Int!
    cropDeclarations: Int!
    printedLabels: Int!
    pendingLabels: Int!
    myActiveForms: Int!
    myActivePermits: Int!
    myApprovedPlantingReturns: Int!
    assignedForms: Int!
    assignedPermits: Int!
    assignedPlantingReturns: Int!
    pendingInspections: Int!
    receivedLabRequests: Int!
    haltedLabRequests: Int!
    marketableSeed: Int!
    nonMarketableSeed: Int!
    totalInspections: Int!
    scheduledVisits: Int!
    pendingCorrectiveActions: Int!
    inspections: [DashboardInspectionSlice!]!
    seedStock: [DashboardSeedStockPoint!]!
    recentActivities: [DashboardActivity!]!
  }

  extend type Query {
    dashboardStats: DashboardStats!
  }
`;

export default dashboardTypeDefs;
