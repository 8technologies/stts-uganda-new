import { db } from "../../config/config.js";

const seedLabelResolvers = {
    Query: {
        // Query resolvers here
        getDistricts: async (parent, args, context) => {
            // Implementation for fetching districts

            const sql = `
                SELECT seed_labels.*
                FROM districts
                ORDER BY seed_labels.name DESC
            `;

            const [results] = await db.execute(sql, values);
            return results.map((row) => ({
                id: row.id?.toString(),
                name: row.name,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }));

        }
    }
}
