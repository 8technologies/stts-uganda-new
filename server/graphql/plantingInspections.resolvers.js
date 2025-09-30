import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import saveData from "../../utils/db/saveData.js";
import checkPermission from "../../helpers/checkPermission.js";

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
const handleSQLError = (error, fallback = "Database error") => {
  return new GraphQLError(error?.message || fallback);
};

const parseJSON = (text) => {
  if (!text) return {};
  try {
    return typeof text === "string" ? JSON.parse(text) : text;
  } catch {
    return {};
  }
};

const mapStageRow = (row) => {
  const meta = parseJSON(row.report);
  const decision = meta?.decision || null;
  const status = decision || "pending"; // UI expects: pending | provisional | accepted | rejected | skipped
  const submittedAt = decision ? row.updated_at : null;
  return {
    id: String(row.id),
    plantingReturnId: String(row.planting_return_id),
    inspectionTypeId: meta?.inspectionTypeId != null ? String(meta.inspectionTypeId) : null,
    stageName: meta?.stageName || null,
    order: meta?.order != null ? Number(meta.order) : null,
    required: Boolean(meta?.required ?? false),
    status,
    dueDate: row.visit_date || null,
    submittedAt,
    reportUrl: meta?.reportUrl || null,
    comment: meta?.comment || null,
    inputs: meta?.inputs ?? null
  };
};

const fetchStagesForReturn = async (plantingReturnId, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT * FROM planting_return_inspections WHERE planting_return_id = ? ORDER BY id ASC",
    [plantingReturnId]
  );
  return rows.map(mapStageRow);
};

const fetchPlantingReturnCore = async (id, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT id, crop_id, inspector_id, date_sown FROM planting_returns WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows.length) return null;
  return rows[0];
};

// Attempt to load crop inspection types from an assumed table.
// Adjust table/column names to your environment if different.
const fetchCropInspectionTypes = async (cropId, conn = db) => {
  try {
    const [rows] = await conn.execute(
      "SELECT id, stage_name, `order`, required, period_after_planting_days FROM crop_inspection_types WHERE crop_id = ? ORDER BY `order` ASC",
      [cropId]
    );
    return rows.map((r) => ({
      id: String(r.id),
      stageName: r.stage_name,
      order: r.order != null ? Number(r.order) : null,
      required: Boolean(r.required ?? false),
      periodAfterPlantingDays: r.period_after_planting_days != null ? Number(r.period_after_planting_days) : null
    }));
  } catch (e) {
    // If your schema differs or table doesn't exist, return empty and handle upstream
    return [];
  }
};

const addDays = (isoDate, days) => {
  if (!isoDate || days == null) return null;
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(+d)) return null;
    d.setUTCDate(d.getUTCDate() + Number(days));
    return d.toISOString();
  } catch {
    return null;
  }
};

const mapDecisionToRecommendation = (decision) => {
  const v = String(decision || "").toLowerCase();
  if (v === "accepted") return "approve";
  if (v === "rejected") return "reject";
  // provisional / skipped -> none
  return "none";
};

// ---------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------
const plantingInspectionsResolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  Query: {
    plantingReturnInspection: async (parent, args, context) => {
      const userPermissions = context?.req?.user?.permissions || [];
      checkPermission(
        userPermissions,
        "can_view_field_inspections",
        "You dont have permissions to view field inspections"
      );
      const plantingReturnId = args.id;
      const stages = await fetchStagesForReturn(plantingReturnId);
      return { id: String(plantingReturnId), plantingReturnId: String(plantingReturnId), stages };
    }
  },

  Mutation: {
    initializePlantingReturnInspection: async (parent, args, context) => {
      const userPermissions = context?.req?.user?.permissions || [];
      checkPermission(
        userPermissions,
        "can_initialise_inspections",
        "You dont have permissions to initialise inspections"
      );

      const { plantingReturnId } = args.input || {};
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // Avoid duplicate initialization
        const [[countRow]] = await conn.execute(
          "SELECT COUNT(*) AS c FROM planting_return_inspections WHERE planting_return_id = ?",
          [plantingReturnId]
        );
        const already = Number(countRow?.c || 0) > 0;
        if (already) {
          await conn.commit();
          return { success: true, message: "Inspection already initialized" };
        }

        const core = await fetchPlantingReturnCore(plantingReturnId, conn);
        if (!core) {
          throw new GraphQLError("Planting return not found");
        }

        const cropStages = await fetchCropInspectionTypes(core.crop_id, conn);
        if (!Array.isArray(cropStages) || cropStages.length === 0) {
          throw new GraphQLError("No inspection types configured for this crop");
        }

        const dueDates = cropStages.map((s) => addDays(core.date_sown, s.periodAfterPlantingDays));

        for (let i = 0; i < cropStages.length; i += 1) {
          const s = cropStages[i];
          const payload = {
            planting_return_id: plantingReturnId,
            inspector_id: core.inspector_id || null,
            visit_date: dueDates[i] ? new Date(dueDates[i]) : null,
            report: JSON.stringify({
              inspectionTypeId: s.id,
              stageName: s.stageName,
              order: s.order,
              required: !!s.required
            }),
            recommendation: "none",
            status: "draft"
          };
          // Use direct insert to preserve created order
          await conn.execute(
            "INSERT INTO planting_return_inspections (planting_return_id, inspector_id, visit_date, report, recommendation, status) VALUES (?, ?, ?, ?, ?, ?)",
            [
              payload.planting_return_id,
              payload.inspector_id,
              payload.visit_date,
              payload.report,
              payload.recommendation,
              payload.status
            ]
          );
        }

        await conn.commit();
        return { success: true, message: "Inspection initialized successfully" };
      } catch (error) {
        await conn.rollback();
        throw handleSQLError(error, "Failed to initialize inspection");
      } finally {
        conn.release();
      }
    },

    submitPlantingInspectionStage: async (parent, args, context) => {
      const userPermissions = context?.req?.user?.permissions || [];
      checkPermission(
        userPermissions,
        "can_edit_field_inspections",
        "You dont have permissions to edit field inspections"
      );

      const { plantingReturnId, taskId, inspectionTypeId, decision, comment, inputs } = args.input || {};

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // Find the row either by explicit taskId or by matching inspectionTypeId in report JSON
        let rowId = null;
        if (taskId) {
          const [rows] = await conn.execute(
            "SELECT id, report FROM planting_return_inspections WHERE id = ? AND planting_return_id = ? LIMIT 1",
            [taskId, plantingReturnId]
          );
          if (rows.length) rowId = rows[0].id;
        }
        if (!rowId) {
          const [rows] = await conn.execute(
            "SELECT id, report FROM planting_return_inspections WHERE planting_return_id = ? ORDER BY id ASC",
            [plantingReturnId]
          );
          for (const r of rows) {
            const meta = parseJSON(r.report);
            if (String(meta?.inspectionTypeId || "") === String(inspectionTypeId)) {
              rowId = r.id;
              break;
            }
          }
        }

        // If still not found, create a minimal record (should be rare if initialized correctly)
        if (!rowId) {
          const core = await fetchPlantingReturnCore(plantingReturnId, conn);
          const baseReport = JSON.stringify({ inspectionTypeId });
          const insertRes = await conn.execute(
            "INSERT INTO planting_return_inspections (planting_return_id, inspector_id, report, recommendation, status) VALUES (?, ?, ?, 'none', 'draft')",
            [plantingReturnId, core?.inspector_id || null, baseReport]
          );
          rowId = insertRes?.[0]?.insertId;
        }

        // Load existing to merge report JSON
        const [[existing]] = await conn.execute(
          "SELECT id, report FROM planting_return_inspections WHERE id = ?",
          [rowId]
        );
        const existingMeta = parseJSON(existing?.report);
        const nextMeta = {
          ...existingMeta,
          inspectionTypeId: existingMeta?.inspectionTypeId ?? inspectionTypeId,
          comment: comment ?? existingMeta?.comment ?? null,
          inputs: inputs ?? existingMeta?.inputs ?? null,
          decision: decision
        };
        const recommendation = mapDecisionToRecommendation(decision);

        await conn.execute(
          "UPDATE planting_return_inspections SET report = ?, status = 'submitted', recommendation = ? WHERE id = ?",
          [JSON.stringify(nextMeta), recommendation, rowId]
        );

        await conn.commit();
        return { success: true, message: "Stage submitted" };
      } catch (error) {
        await conn.rollback();
        throw handleSQLError(error, "Failed to submit stage");
      } finally {
        conn.release();
      }
    }
  }
};

export default plantingInspectionsResolvers;

