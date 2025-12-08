const OrderType = `#graphql


    type Order {
        id: ID!
        product_id: ID!
        quantity: Int!
        buyer_id: ID!
        seller_id: ID!
        comment: String
        status: String
        created_at: Date
        Product: Product
        Buyer: User
        Seller: User
    }

    input OrderProductInput{
        productId: ID
        quantity: Int
        comment: String
    }

    input OrderProcessingInput{
        orderId: ID!
        status: String!
        comment: String
    }
    

    type Query {
        getOrders: [Order!]!
        getOrder(id: ID!): Order
    }

    type Mutation {
        orderProduct(input: OrderProductInput!): OrderResponseMessage
        orderProcessing(input: OrderProcessingInput!): OrderResponseMessage
        deleteOrder(id: ID): OrderResponseMessage
    }

    type OrderResponseMessage {
        success: Boolean
        message: String
        order: Order
    }
`;

export default OrderType;
