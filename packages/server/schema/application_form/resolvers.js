import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import saveData from "../../utils/db/saveData.js";
import { JSONResolver } from "graphql-scalars";
import tryParseJSON from "../../helpers/tryParseJSON.js";
import checkPermission from "../../helpers/checkPermission.js";
import hasPermission from "../../helpers/hasPermission.js";
import { getUsers } from "../user/resolvers.js";
import saveUpload from "../../helpers/saveUpload.js";
import { getRoles } from "../role/resolvers.js";
import sendEmail from "../../utils/emails/email_server.js";
import generateSeedBoardRegNo from "../../helpers/generateSeedBoardRegNo.js";
import renderTemplate from "../../helpers/renderTemplate.js";
import formatDate from "../../helpers/formatDate.js";
import { fileURLToPath } from "url";
import path from "path";
import htmlToPdf from "../../helpers/htmlToPdf.js";
import { Console } from "console";

export const getForms = async ({
  id = null,
  form_type,
  user_id,
  inspector_id = null,
  user_assigned_forms,
  status
}) => {
  console.log({
    id,
    form_type,
    user_id,
    inspector_id,
    user_assigned_forms,
  });
  try {
    let values = [];
    let where = "";
    let extra_join = "";
    let extra_select = "";

    if (id) {
      where += " AND application_forms.id = ?";
      values.push(id);
    }

    if (user_id) {
      if (!user_assigned_forms) {
        where += " AND application_forms.user_id = ?";
        values.push(user_id);
      }
    }

    if (form_type) {
      where += " AND application_forms.form_type = ?";
      values.push(form_type);
    }
    if (status) {
      where += " AND application_forms.status = ?";
      values.push(status);
    }

    if (inspector_id) {
      where += " AND application_forms.inspector_id = ?";
      values.push(inspector_id);
    }

    if (user_assigned_forms) {
      where += " AND application_forms.inspector_id = ?";
      values.push(user_assigned_forms);
    }

    if (form_type == "sr4") {
      extra_join +=
        " LEFT JOIN sr4_application_forms ON sr4_application_forms.application_form_id = application_forms.id";
      extra_select += ` sr4_application_forms.experienced_in,
                        sr4_application_forms.processing_of, 
                        sr4_application_forms.marketing_of,
                        sr4_application_forms.have_adequate_land, 
                        sr4_application_forms.land_size, 
                        sr4_application_forms.equipment, 
                        sr4_application_forms.have_adequate_equipment, 
                        sr4_application_forms.have_contractual_agreement, 
                        sr4_application_forms.have_adequate_field_officers, 
                        sr4_application_forms.have_conversant_seed_matters, 
                        sr4_application_forms.have_adequate_land_for_production, 
                        sr4_application_forms.have_internal_quality_program, 
                        sr4_application_forms.source_of_seed,  
                        sr4_application_forms.accept_declaration, 
                        sr4_application_forms.dealers_in_other, 
                        sr4_application_forms.marketing_of_other, 
                        sr4_application_forms.seed_board_registration_number, 
                        sr4_application_forms.processing_of_other,
                        sr4_application_forms.type,
                        `;
    }

    if (form_type == "sr6") {
      extra_join +=
        " LEFT JOIN sr6_application_forms ON sr6_application_forms.application_form_id = application_forms.id";
      extra_select += ` sr6_application_forms.have_adequate_isolation,
                            sr6_application_forms.have_adequate_labor, 
                            sr6_application_forms.aware_of_minimum_standards,
                            sr6_application_forms.seed_grower_in_past, 
                            sr6_application_forms.type,
                            sr6_application_forms.other_documents,
                            `;
    }

    if (form_type == "qds") {
      extra_join +=
        " LEFT JOIN qds_application_forms ON qds_application_forms.application_form_id = application_forms.id";
      extra_select += ` qds_application_forms.certification,
                            qds_application_forms.inspector_comment, 
                            qds_application_forms.have_been_qds,
                            qds_application_forms.isolation_distance, 
                            qds_application_forms.number_of_labors, 
                            qds_application_forms.have_adequate_storage_facility, 
                            qds_application_forms.is_not_used, 
                            qds_application_forms.examination_category, 
                            qds_application_forms.recommendation_id, 
                            `;
    }

    let sql = `
      SELECT 
      ${extra_select}
      application_forms.*
      FROM
      application_forms
      ${extra_join}
      WHERE application_forms.deleted = 0 ${where}
      ORDER BY created_at DESC
    `;

    const [results] = await db.execute(sql, values);

    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching forms");
  }
};

const applicationFormsResolvers = {
  JSON: JSONResolver,
  Query: {
    sr4_applications: async (_, args, context) => {
      try {
        const user_id = context.req.user.id;
        const userPermissions = context.req.user.permissions;

        checkPermission(
          userPermissions,
          "can_view_sr4_forms",
          "You dont have permissions to view SR4 forms"
        );

        // The permissions
        const can_manage_all_forms = hasPermission(
          userPermissions,
          "can_manage_all_forms"
        );

        const can_view_specific_assigned_forms = hasPermission(
          userPermissions,
          "can_view_specific_assigned_forms"
        );

        const results = await getForms({
          user_id: !can_manage_all_forms ? user_id : null,
          form_type: "sr4",
          user_assigned_forms: can_view_specific_assigned_forms
            ? user_id
            : false,
        });

        return results;
      } catch (error) {
        console.log(error.message);
      }
    },
    sr4_application_details: async (_, args, context) => {
      const { id } = args;
      const userPermissions = context.req.user.permissions;

      checkPermission(
        userPermissions,
        "can_view_sr4_forms",
        "You dont have permissions to view SR4 forms"
      );

      const results = await getForms({
        id,
        form_type: "sr4",
      });

      return results[0];
    },
    sr6_applications: async (_, args, context) => {
      const user_id = context.req.user.id;
      const userPermissions = context.req.user.permissions;

      checkPermission(
        userPermissions,
        "can_view_sr6_forms",
        "You dont have permissions to view SR6 forms"
      );

      // The permissions
      const can_manage_all_forms = hasPermission(
        userPermissions,
        "can_manage_all_forms"
      );

      const can_view_specific_assigned_forms = hasPermission(
        userPermissions,
        "can_view_specific_assigned_forms"
      );

      const results = await getForms({
        user_id: !can_manage_all_forms ? user_id : null,
        form_type: "sr6",
        user_assigned_forms: can_view_specific_assigned_forms ? user_id : false,
      });

      return results;
    },
    sr6_application_details: async (_, args, context) => {
      const { id } = args;
      const userPermissions = context.req.user.permissions;

      checkPermission(
        userPermissions,
        "can_view_sr6_forms",
        "You dont have permissions to view SR6 forms"
      );

      const results = await getForms({
        id,
        form_type: "sr6",
      });

      return results[0];
    },
    qds_applications: async (_, args, context) => {
      const user_id = context.req.user.id;
      const userPermissions = context.req.user.permissions;

      checkPermission(
        userPermissions,
        "can_view_qds_forms",
        "You dont have permissions to view QDs forms"
      );
      return await getForms({
        user_id: hasPermission(userPermissions, "can_manage_all_forms")
          ? null
          : user_id,
        form_type: "qds",
      });
    },
    qds_application_details: async (_, args, context) => {
      const { id } = args;
      const userPermissions = context.req.user.permissions;

      checkPermission(
        userPermissions,
        "can_view_qds_forms",
        "You dont have permissions to view QDs forms"
      );

      const results = await getForms({
        id,
        form_type: "qds",
      });

      return results[0];
    },
    inspectors: async (_, args, context) => {
      try {
        // load the inspector role id
        const [existingRole] = await getRoles({
          role_name: "inspector",
        });

        if (!existingRole) {
          // can create the role here
          throw new GraphQLError(
            "Inspector role not found, Please create the role and try again"
          );
        }

        const inspectors = await getUsers({
          role_id: existingRole.id,
        });

        return inspectors;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
  SR4ApplicationForm: {
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
  },
  SR6ApplicationForm: {
    inspector: async (parent, args, context) => {
      try {
        const inspector_id = parent.inspector_id;

        if (!inspector_id) return null;

        if (!inspector_id) return null;
        const [user] = await getUsers({
          id: inspector_id,
        });

        return user;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
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
  },
  QDsApplicationForm: {
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
  },
  Mutation: {
    saveSr4Form: async (parent, args, context) => {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        const user_id = context.req.user.id;
        const {
          id,
          years_of_experience,
          experienced_in,
          dealers_in,
          marketing_of,
          have_adequate_land,
          land_size,
          equipment,
          have_adequate_equipment,
          have_contractual_agreement,
          have_adequate_field_officers,
          have_conversant_seed_matters,
          have_adequate_land_for_production,
          have_internal_quality_program,
          source_of_seed,
          receipt,
          accept_declaration,
          // valid_from,
          // valid_until,
          status,
          // status_comment,
          // recommendation,
          // inspector_id,
          dealers_in_other,
          marketing_of_other,
          have_adequate_storage,
          // seed_board_registration_number,
          type,
          // processing_of_other,
        } = args.payload;

        // if the user wants to update the form, that form should be in the pending state
        if (id) {
          // check the current form status
          const [form] = await getForms({
            id,
          });

          if (!form) throw new GraphQLError("Form not found1");

          if (form.status !== "pending")
            throw new GraphQLError("Editing this form is no longer allowed");
        }

        // construct the data object for application forms
        let data = {
          user_id,
          years_of_experience,
          status,
          status: "pending",
          have_adequate_storage,
          dealers_in,
          form_type: "sr4",
        };

        console.log("data", data);

        const save_id = await saveData({
          table: "application_forms",
          data,
          id,
          connection,
        });

        // If a receipt was uploaded, save it and capture its public path
        let savedReceiptInfo = null;
        if (receipt) {
          try {
            savedReceiptInfo = await saveUpload({
              file: receipt,
              subdir: "form_attachments",
            });
          } catch (e) {
            // If upload fails, rollback and bubble up
            throw new GraphQLError(`Receipt upload failed: ${e.message}`);
          }
        }

        // data object for sr4 Forms (conditionally include receipt only if provided)
        let sr4_data = {
          application_form_id: save_id,
          experienced_in,
          type,
          // processing_of,
          have_adequate_land,
          land_size,
          // equipment,
          have_adequate_equipment,
          have_contractual_agreement,
          have_adequate_field_officers,
          have_conversant_seed_matters,
          have_adequate_land_for_production,
          have_internal_quality_program,
          source_of_seed: source_of_seed || null,
          dealers_in_other: dealers_in_other || null,
          accept_declaration: accept_declaration || null,
          marketing_of,
        };

        // Do not set receipt on sr4 table; receipt_id is kept on application_forms

        console.log("sr4_data", sr4_data);

        const save_id2 = await saveData({
          table: "sr4_application_forms",
          data: sr4_data,
          id,
          idColumn: "application_form_id",
          connection,
        });

        // Record attachment metadata in form_attachments if a receipt was uploaded
        if (savedReceiptInfo) {
          try {
            // const attachment_id = await saveData({
            //   table: "form_attachments",
            //   data: {
            //     application_form_id: save_id,
            //     form_type: "sr4",
            //     field: "receipt",
            //     file_name: savedReceiptInfo.filename,
            //     file_path: savedReceiptInfo.path,
            //   },
            //   connection,
            // });

            // Update application_forms with receipt_id
            await saveData({
              table: "application_forms",
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
          message: args.payload.id
            ? " SR4 form updated successfully"
            : "SR4 form Created Successfully",
          result: {
            id: save_id,
            ...data,
            ...sr4_data,
          },
        };
      } catch (error) {
        await connection.rollback();
        throw new GraphQLError(error.message);
      }
    },
    saveSr6Form: async (parent, args, context) => {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        const user_id = context.req.user.id;
        const {
          id,
          years_of_experience,
          dealers_in,
          previous_grower_number,
          cropping_history,
          have_adequate_isolation,
          have_adequate_labor,
          aware_of_minimum_standards,
          signature_of_applicant,
          grower_number,
          status,
          receipt,
          other_documents,
          inspector_id,
          status_comment,
          recommendation,
          have_adequate_storage,
          seed_grower_in_past,
          type,
        } = args.payload;

        // if the user wants to update the form, that form should be in the pending state
        if (id) {
          // check the current form status
          const [form] = await getForms({
            id,
          });

          if (!form) throw new GraphQLError("Form not found1");

          if (form.status !== "pending")
            throw new GraphQLError("Editing this form is no longer allowed");
        }
        // construct the data object for application forms
        let data = {
          user_id,
          years_of_experience,
          dealers_in,
          previous_grower_number,
          cropping_history,
          signature_of_applicant,
          grower_number,
          status: id ? status : "pending",
          inspector_id,
          status_comment,
          recommendation,
          have_adequate_storage,
          form_type: "sr6",
        };

        const save_id = await saveData({
          table: "application_forms",
          data,
          id,
          connection,
        });

        // If a receipt was uploaded, save it and capture its public path
        let savedReceiptInfo = null;
        if (receipt) {
          try {
            savedReceiptInfo = await saveUpload({
              file: receipt,
              subdir: "form_attachments",
            });
          } catch (e) {
            // If upload fails, rollback and bubble up
            throw new GraphQLError(`Receipt upload failed: ${e.message}`);
          }
        }

        // data object for sr4 Forms
        let sr6_data = {
          application_form_id: save_id,
          have_adequate_isolation,
          have_adequate_labor,
          aware_of_minimum_standards,
          seed_grower_in_past,
          type,
        };

        const save_id2 = await saveData({
          table: "sr6_application_forms",
          data: sr6_data,
          id,
          idColumn: "application_form_id",
          connection,
        });

        let savedDocuments = null;
        if (other_documents) {
          try {
            savedDocuments = await saveUpload({
              file: other_documents,
              subdir: "form_attachments",
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
              table: "application_forms",
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

        // Record attachment metadata in form_attachments if a receipt was uploaded
        if (savedDocuments) {
          try {
            // Update application_forms with receipt_id
            await saveData({
              table: "sr6_application_forms",
              data: { other_documents: savedDocuments.filename },
              id: save_id2,
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
          message: args.payload.id
            ? "SR6 form updated successfully"
            : "SR6 form Created Successfully",
          result: {
            id: save_id,
            ...data,
            ...sr6_data,
          },
        };
      } catch (error) {
        console.log("error", error);
        await connection.rollback();
        throw new GraphQLError(error.message);
      }
    },
    saveQdsForm: async (parent, args, context) => {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        const user_id = context.req.user.id;
        const {
          id,
          certification,
          receipt,
          recommendation_id,
          years_of_experience,
          dealers_in,
          previous_grower_number,
          cropping_history,
          have_adequate_isolation,
          have_adequate_labor,
          aware_of_minimum_standards,
          signature_of_applicant,
          grower_number,
          registration_number,
          status,
          have_been_qds,
          isolation_distance,
          number_of_labors,
          have_adequate_storage_facility,
          is_not_used,
          examination_category,
        } = args.payload;

        console.log(args.payload);

        // if the user wants to update the form, that form should be in the pending state
        if (id) {
          // check the current form status
          const [form] = await getForms({
            id,
          });

          if (!form) throw new GraphQLError("Form not found1");

          if (form.status !== "pending")
            throw new GraphQLError("Editing this form is no longer allowed");
        }

        // construct the data object for application forms
        let data = {
          user_id,
          years_of_experience,
          dealers_in,
          previous_grower_number,
          cropping_history,
          signature_of_applicant,
          grower_number,
          registration_number,
          status: "pending",
          form_type: "qds",
        };

        const save_id = await saveData({
          table: "application_forms",
          data,
          id,
          connection,
        });

        // If a receipt was uploaded, save it and capture its public path
        let savedReceiptInfo2 = null;
        if (receipt) {
          try {
            savedReceiptInfo2 = await saveUpload({
              file: receipt,
              subdir: "form_attachments",
            });
          } catch (e) {
            // If upload fails, rollback and bubble up
            throw new GraphQLError(`Receipt upload failed: ${e.message}`);
          }
        }

        // data object for qds Forms
        let qds_data = {
          application_form_id: save_id,
          have_adequate_isolation,
          have_adequate_labor,
          aware_of_minimum_standards,
          have_been_qds,
          isolation_distance,
          number_of_labors,
          have_adequate_storage_facility,
          is_not_used,
          examination_category,
        };

        const save_id3 = await saveData({
          table: "qds_application_forms",
          data: qds_data,
          id,
          idColumn: "application_form_id",
          connection,
        });

        let certificationDoc = null;
        if (certification) {
          try {
            certificationDoc = await saveUpload({
              file: certification,
              subdir: "form_attachments",
            });
          } catch (e) {
            // If upload fails, rollback and bubble up
            throw new GraphQLError(`Certification upload failed: ${e.message}`);
          }
        }

        let recommendationDoc = null;
        if (recommendation_id) {
          try {
            recommendationDoc = await saveUpload({
              file: recommendation_id,
              subdir: "form_attachments",
            });
          } catch (e) {
            // If upload fails, rollback and bubble up
            throw new GraphQLError(
              `Recommendation upload failed: ${e.message}`
            );
          }
        }

        // Record attachment metadata in form_attachments if a receipt was uploaded
        if (savedReceiptInfo2) {
          try {
            // Update application_forms with receipt_id
            await saveData({
              table: "application_forms",
              data: { receipt_id: savedReceiptInfo2.filename },
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

        // Record attachment metadata in form_attachments if a receipt was uploaded
        if (certificationDoc) {
          try {
            // Update application_forms with receipt_id
            await saveData({
              table: "qds_application_forms",
              data: { certification: certificationDoc.filename },
              id: save_id3,
              connection,
            });
          } catch (e) {
            // Non-fatal for the core form save; log but do not block
            console.error(
              "Failed to save form_attachments record or update certification:",
              e.message
            );
          }
        }

        // Record attachment metadata in form_attachments if a receipt was uploaded
        if (recommendationDoc) {
          try {
            // Update application_forms with receipt_id
            await saveData({
              table: "qds_application_forms",
              data: { recommendation_id: recommendationDoc.filename },
              id: save_id3,
              connection,
            });
          } catch (e) {
            // Non-fatal for the core form save; log but do not block
            console.error(
              "Failed to save form_attachments record or update recommendation_id:",
              e.message
            );
          }
        }

        await connection.commit();

        return {
          success: true,
          message: args.payload.id
            ? "QDs form updated successfully"
            : "QDs form Created Successfully",
          result: {
            id: save_id,
            ...data,
            ...qds_data,
          },
        };
      } catch (error) {
        console.log("error", error);
        await connection.rollback();
        throw new GraphQLError(error.message);
      }
    },
    assignInspector: async (parent, args, context) => {
      try {
        const { inspector_id, form_id } = args.payload;
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
        const [formDetails] = await getForms({
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
          table: "application_forms",
          data,
          id: form_id,
        });

        // send a notification to the assigned inspector
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: inspector.email,
          subject: "Inspector Assignment",
          message: `Dear ${inspector.name}, You have been assigned as the inspector for ${formOwner.name}'s ${formDetails.form_type} application `,
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
    haltForm: async (parent, args, context) => {
      try {
        const { form_id, reason } = args.payload;
        const userPermissions = context.req.user.permissions;

        // check if user has permission to assign an inspector
        checkPermission(
          userPermissions,
          "can_halt",
          "You don't have permissions to halt a form"
        );

        // fetch the form details
        const [formDetails] = await getForms({
          id: form_id,
        });

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
          table: "application_forms",
          data,
          id: form_id,
        });

        // send another email to the form owner
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: formOwner.email,
          subject: `${formDetails.form_type} Form Halted`,
          message: `Dear ${formOwner.name}, Your form haas been halted. Please go to the system to see the reason`,
        });

        return {
          success: true,
          message: "Form halted successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    rejectForm: async (parent, args, context) => {
      try {
        const { form_id, reason } = args.payload;
        const userPermissions = context.req.user.permissions;

        // check if user has permission to assign an inspector
        checkPermission(
          userPermissions,
          "can_reject",
          "You don't have permissions to reject a form"
        );

        // fetch the form details
        const [formDetails] = await getForms({
          id: form_id,
        });

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
          table: "application_forms",
          data,
          id: form_id,
        });

        // send another email to the form owner
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: formOwner.email,
          subject: `${formDetails.form_type} Form Rejection`,
          message: `Dear ${formOwner.name}, Your form haas been rejected. Please go to the system to see the reason`,
        });

        return {
          success: true,
          message: "Form rejected successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    recommend: async (parent, args, context) => {
      try {
        const { form_id, reason } = args.payload;
        const userPermissions = context.req.user.permissions;

        // check if user has permission to assign an inspector
        checkPermission(
          userPermissions,
          "can_recommend",
          "You don't have permissions to make recommendations"
        );

        // fetch the form details
        const [formDetails] = await getForms({
          id: form_id,
        });

        if (!formDetails)
          throw new GraphQLError("Form with the provided id is not found!");

        // get the user associated to that form
        const [formOwner] = await getUsers({
          id: formDetails.user_id,
        });

        if (!formOwner) throw new GraphQLError("Form owner not found!");

        // updated the form status
        const data = {
          inspector_comment: reason,
          status: "recommended",
        };

        await saveData({
          table: "application_forms",
          data,
          id: form_id,
        });

        // send another email to the form owner
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: formOwner.email,
          subject: `${formDetails.form_type} Form Recommendation`,
          message: `Dear ${formOwner.name}, Your form haas been recommended. The form is now submitted back to the commissioner`,
        });

        return {
          success: true,
          message: "Form recommended successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    approveForm: async (parent, args, context) => {
      const connection = await db.getConnection();
      try {
        const { form_id } = args.payload;
        const userPermissions = context.req.user.permissions;
        await connection.beginTransaction();

        // check if user has permission to assign an inspector
        checkPermission(
          userPermissions,
          "can_approve",
          "You don't have permissions to approve a form"
        );

        // fetch the form details
        const [formDetails] = await getForms({
          id: form_id,
        });

        if (!formDetails)
          throw new GraphQLError("Form with the provided id is not found!");

        // get the user associated to that form
        const [formOwner] = await getUsers({
          id: formDetails.user_id,
        });

        if (!formOwner) throw new GraphQLError("Form owner not found!");

        // default validity window

        const now = new Date();
        const validFrom = formDetails.valid_from
          ? new Date(formDetails.valid_from)
          : now;
        const validUntil = formDetails.valid_until
          ? new Date(formDetails.valid_until)
          : new Date(
              new Date(validFrom).setFullYear(validFrom.getFullYear() + 1)
            );

        // update the form status/validity on application_forms
        const data = {
          status: "approved",
          valid_from: validFrom,
          valid_until: validUntil,
          status_comment: "Accepted",
        };

        await saveData({
          table: "application_forms",
          data,
          id: form_id,
          connection,
        });

        let is_grower = false;
        let is_merchant = false;
        let is_qds_producer = false;

        if (formDetails.form_type === "sr4") {
          // generate SR4 seed board reg number if missing
          let seedBoardReg = formDetails.seed_board_registration_number;
          if (!seedBoardReg) {
            seedBoardReg = generateSeedBoardRegNo({ prefix: "MAAIF/MER" });
            await saveData({
              table: "application_forms",
              data: { seed_board_registration_number: seedBoardReg },
              id: form_id,
              idColumn: "application_form_id",
              connection,
            });
          }

          is_merchant = true;

          // Prepare certificate HTML
          // const __filename = fileURLToPath(import.meta.url);
          // const __dirname = path.dirname(__filename);
          // const templatePath = path.join(
          //   __dirname,
          //   "../../templates/sr4form.html"
          // );

          // const serialNo = String(Math.floor(1000 + Math.random() * 9000));

          // // try to embed coat image as data URI
          // const publicDir = path.join(__dirname, "../../public");
          // const possibleCoatPaths = [
          //   path.join(publicDir, "imgs", "coat.png"),
          //   path.join(publicDir, "imgs", "coat.jpg"),
          //   path.join(publicDir, "imgs", "coat.jpeg"),
          //   path.join(publicDir, "logos", "coat.png"),
          //   path.join(publicDir, "logos", "coat.jpg"),
          //   path.join(publicDir, "logos", "coat.jpeg"),
          // ];
          // let coatImageSrc = "";
          // for (const p of possibleCoatPaths) {
          //   try {
          //     const { default: fileToDataUri } = await import(
          //       "../../helpers/fileToDataUri.js"
          //     );
          //     coatImageSrc = fileToDataUri(p);
          //     if (coatImageSrc) break;
          //   } catch (_) {
          //     // ignore
          //   }
          // }

          // const certificateHtml = renderTemplate({
          //   templatePath,
          //   data: {
          //     coat_image_src: coatImageSrc,
          //     serial_no: serialNo,
          //     registration_number: seedBoardReg,
          //     valid_from: formatDate(validFrom),
          //     valid_until: formatDate(validUntil),
          //     company_initials: formOwner.company_initials || "",
          //     address: formOwner.address || formOwner.premises_location || "",
          //     premises_location: formOwner.premises_location || "",
          //     phone_number: formOwner.phone_number || "",
          //     category: formDetails.marketing_of || "",
          //     date: formatDate(now),
          //   },
          // });

          // // Convert HTML to PDF buffer
          // let pdfBuffer;
          // try {
          //   pdfBuffer = await htmlToPdf(certificateHtml);
          // } catch (e) {
          //   throw new GraphQLError(
          //     `Failed to generate PDF: ${e.message}. Please install puppeteer (npm i puppeteer).`
          //   );
          // }

          // attachments = [
          //   {
          //     filename: `sr4_certificate_${form_id}.pdf`,
          //     content: pdfBuffer,
          //     contentType: "application/pdf",
          //   },
          // ];
        }

        if (formDetails.form_type === "sr6") {
          // generate SR4 seed board reg number if missing
          let seedBoardReg = formDetails.seed_board_registration_number;
          let growerReg = formDetails.grower_number;
          if (!seedBoardReg) {
            if (formDetails.type == "seed_breeder") {
              seedBoardReg = generateSeedBoardRegNo({ prefix: "MAAIF/SB" });
              growerReg = generateSeedBoardRegNo({ prefix: "NSCS/SB" });
            } else {
              seedBoardReg = generateSeedBoardRegNo({ prefix: "MAAIF/PB" });
              growerReg = generateSeedBoardRegNo({ prefix: "NSCS/PB" });
            }
            await saveData({
              table: "application_forms",
              data: {
                seed_board_registration_number: seedBoardReg,
                grower_number: growerReg,
              },
              id: form_id,
              // idColumn: "application_form_id",
              connection,
            });
          }

          is_grower = true;

          // Prepare certificate HTML
          // const __filename = fileURLToPath(import.meta.url);
          // const __dirname = path.dirname(__filename);
          // const templatePath = path.join(
          //   __dirname,
          //   "../../templates/sr4form.html"
          // );

          // const serialNo = String(Math.floor(1000 + Math.random() * 9000));

          // // try to embed coat image as data URI
          // const publicDir = path.join(__dirname, "../../public");
          // const possibleCoatPaths = [
          //   path.join(publicDir, "imgs", "coat.png"),
          //   path.join(publicDir, "imgs", "coat.jpg"),
          //   path.join(publicDir, "imgs", "coat.jpeg"),
          //   path.join(publicDir, "logos", "coat.png"),
          //   path.join(publicDir, "logos", "coat.jpg"),
          //   path.join(publicDir, "logos", "coat.jpeg"),
          // ];
          // let coatImageSrc = "";
          // for (const p of possibleCoatPaths) {
          //   try {
          //     const { default: fileToDataUri } = await import(
          //       "../../helpers/fileToDataUri.js"
          //     );
          //     coatImageSrc = fileToDataUri(p);
          //     if (coatImageSrc) break;
          //   } catch (_) {
          //     // ignore
          //   }
          // }

          // const certificateHtml = renderTemplate({
          //   templatePath,
          //   data: {
          //     coat_image_src: coatImageSrc,
          //     serial_no: serialNo,
          //     registration_number: seedBoardReg,
          //     valid_from: formatDate(validFrom),
          //     valid_until: formatDate(validUntil),
          //     company_initials: formOwner.company_initials || "",
          //     address: formOwner.address || formOwner.premises_location || "",
          //     premises_location: formOwner.premises_location || "",
          //     phone_number: formOwner.phone_number || "",
          //     category: formDetails.marketing_of || "",
          //     date: formatDate(now),
          //   },
          // });

          // // Convert HTML to PDF buffer
          // let pdfBuffer;
          // try {
          //   pdfBuffer = await htmlToPdf(certificateHtml);
          // } catch (e) {
          //   throw new GraphQLError(
          //     `Failed to generate PDF: ${e.message}. Please install puppeteer (npm i puppeteer).`
          //   );
          // }

          // attachments = [
          //   {
          //     filename: `sr4_certificate_${form_id}.pdf`,
          //     content: pdfBuffer,
          //     contentType: "application/pdf",
          //   },
          // ];
        }

        if (formDetails.form_type === "qds") {
          // generate SR4 seed board reg number if missing
          let seedBoardReg = formDetails.seed_board_registration_number;
          let growerReg = formDetails.grower_number;
          if (!seedBoardReg) {
            seedBoardReg = generateSeedBoardRegNo({ prefix: "MAAIF/QDS" });
            growerReg = generateSeedBoardRegNo({ prefix: "NSCS/QDS" });

            await saveData({
              table: "application_forms",
              data: {
                seed_board_registration_number: seedBoardReg,
                grower_number: growerReg,
              },
              id: form_id,
              // idColumn: "application_form_id",
              connection,
            });
          }

          is_qds_producer = true;
        }

        // update user access level based on the form type
        const userData = {
          is_grower,
          is_merchant,
          is_qds_producer,
        };

        await saveData({
          table: "users",
          data: userData,
          id: formOwner.id,
        });

        // send email with attachment if any
        await sendEmail({
          from: '"STTS MAAIF" <tredumollc@gmail.com>',
          to: formOwner.email,
          subject: `${formDetails.form_type} Form Approval`,
          message: `Congragfulations!!!, Dear ${formOwner.name}, Your form has been approved.`,
          // attachments,
        });

        await connection.commit();

        return {
          success: true,
          message: "Form approved successfully",
        };
      } catch (error) {
        await connection.rollback();
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default applicationFormsResolvers;
