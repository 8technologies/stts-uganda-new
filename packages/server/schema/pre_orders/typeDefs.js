const PreOrderType = `#graphql

    type PreOrder {
        id: ID!
        user_id: ID!
        breeder_id: ID
        crop_id: ID!
        variety_id: ID!
        quantity: Float!
        collection_date: Date!
        detail: String
        supply_date: Date!
        pickup_location: String
        status: String
        comment: String
        deleted: Int
        created_at: Date
        updated_at: Date
        createdBy: User
        Crop: Crop
        Variety: CropVariety
    }

    input CreatePreOrderInput {
        cropId: ID!
        varietyId: ID!
        seedClass: String
        quantity: Float!
        requestedDate: String!
        comment: String
    }

    input UpdatePreOrderInput {
        status: String
        comment: String
    }

    type Query {
        getPreOrders: [PreOrder!]!
        getPreOrder(id: ID!): PreOrder
    }

    type Mutation {
        createPreOrder(input: CreatePreOrderInput!): PreOrderResponse
        updatePreOrder(id: ID!, input: UpdatePreOrderInput!): PreOrderResponse
        deletePreOrder(id: ID!): PreOrderResponse
    }

    type PreOrderResponse {
        success: Boolean
        message: String
        preOrder: PreOrder
    }
`;

export default PreOrderType;
