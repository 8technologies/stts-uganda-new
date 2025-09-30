import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import saveData from "../../utils/db/saveData.js";
import checkPermission from "../../helpers/checkPermission.js";

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
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
    gpsLng: row.gps_lng != null ? Number(row.gps_lng) : null
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
  createdBy: row.created_by ? { id: String(row.created_by) } : null
});

const handleSQLError = (error, fallback = "Database error") => {
  return new GraphQLError(error?.message || fallback);
};

const fetchReturnById = async (id, conn = db) => {
  const [rows] = await conn.execute("SELECT * FROM planting_returns WHERE id = ?", [id]);
  if (!rows.length) return null;
  return mapReturn(rows[0]);
};

export const listPlantingReturns = async ({ filter = {}, pagination = {} }) => {
  const page = Math.max(1, Number(pagination.page || 1));
  const size = Math.max(1, Math.min(100, Number(pagination.size || 20)));
  const offset = (page - 1) * size;

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
  if (filter.createdById) {
    where += " AND created_by = ?";
    values.push(filter.createdById);
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

// Light user/crop variety lookups
const fetchUserById = async (id) => {
  if (!id) return null;
  try {
    const [rows] = await db.execute(
      "SELECT id, name, email, image FROM users WHERE id = ? LIMIT 1",
      [id]
    );
    if (!rows.length) return null;
    const u = rows[0];
    return { id: String(u.id), name: u.name, email: u.email, image: u.image };
  } catch (e) {
    return null;
  }
};

const fetchCropById = async (id) => {
  if (!id) return null;
  try {
    const [rows] = await db.execute("SELECT id, name FROM crops WHERE id = ?", [id]);
    if (!rows.length) return null;
    return { id: String(rows[0].id), name: rows[0].name };
  } catch (e) {
    return null;
  }
};

const fetchVarietyById = async (id) => {
  if (!id) return null;
  try {
    // Adjust table name if different in your schema
    const [rows] = await db.execute(
      "SELECT id, name FROM crop_varieties WHERE id = ?",
      [id]
    );
    if (!rows.length) return null;
    return { id: String(rows[0].id), name: rows[0].name };
  } catch (e) {
    return null;
  }
};

// Generate SR8 number like SR8-YYYY-0001 (naive, not concurrency-safe)
const generateSr8Number = async () => {
  const year = new Date().getFullYear();
  const [[row]] = await db.execute(
    "SELECT COUNT(*) AS c FROM planting_returns WHERE YEAR(created_at) = ?",
    [year]
  );
  const next = Number(row?.c || 0) + 1;
  return `SR8-${year}-${String(next).padStart(4, "0")}`;
};

// ---------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------
const plantingReturnsResolvers = {
  DateTime: DateTimeResolver,

  PlantingReturn: {
    inspector: async (parent) => fetchUserById(parent?.inspector?.id || parent?.inspector_id),
    createdBy: async (parent) => fetchUserById(parent?.createdBy?.id || parent?.created_by),
    crop: async (parent) => fetchCropById(parent?.cropId || parent?.crop_id),
    variety: async (parent) => fetchVarietyById(parent?.varietyId || parent?.variety_id)
  },

  Query: {
    plantingReturns: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_view_planting_returns",
        "You dont have permissions to view planting returns"
      );
      const { filter, pagination } = args || {};
      return listPlantingReturns({ filter, pagination });
    },
    plantingReturn: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_view_planting_returns",
        "You dont have permissions to view planting returns"
      );
      return fetchReturnById(args.id);
    }
  },

  Mutation: {
    createPlantingReturn: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_manage_planting_returns",
        "You dont have permissions to create planting returns"
      );

      const input = args.input || {};
      try {
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
          seed_rate_per_ha: input.seedRatePerHa || null
        };

        const id = await saveData({ table: "planting_returns", data, id: null, idColumn: "id" });
        const record = await fetchReturnById(id);
        return { success: true, message: "Planting return created successfully", record };
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
          scheduledVisitDate: "scheduled_visit_date"
        };
        for (const k of Object.keys(map)) {
          if (Object.prototype.hasOwnProperty.call(input, k)) {
            data[map[k]] = input[k];
          }
        }
        if (input?.location) {
          const loc = input.location;
          if (Object.prototype.hasOwnProperty.call(loc, "district")) data.district = loc.district;
          if (Object.prototype.hasOwnProperty.call(loc, "subcounty")) data.subcounty = loc.subcounty;
          if (Object.prototype.hasOwnProperty.call(loc, "parish")) data.parish = loc.parish;
          if (Object.prototype.hasOwnProperty.call(loc, "village")) data.village = loc.village;
          if (Object.prototype.hasOwnProperty.call(loc, "gpsLat")) data.gps_lat = loc.gpsLat;
          if (Object.prototype.hasOwnProperty.call(loc, "gpsLng")) data.gps_lng = loc.gpsLng;
        }

        await saveData({ table: "planting_returns", data, id, idColumn: "id" });
        const record = await fetchReturnById(id);
        return { success: true, message: "Planting return updated successfully", record };
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
        await db.execute("DELETE FROM planting_returns WHERE id = ?", [args.id]);
        return { success: true, message: "Planting return deleted successfully" };
      } catch (error) {
        throw handleSQLError(error, "Failed to delete planting return");
      }
    },

    assignPlantingReturnInspector: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "qa_can_assign_inspector",
        "You dont have permissions to assign inspector"
      );
      const { id, inspectorId, scheduledVisitDate, comment } = args.input;
      try {
        const data = {
          inspector_id: inspectorId,
          scheduled_visit_date: scheduledVisitDate || null,
          status: "assigned",
          status_comment: comment || null
        };
        await saveData({ table: "planting_returns", data, id, idColumn: "id" });
        return { success: true, message: "Inspector assigned" };
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
          idColumn: "id"
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
          idColumn: "id"
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
          idColumn: "id"
        });
        return { success: true, message: "Planting return halted" };
      } catch (error) {
        throw handleSQLError(error, "Failed to halt planting return");
      }
    }
  }
};

export default plantingReturnsResolvers;

