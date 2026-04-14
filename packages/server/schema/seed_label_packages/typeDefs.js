const SeedLabelPackagesTypes = `#graphql
    scalar DateTime

    type SeedLabelPackage {
        id: ID!
        crop_id: String
        crop: Crop
        packageSizeKg: Float!
        priceUgx: Float!
        isActive: Boolean!
        createdAt: DateTime
        updatedAt: DateTime
    }

    input SeedLabelPackageInput {
        id: ID
        crop_id: ID
        packageSizeKg: Float
        priceUgx: Float
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
