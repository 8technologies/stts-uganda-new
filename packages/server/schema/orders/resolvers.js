import { GraphQLError } from "graphql";
import { db } from "../../config/config";
import { getUsers } from "../user/resolvers";
import { mapProductRow } from "../marketplace/resolvers";
import saveData from "../../utils/db/saveData";

const mapOrdersRow = (row) => {
  return {
    id: row.id?.toString(),
    product_id: row.product_id?.toString(),
    quantity: row.quantity != null ? Number(row.quantity) : null,
    buyer_id: row.buyer_id?.toString(),
    status: row.status || null,
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

    Mutation:{
        orderProduct: async (parent, args, context) => {
            const input = args.input;
            
            const connection = await db.getConnection();
            try {
                const buyerId = context?.req?.user?.id;
                await connection.beginTransaction();
                const user = context?.req?.user;
                const userPermissions = user?.permissions || [];
                // checkPermission(userPermissions, 'can_order_product', 'No permission to order product');

                // Fetch the product to ensure it exists and has enough stock
                const [productRows] = await db.execute('SELECT * FROM products WHERE id = ? AND deleted = 0', [input.productId]);
                if (productRows.length === 0) {
                return { success: false, message: 'Product not found' };
                }

                const product = mapProductRow(productRows[0]);

                if (product.user_id === buyerId) {
                    return { success: false, message: 'You cant order your own product' };
                }
                
                if (product.stock < input.quantity) {
                    return { success: false, message: 'Insufficient stock available' };
                }

                const data = {
                    product_id: input.productId,
                    quantity: input.quantity,
                    seller_id: product.user_id,
                    buyer_id: buyerId,
                    comment: input.comment || null,
                    created_at: new Date(),
                };

                // Create the order 
                await saveData({
                    table:'orders', 
                    data,
                    id: null,
                    connection
                });

                connection.commit();
                return { success: true, message: 'Order placed successfully', data: data };
            }
            catch (err) {
                return { success: false, message: err.message };
            }
        },

        orderProcessing: async (parent, args, context) => {
            const input = args.input;
            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();
                const user = context?.req?.user;
                const userPermissions = user?.permissions || [];
                // checkPermission(userPermissions, 'can_process_order', 'No permission to process order');

                // Fetch the order to ensure it exists
                const order= await getOrders({id: input.orderId});
                if (order.length === 0) {
                    return { success: false, message: 'Order not found' };
                }

                const data = {
                    status: input.status,
                    comment: input.comment || null,
                };

                // Update the order 
                await saveData({
                    table:'orders', 
                    data,
                    id: input.orderId,
                    connection
                });

                connection.commit();
                return { success: true, message: 'Order updated successfully', order: {...order[0], ...data} };


            }catch (err) {
                return { success: false, message: err.message };
            }
        }
    }
};

export default orderResolvers;