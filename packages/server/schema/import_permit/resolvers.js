import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import saveData from "../../utils/db/saveData.js";
import checkPermission from "../../helpers/checkPermission.js";
import { getUsers } from "../user/resolvers.js";
import { fetchCropById, fetchVarietyById } from "../crop/resolvers.js";
import saveUpload from "../../helpers/saveUpload.js";
import sendEmail from "../../utils/emails/email_server.js";
import hasPermission from "../../helpers/hasPermission.js";
import generateImportPermitNo from "../../helpers/generateImportPermitNo.js";

const mapPermit = (row) => ({
  id: String(row.id),
  userId: row.user_id,
  applicantCategory: row.applicant_category,
  stockQuantity: Number(row.stock_quantity),
  countryOfOrigin: row.country_of_origin,
  supplierName: row.supplier_name,
  supplierAddress: row.supplier_address,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  status: row.status,
  inspectorId: row.inspector_id,
  statusComment: row.status_comment,
  permitNumber: row.permit_number,
  validFrom: row.valid_from,
  validUntil: row.valid_until,
  permitType: row.permit_type,
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
  updatedAt: row.updated_at,
});

const mapAttachment = (row) => ({
  id: String(row.id),
  permitId: String(row.permit_id),
  fileName: row.file_name,
  filePath: row.file_path,
  mimeType: row.mime_type,
  fileSize: row.file_size ? Number(row.file_size) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const handleSQLError = (error, fallback = "Database error") => {
  if (error?.code === "ER_DUP_ENTRY") {
    return new GraphQLError("Duplicate value detected");
  }
  return new GraphQLError(error?.message || fallback);
};

const fetchPermitById = async (id, conn = db) => {
  const [rows] = await conn.execute("SELECT * FROM permits WHERE id = ?", [id]);
  if (!rows.length) return null;
  return mapPermit(rows[0]);
};

const fetchItems = async (permitId, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT * FROM permit_items WHERE permit_id = ? ORDER BY id ASC",
    [permitId]
  );
  return rows.map(mapItem);
};

const fetchAttachments = async (permitId, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT * FROM permit_attachments WHERE permit_id = ? ORDER BY id ASC",
    [permitId]
  );
  return rows.map(mapAttachment);
};

const fetchConsignmentDocs = async (permitId, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT doc FROM permit_consignment_docs WHERE permit_id = ? ORDER BY doc ASC",
    [permitId]
  );
  return rows.map((r) => r.doc);
};

export const listImportPermits = async ({
  filter = {},
  pagination = {},
  inspector_id,
  user_id,
}) => {
  // console.log({
  //   filter,
  //   pagination,
  //   inspector_id,
  //   user_id,
  // });
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

  // if (user_id) {
  //   // for the inspector
  //   if (inspector_id) {
  //     // where += " OR user_id = ?";
  //   } else {
  //     where += " AND user_id = ?";
  //     values.push(user_id);
  //   }
  // }

  // Scope results based on user role.
  // If both are provided (inspector case), show permits created by the user OR assigned to them.
  if (user_id && inspector_id) {
    where += " AND (user_id = ? OR inspector_id = ?)";
    values.push(user_id, inspector_id);
  } else if (user_id) {
    where += " AND user_id = ?";
    values.push(user_id);
  } else if (inspector_id) {
    where += " AND (user_id = ? OR inspector_id = ?)";
    values.push(inspector_id, inspector_id);
  }

  // if (inspector_id) {
  //   where += " AND inspector_id = ? OR user_id = ?";
  //   values.push(inspector_id, user_id);
  // }

  if (filter?.type) {
    where += " AND permit_type = ?";
    values.push(filter?.type);
  }

  const [[countRow]] = await db.execute(
    `SELECT COUNT(*) AS total FROM permits ${where}`,
    values
  );
  const total = Number(countRow.total || 0);

  const [rows] = await db.execute(
    `SELECT * FROM permits ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...values, size, offset]
  );

  return { items: rows.map(mapPermit), total };
};

const importPermitsResolvers = {
  DateTime: DateTimeResolver,

  ImportPermit: {
    consignment: async (parent) => fetchConsignmentDocs(parent.id),
    items: async (parent) => fetchItems(parent.id),
    attachments: async (parent) => fetchAttachments(parent.id),
    createdBy: async (parent) => {
      const [user] = await getUsers({ id: parent.userId });
      if (!user) return null;
      return user;
    },
    inspector: async (parent) => {
      if (!parent.inspectorId) return null;
      const [user] = await getUsers({ id: parent.inspectorId });
      if (!user) return null;
      return user;
    },
  },

  ImportPermitItem: {
    crop: async (parent) => fetchCropById(parent.cropId),
    variety: async (parent) => fetchVarietyById(parent.varietyId),
  },

  Query: {
    importPermits: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      const userId = context.req.user.id;
      checkPermission(
        userPermissions,
        "can_view_import_permits",
        "You dont have permissions to view import permits"
      );

      const canViewAssignedPermits = hasPermission(
        userPermissions,
        "can_view_only_assigned_permits"
      );

      const canManageAllPermits = hasPermission(
        userPermissions,
        "can_manage_import_permits"
      );

      const { filter, pagination } = args || {};
      return listImportPermits({
        filter,
        pagination,
        inspector_id: canViewAssignedPermits ? userId : null,
        user_id: !canManageAllPermits ? userId : null,
      });
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
    },
  },

  Mutation: {
    createImportPermit: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const userPermissions = context.req.user.permissions;

      if (hasPermission(userPermissions, "can_create_permits")) {
        checkPermission(
          userPermissions,
          "can_create_permits",
          "You dont have permissions to create import permits"
        );
      } else {
        checkPermission(
          userPermissions,
          "can_manage_import_permits",
          "You dont have permissions to create import permits"
        );
      }

      const input = args.input;
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const permitData = {
          applicant_category: input.applicantCategory,
          stock_quantity: input.stockQuantity,
          country_of_origin: input.countryOfOrigin,
          supplier_name: input.supplierName,
          supplier_address: input.supplierAddress,
          user_id,
          status: "pending",
          permit_type: input.type,
        };

        const permitId = await saveData({
          table: "permits",
          data: permitData,
          id: null,
          idColumn: "id",
          connection: conn,
        });

        // Consignment docs
        if (Array.isArray(input.consignment) && input.consignment.length) {
          const placeholders = input.consignment.map(() => "(?, ?)").join(", ");
          const values = input.consignment.flatMap((d) => [permitId, d]);
          await conn.execute(
            `INSERT INTO permit_consignment_docs (permit_id, doc) VALUES ${placeholders}`,
            values
          );
        }

        // Items
        if (Array.isArray(input.items) && input.items.length) {
          const placeholders = input.items
            .map(() => "(?, ?, ?, ?, ?, ?)")
            .join(", ");
          const values = input.items.flatMap((i) => [
            permitId,
            i.cropId,
            i.varietyId,
            i.category,
            i.weight,
            i.measure,
          ]);
          await conn.execute(
            `INSERT INTO permit_items (permit_id, crop_id, variety_id, category, weight, measure) VALUES ${placeholders}`,
            values
          );
        }

        // Attachments (optional). Implement your own storage if needed.
        if (Array.isArray(input.attachments) && input.attachments.length) {
          for (const uploadPromise of input.attachments) {
            try {
              //   const upload = await uploadPromise; // { filename, mimetype, createReadStream }
              //   const { filename, mimetype } = upload;
              //   // TODO: persist file to storage and compute filePath, fileSize
              //   const filePath = `/uploads/permits/${permitId}/${filename}`;

              const {
                filename,
                path: filePath,
                mimetype,
              } = await saveUpload({
                file: uploadPromise,
                subdir: "permits",
              });

              await conn.execute(
                `INSERT INTO permit_attachments (permit_id, file_name, file_path, mime_type) VALUES (?, ?, ?, ?)`,
                [permitId, filename, filePath, mimetype || null]
              );
            } catch (e) {
              // continue on single-file failure
              console.error("Attachment save error:", e?.message || e);
            }
          }
        }

        await conn.commit();
        const permit = await fetchPermitById(permitId, conn);
        return {
          success: true,
          message: `${input.type} permit created successfully`,
          permit,
        };
      } catch (error) {
        await conn.rollback();
        throw handleSQLError(error, "Failed to create import permit");
      } finally {
        conn.release();
      }
    },

    updateImportPermit: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const userPermissions = context.req.user.permissions;
      console.log("args", args);
      checkPermission(
        userPermissions,
        "can_edit_import_permits",
        "You dont have permissions to edit permits"
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
          supplierAddress: "supplier_address",
          type: "permit_type",
        };
        for (const k of Object.keys(map)) {
          if (Object.prototype.hasOwnProperty.call(input, k)) {
            sets.push(`${map[k]} = ?`);
            vals.push(input[k]);
          }
        }
        if (sets.length) {
          await conn.execute(
            `UPDATE permits SET ${sets.join(", ")} WHERE id = ?`,
            [...vals, id]
          );
        }

        if (input.replaceChildren !== false) {
          if (Array.isArray(input.consignment)) {
            await conn.execute(
              "DELETE FROM permit_consignment_docs WHERE permit_id = ?",
              [id]
            );
            if (input.consignment.length) {
              const placeholders = input.consignment
                .map(() => "(?, ?)")
                .join(", ");
              const values = input.consignment.flatMap((d) => [id, d]);
              await conn.execute(
                `INSERT INTO permit_consignment_docs (permit_id, doc) VALUES ${placeholders}`,
                values
              );
            }
          }
          if (Array.isArray(input.items)) {
            await conn.execute("DELETE FROM permit_items WHERE permit_id = ?", [
              id,
            ]);
            if (input.items.length) {
              const placeholders = input.items
                .map(() => "(?, ?, ?, ?, ?, ?)")
                .join(", ");
              const values = input.items.flatMap((i) => [
                id,
                i.cropId,
                i.varietyId,
                i.category,
                i.weight,
                i.measure,
              ]);
              await conn.execute(
                `INSERT INTO permit_items (permit_id, crop_id, variety_id, category, weight, measure) VALUES ${placeholders}`,
                values
              );
            }
          }
        }

        // Attachments updates
        if (
          Array.isArray(input.attachmentsRemoveIds) &&
          input.attachmentsRemoveIds.length
        ) {
          const placeholders = input.attachmentsRemoveIds
            .map(() => "?")
            .join(", ");
          await conn.execute(
            `DELETE FROM permit_attachments WHERE id IN (${placeholders}) AND permit_id = ?`,
            [...input.attachmentsRemoveIds, id]
          );
        }
        if (
          Array.isArray(input.attachmentsAdd) &&
          input.attachmentsAdd.length
        ) {
          for (const uploadPromise of input.attachmentsAdd) {
            try {
              //   const upload = await uploadPromise; // { filename, mimetype, createReadStream }
              //   const { filename, mimetype } = upload;
              //   const filePath = `/uploads/permits/${id}/${filename}`;

              const {
                filename,
                path: filePath,
                mimetype,
              } = await saveUpload({
                file: uploadPromise,
                subdir: "permits",
              });
              await conn.execute(
                `INSERT INTO permit_attachments (permit_id, file_name, file_path, mime_type) VALUES (?, ?, ?, ?)`,
                [id, filename, filePath, mimetype || null]
              );
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error("Attachment save error:", e?.message || e);
            }
          }
        }

        await conn.commit();
        const permit = await fetchPermitById(id, conn);
        return {
          success: true,
          message: `${input.type} permit updated successfully`,
          permit,
        };
      } catch (error) {
        await conn.rollback();
        throw handleSQLError(error, "Failed to update permit");
      } finally {
        conn.release();
      }
    },

    deleteImportPermit: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_delete_import_permits",
        "You dont have permissions to delete permits"
      );
      try {
        await db.execute("DELETE FROM permits WHERE id = ?", [args.id]);
        return { success: true, message: "Permit deleted successfully" };
      } catch (error) {
        throw handleSQLError(error, "Failed to delete permit");
      }
    },

    assignPermitInspector: async (parent, args, context) => {
      try {
        const { inspector_id, form_id } = args.payload;
        const userPermissions = context.req.user.permissions;

        // check if user has permission to assign an inspector
        checkPermission(
          userPermissions,
          "qa_can_assign_inspector",
          "You don't have permissions to assign an inspector"
        );

        // fetch inspector details
        const [inspector] = await getUsers({
          id: inspector_id,
        });

        // fetch the form details
        const formDetails = await fetchPermitById(form_id);

        if (!inspector)
          throw new GraphQLError("Inspector with the given id is not found!");

        if (!formDetails)
          throw new GraphQLError("Form with the provided id is not found!");

        // get the user associated to that form
        const [formOwner] = await getUsers({
          id: formDetails.user_id,
        });

        if (!formOwner) throw new GraphQLError("Form owner not found!");

        // set the new inspector
        const data = {
          inspector_id,
          status: "assigned_inspector",
        };

        await saveData({
          table: "permits",
          data,
          id: form_id,
        });

        // send a notification to the assigned inspector
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: inspector.email,
          subject: `${formDetails.permitType} Permit Inspector Assignment`,
          message: `Dear ${inspector.name}, You have been assigned as the inspector for ${formOwner.name}'s ${formDetails.permitType} permit`,
        });

        // send another email to the form owner
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: formOwner.email,
          subject: `${formDetails.permitType} Permit Inspector Assignment`,
          message: `Dear ${formOwner.name}, You have been assigned to ${inspector.name} as your inspector for the ${formDetails.permitType} permit requests that you submitted`,
        });

        return {
          success: true,
          message: `${formDetails.permitType} Permit Inspector assigned successfully`,
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    haltPermit: async (parent, args, context) => {
      try {
        const { form_id, reason } = args.payload;
        const userPermissions = context.req.user.permissions;

        // check if user has permission to assign an inspector
        checkPermission(
          userPermissions,
          "qa_can_halt",
          "You don't have permissions to halt a permit"
        );

        // fetch the form details
        const formDetails = await fetchPermitById(form_id);

        if (!formDetails)
          throw new GraphQLError("Form with the provided id is not found!");

        // get the user associated to that form
        const [formOwner] = await getUsers({
          id: formDetails.user_id,
        });

        if (!formOwner) throw new GraphQLError("Form owner not found!");

        // updated the form status
        const data = {
          status_comment: reason,
          status: "halted",
        };

        await saveData({
          table: "permits",
          data,
          id: form_id,
        });

        // send another email to the form owner
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: formOwner.email,
          subject: `${formDetails.permitType} Permit Halted`,
          message: `Dear ${formOwner.name}, Your ${formDetails.permitType} Permit Application has been halted. Please go to the system to see the reason`,
        });

        return {
          success: true,
          message: `${formDetails.permitType} Permit halted successfully`,
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    rejectPermit: async (parent, args, context) => {
      try {
        const { form_id, reason } = args.payload;
        const userPermissions = context.req.user.permissions;

        // check if user has permission to assign an inspector
        checkPermission(
          userPermissions,
          "qa_can_reject",
          "You don't have permissions to reject a permit"
        );

        // fetch the form details
        const formDetails = await fetchPermitById(form_id);

        if (!formDetails)
          throw new GraphQLError("Form with the provided id is not found!");

        // get the user associated to that form
        const [formOwner] = await getUsers({
          id: formDetails.user_id,
        });

        if (!formOwner) throw new GraphQLError("Form owner not found!");

        // updated the form status
        const data = {
          status_comment: reason,
          status: "rejected",
        };

        await saveData({
          table: "permits",
          data,
          id: form_id,
        });

        // send another email to the form owner
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: formOwner.email,
          subject: `${formDetails.permitType} Permit Rejection`,
          message: `Dear ${formOwner.name}, Your form has been rejected. Please go to the system to see the reason`,
        });

        return {
          success: true,
          message: `${formDetails.permitType} Permit rejected successfully`,
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    approvePermit: async (parent, args, context) => {
      const connection = await db.getConnection();
      try {
        const { form_id } = args.payload;
        const userPermissions = context.req.user.permissions;
        await connection.beginTransaction();

        // check if user has permission to assign an inspector
        checkPermission(
          userPermissions,
          "qa_can_approve",
          "You don't have permissions to approve a permit"
        );

        // fetch the form details
        const formDetails = await fetchPermitById(form_id);

        if (!formDetails)
          throw new GraphQLError("Form with the provided id is not found!");

        // get the user associated to that form
        const [formOwner] = await getUsers({ id: formDetails.userId });

        if (!formOwner) throw new GraphQLError("Form owner not found!");

        // default validity window

        const now = new Date();
        const validFrom = formDetails.valid_from
          ? new Date(formDetails.valid_from)
          : now;

        // Valid for 6 months from validFrom if not already set
        const validUntil = formDetails.valid_until
          ? new Date(formDetails.valid_until)
          : new Date(new Date(validFrom).setMonth(validFrom.getMonth() + 6));

        // generate a unique permit number
        // Ensure uniqueness by checking existing numbers; try a few times
        let permitNo = null;
        for (let i = 0; i < 5; i++) {
          const candidate = generateImportPermitNo({ prefix: "MAAIF/IMP" });
          const [[row]] = await connection.execute(
            "SELECT COUNT(*) AS cnt FROM permits WHERE permit_number = ?",
            [candidate]
          );
          if (Number(row?.cnt || 0) === 0) {
            permitNo = candidate;
            break;
          }
        }
        if (!permitNo) {
          throw new GraphQLError(
            `Failed to generate a unique ${formDetails.permitType} permit number`
          );
        }

        // update the form status/validity on application_forms
        const data = {
          status: "approved",
          valid_from: validFrom,
          valid_until: validUntil,
          permit_number: permitNo,
          status_comment: "Accepted",
        };

        await saveData({
          table: "permits",
          data,
          id: form_id,
          connection,
        });

        // send email with attachment if any
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: formOwner.email,
          subject: `${formDetails.permitType} Permit Approval`,
          message: `Congragfulations!!!, Dear ${formOwner.name}, Your ${formDetails.permitType} Permit has been approved.`,
          // attachments,
        });

        await connection.commit();

        return {
          success: true,
          message: `${formDetails.permitType} permit approved successfully`,
        };
      } catch (error) {
        await connection.rollback();
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default importPermitsResolvers;
