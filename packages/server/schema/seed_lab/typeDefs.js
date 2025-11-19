const seedLabTypeDefs = `#graphql
    scalar Date
    scalar JSON
    scalar Upload

    enum LabStatus {
        pending
        assigned_inspector
        lab_inspected
        accepted
        rejected
        received
        marketable
        not_marketable
    }

    enum seedStatus {
        marketable
        not_marketable
    }

    type LabInspection {
        id: ID!
        user_id: String!
        variety_id: ID!
        stock_examination_id: ID!
        collection_date: Date!
        receipt_id: String
        applicant_remark: String
        inspector_id: String
        status: LabStatus!
        inspector_report: JSON
        lab_test_report: JSON
        lab_test_number: String
        lot_number: String
        deleted: Boolean
        created_at: DateTime
        createdBy: User
        variety: CropVariety
        inspector: User
    }

    type Query {
        getLabInspections: [LabInspection!]!
        getSeedLab(id: ID!): LabInspection

    }

    type Mutation{
        saveSeedLabRequest(input: SeedLabInput!): LabInspectionResponseMessage
        assignLabInspector(input: AssignLabInspectorInput!): ResponseMessage
        
        submitLabInspection(input: LabInspectionInput!): ResponseMessage
        receiveLabInspection(input: ReceiveLabInspectionInput!): ResponseMessage

        submitLabTestReport(input: LabTestReportInput!): ResponseMessage

        deleteSeedLabInspection(id: ID!): LabInspectionResponseMessage
    }

    input SeedLabInput {
        id: ID
        stock_examination_id: ID!
        collection_date: String!
        receipt: Upload
        applicant_remark: String
    }

    input AssignLabInspectorInput {
        inspector_id: String!
        form_id: String!
    }

    input LabInspectionInput {
        id: ID!
        inspector_report: JSON!
        decision: String!
    }
    input ReceiveLabInspectionInput {
        id: ID!
        decision: String!
        receptionist_comment: String  
    }

    input LabTestReportInput {
        id: ID!
        lab_test_report: JSON!
        marketableStatus: seedStatus!
    }

    type LabInspectionResponseMessage {
        success: Boolean
        message: String
        data: LabInspection
    }

`;

export default seedLabTypeDefs;