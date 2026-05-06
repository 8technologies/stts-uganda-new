import { GraphQLError } from "graphql";
import { db } from "../../config/config.js";
import { getUsers } from "../user/resolvers.js";
import saveData from "../../utils/db/saveData.js";
import { seedCategory } from "../../../client/src/pages/seed-stock/stock-examination/StockExamination.js";

const mapPreOrderRow = (row) => ({
  id: row.id?.toString(),
  user_id: row.user_id?.toString(),
  crop_id: row.crop_id?.toString(),
  variety_id: row.crop_variety_id?.toString(),
  seed_class: row.seed_class,
  quantity: row.quantity != null ? Number(row.quantity) : null,
  collection_date: row.collection_date ? new Date(row.collection_date) : null,
  pickup_location: row.pickup_location,
  status: row.status || "pending",
  comment: row.response || null,
  deleted: row.deleted,
  created_at: row.created_at ? new Date(row.created_at) : null,
  updated_at: row.updated_at ? new Date(row.updated_at) : null,
});

const getPreOrders = async ({ id = null, user_id = null } = {}) => {
  let values = [];
  let where = "";

  if (id) {
    where += " AND id = ? ";
    values.push(id);
  }
  if (user_id) {
    where += " AND user_id = ? ";
    values.push(user_id);
  }

  const query = `SELECT * FROM pre_orders WHERE deleted = 0 ${where} ORDER BY created_at DESC`;
  const [rows] = await db.execute(query, values);
  return rows.map(mapPreOrderRow);
};

const preOrderResolvers = {
  Query: {
    getPreOrders: async (parent, args, context) => {
      try {
        const user_id = context.req.user.id;
        return await getPreOrders({ user_id });
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
    Crop: async (parent) => {
      const [rows] = await db.execute(
        "SELECT * FROM crops WHERE id = ? AND deleted = 0",
        [parent.crop_id]
      );
      if (!rows[0]) return null;
      const r = rows[0];
      return { id: String(r.id), name: r.name };
    },
    Variety: async (parent) => {
      const [rows] = await db.execute(
        "SELECT * FROM crop_varieties WHERE id = ? AND deleted = 0",
        [parent.variety_id]
      );
      if (!rows[0]) return null;
      const r = rows[0];
      return { id: String(r.id), name: r.name, cropId: String(r.crop_id) };
    },
  },

  Mutation: {
    createPreOrder: async (parent, { input }, context) => {
      try {
        const user_id = context.req.user.id;

        const data = {
          user_id,
          crop_id: input.cropId,
          variety_id: input.varietyId,
          quantity: input.quantity,
          requested_date: new Date(input.requestedDate),
          comment: input.comment || null,
          status: "pending",
          deleted: 0,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const insertId = await saveData({ table: "pre_orders", data, id: null });
        const results = await getPreOrders({ id: insertId });
        return { success: true, message: "Pre-order created", preOrder: results[0] };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    updatePreOrder: async (parent, { id, input }, context) => {
      try {
        await saveData({
          table: "pre_orders",
          id,
          data: {
            status: input.status,
            comment: input.comment,
            updated_at: new Date(),
          },
        });
        const results = await getPreOrders({ id });
        return { success: true, message: "Pre-order updated", preOrder: results[0] };
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
