import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import saveData from "../../utils/db/saveData.js";
import checkPermission from "../../helpers/checkPermission.js";
import { fetchCropDeclarationById, fetchReturnById } from "../qdsCropDeclarations/resolvers.js";


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
    CropDecalrationId: String(row.qds_crop_declaration_id),
    CropDecalrationCropId: String(row.crop_declaration_crop_id),
    inspectionTypeId:
      meta?.inspectionTypeId != null ? String(meta.inspectionTypeId) : null,
    stageName: meta?.stageName || null,
    order: meta?.order != null ? Number(meta.order) : null,
    required: Boolean(meta?.required ?? false),
    status,
    dueDate: row.visit_date || null,
    submittedAt,
    reportUrl: meta?.reportUrl || null,
    comment: meta?.comment || null,
    inputs: meta?.inputs ?? null,
  };
};

const fetchStagesForReturn = async (CropDecalrationId, cropDeclarationCropId, conn = db) => {
  const [rows] = await conn.execute(
    "SELECT * FROM planting_return_inspections WHERE qds_crop_declaration_id = ? AND crop_declaration_crop_id = ? ORDER BY id ASC",
    [CropDecalrationId, cropDeclarationCropId]
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
    const [rows] = await db.execute(
      "SELECT * FROM crop_inspection_types WHERE crop_id = ? ORDER BY `order_no` ASC",
      [cropId]
    );

    return rows.map((r) => ({
      id: String(r.id),
      stageName: r.stage_name,
      order: r.order_no != null ? Number(r.order_no) : null,
      required: Boolean(r.is_required ?? false),
      periodAfterPlantingDays:
        r.period_after_planting_days != null
          ? Number(r.period_after_planting_days)
          : null,
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
const cropDeclarationInspectionsResolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  Query: {
    CropDecalrationInspection: async (parent, args, context) => {
      const userPermissions = context?.req?.user?.permissions || [];
      checkPermission(
        userPermissions,
        "can_view_field_inspections",
        "You dont have permissions to view field inspections"
      );
      const CropDecalrationId = args.id;
      const CropDeclarationCropId = args.cropId;
      const stages = await fetchStagesForReturn(CropDecalrationId, CropDeclarationCropId);
      return {
        id: String(CropDecalrationId),
        CropDecalrationId: String(CropDecalrationId),
        // CropDeclarationCropId: String(CropDeclarationCropId),
        stages,
      };
    },
  },

  Mutation: {
    initializeCropDecalrationInspection: async (parent, args, context) => {
      const userPermissions = context?.req?.user?.permissions || [];
      checkPermission(
        userPermissions,
        "can_initialise_inspections",
        "You dont have permissions to initialise inspections"
      );

      const  cropDeclarationCropId  = args.input.cropDeclarationCropId || {};
      const  cropDeclarationId = args.input.cropDeclarationId || {};
      
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // Avoid duplicate initialization
        const [[countRow]] = await conn.execute(
          "SELECT COUNT(*) AS c FROM planting_return_inspections WHERE crop_declaration_crop_id	 = ?",
          [cropDeclarationCropId]
        );
        const already = Number(countRow?.c || 0) > 0;
        if (already) {
          await conn.commit();
          return { success: true, message: "Inspection already initialized" };
        }

        // const core = await fetchPlantingReturnCore(CropDecalrationId, conn);
        const core = await fetchReturnById(cropDeclarationId, conn);
        console.log("core", core);
        if (!core) {
          throw new GraphQLError("Planting return not found");
        }


        const cropStages = await fetchCropInspectionTypes(cropDeclarationCropId, conn);
        // console.log("cropStages", cropStages);

        if (!Array.isArray(cropStages) || cropStages.length === 0) {
          throw new GraphQLError(
            "No inspection types configured for this crop"
          );
        }

        const dueDates = cropStages.map((s) =>
          addDays(core.dateSown, s.periodAfterPlantingDays)
        );

        for (let i = 0; i < cropStages.length; i += 1) {
          const s = cropStages[i];
          const payload = {
            qds_crop_declaration_id: cropDeclarationId,
            crop_declaration_crop_id: cropDeclarationCropId,
            inspector_id: core.inspector_id || null,
            visit_date: dueDates[i] ? new Date(dueDates[i]) : null,
            report: JSON.stringify({
              inspectionTypeId: s.id,
              stageName: s.stageName,
              order: s.order,
              required: !!s.required,
            }),
            recommendation: "none",
            status: "draft",
          };
          // Use direct insert to preserve created order
          await conn.execute(
            "INSERT INTO planting_return_inspections (qds_crop_declaration_id, crop_declaration_crop_id, inspector_id, visit_date, report, recommendation, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              payload.qds_crop_declaration_id,
              payload.crop_declaration_crop_id,
              payload.inspector_id,
              payload.visit_date,
              payload.report,
              payload.recommendation,
              payload.status,
            ]
          );
        }

        await conn.commit();
        return {
          success: true,
          message: "Inspection initialized successfully",
        };
      } catch (error) {
        await conn.rollback();
        console.error("Error initializing inspection:", error);
        throw handleSQLError(error, "Failed to initialize inspection");
      } finally {
        conn.release();
      }
    },

    submitCropDeclarationInspectionStage: async (parent, args, context) => {
      const userPermissions = context?.req?.user?.permissions || [];
      checkPermission(
        userPermissions,
        "can_edit_field_inspections",
        "You dont have permissions to edit field inspections"
      );

      const {
        CropDeclarationId,
        cropDeclarationCropId,
        taskId,
        inspectionTypeId,
        decision,
        comment,
        inputs,
      } = args.input || {};

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // Find the row either by explicit taskId or by matching inspectionTypeId in report JSON
        let rowId = null;
        if (taskId) {
          const [rows] = await conn.execute(
            "SELECT id, report FROM planting_return_inspections WHERE id = ? AND qds_crop_declaration_id = ? AND crop_declaration_crop_id = ? LIMIT 1",
            [taskId, CropDeclarationId, cropDeclarationCropId ]
          );
          if (rows.length) rowId = rows[0].id;
        }
        // if (!rowId) {
        //   const [rows] = await conn.execute(
        //     "SELECT id, report FROM planting_return_inspections WHERE planting_return_id = ? ORDER BY id ASC",
        //     [CropDecalrationId]
        //   );
        //   for (const r of rows) {
        //     const meta = parseJSON(r.report);
        //     if (
        //       String(meta?.inspectionTypeId || "") === String(inspectionTypeId)
        //     ) {
        //       rowId = r.id;
        //       break;
        //     }
        //   }
        // }

        // If still not found, create a minimal record (should be rare if initialized correctly)
        if (!rowId) {
          const core = await fetchPlantingReturnCore(CropDeclarationId, conn);
          const baseReport = JSON.stringify({ inspectionTypeId });
          const insertRes = await conn.execute(
            "INSERT INTO planting_return_inspections (planting_return_id, inspector_id, report, recommendation, status) VALUES (?, ?, ?, 'none', 'draft')",
            [CropDeclarationId, core?.inspector_id || null, baseReport]
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
          decision: decision,
        };
        const recommendation = mapDecisionToRecommendation(decision);

        await conn.execute(
          "UPDATE planting_return_inspections SET report = ?, status = 'submitted', recommendation = ? WHERE id = ?",
          [JSON.stringify(nextMeta), recommendation, rowId]
        );

        const cropStages = await fetchCropInspectionTypes(cropDeclarationCropId, conn);
        
        // Find the stage with the highest order
        const latestStage = cropStages.reduce( 
          (max, stage) => (stage.order > (max?.order ?? -Infinity) ? stage : max),
          null
        );

        if (latestStage && inspectionTypeId === latestStage.id) {
          console.log("Matched!");

          await conn.execute(
            `
            UPDATE qds_crop_declaration_crops
            SET status = ?
            WHERE crop_declaration_id = ?
            AND crop_id = ?
            `,
            ["provisional", CropDeclarationId, cropDeclarationCropId]
          );

          console.log("Status updated to provisional for crop_declaration_id:", CropDeclarationId);
        } else {
          console.log("Not latest stage");
        }
        const core = await fetchCropDeclarationById(CropDeclarationId, conn);
        const core1 = await fetchReturnById(CropDeclarationId, conn);
        
        console.log("core...........", core, core1);

        await conn.commit();
        return { success: true, message: "Stage submitted" };
      } catch (error) {
        await conn.rollback();
        throw handleSQLError(error, "Failed to submit stage");
      } finally {
        conn.release();
      }
    },
  },
};

export default cropDeclarationInspectionsResolvers;
