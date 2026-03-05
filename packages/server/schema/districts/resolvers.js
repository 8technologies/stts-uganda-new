import { db } from "../../config/config.js";

const districtsResolvers = {
    Query: {
        // Query resolvers here
        getDistricts: async (parent, args, context) => {
            // Implementation for fetching districts

            const sql = `
                SELECT *
                FROM districts d
                ORDER BY d.name ASC
            `;

            const [results] = await db.execute(sql);
            return results.map((row) => ({
                id: row.id?.toString(),
                name: row.name,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }));

        },
    },
        
    District: {
        subcounties: async(parent)=> {
            const [result] = await db.execute(`SELECT sc.id, sc.name FROM subcounties sc WHERE sc.district_id = ?`, [parent.id]);
            
            return result; 
        }
    }
    
}

export default districtsResolvers;
