
const marketplaceTypeDefs = `#graphql
  scalar JSON
  scalar DateTime

  type Product {
    id: ID!
    name: String!
    description: String
    price: Float
    crop_variety_id: ID
    unit: String
    category_id: ID
    seller_id: ID
    stock: Int
    quantity: Int
    image_url: String
    metadata: JSON
    deleted: Boolean
    created_at: DateTime
    updated_at: DateTime
    Seller: User
    CropVariety: CropVariety
    Crop: Crop
  }

  input ProductFilterInput {
    id: ID
    seller_id: ID
    category_id: ID
    q: String
    includeDeleted: Boolean = false
  }

  input CreateProductInput {
    name: String!
    description: String
    price: Float
    unit: String
    category_id: ID
    seller_id: ID
    stock: Int
    metadata: JSON
  }
  input OrderProductInput{
    productId: ID
    quantity: Int
    comment: String
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    unit: String
    category_id: ID
    seller_id: ID
    stock: Int
    metadata: JSON
  }

  type ProductResponse {
    success: Boolean!
    message: String
    product: Product
  }

  type DeleteResponse {
    success: Boolean!
    message: String
  }

  extend type Query {
    products(filter: ProductFilterInput): [Product!]!
    product(id: ID!): Product
  }

  extend type Mutation {
    createProduct(input: CreateProductInput!): ProductResponse!
    updateProduct(id: ID!, input: UpdateProductInput!): ProductResponse!
    deleteProduct(id: ID!): DeleteResponse!
    # orderProduct(input: OrderProductInput!): ProductResponse!
  }
`;

export default marketplaceTypeDefs ;