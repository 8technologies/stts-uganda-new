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
  quantityPlanted: row.quantity_planted != null ? Number(row.quantity_planted) : null,
  expectedHarvest: row.expected_harvest,
  seedSource: row.seed_source,
  seedLotCode: row.seed_lot_code,
  intendedMerchant: row.intended_merchant,

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

const applicantNameSearchField = {
  label: "Applicant name",
  clauses: [
    "applicant_name LIKE ?",
    `EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = planting_returns.created_by
        AND (u.name LIKE ? OR u.email LIKE ? OR u.company_initials LIKE ?)
    )`,
  ],
};

const visiblePlantingReturnSearchFields = [
  {
    label: "SR8 number",
    clauses: ["sr8_number LIKE ?"],
  },
  {
    label: "Field/Garden",
    clauses: ["field_name LIKE ?", "garden_number LIKE ?"],
  },
  {
    label: "Inspector",
    clauses: [
      "inspector_id LIKE ?",
      `EXISTS (
        SELECT 1
        FROM users u
        WHERE u.id = planting_returns.inspector_id
          AND (u.name LIKE ? OR u.email LIKE ? OR u.company_initials LIKE ?)
      )`,
    ],
  },
  {
    label: "Crop",
    clauses: [
      "CAST(crop_id AS CHAR) LIKE ?",
      `EXISTS (
        SELECT 1
        FROM crops c
        WHERE c.id = planting_returns.crop_id
          AND c.name LIKE ?
      )`,
    ],
  },
  {
    label: "Variety",
    clauses: [
      "CAST(variety_id AS CHAR) LIKE ?",
      `EXISTS (
        SELECT 1
        FROM crop_varieties cv
        WHERE cv.id = planting_returns.variety_id
          AND cv.name LIKE ?
      )`,
    ],
  },
];

const placeholderCount = (sql) => (sql.match(/\?/g) || []).length;

const applyPlantingReturnSearch = (
  where,
  values,
  search,
  { includeApplicantName = true } = {}
) => {
  if (!search || !String(search).trim()) return where;

  const searchableFields = includeApplicantName
    ? [applicantNameSearchField, ...visiblePlantingReturnSearchFields]
    : visiblePlantingReturnSearchFields;
  const clauses = searchableFields.flatMap((field) => field.clauses);
  const term = `%${String(search).trim()}%`;

  where += ` AND (${clauses.join(" OR ")})`;
  values.push(
    ...clauses.flatMap((clause) =>
      Array(placeholderCount(clause)).fill(term)
    )
  );

  return where;
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

  where = applyPlantingReturnSearch(where, values, filter.search, {
    includeApplicantName: filter.includeApplicantNameSearch !== false,
  });

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
        includeApplicantNameSearch: canManageAllPlantingReturns,
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
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_create_planting_returns",
        "You dont have permissions to create planting returns"
      );

      const input = args.input || {};
      const connection = await db.getConnection();
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
          quantity_planted: input.quantityPlanted ?? null,
          expected_harvest: input.expectedHarvest || null,
          seed_source: input.seedSource || null,
          seed_lot_code: input.seedLotCode || null,
          intended_merchant: input.intendedMerchant || null,
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
        try { await connection.rollback(); } catch (_) {}
        throw handleSQLError(error, "Failed to create planting return");
      } finally {
        connection.release();
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
         try {
            // Notify inspector (one email). Optionally include a list of returns.
            sendEmail({
              from: '"STTS MAAIF" <info@seedtracking.net>',
              to: inspector.email,
              subject: `Planting Return Inspector Assignment`,
              message: `Dear ${inspector.name}, You have been assigned as the inspector for ${formIds.length} planting return(s).`,
            });

            // Notify each form owner
        await Promise.all(
          owners.map((owner) =>
            sendEmail({
              from: '"STTS MAAIF" <info@seedtracking.net>',
              to: owner.email,
              subject: `Planting Return Inspector Assignment`,
              message: `Dear ${owner.name}, You have been assigned to ${inspector.name} as your inspector for your Planting Return request.`,
            })
          )
        );

         } catch (e) {
            console.log("Failed to save assignment comment, proceeding anyway:", e.message);
         }
        
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
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_create_planting_returns",
        "You dont have permissions to create planting returns"
      );

      const input = args.input || {};
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        // ── 1. Create the upload tracking record ────────────────────────────
        const uploadId = await saveData({
          table: "planting_returns_uploads",
          data: {
            amount_enclosed: input.amount_enclosed || null,
            registered_dealer: input.registered_dealer || null,
            user_id: context?.req?.user?.id || null,
          },
          id: null,
          idColumn: "id",
          connection,
        });

        // ── 2. Save payment receipt (optional) ──────────────────────────────
        let receiptFilename = null;
        if (input.payment_receipt) {
          try {
            const saved = await saveUpload({
              file: input.payment_receipt,
              subdir: "form_attachments",
            });
            receiptFilename = saved.filename;
          } catch (e) {
            throw new GraphQLError(`Receipt upload failed: ${e.message}`);
          }
        }

        // ── 3. Save sub-growers file and parse it ───────────────────────────
        let subgrowerFilename = null;
        let parseResult = { rows: [], headerErrors: [] };

        if (input.sub_grower_file) {
          const saved = await saveUpload({
            file: input.sub_grower_file,
            subdir: "Subgrower_files",
          });
          subgrowerFilename = saved.filename;

          // Server-side independent parse & validate (does not rely on client)
          parseResult = await importSubGrowers(subgrowerFilename);

          if (parseResult.headerErrors && parseResult.headerErrors.length > 0) {
            await connection.rollback();
            return {
              success: false,
              message: parseResult.headerErrorMessage || `Missing required columns: ${parseResult.headerErrors.join(', ')}`,
              totalRecords: 0,
              totalImported: 0,
              totalFailed: 0,
              results: [],
            };
          }
        }

        // ── 4. Persist upload file references ───────────────────────────────
        await saveData({
          table: "planting_returns_uploads",
          data: {
            payment_receipt: receiptFilename || null,
            sub_grower_file: subgrowerFilename || null,
          },
          id: uploadId,
          connection,
        });

        // ── 5. Per-row insert (batches of 100) ──────────────────────────────
        const rows = parseResult.rows ?? [];
        const createdById = context?.req?.user?.id || null;

        const normalizeFieldName = (value) => String(value || "").trim().toLowerCase();
        const toYmd = (year, month, day) => {
          const y = String(year).padStart(4, "0");
          const m = String(month).padStart(2, "0");
          const d = String(day).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };
        const normalizeDateOnly = (value) => {
          if (value == null || value === "") return "";

          // Excel serial date values (common from spreadsheets)
          if (typeof value === "number" && Number.isFinite(value)) {
            const parsed = XLSX.SSF.parse_date_code(value);
            if (parsed?.y && parsed?.m && parsed?.d) {
              return toYmd(parsed.y, parsed.m, parsed.d);
            }
          }

          // Keep calendar date in local time to avoid UTC day shifts.
          if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return toYmd(value.getFullYear(), value.getMonth() + 1, value.getDate());
          }

          const raw = String(value).trim();
          if (!raw) return "";

          // Already in SQL-like format (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss)
          const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (ymdMatch) return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;

          // Handle slash or dot dates like 10/06/2026 or 10.06.2026.
          const delimited = raw.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/);
          if (delimited) {
            const a = Number(delimited[1]);
            const b = Number(delimited[2]);
            const y = Number(delimited[3]);
            let day = a;
            let month = b;

            // If clearly month/day, flip. If ambiguous, default to day/month.
            if (a <= 12 && b > 12) {
              month = a;
              day = b;
            }

            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              return toYmd(y, month, day);
            }
          }

          const parsed = new Date(raw);
          if (!Number.isNaN(parsed.getTime())) {
            return toYmd(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
          }

          return raw.slice(0, 10);
        };
        const buildRowKey = ({ fieldName, dateSown, createdBy }) =>
          `${createdBy || ""}::${normalizeFieldName(fieldName)}::${normalizeDateOnly(dateSown)}`;

        // Load current user's existing rows once to prevent re-importing duplicates.
        const [existingRows] = await connection.execute(
          `SELECT id,
                  LOWER(TRIM(field_name)) AS field_name_key,
                  DATE_FORMAT(date_sown, '%Y-%m-%d') AS date_sown_key,
                  created_by
           FROM planting_returns
           WHERE created_by = ?`,
          [createdById],
        );
        const existingRowIdByKey = new Map();
        const existingRowKeys = new Set(
          (existingRows || []).map((r) => {
            const key = buildRowKey({
              fieldName: r.field_name_key,
              dateSown: r.date_sown_key,
              createdBy: r.created_by,
            });
            existingRowIdByKey.set(key, r.id);
            return key;
          }),
        );

        const buildMutableRowData = (row) => ({
          file_upload_id: uploadId,
          applicant_name: row.name || null,
          contact_phone: row.phone_number || null,
          gps_lat: row.gps_latitude ?? null,
          gps_lng: row.gps_longitude ?? null,
          district: row.district || null,
          subcounty: row.subcounty || null,
          village: row.village || null,
          expected_harvest: row.expected_yield || null,
          quantity_planted: row.quantity_planted ?? null,
          seed_source: row.source_of_seed || null,
          seed_lot_code: row.lot_number || null,
          seed_class: row.seed_class || null,
          area_ha: row.size ?? null,
          crop_id: row.crop_id || null,
          variety_id: row.variety_id || null,
          intended_merchant: input.registered_dealer || null,
          receipt_id: receiptFilename || null,
        });

        const buildInsertRowData = (row, sr8_number) => ({
          ...buildMutableRowData(row),
          sr8_number,
          created_by: createdById,
          field_name: row.field_name || null,
          date_sown: normalizeDateOnly(row.planting_date) || null,
        });

        const totalRecords = rows.length;
        let totalImported = 0;
        let totalFailed = 0;
        const results = [];

        const BATCH_SIZE = 100;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map(async (row) => {
              // Skip rows that already have server-side validation errors
              if (row._errors && row._errors.length > 0) {
                totalFailed++;
                results.push({
                  row: row._rowNum,
                  success: false,
                  message: row._errors.join('; '),
                });
                return;
              }

              const rowKey = buildRowKey({
                fieldName: row.field_name,
                dateSown: row.planting_date,
                createdBy: createdById,
              });
              // If this key exists in DB, update mutable columns only.
              if (existingRowKeys.has(rowKey)) {
                const existingId = existingRowIdByKey.get(rowKey);
                if (!existingId) {
                  totalFailed++;
                  results.push({
                    row: row._rowNum,
                    success: false,
                    message: "Duplicate row in current upload skipped",
                  });
                  return;
                }

                try {
                  await saveData({
                    table: "planting_returns",
                    data: buildMutableRowData(row),
                    id: existingId,
                    idColumn: "id",
                    connection,
                  });
                  totalImported++;
                  results.push({
                    row: row._rowNum,
                    success: true,
                    message: "Existing row updated (field_name and date_sown kept unchanged)",
                  });
                } catch (e) {
                  totalFailed++;
                  results.push({
                    row: row._rowNum,
                    success: false,
                    message: e?.message || "Update failed",
                  });
                }
                return;
              }

              // Reserve key before async work to avoid race conditions in Promise.all.
              existingRowKeys.add(rowKey);

              try {
                const sr8_number = await generateSr8Number();
                const insertedId = await saveData({
                  table: "planting_returns",
                  data: buildInsertRowData(row, sr8_number),
                  id: null,
                  idColumn: "id",
                  connection,
                });
                existingRowIdByKey.set(rowKey, insertedId);
                totalImported++;
                results.push({ row: row._rowNum, success: true, message: null });
              } catch (e) {
                // Release reservation so only successfully inserted keys remain locked.
                existingRowKeys.delete(rowKey);
                totalFailed++;
                results.push({
                  row: row._rowNum,
                  success: false,
                  message: e?.message || "Insert failed",
                });
              }
            })
          );
        }

        // ── 6. Update upload record with final totals ────────────────────────
        await saveData({
          table: "planting_returns_uploads",
          data: { total_records: totalRecords, total_imported: totalImported, total_failed: totalFailed },
          id: uploadId,
          connection,
        }).catch((e) => console.warn("Could not save totals to upload record:", e.message));

        await connection.commit();

        return {
          success: true,
          message: `Import complete: ${totalImported} of ${totalRecords} records imported.`,
          totalRecords,
          totalImported,
          totalFailed,
          results,
        };

      } catch (error) {
        try { await connection.rollback(); } catch (_) {}
        console.error('[createPlantingReturnUpload] error:', error);
        throw handleSQLError(error, "Failed to create planting return upload");
      } finally {
        connection.release();
      }
    }

  },
};

export default plantingReturnsResolvers;
