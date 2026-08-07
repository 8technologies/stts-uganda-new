const PreOrderType = `#graphql

    type PreOrder {
        id: ID!
        user_id: ID!
        breeder_id: ID
        variety_id: ID!
        quantity: Float!
        seed_class: String!
        collection_date: Date!
        detail: String
        supply_date: Date
        pickup_location: String
        status: PreOrderStatus
        comment: String
        response: String
        created_at: Date
        updated_at: Date
        createdBy: User
        breeder: User
        Crop: Crop
        Variety: CropVariety
    }

    enum PreOrderStatus {
        pending
        accepted
        rejected
        delivered
        picked
        completed
    }

    input savePreOrderInput {
        id: ID
        cropId: ID!
        varietyId: ID!
        breederId: ID!  
        seedClass: String
        quantity: Float!
        requestedDate: String!
        pickup_location: String
        comment: String
    }

    input UpdatePreOrderInput {
        status: PreOrderStatus
        supplyDate: String
        comment: String
    }

    type Query {
        getPreOrders: [PreOrder!]!
        getPreOrder(id: ID!): PreOrder
    }

    type Mutation {
        savePreOrder(input: savePreOrderInput!): PreOrderResponse
        updatePreOrder(id: ID!, input: UpdatePreOrderInput!): PreOrderResponse
        markPreOrderPicked(id: ID!, comment: String): PreOrderResponse
        deletePreOrder(id: ID!): PreOrderResponse
    }

    type PreOrderResponse {
        success: Boolean
        message: String
        preOrder: PreOrder
    }
`;

export default PreOrderType;
