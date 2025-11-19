const districtTypeDefs = `#graphql
    
    type District {
        id: ID!
        name: String!
        createdAt: DateTime
        updatedAt: DateTime
    }

    type Query {
        getDistricts: [District!]!
        
    }

    
`;

export default districtTypeDefs;