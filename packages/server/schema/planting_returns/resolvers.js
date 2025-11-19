import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import saveData from "../../utils/db/saveData.js";
import checkPermission from "../../helpers/checkPermission.js";
import { fetchCropById, fetchVarietyById } from "../crop/resolvers.js";
import { getUsers } from "../user/resolvers.js";
import saveUpload from "../../helpers/saveUpload.js";
import hasPermission from "../../helpers/hasPermission.js";
import sendEmail from "../../utils/emails/email_server.js";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import { fileURLToPath } from "url";
import importSubGrowers from "../../utils/subgrowers/importsubgrowers.js";



const mapReturn = (row) => ({
  id: String(row.id),
  sr8Number: row.sr8_number,

  applicantName: row.applicant_name,
  growerNumber: row.grower_number,
  contactPhone: row.contact_phone,

  gardenNumber: row.garden_number,
  fieldName: row.field_name,
  location: {
    district: row.district,
    subcounty: row.subcounty,
    parish: row.parish,
    village: row.village,
    gpsLat: row.gps_lat != null ? Number(row.gps_lat) : null,
    gpsLng: row.gps_lng != null ? Number(row.gps_lng) : null,
  },

  cropId: row.crop_id != null ? String(row.crop_id) : null,
  varietyId: row.variety_id != null ? String(row.variety_id) : null,
  seedClass: row.seed_class,

  areaHa: row.area_ha != null ? Number(row.area_ha) : null,
  dateSown: row.date_sown,
  expectedHarvest: row.expected_harvest,
  seedSource: row.seed_source,
  seedLotCode: row.seed_lot_code,
  intendedMerchant: row.intended_merchant,
  seedRatePerHa: row.seed_rate_per_ha,

  status: row.status,
  statusComment: row.status_comment,
  scheduledVisitDate: row.scheduled_visit_date,

  createdAt: row.created_at,
  updatedAt: row.updated_at,

  // Resolver-level lookups
  inspector: row.inspector_id ? { id: String(row.inspector_id) } : null,
  createdBy: row.created_by ? { id: String(row.created_by) } : null,
});

const handleSQLError = (error, fallback = "Database error") => {
  return new GraphQLError(error?.message || fallback);
};

export const fetchReturnById = async (id, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT * FROM planting_returns WHERE id = ?",
    [id]
  );
  if (!rows.length) return null;
  return mapReturn(rows[0]);
};

export const listPlantingReturns = async ({ filter = {}, pagination = {} }) => {
  const page = Math.max(1, Number(pagination.page || 1));
  const size = Math.max(1, Math.min(100, Number(pagination.size || 20)));
  const offset = (page - 1) * size;

  console.log("filters", filter);

  const values = [];
  let where = "WHERE 1=1";

  if (filter.status) {
    where += " AND status = ?";
    values.push(filter.status);
  }

  if (filter.district) {
    where += " AND district LIKE ?";
    values.push(`%${filter.district}%`);
  }

  if (filter.cropId) {
    where += " AND crop_id = ?";
    values.push(filter.cropId);
  }

  if (filter.varietyId) {
    where += " AND variety_id = ?";
    values.push(filter.varietyId);
  }

  // if (filter.createdById) {
  //   where += " AND created_by = ?";
  //   values.push(filter.createdById);
  // }

  // if (filter.inspectorId) {
  //   where += " AND inspector_id = ?";
  //   values.push(filter.inspectorId);
  // }

  if (filter.createdById && filter.inspectorId) {
    where += " AND (created_by = ? OR inspector_id = ?)";
    values.push(filter.createdById, filter.inspectorId);
  } else if (filter.createdById) {
    where += " AND created_by = ?";
    values.push(filter.createdById);
  } else if (filter.inspectorId) {
    where += " AND (created_by = ? OR inspector_id = ?)";
    values.push(filter.inspectorId, filter.inspectorId);
  }

  if (filter.search) {
    where +=
      " AND (applicant_name LIKE ? OR field_name LIKE ? OR garden_number LIKE ? OR seed_lot_code LIKE ?)";
    values.push(
      `%${filter.search}%`,
      `%${filter.search}%`,
      `%${filter.search}%`,
      `%${filter.search}%`
    );
  }

  const [[countRow]] = await db.execute(
    `SELECT COUNT(*) AS total FROM planting_returns ${where}`,
    values
  );
  const total = Number(countRow?.total || 0);

  const [rows] = await db.execute(
    `SELECT * FROM planting_returns ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...values, size, offset]
  );

  return { items: rows.map(mapReturn), total };
};

// Generate SR8 number like SR8-YYYY-0001 (naive, not concurrency-safe)
/* const generateSr8Number = async () => {
  const year = new Date().getFullYear();
  const [[row]] = await db.execute(
    "SELECT COUNT(*) AS c FROM planting_returns WHERE YEAR(created_at) = ?",
    [year]
  );
  const next = Number(row?.c || 0) + 1;
  return `SR8-${year}-${String(next).padStart(4, "0")}`;
}; */

const generateSr8Number = async () => {
  const year = new Date().getFullYear();

  // Atomic insert-or-increment using the sequence table
  const [result] = await db.execute(
    `INSERT INTO sr8_sequences (year, last_seq)
     VALUES (?, 1)
     ON DUPLICATE KEY UPDATE last_seq = LAST_INSERT_ID(last_seq + 1)`,
    [year]
  );

  const next = result.insertId; // Guaranteed unique per row
  return `SR8-${year}-${String(next).padStart(4, "0")}`;
};


const plantingReturnsResolvers = {
  DateTime: DateTimeResolver,

  PlantingReturn: {
    inspector: async (parent) => {
      let inspectorId = parent?.inspector?.id || parent?.inspector_id;

      if (!inspectorId) return null;
      const [user] = await getUsers({
        id: parent?.inspector?.id || parent?.inspector_id,
      });

      return user;
    },
    createdBy: async (parent) => {
      let createdBy = parent?.createdBy?.id || parent?.created_by;

      if (!createdBy) return null;
      const [user] = await getUsers({
        id: parent?.createdBy?.id || parent?.created_by,
      });

      return user;
    },
    crop: async (parent) => {
      let cropId = parent?.cropId || parent?.crop_id;
      if (!cropId) return null;

      const result = await fetchCropById(parent?.cropId || parent?.crop_id);

      return result;
    },
    variety: async (parent) => {
      let varietyId = parent?.varietyId || parent?.variety_id;
      if (!varietyId) return null;

      const result = await fetchVarietyById(
        parent?.varietyId || parent?.variety_id
      );
      return result;
    },
  },

  Query: {
    plantingReturns: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      const user_id = context.req.user.id;

      checkPermission(
        userPermissions,
        "can_view_planting_returns",
        "You dont have permissions to view planting returns"
      );

      const canViewAssignedPlantingReturns = hasPermission(
        userPermissions,
        "can_view_only_assigned_planting_returns"
      );

      const canManageAllPlantingReturns = hasPermission(
        userPermissions,
        "can_manage_planting_returns"
      );

      console.log("canManageAllPlantingReturns", canManageAllPlantingReturns);
      const { filter, pagination } = args || {};

      let newFilters = {
        ...filter,
        inspectorId: canViewAssignedPlantingReturns ? user_id : null,
        createdById: !canManageAllPlantingReturns ? user_id : null,
      };

      console.log("newFilters", newFilters);

      const results = await listPlantingReturns({
        filter: newFilters,
        pagination,
      });

      return results;
    },
    plantingReturn: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_view_planting_returns",
        "You dont have permissions to view planting returns"
      );
      return fetchReturnById(args.id);
    },
  },

  Mutation: {
    createPlantingReturn: async (parent, args, context) => {
      const connection = await db.getConnection();
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_create_planting_returns",
        "You dont have permissions to create planting returns"
      );

      const input = args.input || {};
      try {
        await connection.beginTransaction();
        
        const sr8_number = await generateSr8Number();
        const data = {
          sr8_number,
          created_by: context?.req?.user?.id || null,
          applicant_name: input.applicantName || null,
          grower_number: input.growerNumber || null,
          contact_phone: input.contactPhone || null,
          garden_number: input.gardenNumber || null,
          field_name: input.fieldName || null,
          district: input.location?.district || null,
          subcounty: input.location?.subcounty || null,
          parish: input.location?.parish || null,
          village: input.location?.village || null,
          gps_lat: input.location?.gpsLat ?? null,
          gps_lng: input.location?.gpsLng ?? null,
          crop_id: input.cropId || null,
          variety_id: input.varietyId || null,
          seed_class: input.seedClass || null,
          area_ha: input.areaHa ?? null,
          date_sown: input.dateSown || null,
          expected_harvest: input.expectedHarvest || null,
          seed_source: input.seedSource || null,
          seed_lot_code: input.seedLotCode || null,
          intended_merchant: input.intendedMerchant || null,
          seed_rate_per_ha: input.seedRatePerHa || null,
          // receipt: input.receipt || null,
        };

        const id = await saveData({
          table: "planting_returns",
          data,
          id: null,
          idColumn: "id",
          connection
        });

        let savedReceiptInfo = null;
        if (input.receipt) {
          try {
            savedReceiptInfo = await saveUpload({
              file: input.receipt,
              subdir: "form_attachments",
            });
          } catch (e) {
            // If upload fails, rollback and bubble up
            throw new GraphQLError(`Receipt upload failed: ${e.message}`);
          }
        }

        //save the receipt and subgrower file info
        if (savedReceiptInfo ) {
          try {
            // Update application_forms with receipt_id
            await saveData({
              table: "planting_returns",
              data: { receipt_id: savedReceiptInfo.filename},
              id: id,
              connection,
            });
          } catch (e) {
            // Non-fatal for the core form save; log but do not block
            console.error(
              "Failed to save form_attachments record or update receipt_id:",
              e.message
            );
          }
        }

        await connection.commit();

        const record = await fetchReturnById(id);
        return {
          success: true,
          message: "Planting return created successfully",
          record,
        };
      } catch (error) {
        throw handleSQLError(error, "Failed to create planting return");
      }
    },

    updatePlantingReturn: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_edit_planting_returns",
        "You dont have permissions to edit planting returns"
      );

      const { id, input } = args;
      try {
        const data = {};
        const map = {
          applicantName: "applicant_name",
          growerNumber: "grower_number",
          contactPhone: "contact_phone",
          gardenNumber: "garden_number",
          fieldName: "field_name",
          seedClass: "seed_class",
          cropId: "crop_id",
          varietyId: "variety_id",
          areaHa: "area_ha",
          dateSown: "date_sown",
          expectedHarvest: "expected_harvest",
          seedSource: "seed_source",
          seedLotCode: "seed_lot_code",
          intendedMerchant: "intended_merchant",
          seedRatePerHa: "seed_rate_per_ha",
          scheduledVisitDate: "scheduled_visit_date",
        };
        for (const k of Object.keys(map)) {
          if (Object.prototype.hasOwnProperty.call(input, k)) {
            data[map[k]] = input[k];
          }
        }
        if (input?.location) {
          const loc = input.location;
          if (Object.prototype.hasOwnProperty.call(loc, "district"))
            data.district = loc.district;
          if (Object.prototype.hasOwnProperty.call(loc, "subcounty"))
            data.subcounty = loc.subcounty;
          if (Object.prototype.hasOwnProperty.call(loc, "parish"))
            data.parish = loc.parish;
          if (Object.prototype.hasOwnProperty.call(loc, "village"))
            data.village = loc.village;
          if (Object.prototype.hasOwnProperty.call(loc, "gpsLat"))
            data.gps_lat = loc.gpsLat;
          if (Object.prototype.hasOwnProperty.call(loc, "gpsLng"))
            data.gps_lng = loc.gpsLng;
        }

        await saveData({ table: "planting_returns", data, id, idColumn: "id" });
        const record = await fetchReturnById(id);
        return {
          success: true,
          message: "Planting return updated successfully",
          record,
        };
      } catch (error) {
        throw handleSQLError(error, "Failed to update planting return");
      }
    },

    deletePlantingReturn: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_delete_planting_returns",
        "You dont have permissions to delete planting returns"
      );
      try {
        await db.execute("DELETE FROM planting_returns WHERE id = ?", [
          args.id,
        ]);
        return {
          success: true,
          message: "Planting return deleted successfully",
        };
      } catch (error) {
        throw handleSQLError(error, "Failed to delete planting return");
      }
    },

    assignPlantingReturnInspector: async (_parent, args, context) => {
      const userPermissions = context.req.user.permissions;

      checkPermission(
        userPermissions,
        "qa_can_assign_inspector",
        "You dont have permissions to assign inspector"
      );

      const { id, ids, inspectorId, scheduledVisitDate, comment } =
        args.input || {};

      // Require either id or ids (but not both)
      if (
        (!id && (!ids || ids.length === 0)) ||
        (id && ids && ids.length > 0)
      ) {
        throw new GraphQLError("Provide either id or ids (not both).");
      }

      const formIds = (ids && ids.length ? ids : [id]).map(String);

      // Fetch inspector
      const [inspector] = await getUsers({ id: inspectorId });
      if (!inspector)
        throw new GraphQLError("Inspector with the given id is not found!");

      // Fetch all forms (you can replace with a batch method if available)
      const forms = await Promise.all(
        formIds.map((fid) => fetchReturnById(fid))
      );
      forms.forEach((formDetails, idx) => {
        if (!formDetails) {
          throw new GraphQLError(
            `Form with the provided id (${formIds[idx]}) is not found!`
          );
        }
      });

      // Fetch form owners (parallelized)
      const ownerIds = forms.map((f) => f.user_id);
      const owners = await Promise.all(
        ownerIds.map((uid) => getUsers({ id: uid }).then((r) => r?.[0]))
      );
      owners.forEach((formOwner, idx) => {
        if (!formOwner) {
          throw new GraphQLError(
            `Form owner not found for form ${formIds[idx]}`
          );
        }
      });

      try {
        // Persist updates (transaction recommended if available)
        await Promise.all(
          formIds.map((fid) =>
            saveData({
              table: "planting_returns",
              data: {
                inspector_id: inspectorId,
                scheduled_visit_date: scheduledVisitDate || null,
                status: "assigned_inspector",
                status_comment: comment || null,
              },
              id: fid,
              idColumn: "id",
            })
          )
        );

        // Notify inspector (one email). Optionally include a list of returns.
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: inspector.email,
          subject: `Planting Return Inspector Assignment`,
          message: `Dear ${inspector.name}, You have been assigned as the inspector for ${formIds.length} planting return(s).`,
        });

        // Notify each form owner
        await Promise.all(
          owners.map((owner) =>
            sendEmail({
              from: '"STTS MAAIF" <tredumollc@gmail.com>',
              to: owner.email,
              subject: `Planting Return Inspector Assignment`,
              message: `Dear ${owner.name}, You have been assigned to ${inspector.name} as your inspector for your Planting Return request.`,
            })
          )
        );

        return {
          success: true,
          message: `Inspector assigned to ${formIds.length} planting return(s).`,
        };
      } catch (error) {
        throw handleSQLError(error, "Failed to assign inspector");
      }
    },
    approvePlantingReturn: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "qa_can_approve",
        "You dont have permissions to approve"
      );
      const { id, comment } = args.input;
      try {
        await saveData({
          table: "planting_returns",
          data: { status: "approved", status_comment: comment || null },
          id,
          idColumn: "id",
        });
        return { success: true, message: "Planting return approved" };
      } catch (error) {
        throw handleSQLError(error, "Failed to approve planting return");
      }
    },

    rejectPlantingReturn: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "qa_can_reject",
        "You dont have permissions to reject"
      );
      const { id, comment } = args.input;
      try {
        await saveData({
          table: "planting_returns",
          data: { status: "rejected", status_comment: comment || null },
          id,
          idColumn: "id",
        });
        return { success: true, message: "Planting return rejected" };
      } catch (error) {
        throw handleSQLError(error, "Failed to reject planting return");
      }
    },

    haltPlantingReturn: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "qa_can_halt",
        "You dont have permissions to halt"
      );
      const { id, comment } = args.input;
      try {
        await saveData({
          table: "planting_returns",
          data: { status: "halted", status_comment: comment || null },
          id,
          idColumn: "id",
        });
        return { success: true, message: "Planting return halted" };
      } catch (error) {
        throw handleSQLError(error, "Failed to halt planting return");
      }
    },

    createPlantingReturnUpload: async (parent, args, context) => {
      const connection = await db.getConnection();
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_create_planting_returns",
        "You dont have permissions to create planting returns"
      );

      console.log("args", args.input);

      const input = args.input || {};
      try {
        await connection.beginTransaction();
        const data = {
          amount_enclosed: input.amount_enclosed || null,
          registered_dealer: input.registered_dealer || null,
          user_id: context?.req?.user?.id || null,
        };

        const id = await saveData({
          table: "planting_returns_uploads",
          data,
          id: null,
          idColumn: "id",
          connection
        });

        // If a receipt was uploaded, save it and capture its public path
        let savedReceiptInfo = null;
        if (input.payment_receipt) {
          try {
            savedReceiptInfo = await saveUpload({
              file: input.payment_receipt,
              subdir: "form_attachments",
            });
          } catch (e) {
            // If upload fails, rollback and bubble up
            throw new GraphQLError(`Receipt upload failed: ${e.message}`);
          }
        }

        // If a receipt was uploaded, save it and capture its public path
        let savedSubgrowerInfo = null;
        let subgrowers = null;
        if (input.sub_grower_file) {
          try {
            savedSubgrowerInfo = await saveUpload({
              file: input.sub_grower_file,
              subdir: "Subgrower_files",
            });
            console.log("try-------------------------------------");
            //  subgrowers = importSubGrowers(null, { fileName: savedSubgrowerInfo.filename, returnId: id }, context);
            subgrowers = await importSubGrowers(savedSubgrowerInfo.filename);
            console.log("subgrowers", subgrowers);
            

            // for (const subgrower of subgrowers) {
            //   const sr8_number = await generateSr8Number();
            //   const subgrowerdata = {
            //       sr8_number,
            //       file_upload_id: id,
            //       created_by: context?.req?.user?.id || null,
            //       applicant_name: subgrower.name || null,
            //       contact_phone: subgrower.phone_number || null,
            //       field_name: subgrower.field_name || null,
            //       gps_lat: subgrower.gps_latitude || null,
            //       gps_lng: subgrower.gps_longitude || null,
            //       district: subgrower.district || null,
            //       subcounty: subgrower.subcounty || null,
            //       parish: subgrower.location?.parish || null,
            //       village: subgrower.village || null,
            //       date_sown: subgrower.planting_date || null,
            //       expected_harvest: subgrower.planting_date || null,
            //       seed_source: subgrower.source_of_seed || null,
            //       seed_lot_code: subgrower.lot_number || null,
            //       seed_class: subgrower.seed_class || null,
            //       area_ha: subgrower.size ?? null,
            //       crop_id: subgrower.crop || null,
            //       variety_id: subgrower.variety || null,
            //       intended_merchant: input.registered_dealer || null,
            //       seed_rate_per_ha: input.amount_enclosed || null,
            //       grower_number: subgrower.growerNumber || null,
            //       garden_number: subgrower.gardenNumber || null,
            //       receipt_id: savedReceiptInfo.filename || null,
            //     };
            //   await saveData({
            //     table: "planting_returns",
            //     data: subgrowerdata,
            //     id: null,
            //     idColumn: "id",
            //     connection
            //   });
            // }

            const chunkSize = 10; // insert 10 at a time
            for (let i = 0; i < subgrowers.length; i += chunkSize) {
              const chunk = subgrowers.slice(i, i + chunkSize);
              await Promise.all(chunk.map(async (subgrower) => {
                const sr8_number = await generateSr8Number();
                const subgrowerdata = {
                  sr8_number,
                  file_upload_id: id,
                  created_by: context?.req?.user?.id || null,
                  applicant_name: subgrower.name || null,
                  contact_phone: subgrower.phone_number || null,
                  field_name: subgrower.field_name || null,
                  gps_lat: subgrower.gps_latitude || null,
                  gps_lng: subgrower.gps_longitude || null,
                  district: subgrower.district || null,
                  subcounty: subgrower.subcounty || null,
                  parish: subgrower.location?.parish || null,
                  village: subgrower.village || null,
                  date_sown: subgrower.planting_date || null,
                  expected_harvest: subgrower.planting_date || null,
                  seed_source: subgrower.source_of_seed || null,
                  seed_lot_code: subgrower.lot_number || null,
                  seed_class: subgrower.seed_class || null,
                  area_ha: subgrower.size ?? null,
                  crop_id: subgrower.crop || null,
                  variety_id: subgrower.variety || null,
                  intended_merchant: input.registered_dealer || null,
                  seed_rate_per_ha: input.amount_enclosed || null,
                  grower_number: subgrower.growerNumber || null,
                  garden_number: subgrower.gardenNumber || null,
                  receipt_id: savedReceiptInfo.filename || null,
                };
                return saveData({
                  table: "planting_returns",
                  data: subgrowerdata,
                  id: null,
                  idColumn: "id",
                  connection
                });
              }));
            }



          } catch (e) {
            // If upload fails, rollback and bubble up
            throw new GraphQLError(`Receipt upload failed: ${e.message}`);
          }
        }

        //save the receipt and subgrower file info
        if (savedReceiptInfo || savedSubgrowerInfo) {
          try {
            // Update application_forms with receipt_id
            await saveData({
              table: "planting_returns_uploads",
              data: { payment_receipt: savedReceiptInfo.filename, sub_grower_file: savedSubgrowerInfo ? savedSubgrowerInfo.filename : null },
              id: id,
              connection,
            });
          } catch (e) {
            // Non-fatal for the core form save; log but do not block
            console.error(
              "Failed to save form_attachments record or update receipt_id:",
              e.message
            );
          }
        }

        await connection.commit();
        return {
          success: true,
        }
        
      } catch (error) {
        throw handleSQLError(error, "Failed to create planting return upload");
      }
    }

  },
};

export default plantingReturnsResolvers;
