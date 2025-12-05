import { GraphQLError } from "graphql";
import { db } from "../../config/config.js";
import checkPermission from "../../helpers/checkPermission.js";
import hasPermission from "../../helpers/hasPermission.js";
import saveData from "../../utils/db/saveData.js";
import { fetchExaminations } from "../stock_examinations/resolvers.js";
import saveUpload from "../../helpers/saveUpload.js";
import { getUsers } from "../user/resolvers.js";
import sendEmail from "../../utils/emails/email_server.js";
import generateLabTestNo from "../../helpers/generateLabTestNo.js";

export const parseJSON = (text) => {
  if (!text) return null;                // return null instead of {}
  try {
    return typeof text === "string" ? JSON.parse(text) : text;
  } catch {
    return null;                         // invalid JSON -> null
  }
};

export const mapLabsRow = (row) => {
  return {
    id: row.id?.toString(),
    user_id: row.user_id,
    variety_id: row.variety_id?.toString(),
    stock_examination_id: row.stock_examination_id?.toString(),
    collection_date: row.collection_date ? new Date(row.collection_date) : null,
    receipt_id: row.receipt_id || null,
    applicant_remark: row.applicant_remark || null,
    inspector_id: row.inspector_id?.toString() || null,   // cast to string for GraphQL ID consistency
    // status: row.status?.toUpperCase(),
    lab_test_number: row.lab_test_number || null,
    lot_number: row.lot_number || null,
    status: row.status,
    inspector_report: parseJSON(row.inspector_report),
    lab_test_report: parseJSON(row.lab_test_report),
    deleted: Boolean(row.deleted),
    created_at: row.created_at ? new Date(row.created_at) : null,
  };
};

export const fetchSeedLabs = async ({
  id = null,
  user_id = null,
  inspector_id = null,
  status = null,
  statusNotIn = null,
} = {}) => {
  try {
    const values = [];
    const where = ["seed_labs.deleted = 0"];

    if (id) {
      where.push("seed_labs.id = ?");
      values.push(id);
    }

    if (user_id) {
      where.push("seed_labs.user_id = ?");
      values.push(user_id);
    }

    if (inspector_id) {
      where.push("seed_labs.inspector_id = ?");        // <-- FIXED: push inspector_id, not user_id
      values.push(inspector_id);
    }

    if (status) {
      where.push("seed_labs.status = ?");
      values.push(status);
    } else if (Array.isArray(statusNotIn) && statusNotIn.length > 0) {
      const placeholders = statusNotIn.map(() => "?").join(",");
      where.push(`seed_labs.status NOT IN (${placeholders})`);
      values.push(...statusNotIn);
    }
    
    const sql = `
      SELECT seed_labs.*
      FROM seed_labs
      WHERE ${where.join(" AND ")}
      ORDER BY seed_labs.created_at DESC
    `;

    const [results] = await db.execute(sql, values);
    return results.map(mapLabsRow);
  } catch (error) {
    throw new Error(`Failed to fetch seed labs: ${error.message}`);
  }
};

const mapVariety = (row) => ({
  id: String(row.id),
  cropId: String(row.crop_id),
  name: row.name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fetchVarietyById = async (id) => {
  const [rows] = await db.execute(
    "SELECT * FROM crop_varieties WHERE id = ?",
    [id]
  );
  if (!rows.length) return null;
  return mapVariety(rows[0]);
};

const seedLabResolvers = {
  Query: {
    getLabInspections: async (_parent, _args, context) => {
      try {
        const user = context?.req?.user;
        const userPermissions = user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_view_seed_lab_inspections", // consider a more specific permission, e.g., "can_view_seed_labs"
          "You dont have permissions to view seed labs"
        );

        const can_manage_all_forms = hasPermission(
          userPermissions,
          "can_manage_seed_lab_inspection"
        );

        const can_view_only_assigned_seed_stock = hasPermission(
          userPermissions,
          "can_view_only_assigned_seed_lab_inspection"
        );

        const can_receive_seed_lab_inspections = hasPermission(
          userPermissions,
          "can_receive_seed_lab_inspections"
        );

        const can_perform_seed_lab_tests = hasPermission(
          userPermissions,
          "can_perform_seed_lab_tests"
        );

        // Receptionists should see everything except pending / inspector assigned / rejected
        let status = null;
        let statusNotIn = null;
        if (can_receive_seed_lab_inspections) {
          statusNotIn = ["pending", "assigned_inspector", "inspector_assigned", "rejected"];
        } else if (can_perform_seed_lab_tests) {
          // status = "received";
          statusNotIn = ["pending", "assigned_inspector", "inspector_assigned", "rejected", "accepted", "halted"];
          
        }

        const labs = await fetchSeedLabs({
          user_id: can_manage_all_forms ? null : user?.id ?? null,
          inspector_id: can_view_only_assigned_seed_stock ? user?.id ?? null : null,
          status: status,
          statusNotIn,
        });

        return labs;
      } catch (error) {
        throw new Error(`Failed to fetch lab inspections: ${error.message}`);
      }
    },

      getSeedLab : async (_parent, { id }, context) => {
        try {
          const user = context?.req?.user;
          const userPermissions = user?.permissions || [];

          checkPermission(
            userPermissions,
            "can_view_seed_stock",
            "You dont have permissions to view seed stock"
          );

          const can_manage_all_forms = hasPermission(
            userPermissions,
            "can_manage_seed_stock"
          );

          const can_view_only_assigned_seed_stock = hasPermission(
          userPermissions,
          "can_view_only_assigned_seed_stock"
        );

          const lab = await fetchSeedLabs({
            id,
            user_id: can_manage_all_forms ? null : user?.id ?? null,
            inspector_id: can_view_only_assigned_seed_stock ? user?.id ?? null : null,
          });

          // if (!labInspection) throw new Error("Seed lab inspection not found");

          return lab;
        } catch (error) {
          throw new Error(`Failed to fetch seed lab inspection: ${error.message}`);
        }
      },

  },
  LabInspection: {
    // Resolve createdBy field
    createdBy: async (parent) => {
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
    // Resolve variety field
    variety: async (parent) => {
      try {
        
        const variety_id = parent.variety_id;

        if (!variety_id) return null;

        const variety = await fetchVarietyById(variety_id);

        return variety;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    // Resolve inspector field
    inspector: async (parent) => {
      try {
        const inspector_id = parent.inspector_id;

        if (!inspector_id) return null;

        const [user] = await getUsers({
          id: inspector_id,
        });

        return user;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    }
  },

  Mutation:{
    saveSeedLabRequest: async (_parent, args, context) => {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        const {
          id,
          stock_examination_id,
          collection_date,
          receipt,
          applicant_remark,
        } = args.input;


        const user = context?.req?.user;
        const userPermissions = user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_request_seed_lab_inspection",
          "You dont have permissions to request seed lab inspection"
        );

        let stock_examination = {};
        
        
        if (stock_examination_id) {

          stock_examination = await fetchExaminations({
            id: stock_examination_id,
            user_id: user.id,
          });
          console.log("Planting return:", stock_examination);
        }

        const data = {
          user_id: user.id,
          variety_id: stock_examination[0]?.variety_id || null,
          stock_examination_id: stock_examination_id,
          lot_number: stock_examination[0]?.lot_number || null,
          collection_date,
          applicant_remark,
        }

        const save_id = await saveData({
          table: "seed_labs",
          data,
          id,
          connection
        });

        // If a receipt was uploaded, save it and capture its public path
        let savedReceiptInfo = null;
        if (receipt) {
          try {
            savedReceiptInfo = await saveUpload({
              file: receipt,
              subdir: "receipts",
            });
          } catch (e) {
            // If upload fails, rollback and bubble up
            throw new GraphQLError(`Receipt upload failed: ${e.message}`);
          }
        }

        // Record attachment metadata in form_attachments if a receipt was uploaded
        if (savedReceiptInfo) {
          try {
            // Update application_forms with receipt_id
            await saveData({
              table: "seed_labs",
              data: { receipt_id: savedReceiptInfo.filename },
              id: save_id,
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
          message: "Seed Lab Request saved successfully",
          data: {
            id: save_id,
            status: "PENDING",
            ...data,
          },
        };
        
      } catch (error) {
        throw new Error(`Failed to save seed lab request: ${error.message}`);
      }
    },
    deleteSeedLabInspection: async (_parent, { id }, context) => {
      try {
        const user = context?.req?.user;
        const userPermissions = user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_manage_seed_stock",
          "You dont have permissions to delete seed lab inspections"
        );

        const [result] = await db.execute(
          `UPDATE seed_labs SET deleted = 1 WHERE id = ?`,
          [id]
        );

        if (result.affectedRows === 0)
          throw new Error("Seed lab inspection not found or already deleted");

        return {
          success: true,
          message: "Seed lab inspection deleted successfully",
        };
      } catch (error) {
        throw new Error(`Failed to delete seed lab inspection: ${error.message}`);
      }
    },

    //assignLabInspector
    assignLabInspector: async (parent, args, context) => {
      try {
        const { inspector_id, form_id } = args.input;
        const userPermissions = context.req.user.permissions;

        // check if user has permission to assign an inspector
        checkPermission(
          userPermissions,
          "can_assign_inspector",
          "You don't have permissions to assign an inspector"
        );

        // fetch inspector details
        const [inspector] = await getUsers({
          id: inspector_id,
        });

        // fetch the form details
        const [formDetails] = await fetchSeedLabs({
          id: form_id,
        });

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
          table: "seed_labs",
          data,
          id: form_id,
        });

        // send a notification to the assigned inspector
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: inspector.email,
          subject: "Inspector Assignment",
          message: `Dear ${inspector.name}, You have been assigned as the inspector for ${formOwner.name}'s seed lab application `,
        });

        // send another email to the form owner
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: formOwner.email,
          subject: "Inspector Assignment",
          message: `Dear ${formOwner.name}, You have been assigned to ${inspector.name} as your inspector for the ${formDetails.form_type} application that you submitted`,
        });

        return {
          success: true,
          message: "Inspector assigned successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    submitLabInspection: async (parent, args, context) => {
      try {
        const { id, inspector_report, decision } = args.input;
        const user = context.req.user;
        const userPermissions = user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_view_only_assigned_seed_stock",
          "You dont have permissions to submit lab inspections"
        );

        const data = {
          inspector_report: JSON.stringify(inspector_report),
          status: decision,
        };

        await saveData({
          table: "seed_labs",
          data,
          id: id,
        });

        return {
          success: true,
          message: "Lab inspection submitted successfully",
        };

      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    //lab receptionist receiveLabInspection
    receiveLabInspection: async (parent, args, context) => {
      try {
        const { id, decision, receptionist_comment } = args.input;
        const user = context.req.user;
        const userPermissions = user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_receive_seed_lab_inspections",
          "You dont have permissions to receive lab inspections"
        );

        const data = {
          status: decision,
          lab_test_number: decision === "received" ? generateLabTestNo() : null,
          receptionist_comment: receptionist_comment || null,
        };
        console.log("Receiving lab inspection with data:", data);

        await saveData({
          table: "seed_labs",
          data,
          id: id,
        });


        return {
          success: true,
          message: "Lab inspection sample received successfully",
        };

      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    //submitLabTestReport
    submitLabTestReport: async (parent, args, context) => {
      const connection = await db.getConnection();
      try {
        const { id, lab_test_report, marketableStatus } = args.input;
        const user = context.req.user;
        const userPermissions = user?.permissions || [];
        checkPermission(
          userPermissions,
          "can_perform_seed_lab_tests",
          "You dont have permissions to submit lab test reports"
        );
        await connection.beginTransaction();
        const data = {
          lab_test_report: JSON.stringify(lab_test_report),
          status: marketableStatus,
        };

        await saveData({
          table: "seed_labs",
          data,
          id: id,
          connection,
        });
        
        if (marketableStatus === "marketable") {
          // If the seed is marketable, update the stock examination status
          const seedLab = await fetchSeedLabs({ id });
          const marketabledata = {
            user_id: seedLab[0].user_id,
            crop_variety_id : seedLab[0].variety_id,
            seed_lab_id : seedLab[0].id,
            // seed_label_id : seedLab[0].seed_label_id,
            lot_number : seedLab[0].lot_number,
            quantity : seedLab[0].inspector_report.quantity_represented_kg,
            seed_class : seedLab[0].seed_class?? null,
            source : seedLab[0].source?? null,
            // detail : seedLab[0].detail,
            package_id : seedLab[0].seed_label_package_id?? null,
            // lab_test_number : seedLab[0].lab_test_number,
          };
          
          await saveData({
            table: "marketable_seeds",
            data: marketabledata,
            id: null,
            connection,
          });
        }

        await connection.commit();

        return {
          success: true,
          message: "Lab test report submitted successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    }

  }
};

export default seedLabResolvers;
