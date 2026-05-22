const seedLabelTypeDefs = `#graphql
    
    scalar Date
    scalar JSON
    scalar Upload

    enum SeedLabelStatus{
        pending
        approved
        rejected
        printed
    }

    type SeedLabel {
        id:ID!
        user_id:ID!
        seed_lab_id:ID!
        crop_variety_id:ID!
        seed_label_package:String
        quantity:String
        number_of_labels:String
        total_cost:String
        applicant_remark:String
        status: SeedLabelStatus!
        status_comment: String
        receipt_id:String
        deleted: Boolean
        created_at: Date
        image_id: String
        createdBy: User
        CropVariety: CropVariety
        Crop: Crop
        SeedLab: LabInspection
        SeedLabelPackage: SeedLabelPackage
    }

    type Query {
        getSeedLabels: [SeedLabel!]!
        getSeedLabel(id: ID!): [SeedLabel!]!

    }

    type Mutation{
        saveSeedLabelRequest(input: SeedLabelInput!): SeedLabelResponseMessage
        approveSeedLabelRequest(id: ID!, status: SeedLabelStatus!): SeedLabelResponseMessage
        printSeedLabelRequest(id: ID!): SeedLabelResponseMessage
    } 

    input SeedLabelInput{
        id:ID
        seed_lab_id:ID!
        seed_label_package:String
        quantity:Int
        number_of_labels:Int
        total_cost:String
        applicant_remark:String
        receipt:Upload
        image: Upload
    }


    type SeedLabelResponseMessage {
        success: Boolean
        message: String
        data: SeedLabel
    }

`;

export default seedLabelTypeDefs;