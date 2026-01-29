const SeedLabelPackagesTypes = `#graphql

    type SeedLabelPackage {
        id: ID!
        crop_id: String!
        quantity: String
        price: Float!
        created_at: Date
        Crop: Crop
    }
    input SeedLabelPackageInput{
        id: ID
        crop_id: ID!
        quantity: String!
        price: Float!
    }

    type Query {
        getSeedLabelPackages(crop_id: ID): [SeedLabelPackage!]!
        getSeedLabelPackage(id: ID!): SeedLabelPackage
    }

    type Mutation {
        SeedLabelPackage(input: SeedLabelPackageInput!): SeedLabelPackageResponseMessage
        deleteSeedLabelPackage(id: ID!): SeedLabelPackageResponseMessage
    }

    type SeedLabelPackageResponseMessage {
        success: Boolean
        message: String
        seedLabelPackage: SeedLabelPackage  
    }
`;

export default SeedLabelPackagesTypes;