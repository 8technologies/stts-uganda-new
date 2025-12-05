const marketableSeedsTypeDefs = `#graphql
    enum SeedClass {
        CERTIFIED
        BASIC
        PRE_BASIC
        QS
    }

    type MarketableSeed {
        id: ID!
        user_id: String!
        seed_lab_id: ID
        crop_variety_id: ID
        seed_class: SeedClass
        seed_label_id: ID
        lab_test_number: String
        quantity: Int
        package_id: String
        created_at: DateTime
        lot_number: String
    }

    type Query {
        marketableSeeds: [MarketableSeed!]!
    }
`;

export default marketableSeedsTypeDefs;
