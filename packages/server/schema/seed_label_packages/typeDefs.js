const SeedLabelPackagesTypes = `#graphql
    scalar DateTime

    type SeedLabelPackage {
        id: ID!
        name: String!
        packageSizeKg: Float!
        labelsPerPackage: Int!
        priceUgx: Int!
        isActive: Boolean!
        createdAt: DateTime
        updatedAt: DateTime
    }

    input SeedLabelPackageInput {
        id: ID
        name: String!
        packageSizeKg: Float!
        labelsPerPackage: Int!
        priceUgx: Int!
        isActive: Boolean
    }

    type SeedLabelPackageResponse {
        success: Boolean!
        message: String
        package: SeedLabelPackage
    }

    type Query {
        seedLabelPackages(activeOnly: Boolean): [SeedLabelPackage!]!
    }

    type Mutation {
        saveSeedLabelPackage(input: SeedLabelPackageInput!): SeedLabelPackageResponse!
        deleteSeedLabelPackage(id: ID!): ResponseMessage!
    }
`;

export default SeedLabelPackagesTypes;
