import { GraphQLError } from "graphql";
import { db } from "../../config/config.js";
import saveData from "../../utils/db/saveData.js";
import { getUsers } from "../user/resolvers.js";
import checkPermission from "../../helpers/checkPermission.js";
import hasPermission from "../../helpers/hasPermission.js";
import { fetchVarietyById } from "../crop/resolvers.js";

const parseJSON = (text) => {
  if (!text) return null;
  try {
    return typeof text === 'string' ? JSON.parse(text) : text;
  } catch {
    return null;
  }
};

const mapProductRow = (row) => {
  return {
  id: row.id?.toString(),
  name: row.name || row.lot_number ,
  description: row.description || null,
  price: row.price != null ? Number(row.price) : null,
  unit: row.unit || null,
  crop_variety_id: row.crop_variety_id?.toString() || null,
  category_id: row.category_id?.toString() || null,
  seller_id: row.user_id?.toString() || null,
  quantity: row.quantity != null ? Number(row.quantity) : null,
  stock: row.available_stock != null ? Number(row.available_stock) : null,
  metadata: parseJSON(row.metadata),
  image_url: row.image_url || null,
  deleted: Boolean(row.deleted),
  created_at: row.created_at ? new Date(row.created_at) : null,
  updated_at: row.updated_at ? new Date(row.updated_at) : null,
}};

const fetchProducts = async ({
    filter = {},

} = {}) => {
      const values = [];
        const where = ['products.deleted = 0'];

        if (filter.includeDeleted) {
          // if includeDeleted true, remove deleted filter
          where.length = 0;
        }

        if (filter.id) {
          where.push('products.id = ?');
          values.push(filter.id);
        }
        if (filter.seller_id) {
          where.push('products.seller_id = ?');
          values.push(filter.seller_id);
        }
        if (filter.category_id) {
          where.push('products.category_id = ?');
          values.push(filter.category_id);
        }
        if (filter.q) {
          where.push('(products.name LIKE ? OR products.description LIKE ?)');
          const term = `%${filter.q}%`;
          values.push(term, term);
        }

        const sql = `
          SELECT products.*
          FROM products
          ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
          ORDER BY products.created_at DESC
        `;

        const [rows] = await db.execute(sql, values);
        return rows.map(mapProductRow);

};

const marketplaceResolvers = {
  Query: {
    products: async (_parent, { filter = {} }, context) => {
      try {
        const user = context?.req?.user;
        const userPermissions = user?.permissions || [];

        // permission to view products (adjust name to your system)
        // checkPermission(userPermissions, 'can_view_products', 'No permission to view products');
        const products = await fetchProducts({ filter });
        return products;
      
      } catch (err) {
        throw new Error(`Failed to fetch products: ${err.message}`);
      }
    },

    product: async (_parent, { id }, context) => {
      try {
        // checkPermission(...);
        const [rows] = await db.execute('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
        if (!rows.length) return null;
        return mapProductRow(rows[0]);
      } catch (err) {
        throw new Error(`Failed to fetch product: ${err.message}`);
      }
    },
  },
  Product: {
    Seller: async (parent) => {
        try {
            const user_id = parent.user_id;

            const [user] = await getUsers({
                id: user_id,
            });
            return user;
        } catch (error) {
            throw new GraphQLError(error.message);
         }
    },
    Crop: async (parent) => {
        try {
            // 1️⃣ Get the variety based on crop_variety_id
            const [varietyRows] = await db.execute(
            "SELECT * FROM crop_varieties WHERE id = ?",
            [parent.crop_variety_id]
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
    CropVariety: async (parent) => {
        try {
        
        const variety_id = parent.crop_variety_id;

        if (!variety_id) return null;

        const variety = await fetchVarietyById(variety_id);

        return variety;
        } catch (error) {
            console.error("Error fetching crop variety:", error);
            throw new GraphQLError(error.message);
        }
    },

  },

  Mutation: {
    deleteProduct: async (_parent, { id }, context) => {
      try {
        const user = context?.req?.user;
        const userPermissions = user?.permissions || [];
        // checkPermission(userPermissions, 'can_delete_product', 'No permission to delete product');

        await db.execute('UPDATE products SET deleted = 1 WHERE id = ?', [id]);
        return { success: true, message: 'Product deleted' };
      } catch (err) {
        return { success: false, message: err.message };
      }
    },

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
        }
        );

        connection.commit();
        return { success: true, message: 'Order placed successfully', product };
      }
      catch (err) {
        return { success: false, message: err.message };
      }
    }
  },
};

export default marketplaceResolvers ;