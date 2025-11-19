const stockExaminationTypeDefs = `#graphql
    scalar Date
    scalar JSON
    
    type StockExamination {
        id: ID!
        created_at: Date
        submittedAt: Date
        user_id: ID!
        variety_id: ID
        category: String
        import_export_permit_id: ID
        planting_return_id: ID
        form_qds_id: ID
        report: JSON
        status: String
        inspector_id: ID
        status_comment: String
        remarks: String
        mother_lot: String
        seed_class: String
        field_size: String
        yield: String
        user: User
        inspector: User
        
    }

    

    type Query {
        stockExaminations: [StockExamination!]!
        stockExamination(id: ID!): StockExamination

        
    }

    type Mutation {
        saveStockExamination(payload: StockExaminationInput!): StockExaminationResponseMessage
        deleteStockExamination(id: ID!): ResponseMessage
        # updateStockExamination(id: ID!, payload: StockExaminationInput!): StockExaminationResponseMessage

        # assign inspector to one or many stock examinations
        assignStockExaminationInspector(input: AssignInspectorInput!): ResponseMessage
        submitStockExaminationInspection(input: StockExaminationInspectionInput!): StockExaminationInspectionResponse!
    }


    input StockExaminationInspectionInput {
        id: ID!
        decision: StockInspectionDecision!
        report: JSON! # You can replace JSON with a more specific input type if needed
        remarks: String
    }

    enum StockInspectionDecision {
        approved
        rejected
    }

    type StockExaminationInspectionResponse {
        success: Boolean!
        message: String!
    }


    input StockExaminationInput {
        id: ID
        variety_id: ID
        import_export_permit_id: ID
        planting_return_id: ID
        form_qds_id: ID
        remarks: String
        mother_lot: String
    }


    input StockExaminationInput2 {
        import_export_permit_id: ID
        planting_return_id: ID
        form_qds_id: ID
        field_size: String
        yield: String
        seed_company_name: String
        date: String
        purity: String
        germination: String
        moisture_content: String
        insect_damage: String
        moldiness: String
        noxious_weeds: String
        recommendation: String
        status: Int
        inspector_id: ID
        status_comment: String
        remarks: String
        examination_category: Int!
        administrator_id: ID!
        variety_id: ID
    }

    # input for assigning an inspector to one or multiple stock examinations
    input AssignInspectorInput {
        id: ID
        ids: [ID!]
        inspectorId: ID!
        scheduledVisitDate: Date
        comment: String
    }

    type StockExaminationResponseMessage {
        success: Boolean
        message: String
        data: StockExamination
    }
`;
export default stockExaminationTypeDefs;
