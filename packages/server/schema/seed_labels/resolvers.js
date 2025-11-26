import { GraphQLError } from "graphql";
import { db } from "../../config/config.js";
import checkPermission from "../../helpers/checkPermission.js";
import hasPermission from "../../helpers/hasPermission.js";
import saveUpload from "../../helpers/saveUpload.js";
import saveData from "../../utils/db/saveData.js";
import { fetchSeedLabs } from "../seed_lab/resolvers.js";
import { fetchVarietyById } from "../crop/resolvers.js";
import { getUsers } from "../user/resolvers.js";
import sendEmail from "../../utils/emails/email_server.js";

export const mapLabelsRow = (row) => {
  return {
    id: row.id?.toString(),
    user_id: row.user_id,
    crop_variety_id: row.crop_variety_id?.toString(),
    seed_label_package: row.label_package,

    seed_lab_id: row.seed_lab_id,
    quantity:row.quantity?.toString(),
    available_stock:row.available_stock,
    status_comment: row.available_stock,
    image_id: row.image_id,
    receipt_id: row.receipt_id || null,
    applicant_remark: row.applicant_remark || null,
    inspector_id: row.inspector_id?.toString() || null,   // cast to string for GraphQL ID consistency
    // status: row.status?.toUpperCase(),
    status: row.status,
    
    deleted: Boolean(row.deleted),
    created_at: row.created_at ? new Date(row.created_at) : null,
   
  };
};

const fetchSeedLabels = async ({
  id = null,
  user_id = null,
//   status = null,
  statusNotIn = null,
} = {}) => {
  try {
    const values = [];
    const where = ["seed_labels.deleted = 0"];

    if (id) {
      where.push("seed_labels.id = ?");
      values.push(id);
    }

    if (user_id) {
      where.push("seed_labels.user_id = ?");
      values.push(user_id);
    }

    // if (statusNotIn) {
    //   where.push("seed_labels.status = ?");
    //   values.push(status);        
    // }
    if (Array.isArray(statusNotIn) && statusNotIn.length > 0) {
      const placeholders = statusNotIn.map(() => "?").join(",");
      where.push(`seed_labels.status NOT IN (${placeholders})`);
      values.push(...statusNotIn);
    }

    const sql = `
      SELECT seed_labels.*
      FROM seed_labels
      WHERE ${where.join(" AND ")}
      ORDER BY seed_labels.created_at DESC
    `;

    const [results] = await db.execute(sql, values);
    return results.map(mapLabelsRow);
  } catch (error) {
    throw new Error(`Failed to fetch seed labels: ${error.message}`);
  }
};

const seedLabelResolvers = {
    Query: {
        getSeedLabels: async (_parent, _args, context) => {
            try {
                const user = context?.req?.user;
                const userPermissions = user?.permissions || [];

                checkPermission(
                userPermissions,
                "can_view_seed_labels", // consider a more specific permission, e.g., "can_view_seed_labels"
                "You dont have permissions to view seed labels"
                );

                const can_manage_all_forms = hasPermission(
                userPermissions,
                "can_manage_seed_labels"
                );

                const can_view_only_assigned_seed_stock = hasPermission(
                userPermissions,
                "can_view_only_assigned_seed_lab_inspection"
                );

                const can_print_seed_labels = hasPermission(
                userPermissions,
                "can_print_seed_labels"
                );

                const can_approve_seed_labels = hasPermission(
                userPermissions,
                "can_approve_seed_labels"
                );

                let statusNotIn = null;
                 statusNotIn = (() => {
                if (can_print_seed_labels) return  ["pending", "rejected"];
                return null;
                })();
                
                const labs = await fetchSeedLabels({
                user_id: can_manage_all_forms ? null : user?.id ?? null,
                // status: status,
                statusNotIn: statusNotIn,
                });

                return labs;
            } catch (error) {
                throw new Error(`Failed to fetch seed labels: ${error.message}`);
            }
        },

        getSeedLabel: async (_parent, _args, context) => {
            try {
                const { id } = _args;
                const user = context?.req?.user;
                const userPermissions = user?.permissions || [];
                console.log("ID here:", id)

                checkPermission(
                userPermissions,
                "can_view_seed_labels", // consider a more specific permission, e.g., "can_view_seed_labels"
                "You dont have permissions to view seed labels"
                );

                const can_manage_all_forms = hasPermission(
                userPermissions,
                "can_manage_seed_labels"
                );

                const can_view_only_assigned_seed_stock = hasPermission(
                userPermissions,
                "can_view_only_assigned_seed_lab_inspection"
                );

                const can_print_seed_labels = hasPermission(
                userPermissions,
                "can_print_seed_labels"
                );

                const can_approve_seed_labels = hasPermission(
                userPermissions,
                "can_approve_seed_labels"
                );

                const status = (() => {
                if (can_print_seed_labels) return "approved";
                return null;
                })();
                
                const labs = await fetchSeedLabels({
                id,
                // user_id: can_manage_all_forms ? null : user?.id ?? null,
                // status: status,
                });

                return labs;
            } catch (error) {
                throw new Error(`Failed to fetch seed labels: ${error.message}`);
            }
        },

    },
    SeedLabel: {
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
        CropVariety: async (parent) => {
            try {
            
            const variety_id = parent.crop_variety_id;
    
            if (!variety_id) return null;
    
            const variety = await fetchVarietyById(variety_id);
    
            return variety;
            } catch (error) {
                console.error("Error fetching crop variety:", error);
                throw new GraphQLError(error.message);
            }
        },
        Crop: async (parent) => {
            try {
                // 1️⃣ Get the variety based on crop_variety_id
                const [varietyRows] = await db.execute(
                "SELECT * FROM crop_varieties WHERE id = ?",
                [parent.crop_variety_id]
                );

                if (!varietyRows || varietyRows.length === 0) {
                return null; // no variety found
                }

                const variety = varietyRows[0];

                // 2️⃣ Get the crop based on the variety’s crop_id
                const [cropRows] = await db.execute(
                "SELECT * FROM crops WHERE id = ?",
                [variety.crop_id]
                );

                if (!cropRows || cropRows.length === 0) {
                return null; // no crop found
                }

                return cropRows[0];
            } catch (error) {
                console.error("Error fetching crop:", error);
                throw new Error("Failed to load crop.");
            }
        },


        SeedLab: async (parent) => {
            try {
                const seed_lab_id = parent.seed_lab_id;
        
                const [seedLab] = await fetchSeedLabs({
                  id: seed_lab_id,
                });
                return seedLab;
            } catch (error) {
                throw new GraphQLError(error.message);
            }
        },
    },

    Mutation: {
        saveSeedLabelRequest: async (_parent, args, context) => {
            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();
                const {
                    id,
                    receipt,
                    applicant_remark,
                    seed_lab_id,
                    seed_label_package,
                    quantity,
                    available_stock,
                    image,
                } = args.input;

                console.log(args.input)
                const user = context?.req?.user;
                const userPermissions = user?.permissions || [];

                checkPermission(
                  userPermissions,
                  "can_view_seed_labels",
                  "You dont have permissions to request seed lab inspection"
                );

                let seed_lab = {};
                
                if (seed_lab_id) {

                    seed_lab = await fetchSeedLabs({
                        id: seed_lab_id,
                        user_id: user.id,
                    });
                    console.log(" seed_lab:", seed_lab[0]?.variety_id);
                }

                const data = {
                    user_id: user.id,
                    crop_variety_id: seed_lab[0]?.variety_id || null,
                    seed_lab_id,
                    label_package:seed_label_package,
                    quantity/* : parseInt(quantity), */,
                    available_stock,
                    applicant_remark,
                }
                console.log("data.........", data)

                const save_id = await saveData({
                table: "seed_labels",
                data,
                id,
                connection
                });

                // If a receipt was uploaded, save it and capture its public path
                let savedReceiptInfo = null;
                let savedImageInfo = null;
                if (receipt && image) {
                try {
                    savedReceiptInfo = await saveUpload({
                    file: receipt,
                    subdir: "receipts",
                    });

                    savedImageInfo = await saveUpload({
                    file: image,
                    subdir: "imgs",
                    });

                } catch (e) {
                    // If upload fails, rollback and bubble up
                    throw new GraphQLError(`Receipt and image upload failed: ${e.message}`);
                }
                }

                // Record attachment metadata in form_attachments if a receipt was uploaded
                if (savedReceiptInfo && savedImageInfo) {
                try {
                    // Update application_forms with receipt_id
                    await saveData({
                    table: "seed_labels",
                    data: { receipt_id: savedReceiptInfo.filename, image_id: savedImageInfo.filename },
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
                message: "Seed Label Request saved successfully",
                data: {
                    id: save_id,
                    status: "pending",
                    ...data,
                },
                };
                
            } catch (error) {
                throw new Error(`Failed to save seed lab request: ${error.message}`);
            }
        },
        approveSeedLabelRequest: async (parent, args, context) => {
            const connection = await db.getConnection();
            try {
                console.log("Approving Seed Label with ID:", args);
                const form_id  = args.id;
                console.log("Form ID to approve:", form_id);
                const userPermissions = context.req.user.permissions;
                await connection.beginTransaction();

                // check if user has permission to assign an inspector
                checkPermission(
                userPermissions,
                "can_approve_seed_labels",
                "You don't have permissions to approve a seed label"
                );

                // fetch the form details
                const [formDetails] = await fetchSeedLabels({
                id: form_id,
                });

                if (!formDetails)
                throw new GraphQLError("Form with the provided id is not found!");

                // get the user associated to that form
                const [formOwner] = await getUsers({
                id: formDetails.user_id,
                });

                if (!formOwner) throw new GraphQLError("Form owner not found!");

                // update the form status/validity on application_forms
                const data = {
                status: "approved",
                // user_id: formDetails.user_id,
                // seed_lab_id: formDetails.seed_lab_id,
                // crop_variety_id: formDetails.crop_variety_id,
                // status_comment: "Accepted",
                };

                await saveData({
                table: "seed_labels",
                data,
                id: form_id,
                connection,
                });

                
                // send email with attachment if any
                await sendEmail({
                from: '"STTS MAAIF" <tredumollc@gmail.com>',
                to: formOwner.email,
                subject: `${formDetails.form_type} Form Approval`,
                message: `Congragulations!!!, Dear ${formOwner.name}, Your seed label has been approved.`,
                // attachments,
                });

                await connection.commit();

                return {
                success: true,
                message: "Seed label request approved successfully",
                };
            } catch (error) {
                console.error("Error approving seed label request:", error);
                await connection.rollback();
                throw new GraphQLError(error.message);
            }
        },
        printSeedLabelRequest: async (parent, args, context) => {
            const connection = await db.getConnection();
            try {
                console.log("Printing Seed Label with ID:", args);
                const form_id  = args.id;
                console.log("Form ID to print:", form_id);
                const userPermissions = context.req.user.permissions;
                await connection.beginTransaction();

                // check if user has permission to assign an inspector
                checkPermission(
                userPermissions,
                "can_print_seed_labels",
                "You don't have permissions to print a seed label"
                );

                // fetch the form details
                const [formDetails] = await fetchSeedLabels({
                id: form_id,
                });

                if (!formDetails)
                throw new GraphQLError("Form with the provided id is not found!");

                // get the user associated to that form
                const [formOwner] = await getUsers({
                 id: formDetails.user_id,
                });

                if (!formOwner) throw new GraphQLError("Form owner not found!");

                // update the form status/validity on application_forms
                const data = {
                status: "printed",
                
                };

                await saveData({
                table: "seed_labels",
                data,
                id: form_id,
                connection,
                });

                // const label = await fetchSeedLabels({ id });
                const lab_id = formDetails.seed_lab_id;
                const marketableSeed = await fetchSeedLabs({ id:lab_id });
                const packages = formDetails.quantity/ formDetails.label_package;
                const product ={
                    user_id: formDetails.user_id,
                    crop_variety_id : formDetails.crop_variety_id,
                    seed_lab_id : formDetails.seed_lab_id,
                    seed_label_id : formDetails.id,

                    quantity : formDetails.label_package,
                    available_stock : packages,
                    lab_test_number : marketableSeed[0].lab_test_number,
                    lot_number : marketableSeed[0].lot_number,
                    seed_class : marketableSeed[0].lot_number,
                    image_url : marketableSeed[0].lot_number,
                }

                await saveData({
                table: "products",
                data:product,
                id: null,
                connection,
                });

                // send email with attachment if any
                await sendEmail({
                from: '"STTS MAAIF" <tredumollc@gmail.com>',
                to: formOwner.email,
                subject: `${formDetails.form_type} Form Approval`,
                message: `Congragulations!!!, Dear ${formOwner.name}, Your seed label has been approved.`,
                // attachments,
                });

                await connection.commit();

                return {
                success: true,
                message: "Seed label request printed successfully",
                };
            } catch (error) {
                console.error("Error printing seed label request:", error);
                await connection.rollback();
                throw new GraphQLError(error.message);
            }
        },
    }
}

export default seedLabelResolvers;