import { GraphQLError } from "graphql";
import { db } from "../../config/config.js";
import { getUsers } from "../user/resolvers.js";
import saveData from "../../utils/db/saveData.js";
import { seedCategory } from "../../../client/src/pages/seed-stock/stock-examination/StockExamination.js";
import checkPermission from "../../helpers/checkPermission.js";
import hasPermission from "../../helpers/hasPermission.js";

const mapPreOrderRow = (row) => ({
  id: row.id?.toString(),
  user_id: row.user_id?.toString(),
  breeder_id: row.breeder?.toString(),
  crop_id: row.crop_id?.toString(),
  variety_id: row.crop_variety_id?.toString(),
  seed_class: row.seed_class,
  quantity: row.quantity != null ? Number(row.quantity) : null,
  collection_date: row.collection_date ? new Date(row.collection_date) : null,
  pickup_location: row.pickup_location,
  detail: row.detail,
  status: row.status || "pending",
  comment: row.response || null,
  supplyDate: row.supply_date ? new Date(row.supply_date) : null,
  // deleted: row.deleted,
  created_at: row.created_at ? new Date(row.created_at) : null,
  updated_at: row.updated_at ? new Date(row.updated_at) : null,
});

const getPreOrders = async ({ id = null, user_id = null } = {}) => {
  let values = [];
  let where = "";

  if (id) {
    where += " AND po.id = ? ";
    values.push(id);
  }
  if (user_id) {
    where += " AND po.user_id = ? ";
    values.push(user_id);
  }

  const query = `SELECT po.* FROM pre_orders AS po WHERE deleted = 0 ${where} ORDER BY po.created_at DESC`;
  const [rows] = await db.execute(query, values);
  console.log("getPreOrders query", rows);
  return rows.map(mapPreOrderRow);
};

const preOrderResolvers = {
  Query: {
    getPreOrders: async (parent, args, context) => {
      try {
        const user_id = context.req.user.id;
        const userPermissions = context.req.user.permissions;
            checkPermission(
                userPermissions,
                "can_view_pre_orders",
                "You dont have permissions to view pre-orders"
            );
          const can_manage_pre_orders = hasPermission(
                userPermissions,
                "can_manage_pre_orders"
            );

        return await getPreOrders({ 
          user_id: can_manage_pre_orders ? null : user_id  });
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    getPreOrder: async (parent, { id }, context) => {
      try {
        const results = await getPreOrders({ id });
        return results[0] || null;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },

  PreOrder: {
    createdBy: async (parent) => {
      const users = await getUsers({ id: parent.user_id });
      return users[0] || null;
    },
    breeder: async (parent) => {
      if (!parent.breeder_id) return null;
      const users = await getUsers({ id: parent.breeder_id });
      return users[0] || null;
    },
    Crop: async (parent) => {
      try {
            // 1️⃣ Get the variety based on crop_variety_id
            const [varietyRows] = await db.execute(
            "SELECT * FROM crop_varieties WHERE id = ?",
            [parent.variety_id]
            );

            if (!varietyRows || varietyRows.length === 0) {
            return null; // no variety found
            }

            const variety = varietyRows[0];

            // 2️⃣ Get the crop based on the variety’s crop_id
            const [cropRows] = await db.execute(
            "SELECT * FROM crops WHERE id = ?",
            [variety.crop_id]
            );

            if (!cropRows || cropRows.length === 0) {
            return null; // no crop found
            }

            return cropRows[0];
        } catch (error) {
            console.error("Error fetching crop:", error);
            throw new Error("Failed to load crop.");
        }
    },
    Variety: async (parent) => {
      const [rows] = await db.execute(
        "SELECT * FROM crop_varieties WHERE id = ?",
        [parent.variety_id]
      );
      if (!rows[0]) return null;
      const r = rows[0];
      return { id: String(r.id), name: r.name, cropId: String(r.crop_id) };
    },
  },

  Mutation: {
    savePreOrder: async (parent, { input }, context) => {
      try {
        const user_id = context.req.user.id;

        checkPermission(
          "can_create_pre_orders",
          "You dont have permissions to create pre-orders"
        );

        const data = {
          user_id,
          // crop_id: input.cropId,
          breeder: input.breederId || null,
          crop_variety_id: input.varietyId,
          quantity: input.quantity,
          seed_class: input.seedClass || null,
          collection_date: new Date(input.requestedDate),
          pickup_location: input.pickup_location || null,
          detail: input.comment || null,
          status: "pending",
          created_at: new Date(),
          updated_at: new Date(),
        };

        const insertId = await saveData({ 
          table: "pre_orders", 
          data,
          id: input.id || null,
         });
        const results = await getPreOrders({ id: insertId });
        return { success: true, message: input.id ? "Pre-order updated" : "Pre-order created", preOrder: results[0] };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    updatePreOrder: async (parent, { id, input }, context) => {
      try {

        checkPermission(
          context.req.user.permissions,
          "can_receive_pre_orders",
          "You dont have permissions to receive pre-orders"
        );

        console.log("Updating pre-order", { id, input });

        await saveData({
          table: "pre_orders",
          id,
          data: {
            status: input.status,
            response: input.comment,
            supply_date: input.status === "accepted" ? input.supplyDate : null,
            updated_at: new Date(),
          },
        });
        const results = await getPreOrders({ id });
        return { success: true, message: `Pre-order request has been ${input.status}`, preOrder: results[0] };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    deletePreOrder: async (parent, { id }, context) => {
      try {
        await db.execute("UPDATE pre_orders SET deleted = 1 WHERE id = ?", [id]);
        return { success: true, message: "Pre-order deleted" };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default preOrderResolvers;
