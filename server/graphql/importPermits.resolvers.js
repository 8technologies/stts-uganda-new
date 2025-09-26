import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import saveData from "../../utils/db/saveData.js";
import checkPermission from "../../helpers/checkPermission.js";

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
const mapPermit = (row) => ({
  id: String(row.id),
  applicantCategory: row.applicant_category,
  stockQuantity: Number(row.stock_quantity),
  countryOfOrigin: row.country_of_origin,
  supplierName: row.supplier_name,
  supplierAddress: row.supplier_address,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapItem = (row) => ({
  id: String(row.id),
  permitId: String(row.permit_id),
  cropId: String(row.crop_id),
  varietyId: String(row.variety_id),
  category: row.category,
  weight: Number(row.weight),
  measure: row.measure,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapAttachment = (row) => ({
  id: String(row.id),
  permitId: String(row.permit_id),
  fileName: row.file_name,
  filePath: row.file_path,
  mimeType: row.mime_type,
  fileSize: row.file_size ? Number(row.file_size) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const handleSQLError = (error, fallback = "Database error") => {
  if (error?.code === "ER_DUP_ENTRY") {
    return new GraphQLError("Duplicate value detected");
  }
  return new GraphQLError(error?.message || fallback);
};

const fetchPermitById = async (id, conn = db) => {
  const [rows] = await conn.execute("SELECT * FROM import_permits WHERE id = ?", [id]);
  if (!rows.length) return null;
  return mapPermit(rows[0]);
};

const fetchItems = async (permitId, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT * FROM import_permit_items WHERE permit_id = ? ORDER BY id ASC",
    [permitId]
  );
  return rows.map(mapItem);
};

const fetchAttachments = async (permitId, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT * FROM import_permit_attachments WHERE permit_id = ? ORDER BY id ASC",
    [permitId]
  );
  return rows.map(mapAttachment);
};

const fetchConsignmentDocs = async (permitId, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT doc FROM import_permit_consignment_docs WHERE permit_id = ? ORDER BY doc ASC",
    [permitId]
  );
  return rows.map((r) => r.doc);
};

export const listImportPermits = async ({ filter = {}, pagination = {} }) => {
  const page = Math.max(1, Number(pagination.page || 1));
  const size = Math.max(1, Math.min(100, Number(pagination.size || 20)));
  const offset = (page - 1) * size;

  const values = [];
  let where = "WHERE 1=1";
  if (filter?.applicantCategory) {
    where += " AND applicant_category = ?";
    values.push(filter.applicantCategory);
  }
  if (filter?.country) {
    where += " AND country_of_origin LIKE ?";
    values.push(`%${filter.country}%`);
  }
  if (filter?.search) {
    where += " AND (supplier_name LIKE ? OR supplier_address LIKE ?)";
    values.push(`%${filter.search}%`, `%${filter.search}%`);
  }

  const [[countRow]] = await db.execute(
    `SELECT COUNT(*) AS total FROM import_permits ${where}`,
    values
  );
  const total = Number(countRow.total || 0);

  const [rows] = await db.execute(
    `SELECT * FROM import_permits ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...values, size, offset]
  );

  return { items: rows.map(mapPermit), total };
};

// ---------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------
const importPermitsResolvers = {
  DateTime: DateTimeResolver,

  ImportPermit: {
    consignment: async (parent) => fetchConsignmentDocs(parent.id),
    items: async (parent) => fetchItems(parent.id),
    attachments: async (parent) => fetchAttachments(parent.id)
  },

  Query: {
    importPermits: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_view_import_permits",
        "You dont have permissions to view import permits"
      );
      const { filter, pagination } = args || {};
      return listImportPermits({ filter, pagination });
    },
    importPermit: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_view_import_permits",
        "You dont have permissions to view import permits"
      );
      const row = await fetchPermitById(args.id);
      return row;
    }
  },

  Mutation: {
    createImportPermit: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_manage_import_permits",
        "You dont have permissions to create import permits"
      );

      const input = args.input;
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const permitData = {
          applicant_category: input.applicantCategory,
          stock_quantity: input.stockQuantity,
          country_of_origin: input.countryOfOrigin,
          supplier_name: input.supplierName,
          supplier_address: input.supplierAddress
        };

        const permitId = await saveData({
          table: "import_permits",
          data: permitData,
          id: null,
          idColumn: "id",
          connection: conn
        });

        // Consignment docs
        if (Array.isArray(input.consignment) && input.consignment.length) {
          const placeholders = input.consignment.map(() => "(?, ?)").join(", ");
          const values = input.consignment.flatMap((d) => [permitId, d]);
          await conn.execute(
            `INSERT INTO import_permit_consignment_docs (permit_id, doc) VALUES ${placeholders}`,
            values
          );
        }

        // Items
        if (Array.isArray(input.items) && input.items.length) {
          const placeholders = input.items.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
          const values = input.items.flatMap((i) => [
            permitId,
            i.cropId,
            i.varietyId,
            i.category,
            i.weight,
            i.measure
          ]);
          await conn.execute(
            `INSERT INTO import_permit_items (permit_id, crop_id, variety_id, category, weight, measure) VALUES ${placeholders}`,
            values
          );
        }

        // Attachments (optional). Implement your own storage if needed.
        if (Array.isArray(input.attachments) && input.attachments.length) {
          for (const uploadPromise of input.attachments) {
            try {
              const upload = await uploadPromise; // { filename, mimetype, createReadStream }
              const { filename, mimetype } = upload;
              // TODO: persist file to storage and compute filePath, fileSize
              const filePath = `/uploads/permits/${permitId}/${filename}`;
              await conn.execute(
                `INSERT INTO import_permit_attachments (permit_id, file_name, file_path, mime_type) VALUES (?, ?, ?, ?)`
              , [permitId, filename, filePath, mimetype || null]);
            } catch (e) {
              // continue on single-file failure
              // eslint-disable-next-line no-console
              console.error("Attachment save error:", e?.message || e);
            }
          }
        }

        await conn.commit();
        const permit = await fetchPermitById(permitId, conn);
        return { success: true, message: "Import permit created successfully", permit };
      } catch (error) {
        await conn.rollback();
        throw handleSQLError(error, "Failed to create import permit");
      } finally {
        conn.release();
      }
    },

    updateImportPermit: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_edit_import_permits",
        "You dont have permissions to edit import permits"
      );

      const { id, input } = args;
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // dynamic update for provided fields
        const sets = [];
        const vals = [];
        const map = {
          applicantCategory: "applicant_category",
          stockQuantity: "stock_quantity",
          countryOfOrigin: "country_of_origin",
          supplierName: "supplier_name",
          supplierAddress: "supplier_address"
        };
        for (const k of Object.keys(map)) {
          if (Object.prototype.hasOwnProperty.call(input, k)) {
            sets.push(`${map[k]} = ?`);
            vals.push(input[k]);
          }
        }
        if (sets.length) {
          await conn.execute(
            `UPDATE import_permits SET ${sets.join(", ")} WHERE id = ?`,
            [...vals, id]
          );
        }

        if (input.replaceChildren !== false) {
          if (Array.isArray(input.consignment)) {
            await conn.execute(
              "DELETE FROM import_permit_consignment_docs WHERE permit_id = ?",
              [id]
            );
            if (input.consignment.length) {
              const placeholders = input.consignment.map(() => "(?, ?)").join(", ");
              const values = input.consignment.flatMap((d) => [id, d]);
              await conn.execute(
                `INSERT INTO import_permit_consignment_docs (permit_id, doc) VALUES ${placeholders}`,
                values
              );
            }
          }
          if (Array.isArray(input.items)) {
            await conn.execute(
              "DELETE FROM import_permit_items WHERE permit_id = ?",
              [id]
            );
            if (input.items.length) {
              const placeholders = input.items.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
              const values = input.items.flatMap((i) => [
                id,
                i.cropId,
                i.varietyId,
                i.category,
                i.weight,
                i.measure
              ]);
              await conn.execute(
                `INSERT INTO import_permit_items (permit_id, crop_id, variety_id, category, weight, measure) VALUES ${placeholders}`,
                values
              );
            }
          }
        }

        // Attachments updates
        if (Array.isArray(input.attachmentsRemoveIds) && input.attachmentsRemoveIds.length) {
          const placeholders = input.attachmentsRemoveIds.map(() => "?").join(", ");
          await conn.execute(
            `DELETE FROM import_permit_attachments WHERE id IN (${placeholders}) AND permit_id = ?`,
            [...input.attachmentsRemoveIds, id]
          );
        }
        if (Array.isArray(input.attachmentsAdd) && input.attachmentsAdd.length) {
          for (const uploadPromise of input.attachmentsAdd) {
            try {
              const upload = await uploadPromise; // { filename, mimetype, createReadStream }
              const { filename, mimetype } = upload;
              const filePath = `/uploads/permits/${id}/${filename}`;
              await conn.execute(
                `INSERT INTO import_permit_attachments (permit_id, file_name, file_path, mime_type) VALUES (?, ?, ?, ?)`
              , [id, filename, filePath, mimetype || null]);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error("Attachment save error:", e?.message || e);
            }
          }
        }

        await conn.commit();
        const permit = await fetchPermitById(id, conn);
        return { success: true, message: "Import permit updated successfully", permit };
      } catch (error) {
        await conn.rollback();
        throw handleSQLError(error, "Failed to update import permit");
      } finally {
        conn.release();
      }
    },

    deleteImportPermit: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_delete_import_permits",
        "You dont have permissions to delete import permits"
      );
      try {
        await db.execute("DELETE FROM import_permits WHERE id = ?", [args.id]);
        return { success: true, message: "Import permit deleted successfully" };
      } catch (error) {
        throw handleSQLError(error, "Failed to delete import permit");
      }
    }
  }
};

export default importPermitsResolvers;

