import { gql } from '@apollo/client';


const LOAD_USERS = gql`
query Users {
  users {
    id
    username
    first_name
    other_names
    email
    district
    image
    created_at
    updated_at
  }
}

`

const ME = gql`
  query Me {
    me {
      id
      username
      first_name
      other_names
      email
      district
      image
      created_at
      updated_at
    }
  }
`;

export {
  LOAD_USERS,
  ME
}
