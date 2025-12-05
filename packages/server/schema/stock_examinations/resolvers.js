import { GraphQLError } from "graphql";
import { db } from "../../config/config.js";
import checkPermission from "../../helpers/checkPermission.js";
import hasPermission from "../../helpers/hasPermission.js";
import saveData from "../../utils/db/saveData.js";
import { fetchReturnById } from "../planting_returns/resolvers.js";
import { getUsers } from "../user/resolvers.js";
import sendEmail from "../../utils/emails/email_server.js";
import generateLotNumber from "../../helpers/generateLotNumber.js";

const parseJSON = (text) => {
  if (!text) return {};
  try {
    return typeof text === "string" ? JSON.parse(text) : text;
  } catch {
    return {};
  }
};

const mapExamRow = (row) => {
  const meta = parseJSON(row.report);
  const decision = meta?.decision || null;
  const status = decision || "pending"; // UI expects: pending |inspector_assigned | accepted | rejected
  // const submittedAt = decision ? row.updated_at : null;

  console.log("Mapping exam row:", row);
  return {
    id: String(row.id),
    created_at: row.created_at,
    submittedAt: row.updated_at,
    user_id: row.user_id,
    variety_id: row.crop_variety_id,
    import_export_permit_id: row.import_export_permit_id,
    planting_return_id: row.planting_return_id,
    form_qds_id: row.qds_crop_declaration_id,
    category: row.category || null,
    report: meta ?? null,
    seed_class: row.seed_class,
    field_size: row.field_size,
    yield: row.yield,
    status:row.status || status,
    inspector_id: row.inspector_id ?? null,
    status_comment: row.status_comment ?? null,
    remarks: row.remarks,
    mother_lot: row.mother_lot ?? null,
  };
};

export const fetchExaminations = async ({
  id = null,
  inspector_id = null,
  user_id = null,
}) => {
  try {
    let values = [];
    let where = "";
    let extra_join = "";
    let extra_select = "";

    console.log("Fetching examinations with params:", { id, inspector_id, user_id });

    if (id) {
      where += " AND stock_examinations.id = ?";
      values.push(id);
    }

    if (user_id) {
      // if (!user_assigned_forms) {
      where += " AND stock_examinations.user_id = ?";
      values.push(user_id);
      // }
    }
    if (inspector_id) {
      where += " AND stock_examinations.inspector_id = ?";
      values.push(inspector_id);
    }

    let sql = `
            SELECT 
            stock_examinations.*
            FROM
            stock_examinations
            WHERE stock_examinations.deleted = 0 ${where}
            ORDER BY created_at DESC
        `;

    console.log("Executing SQL:", sql, "with values:", values);
    const [results] = await db.execute(sql, values);

    // return { items: results.map(mapReturn) };
    return results.map(mapExamRow);
  } catch (error) {
    throw new Error(`Failed to fetch stock examinations: ${error.message}`);
  }
};

const stockExaminationResolvers = {
  Query: {
    stockExaminations: async (parent, args, context) => {
      try {
        const user = context?.req?.user;
        const userPermissions = context?.req?.user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_view_seed_stock",
          "You dont have permissions to view seed stock"
        );

        const can_manage_all_forms = hasPermission(
          userPermissions,
          "can_manage_seed_stock"
        );

        const can_view_specific_assigned_forms = hasPermission(
          userPermissions,
          "can_view_only_assigned_seed_stock"
        );
        console.log("can_view_specific_assigned_forms:", can_view_specific_assigned_forms);

        const examinations = await fetchExaminations({
          user_id: !can_manage_all_forms ? user.id : null,
          inspector_id: can_view_specific_assigned_forms ? user.id : null,
        });

        return examinations;
      } catch (error) {
        throw new Error(`Failed to fetch stock examinations: ${error.message}`);
      }
    },

    stockExamination: async (parent, { id }, context) => {
      try {
        const user = context?.req?.user;
        const userPermissions = context?.req?.user?.permissions || [];

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
        console.log("can_view_only_assigned_seed_stock:", can_view_only_assigned_seed_stock);

        const [examination] = await fetchExaminations({
          id,
          user_id: !can_manage_all_forms ? user.id : null,
          inspector_id: can_view_only_assigned_seed_stock ? user.id : null,
        });

        return examination;
      } catch (error) {
        throw new Error(`Failed to fetch stock examination: ${error.message}`);
      }
    },

  },
  StockExamination: {
    user: async (parent) => {
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
    inspector: async (parent, args, context) => {
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
        },
  },

  Mutation: {
    saveStockExamination: async (parent, args, context) => {
      try {
        const {
          id,
          variety_id,
          import_export_permit_id,
          planting_return_id,
          form_qds_id,
          remarks,
          mother_lot,
        } = args.payload;

        const user = context?.req?.user;
        let plantingReturn = {};

        if (planting_return_id) {
          plantingReturn = await fetchReturnById(planting_return_id);
          console.log("Planting return:", plantingReturn);
        }
        //construct the data object
        const data = {
          user_id: user.id,
          crop_variety_id: planting_return_id
            ? plantingReturn.varietyId
            : variety_id,
          import_export_permit_id: import_export_permit_id
            ? import_export_permit_id
            : null,
          planting_return_id: planting_return_id ? planting_return_id : null,
          qds_crop_declaration_id: form_qds_id ? form_qds_id : null,
          remarks,
          mother_lot,
        };

        const save_id = await saveData({
          table: "stock_examinations",
          data,
          id,
        });

        return {
          success: true,
          message: "Stock examination created successfully",
          result: {
            id: save_id,
            ...data,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to create stock examination: ${error.message}`,
          data: null,
        };
      }
    },

    // updateStockExamination: async (_, { id, payload }, { user }) => {
    //     try {
    //         const [updated] = await db('stock_examinations')
    //             .where({ id })
    //             .update({
    //                 ...payload,
    //                 updated_at: new Date()
    //             })
    //             .returning('*');

    //         return {
    //             success: true,
    //             message: 'Stock examination updated successfully',
    //             data: updated
    //         };
    //     } catch (error) {
    //         return {
    //             success: false,
    //             message: `Failed to update stock examination: ${error.message}`,
    //             data: null
    //         };
    //     }
    // },

    deleteStockExamination: async (_, { id }, { user }) => {
      try {
        await db("stock_examinations").where({ id }).update({
          deleted_at: new Date(),
        });

        return {
          success: true,
          message: "Stock examination deleted successfully",
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to delete stock examination: ${error.message}`,
        };
      }
    },

    assignStockExaminationInspector: async (_parent, args, context) => {
      const userPermissions = context?.req?.user?.permissions || [];

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

      // Fetch each stock examination
      const forms = await Promise.all(
        formIds.map((fid) =>
          fetchExaminations({ id: fid }).then((res) => (Array.isArray(res) ? res[0] : res))
        )
      );
      forms.forEach((formDetails, idx) => {
        if (!formDetails) {
          throw new GraphQLError(
            `Stock examination with the provided id (${formIds[idx]}) is not found!`
          );
        }
      });

      // Fetch owners
      const ownerIds = forms.map((f) => f.user_id);
      const owners = await Promise.all(
        ownerIds.map((uid) => getUsers({ id: uid }).then((r) => r?.[0]))
      );
      owners.forEach((formOwner, idx) => {
        if (!formOwner) {
          throw new GraphQLError(
            `Form owner not found for stock examination ${formIds[idx]}`
          );
        }
      });

      try {
        // Persist updates
        await Promise.all(
          formIds.map((fid) =>
            saveData({
              table: "stock_examinations",
              data: {
                inspector_id: inspectorId,
                // scheduled_visit_date: scheduledVisitDate || null,
                status: "inspector_assigned",
                updated_at: new Date(),
                // status_comment: comment || null,
              },
              id: fid,
              idColumn: "id",
            })
          )
        );

        // Notify inspector
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: inspector.email,
          subject: `Stock Examination Inspector Assignment`,
          message: `Dear ${inspector.name}, You have been assigned as the inspector for ${formIds.length} stock examination(s).`,
        });

        // Notify each form owner
        await Promise.all(
          owners.map((owner) =>
            sendEmail({
              from: '"STTS MAAIF" <tredumollc@gmail.com>',
              to: owner.email,
              subject: `Stock Examination Inspector Assigned`,
              message: `Dear ${owner.name}, ${inspector.name} has been assigned as your inspector for your stock examination request.`,
            })
          )
        );

        return {
          success: true,
          message: `Inspector assigned to ${formIds.length} stock examination(s).`,
        };
      } catch (error) {
        throw new GraphQLError(error?.message || "Failed to assign inspector");
      }
    },

    submitStockExaminationInspection: async (_parent, args, context) => {
      try {
        const conn = await db.getConnection();

        const user = context?.req?.user;
        const userPermissions = user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_edit_examination_inspections",
          "You don't have permission to submit stock examination inspections"
        );

        const { id, decision, report, remarks } = args.input;

        await conn.beginTransaction();
        // Fetch the examination
        const [examination] = await fetchExaminations({ id });
        if (!examination) {
          throw new GraphQLError("Stock examination not found");
        }

        const [owner] = await getUsers({ id: examination.user_id });
        if (!owner) {
          throw new GraphQLError("Form owner not found");
        }

        // Verify inspector assignment
        if (String(examination.inspector_id) !== String(user.id)) {
          throw new GraphQLError("You are not assigned as the inspector for this examination");
        }
        
        const lot_number = generateLotNumber({prefix:owner.company_initials, digits:4})|| null;

        // Save inspection report
        await saveData({
          table: "stock_examinations",
          data: {
            report: JSON.stringify({
              purity: report.purity || null,
              moisture_content: report.moisture_content || null,
              insect_damage:  report.insect_damage || null,
              moldiness:  report.moldiness || null,
              weeds:  report.noxious_weeds || null,
              germination:  report.germination || null,
            }),
            field_size: report.field_size || null,
            yield: report.yield || null,
            seed_class: report.seed_class || null,
            remarks: remarks || null,
            lot_number : lot_number,
            updated_at: new Date(),
            status: decision, // accepted or rejected
          },
          id,
          conn
        });
        console.log("owner", owner);

        if (decision === "approved") {
          // Additional logic for approved decision
          const data = {
            updated_at: new Date(),
            user_id : examination.user_id|| null,
            crop_variety_id : examination.variety_id|| null,
            stock_examination_id : examination.id|| null,
            is_deposit : 1|| null,
            lot_number : lot_number|| null,
            quantity : report.yield|| null,
            seed_class : report.seed_class|| null,
            source : 'Stock examination',
          } 

          await saveData({
            table: "stock_records",
            data,
            id: null,
            conn
          })
        }
        await conn.commit();

        
        // const [owner] = await getUsers({ id: examination.user_id });
        // if (!owner) {
        //   throw new GraphQLError("Form owner not found");
        // }

        // Send email notification
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: owner.email,
          subject: `Stock Examination Inspection ${decision.toUpperCase()}`,
          message: `Dear ${owner.name}, your stock examination has been ${decision} after inspection.`,
        });

        
        return {
          success: true,
          message: `Stock examination inspection submitted successfully`,
        };
      } catch (error) {
        throw new GraphQLError(error?.message || "Failed to submit inspection");
      }
    },
  },
};

export default stockExaminationResolvers;
