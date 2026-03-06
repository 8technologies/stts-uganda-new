const districtTypeDefs = `#graphql
    
    type District {
        id: ID!
        name: String!
        subcounties: [SubCounty!]
        createdAt: DateTime
        updatedAt: DateTime
    }

    type SubCounty {
        id: ID!
        name: String
    }

    type Query {
        getDistricts: [District!]!
    }

    
`;

export default districtTypeDefs;