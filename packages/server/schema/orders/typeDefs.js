const OrderType = `#graphql


    type Order {
        id: ID!
        product_id: ID!
        quantity: Int!
        buyer_id: ID!
        seller_id: ID!
        comment: String
        created_at: Date
        Product: Product
        Buyer: User
        Seller: User
    }
    

    type Query {
        getOrders: [Order!]!
        getOrder(id: ID!): Order
    }
`;

export default OrderType;
