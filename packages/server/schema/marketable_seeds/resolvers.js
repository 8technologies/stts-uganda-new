import { db } from "../../config/config.js";
import checkPermission from "../../helpers/checkPermission.js";
import hasPermission from "../../helpers/hasPermission.js";
// Make sure this import matches your project setup:

const mapRecordRow = (row) => ({
  id: row.id?.toString(),
  user_id: row.user_id,
  seed_lab_id: row.seed_lab_id?.toString() || null,
  crop_variety_id: row.crop_variety_id?.toString(),
  seed_class: row.seed_class?.toUpperCase(),
  source: row.source,
  stock_examination_id: row.stock_examination_id ? row.stock_examination_id.toString() : null,
  quantity: row.quantity,
  is_deposit: Boolean(row.is_deposit),
  is_transfer: Boolean(row.is_transfer),
  created_at: row.created_at ? new Date(row.created_at) : null,
  updated_at: row.updated_at ? new Date(row.updated_at) : null,
  lot_number: row.lot_number || null,
  deleted: Boolean(row.deleted),
});

export const fetchRecords = async ({
  id = null,
  user_id = null,
} = {}) => {
  try {
    const values = [];
    let where = "WHERE marketable_seeds.deleted = 0";

    if (id) {
      where += " AND marketable_seeds.id = ?";
      values.push(id);
    }

    if (user_id) {
      where += " AND marketable_seeds.user_id = ?";
      values.push(user_id);
    }

    const sql = `
      SELECT marketable_seeds.*
      FROM marketable_seeds
      ${where}
      ORDER BY marketable_seeds.created_at DESC
    `;

    const [results] = await db.execute(sql, values);
    return results.map(mapRecordRow);
  } catch (error) {
    throw new Error(`Failed to fetch marketable seeds: ${error.message}`);
  }
};

const marketableSeedsResolvers = {
  Query: {
    marketableSeeds: async (_parent, args, context) => {
      try {
        const user = context?.req?.user;
        const userPermissions = user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_view_seed_stock",
          "You dont have permissions to view marketable seeds"
        );

        const can_manage_all_forms = hasPermission(
          userPermissions,
          "can_manage_seed_stock"
        );

        const can_view_only_assigned_seed_stock = hasPermission(
          userPermissions,
          "can_view_only_assigned_seed_stock"
        );


        // Pull id from args safely
        const recordId = args?.id ?? null;

        const records = await fetchRecords({
          id: recordId,
          // If user cannot manage all, restrict to their own records
          user_id: can_manage_all_forms ? null : user?.id ?? null,
          // If they can only view assigned stock, also restrict by inspector_id
          inspector_id: can_view_only_assigned_seed_stock ? user?.id ?? null : null,
        });

        // Since the field is named stockRecords, return an array.
        return records;
      } catch (error) {
        throw new Error(`Failed to fetch marketable seeds: ${error.message}`);
      }
    },

    // (Optional) If you also want a single-record query:
    // stockRecord: async (_parent, args, context) => {
    //   // similar permission checks...
    //   const [one] = await fetchRecords({ id: args.id });
    //   return one || null;
    // },
  },
};

export default marketableSeedsResolvers;
