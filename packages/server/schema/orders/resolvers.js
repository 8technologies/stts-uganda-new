import { GraphQLError } from "graphql";
import { db } from "../../config/config";
import { getUsers } from "../user/resolvers";

const mapOrdersRow = (row) => {
  return {
    id: row.id?.toString(),
    product_id: row.product_id?.toString(),
    quantity: row.quantity != null ? Number(row.quantity) : null,
    buyer_id: row.buyer_id?.toString(),
    seller_id: row.seller_id?.toString(),
    comment: row.comment || null,
    created_at: row.created_at ? new Date(row.created_at) : null,
  };
};


const getOrders = async ({
    id = null,
    seller_id = null,
    buyer_id = null,
}) => {
    try{
        let values = [];
        let where = '';

        if (id) {
            where += ' AND id = ? ';
            values.push(id);
        }
        if (seller_id) {
            where += ' AND (buyer_id = ? ) ';
            values.push(seller_id);
        }
        if (buyer_id) {
            where += ' AND (seller_id = ? ) ';
            values.push(buyer_id);
        }

        const query = `SELECT * FROM orders WHERE orders.deleted =0 ${where} ORDER BY created_at DESC`;
        const [rows] = await db.execute(query, values);

        return rows.map(mapOrdersRow);
    }
    catch (error) {
        throw new GraphQLError(error.message);
    }
    
};

const orderResolvers = {
    Query:{
        getOrders: async (parent, args, context) => {
            try {
                const user_id = context.req.user.id;
                const userPermissions = context.req.user.permissions;

                // checkPermission(
                // userPermissions,
                // "can_view_orders",
                // "You dont have permissions to view orders"
                // );

                // const can_view_only_own_orders = hasPermission(
                // userPermissions,
                // "can_view_specific_assigned_forms"
                // );
                const results = await getOrders({
                    user_id: user_id,
                });
        
                return results;
            } catch (error) {
                throw new GraphQLError(error.message);
            }
        },
    },
    Order: {
        Seller: async (parent) => {
            try {
                const seller_id = parent.seller_id;
                const user = await getUsers({
                    id: seller_id,
                });
                return user[0];
            }
            catch (error) {
                throw new GraphQLError(error.message);
            }
        },
        Buyer: async (parent) => {
            try {
                const buyer_id = parent.buyer_id;
                const user = await getUsers({
                    id: buyer_id,
                });
                return user[0];
            }
            catch (error) {
                throw new GraphQLError(error.message);
            }
        }
    },
};

export default orderResolvers;