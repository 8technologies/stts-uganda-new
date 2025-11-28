const stockRecordsTypeDefs = `#graphql
    enum SeedClass {
        CERTIFIED
        BASIC
        PRE_BASIC
        QS
    }

    type StockRecord {
        id: ID!
        user_id: String!
        seed_lab_id: ID
        crop_variety_id: ID
        seed_class: SeedClass
        source: String
        stock_examination_id: ID
        quantity: Int
        is_deposit: Boolean
        is_transfer: Boolean
        created_at: DateTime
        updated_at: DateTime
        lot_number: String
        Owner: User
        CropVariety: CropVariety
    }

    type Query {
        stockRecords: [StockRecord!]!
    }
`;

export default stockRecordsTypeDefs;
