import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import checkPermission from "../../helpers/checkPermission.js";
import saveData from "../../utils/db/saveData.js";

const mapCrop = (row) => ({
  id: String(row.id),
  name: row.name,
  isQDS: !!row.is_qds,
  daysBeforeSubmission: row.days_before_submission,
  units: row.units,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapVariety = (row) => ({
  id: String(row.id),
  cropId: String(row.crop_id),
  name: row.name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapInspection = (row) => ({
  id: String(row.id),
  cropId: String(row.crop_id),
  stageName: row.stage_name,
  order: row.order_no,
  required: !!row.is_required,
  periodAfterPlantingDays: row.period_after_planting_days,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const fetchVarieties = async (cropId, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT * FROM crop_varieties WHERE crop_id = ? ORDER BY name ASC",
    [cropId]
  );
  return rows.map(mapVariety);
};

const fetchInspections = async (cropId, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT * FROM crop_inspection_types WHERE crop_id = ? ORDER BY order_no ASC",
    [cropId]
  );
  return rows.map(mapInspection);
};

export const fetchCropById = async (id, conn = db) => {
  const [rows] = await conn.execute("SELECT * FROM crops WHERE id = ?", [id]);
  if (!rows.length) return null;
  return mapCrop(rows[0]);
};

export const fetchVarietyById = async (id, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT * FROM crop_varieties WHERE id = ?",
    [id]
  );
  if (!rows.length) return null;
  return mapVariety(rows[0]);
};

const handleSQLError = (error, fallback = "Database error") => {
  if (error?.code === "ER_DUP_ENTRY") {
    return new GraphQLError("Duplicate value. Please use a unique name/order.");
  }
  return new GraphQLError(error?.message || fallback);
};

/* const syncCropVarieties = async ({ cropId, varieties, conn }) => {
  if (!Array.isArray(varieties)) return;

  const [existingRows] = await conn.execute(
    "SELECT id, name FROM crop_varieties WHERE crop_id = ? ORDER BY id ASC",
    [cropId]
  );

  const normalizedVarieties = varieties
    .map((item) => ({
      id: item?.id != null ? String(item.id) : null,
      name: item?.name?.trim(),
    }))
    .filter((item) => Boolean(item.name));

  const hasIds = normalizedVarieties.some((item) => item.id);

  if (!hasIds) {
    const normalizedNames = normalizedVarieties.map((item) => item.name);
    const overlap = Math.min(existingRows.length, normalizedNames.length);

    for (let index = 0; index < overlap; index += 1) {
      if (existingRows[index].name !== normalizedNames[index]) {
        await saveData({
          table: "crop_varieties",
          id: existingRows[index].id,
          data: { name: normalizedNames[index] },
          connection: conn,
        });
      }
    }

    for (let index = overlap; index < normalizedNames.length; index += 1) {
      await saveData({
        table: "crop_varieties",
        data: { crop_id: cropId, name: normalizedNames[index] },
        connection: conn,
      });
    }

    return;
  }

  const existingById = new Map(existingRows.map((row) => [String(row.id), row]));

  for (const item of normalizedVarieties) {
    if (item.id) {
      const existing = existingById.get(item.id);
      if (!existing) {
        throw new GraphQLError("One or more varieties are invalid for this crop.");
      }

      if (existing.name !== item.name) {
        await saveData({
          table: "crop_varieties",
          id: existing.id,
          data: { name: item.name },
          connection: conn,
        });
      }
      continue;
    }

    await saveData({
      table: "crop_varieties",
      data: { crop_id: cropId, name: item.name },
      connection: conn,
    });
  }
}; */

const syncCropVarieties = async ({ cropId, varieties, conn }) => {
  if (!Array.isArray(varieties)) return;

  console.log("Syncing crop varieties for cropId:", varieties);
  if (varieties && Array.isArray(varieties)) {
    for (const variety of varieties) {
      const varietyData = {
        crop_id: cropId,
        name: variety.name,
      };

      await saveData({
        table: "crop_varieties",
        data: varietyData,
        id: variety.id || null,
        idColumn: "id",
        connection: conn,
      });
    }
  }
};


export const listCrops = async ({ filter = {}, pagination } = {}) => {
  const { search, isQDS } = filter;
  const hasPagination = pagination != null;

  const values = [];
  let where = "WHERE 1=1";
  if (search) {
    where += " AND name LIKE ?";
    values.push(`%${search}%`);
  }
  if (typeof isQDS === "boolean") {
    where += " AND is_qds = ?";
    values.push(isQDS ? 1 : 0);
  }

  const [[countRow]] = await db.execute(
    `SELECT COUNT(*) AS total FROM crops ${where}`,
    values
  );
  const total = Number(countRow.total || 0);

  let rows;
  if (hasPagination) {
    const page = Math.max(1, Number(pagination.page || 1));
    const size = Math.max(1, Math.min(100, Number(pagination.size || 20)));
    const offset = (page - 1) * size;
    [rows] = await db.execute(
      `SELECT * FROM crops ${where} ORDER BY id desc LIMIT ? OFFSET ?`,
      [...values, size, offset]
    );
  } else {
    [rows] = await db.execute(`SELECT * FROM crops ${where} ORDER BY id desc`, values);
  }

  return { items: rows.map(mapCrop), total };
};

const cropsResolvers = {
  DateTime: DateTimeResolver,

  Crop: {
    varieties: async (parent) => fetchVarieties(parent.id),
    inspectionTypes: async (parent) => fetchInspections(parent.id),
  },

  Query: {
    crops: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      // checkPermission(
      //   userPermissions,
      //   "can_view_crops",
      //   "You dont have permissions to view crops"
      // );
      const { filter, pagination } = args || {};
      return listCrops({ filter, pagination });
    },
    crop: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      // checkPermission(
      //   userPermissions,
      //   "can_view_crops",
      //   "You dont have permissions to view crops"
      // );
      const row = await fetchCropById(args.id);
      return row;
    },
  },

  Mutation: {
    createCrop: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_manage_crops",
        "You dont have permissions to create crops"
      );

      const input = args.input;
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const cropId = await saveData({
          table: "crops",
          data: {
            name: input.name,
            is_qds: input.isQDS ? 1 : 0,
            days_before_submission: input.daysBeforeSubmission,
            units: input.units,
          },
          connection: conn,
        });

        await syncCropVarieties({
          cropId,
          varieties: input.varieties,
          conn,
        });

        if (
          Array.isArray(input.inspectionTypes) &&
          input.inspectionTypes.length
        ) {
          const placeholders = input.inspectionTypes
            .map(() => "(?, ?, ?, ?, ?)")
            .join(", ");
          const values = input.inspectionTypes.flatMap((i) => [
            cropId,
            i.stageName,
            i.order,
            i.required ? 1 : 0,
            i.periodAfterPlantingDays,
          ]);
          await conn.execute(
            `INSERT INTO crop_inspection_types (crop_id, stage_name, order_no, is_required, period_after_planting_days) VALUES ${placeholders}`,
            values
          );
        }

        await conn.commit();
        const crop = await fetchCropById(cropId);
        return { success: true, message: "Crop created successfully", crop };
      } catch (error) {
        await conn.rollback();
        throw handleSQLError(error, "Failed to create crop");
      } finally {
        conn.release();
      }
    },

    updateCrop: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_edit_crops",
        "You dont have permissions to edit crops"
      );
      const { id, input } = args;
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const cropData = {};
        if (Object.prototype.hasOwnProperty.call(input, "name")) {
          cropData.name = input.name;
        }
        if (Object.prototype.hasOwnProperty.call(input, "isQDS")) {
          cropData.is_qds = input.isQDS ? 1 : 0;
        }
        if (
          Object.prototype.hasOwnProperty.call(input, "daysBeforeSubmission")
        ) {
          cropData.days_before_submission = input.daysBeforeSubmission;
        }
        if (Object.prototype.hasOwnProperty.call(input, "units")) {
          cropData.units = input.units;
        }

        if (Object.keys(cropData).length) {
          await saveData({
            table: "crops",
            id,
            data: cropData,
            connection: conn,
          });
        }

        if (input.replaceChildren !== false) {
          if (Array.isArray(input.varieties)) {
            console.log("Syncing crop varieties for cropId:", input.varieties);
            await syncCropVarieties({ cropId: id, varieties: input.varieties, conn });
          }
          if (Array.isArray(input.inspectionTypes)) {
            await conn.execute(
              "DELETE FROM crop_inspection_types WHERE crop_id = ?",
              [id]
            );
            if (input.inspectionTypes.length) {
              const placeholders = input.inspectionTypes
                .map(() => "(?, ?, ?, ?, ?)")
                .join(", ");
              const values = input.inspectionTypes.flatMap((i) => [
                id,
                i.stageName,
                i.order,
                i.required ? 1 : 0,
                i.periodAfterPlantingDays,
              ]);
              await conn.execute(
                `INSERT INTO crop_inspection_types (crop_id, stage_name, order_no, is_required, period_after_planting_days) VALUES ${placeholders}`,
                values
              );
            }
          }
        }

        await conn.commit();
        const crop = await fetchCropById(id);
        return { success: true, message: "Crop updated successfully", crop };
      } catch (error) {
        await conn.rollback();
        throw handleSQLError(error, "Failed to update crop");
      } finally {
        conn.release();
      }
    },

    deleteCrop: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_delete_crops",
        "You dont have permissions to delete crops"
      );
      try {
        await db.execute("DELETE FROM crops WHERE id = ?", [args.id]);
        return { success: true, message: "Crop deleted successfully" };
      } catch (error) {
        throw handleSQLError(error, "Failed to delete crop");
      }
    },

    addCropVariety: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_edit_crops",
        "You dont have permissions to edit crops"
      );
      const { cropId, input } = args;
      try {
        await db.execute(
          "INSERT INTO crop_varieties (crop_id, name) VALUES (?, ?)",
          [cropId, input.name]
        );
        const crop = await fetchCropById(cropId);
        return { success: true, message: "Variety added", crop };
      } catch (error) {
        throw handleSQLError(error, "Failed to add variety");
      }
    },

    updateCropVariety: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_edit_crops",
        "You dont have permissions to edit crops"
      );
      const { id, input } = args;
      try {
        const [[row]] = await db.execute(
          "SELECT crop_id FROM crop_varieties WHERE id = ?",
          [id]
        );
        if (!row) throw new GraphQLError("Variety not found");
        await db.execute("UPDATE crop_varieties SET name = ? WHERE id = ?", [
          input.name,
          id,
        ]);
        const crop = await fetchCropById(row.crop_id);
        return { success: true, message: "Variety updated", crop };
      } catch (error) {
        throw handleSQLError(error, "Failed to update variety");
      }
    },

    deleteCropVariety: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_edit_crops",
        "You dont have permissions to edit crops"
      );
      const { id } = args;
      try {
        const [[row]] = await db.execute(
          "SELECT crop_id FROM crop_varieties WHERE id = ?",
          [id]
        );
        if (!row) throw new GraphQLError("Variety not found");
        await db.execute("DELETE FROM crop_varieties WHERE id = ?", [id]);
        const crop = await fetchCropById(row.crop_id);
        return { success: true, message: "Variety deleted", crop };
      } catch (error) {
        throw handleSQLError(error, "Failed to delete variety");
      }
    },

    addCropInspectionType: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_edit_crops",
        "You dont have permissions to edit crops"
      );
      const { cropId, input } = args;
      try {
        await db.execute(
          "INSERT INTO crop_inspection_types (crop_id, stage_name, order_no, is_required, period_after_planting_days) VALUES (?, ?, ?, ?, ?)",
          [
            cropId,
            input.stageName,
            input.order,
            input.required ? 1 : 0,
            input.periodAfterPlantingDays,
          ]
        );
        const crop = await fetchCropById(cropId);
        return { success: true, message: "Inspection type added", crop };
      } catch (error) {
        throw handleSQLError(error, "Failed to add inspection type");
      }
    },

    updateCropInspectionType: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_edit_crops",
        "You dont have permissions to edit crops"
      );
      const { id, input } = args;
      try {
        const [[row]] = await db.execute(
          "SELECT crop_id FROM crop_inspection_types WHERE id = ?",
          [id]
        );
        if (!row) throw new GraphQLError("Inspection type not found");
        await db.execute(
          "UPDATE crop_inspection_types SET stage_name = ?, order_no = ?, is_required = ?, period_after_planting_days = ? WHERE id = ?",
          [
            input.stageName,
            input.order,
            input.required ? 1 : 0,
            input.periodAfterPlantingDays,
            id,
          ]
        );
        const crop = await fetchCropById(row.crop_id);
        return { success: true, message: "Inspection type updated", crop };
      } catch (error) {
        throw handleSQLError(error, "Failed to update inspection type");
      }
    },

    deleteCropInspectionType: async (parent, args, context) => {
      const userPermissions = context.req.user.permissions;
      checkPermission(
        userPermissions,
        "can_edit_crops",
        "You dont have permissions to edit crops"
      );
      const { id } = args;
      try {
        const [[row]] = await db.execute(
          "SELECT crop_id FROM crop_inspection_types WHERE id = ?",
          [id]
        );
        if (!row) throw new GraphQLError("Inspection type not found");
        await db.execute("DELETE FROM crop_inspection_types WHERE id = ?", [
          id,
        ]);
        const crop = await fetchCropById(row.crop_id);
        return { success: true, message: "Inspection type deleted", crop };
      } catch (error) {
        throw handleSQLError(error, "Failed to delete inspection type");
      }
    },
  },
};

export default cropsResolvers;
