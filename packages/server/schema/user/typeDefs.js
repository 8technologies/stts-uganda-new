const userTypeDefs = `#graphql
    scalar DateTime
    scalar Upload

    type User {
        id: ID!
        username: String!
        name: String!
        company_initials: String!
        email: String!
        district: String!
        premises_location: String!
        phone_number: String!
        image: String
        role_id: String
        role_name: String
        created_at: DateTime!
        updated_at: DateTime!
        sr4_applications: [SR4ApplicationForm]
        is_grower: Boolean
        is_merchant: Boolean
        is_qds_producer: Boolean
    }


    input CreateUserInput {
        id: ID,
        username: String!
        name: String!
        company_initials: String!
        email: String!
        district: String!
        premises_location: String!
        phone_number: String!
        password: String
        image: Upload,
        role_id: String
    }

     input RegisterInput {
        username: String!
        name: String!
        company_initials: String!
        premises_location: String!
        phone_number: String!
        password: String
        email: String!
        district: String!
    }

    input UpdateUserInput {
        id: ID!
        email: String
        firstName: String
        lastName: String
        isActive: Boolean
        district: String
        subcounty: String
        school_id: String
    }


    type Query {
        users: [User!]!
        user(id: ID!): User
        currentUser: User
        me: User
    }

    type Mutation {
        login(username: String!, password: String!) :UserLoginResponse!
        createUser(payload: CreateUserInput!): UserResponse!
        register(payload: RegisterInput!): UserResponse!
        updateUser(payload: UpdateUserInput!): UserResponse!
        toggleUserStatus(id: ID!): UserResponse!
        resetPassword(id: String!, newPassword: String!): UserResponse!
        deleteUser(user_id: String!): UserResponse
    }
`;

export default userTypeDefs;
