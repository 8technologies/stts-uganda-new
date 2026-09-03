import { GraphQLError } from "graphql";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../../config/config.js";
import checkPermission from "../../helpers/checkPermission.js";
import hasPermission from "../../helpers/hasPermission.js";
import saveData from "../../utils/db/saveData.js";
import { fetchExaminations } from "../stock_examinations/resolvers.js";
import saveUpload from "../../helpers/saveUpload.js";
import { getUsers } from "../user/resolvers.js";
import sendEmail from "../../utils/emails/email_server.js";
import generateLabTestNo from "../../helpers/generateLabTestNo.js";
import { fetchRecords } from "../stock_records/resolvers.js";
import fileToDataUri from "../../helpers/fileToDataUri.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coatImgDataUri = fileToDataUri(
  path.resolve(__dirname, "../../public/imgs/coat.png"),
);

const escapeHtml = (value = "") =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatReportDate = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const statusLabel = (status) => {
  if (status === "not_marketable") return "Not-Marketable";
  if (status === "marketable") return "Marketable";
  return status ? String(status).replace(/_/g, " ") : "—";
};

const valueWithPercent = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  const str = String(value);
  return str.includes("%") ? escapeHtml(str) : `${escapeHtml(str)} %`;
};

const testValue = (report, section, field) => report?.[section]?.[field] ?? "";

const buildLabTestCertificateHtml = ({
  lab,
  applicant,
  analyst,
  cropVariety,
}) => {
  const report = lab.lab_test_report || {};
  const inspectorReport = lab.inspector_report || {};
  const permitNumber = String(lab.id || "").padStart(4, "0");
  const quantity =
    inspectorReport.quantity_represented_kg || inspectorReport.quantity || "";
  const printedDate = formatReportDate(new Date());
  const receivedDate = formatReportDate(
    lab.updated_at || lab.created_at || lab.collection_date,
  );
  const recommendation = statusLabel(lab.status);

  const coatImgSrc = coatImgDataUri || "/imgs/coat.png";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lab Test Report</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; background: #e5e7eb; }
    .toolbar { display: flex; justify-content: center; gap: 10px; padding: 14px; background: #111827; position: sticky; top: 0; z-index: 2; }
    .toolbar button { border: 0; border-radius: 6px; padding: 9px 14px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .print { background: #16a34a; color: white; }
    .close { background: #e5e7eb; color: #111827; }
    .page { width: 210mm; min-height: 297mm; margin: 12px auto; padding: 11mm 12mm; background: white; }
    .certificate { min-height: 275mm; border: 2px solid #111827; padding: 9mm; position: relative; }
    .certificate::before { content: ""; position: absolute; inset: 5mm; border: 1px solid #9ca3af; pointer-events: none; }
    .content { position: relative; z-index: 1; }
    table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    th, td { border: 1px solid #111827; padding: 6px 7px; text-align: left; vertical-align: middle; font-size: 12px; line-height: 1.25; }
    th { background: #f3f4f6; font-weight: 700; }
    .borderless td { border: 0; padding: 0; }
    .center { text-align: center; }
    .right { text-align: right; }
    .small { font-size: 10px; }
    .header td { vertical-align: top; }
    .permit { font-size: 12px; padding-top: 4px; }
    .rule { font-size: 12px; padding-top: 4px; }
    .coat { width: 70px; height: 70px; object-fit: contain; margin-bottom: 5px; }
    .ministry p { font-size: 12px; line-height: 1.35; }
    .title { margin: 12px 0 9px; padding: 7px 10px; border: 1px solid #111827; text-align: center; font-size: 18px; letter-spacing: 0.04em; font-weight: 800; }
    .section-title { background: #111827; color: #fff; font-size: 12px; letter-spacing: 0.05em; text-align: center; text-transform: uppercase; }
    .meta th { width: 20%; }
    .meta td { text-align: center; font-weight: 600; }
    .results { margin-top: 10px; }
    .results th, .results td { text-align: center; word-break: break-word; }
    .results .group { background: #e5e7eb; font-size: 11px; }
    .results .label { font-size: 9px; font-weight: 700; }
    .results .value { font-size: 12px; font-weight: 700; min-height: 28px; }
    p { margin: 0; }
    .analysis-note { margin-top: 8px; font-size: 10px; }
    .recommendation { margin-top: 10px; display: inline-block; border: 1px solid #111827; padding: 6px 10px; font-size: 13px; font-weight: 800; }
    .signature { margin-top: 18px; }
    .signature-line { border-bottom: 1px dotted #111; min-height: 24px; text-align: center; font-weight: 700; }
    .signature td { border: 0; padding: 4px 8px; }
    .stamp-box { border: 1px solid #111827 !important; height: 68px; }
    .payment { width: 48%; margin-top: 12px; }
    .payment th { width: 40%; }
    .footer-note { margin-top: 14px; text-align: center; font-size: 11px; font-weight: 700; }
    .printer { margin-top: 7px; font-size: 9px; color: #374151; }
    @page { size: A4; margin: 0; }
    @media print {
      body { background: white; }
      .toolbar { display: none; }
      .page { width: 210mm; min-height: 297mm; margin: 0; padding: 8mm; }
      .certificate { min-height: 281mm; padding: 8mm; page-break-inside: avoid; }
      th, td { font-size: 11px; padding: 5px 6px; }
      .title { font-size: 17px; margin: 10px 0 8px; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="print" onclick="window.print()">Print Certificate</button>
    <button class="close" onclick="window.close()">Close</button>
  </div>
  <main class="page">
    <section class="certificate">
      <div class="content">
        <table class="borderless header">
          <tr>
            <td class="permit"><strong>No.</strong> ${escapeHtml(permitNumber)}</td>
            <td class="center ministry">
              <img class="coat" src="${coatImgSrc}" alt="Republic of Uganda" />
              <p><strong>REPUBLIC OF UGANDA</strong></p>
              <p>Ministry of Agriculture, Animal Industry & Fisheries</p>
              <p><strong>P.O. Box 102, ENTEBBE</strong></p>
            </td>
            <td class="right rule">|r.14(4)|</td>
          </tr>
        </table>

        <div class="title">LAB TEST REPORT</div>
        <table class="meta">
          <tbody>
            <tr>
              <th>Date received</th>
              <td>${receivedDate}</td>
              <th>Lab Test Number</th>
              <td>${escapeHtml(lab.lab_test_number || "—")}</td>
            </tr>
            <tr>
              <th>Lot Number</th>
              <td>${escapeHtml(lab.lot_number || "—")}</td>
              <th>Status</th>
              <td>${escapeHtml(recommendation)}</td>
            </tr>
            <tr>
              <th>Applicant</th>
              <td>${escapeHtml(applicant || "—")}</td>
              <th>Crop Variety</th>
              <td>${escapeHtml(cropVariety || "—")}</td>
            </tr>
            <tr>
              <th>Weight of Lot</th>
              <td colspan="3">${quantity ? `${escapeHtml(quantity)} kgs` : "—"}</td>
            </tr>
          </tbody>
        </table>

        <table class="results">
          <tbody>
            <tr><th class="section-title" colspan="12">Results of the Analysis</th></tr>
            <tr>
              <th class="group" colspan="4">PURITY (P)</th>
              <th class="group" colspan="5">GERMINATION CAPACITY (G)</th>
              <th class="group">Abnormal</th>
              <th class="group">PX5/100</th>
              <th class="group">Moisture</th>
            </tr>
            <tr>
              <td class="label">Pure Seed (p)</td>
              <td class="label">Inert Matter</td>
              <td class="label">Other Crop Seeds</td>
              <td class="label">Weed Seeds</td>
              <td class="label">Capacity</td>
              <td class="label">1st Count</td>
              <td class="label">Final Count</td>
              <td class="label">Hard</td>
              <td class="label">Fresh Ungerminated</td>
              <td class="label">Rotten or Dead</td>
              <td class="label">...</td>
              <td class="label">Moisture</td>
            </tr>
            <tr>
              <td class="value">${valueWithPercent(testValue(report, "purity", "pure_seed"))}</td>
              <td class="value">${valueWithPercent(testValue(report, "purity", "inert_matter"))}</td>
              <td class="value">${valueWithPercent(testValue(report, "purity", "other_crop_seeds"))}</td>
              <td class="value">${valueWithPercent(testValue(report, "purity", "weed_seed"))}</td>
              <td class="value">${valueWithPercent(testValue(report, "germination", "capacity"))}</td>
              <td class="value">${escapeHtml(testValue(report, "germination", "first_count") || "—")}</td>
              <td class="value">${escapeHtml(testValue(report, "germination", "final_count") || "—")}</td>
              <td class="value">${valueWithPercent(testValue(report, "germination", "hard"))}</td>
              <td class="value">${valueWithPercent(testValue(report, "germination", "fresh"))}</td>
              <td class="value">${valueWithPercent(testValue(report, "germination", "dead"))}</td>
              <td class="value">...</td>
              <td class="value">${valueWithPercent(testValue(report, "moisture", "moisture"))}</td>
            </tr>
          </tbody>
        </table>

        <p class="analysis-note">* incl. ${valueWithPercent(testValue(report, "germination", "abnormal_sprouts"))} abnormal sprouts of which, nil % broken germs.</p>
        <p class="recommendation">NOTE: ${escapeHtml(recommendation)}</p>

        <table class="borderless signature">
          <tr>
            <td class="stamp-box" style="width:50%;"></td>
            <td>
              <div class="signature-line">${escapeHtml(analyst || "Official Seed Tester")}</div>
              <p><em>Official Seed Tester</em></p>
              <div class="signature-line">DATE: ${printedDate}</div>
              <p><em>For director of seeds</em></p>
            </td>
          </tr>
        </table>

        <table class="payment">
          <tr><th>Paid</th><th></th></tr>
          <tr><th>Deposit</th><th></th></tr>
          <tr><th>Government</th><th></th></tr>
          <tr><th>Unpaid</th><th></th></tr>
        </table>
        <p class="analysis-note"><strong>Any inquiries concerning this test must quote the test number.</strong></p>
        <p class="footer-note">VALIDITY OF THIS REPORT IS AS SPECIFIED IN CLAUSE 16 OF THESE REGULATIONS</p>
        <p class="printer">Printed by Uganda Printing and Publishing Corporation</p>
      </div>
    </section>
  </main>
</body>
</html>`;
};

export const parseJSON = (text) => {
  if (!text) return null; // return null instead of {}
  try {
    return typeof text === "string" ? JSON.parse(text) : text;
  } catch {
    return null; // invalid JSON -> null
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
    inspector_id: row.inspector_id?.toString() || null, // cast to string for GraphQL ID consistency
    // status: row.status?.toUpperCase(),
    lab_test_number: row.lab_test_number || null,
    lot_number: row.lot_number || null,
    seed_class: row.seed_class || null,
    source: row.source || null,
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
      where.push("seed_labs.inspector_id = ?"); // <-- FIXED: push inspector_id, not user_id
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
  const [rows] = await db.execute("SELECT * FROM crop_varieties WHERE id = ?", [
    id,
  ]);
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
          "You dont have permissions to view seed labs",
        );

        const can_manage_all_forms = hasPermission(
          userPermissions,
          "can_manage_seed_lab_inspection",
        );

        const can_view_only_assigned_seed_stock = hasPermission(
          userPermissions,
          "can_view_only_assigned_seed_lab_inspection",
        );

        const can_receive_seed_lab_inspections = hasPermission(
          userPermissions,
          "can_receive_seed_lab_inspections",
        );

        const can_perform_seed_lab_tests = hasPermission(
          userPermissions,
          "can_perform_seed_lab_tests",
        );

        // Receptionists should see everything except pending / inspector assigned / rejected
        let status = null;
        let statusNotIn = null;
        if (can_receive_seed_lab_inspections) {
          statusNotIn = [
            "pending",
            "assigned_inspector",
            "inspector_assigned",
            "rejected",
          ];
        } else if (can_perform_seed_lab_tests) {
          // status = "received";
          statusNotIn = [
            "pending",
            "assigned_inspector",
            "inspector_assigned",
            "rejected",
            "accepted",
            "halted",
          ];
        }

        const labs = await fetchSeedLabs({
          user_id: can_manage_all_forms ? null : (user?.id ?? null),
          inspector_id: can_view_only_assigned_seed_stock
            ? (user?.id ?? null)
            : null,
          status: status,
          statusNotIn,
        });

        return labs;
      } catch (error) {
        throw new Error(`Failed to fetch lab inspections: ${error.message}`);
      }
    },

    getSeedLab: async (_parent, { id }, context) => {
      try {
        const user = context?.req?.user;
        const userPermissions = user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_view_seed_stock",
          "You dont have permissions to view seed stock",
        );

        const can_manage_all_forms = hasPermission(
          userPermissions,
          "can_manage_seed_stock",
        );

        const can_view_only_assigned_seed_stock = hasPermission(
          userPermissions,
          "can_view_only_assigned_seed_stock",
        );

        const lab = await fetchSeedLabs({
          id,
          user_id: can_manage_all_forms ? null : (user?.id ?? null),
          inspector_id: can_view_only_assigned_seed_stock
            ? (user?.id ?? null)
            : null,
        });

        // if (!labInspection) throw new Error("Seed lab inspection not found");

        return lab;
      } catch (error) {
        throw new Error(
          `Failed to fetch seed lab inspection: ${error.message}`,
        );
      }
    },

    labTestCertificate: async (_parent, { id }, context) => {
      try {
        const user = context?.req?.user;
        const userPermissions = user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_view_seed_lab_inspections",
          "You dont have permissions to view seed lab certificates",
        );

        const [lab] = await fetchSeedLabs({ id });

        if (!lab) throw new GraphQLError("Seed lab inspection not found");
        if (!["marketable", "not_marketable"].includes(lab.status)) {
          throw new GraphQLError(
            "Lab test certificate is only available after the test is completed",
          );
        }
        if (!lab.lab_test_report) {
          throw new GraphQLError("Lab test report has not been submitted");
        }

        const [applicant] = await getUsers({ id: lab.user_id });
        const variety = lab.variety_id
          ? await fetchVarietyById(lab.variety_id)
          : null;

        return {
          html: buildLabTestCertificateHtml({
            lab,
            applicant: applicant?.name || applicant?.username || null,
            analyst: user?.name || user?.username || null,
            cropVariety: variety?.name || null,
          }),
        };
      } catch (error) {
        throw new GraphQLError(error.message);
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
    },
    stockExamination: async (parent) => {
      try {
        const stock_examination_id = parent.stock_examination_id;

        if (!stock_examination_id) return null;

        const [stockExamination] = await fetchExaminations({
          id: stock_examination_id,
        });

        return stockExamination;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },

  Mutation: {
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

        const stock_id = stock_examination_id;

        const user = context?.req?.user;
        const userPermissions = user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_request_seed_lab_inspection",
          "You dont have permissions to request seed lab inspection",
        );

        let stock = {};

        if (stock_id) {
          stock = await fetchRecords({
            id: stock_id,
            user_id: user.id,
          });
          console.log("Planting return:", stock[0], stock_id);
        }

        const data = {
          user_id: user.id,
          variety_id: stock[0]?.crop_variety_id || null,
          stock_examination_id: stock[0]?.stock_examination_id || null,
          lot_number: stock[0]?.lot_number || null,
          collection_date,
          applicant_remark,
        };

        const save_id = await saveData({
          table: "seed_labs",
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
              e.message,
            );
          }
        }

        await connection.commit();

        return {
          success: true,
          message: "Seed Lab Request saved successfully",
          data: {
            id: save_id,
            status: "pending",
            ...data,
          },
        };
      } catch (error) {
        try {
          await connection.rollback();
        } catch (_) {}
        throw new Error(`Failed to save seed lab request: ${error.message}`);
      } finally {
        connection.release();
      }
    },
    deleteSeedLabInspection: async (_parent, { id }, context) => {
      try {
        const user = context?.req?.user;
        const userPermissions = user?.permissions || [];

        checkPermission(
          userPermissions,
          "can_manage_seed_stock",
          "You dont have permissions to delete seed lab inspections",
        );

        const [result] = await db.execute(
          `UPDATE seed_labs SET deleted = 1 WHERE id = ?`,
          [id],
        );

        if (result.affectedRows === 0)
          throw new Error("Seed lab inspection not found or already deleted");

        return {
          success: true,
          message: "Seed lab inspection deleted successfully",
        };
      } catch (error) {
        throw new Error(
          `Failed to delete seed lab inspection: ${error.message}`,
        );
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
          "You don't have permissions to assign an inspector",
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
        sendEmail({
          from: '"STTS MAAIF" <info@seedtracking.net>',
          to: inspector.email,
          subject: "Inspector Assignment",
          message: `Dear ${inspector.name}, You have been assigned as the inspector for ${formOwner.name}'s seed lab application `,
        });

        // send another email to the form owner
        sendEmail({
          from: '"STTS MAAIF" <info@seedtracking.net>',
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
          "You dont have permissions to submit lab inspections",
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
          "You dont have permissions to receive lab inspections",
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
          "You dont have permissions to submit lab test reports",
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

          const exam = await fetchExaminations( seedLab[0].stock_examination_id);
          console.log("Fetched examination for lab test report submission:", exam[0], seedLab[0]);
          const marketabledata = {
            user_id: seedLab[0].user_id,
            crop_variety_id: seedLab[0].variety_id,
            seed_lab_id: seedLab[0].id,
            // seed_label_id : seedLab[0].seed_label_id,
            lot_number: seedLab[0].lot_number,
            quantity: seedLab[0].inspector_report.quantity_represented_kg,
            seed_class: exam[0].seed_class ?? null,
            source: seedLab[0].source ?? null,
            remaining_quantity : seedLab[0].inspector_report.quantity_represented_k,
            package_id: seedLab[0].seed_label_package_id ?? null,
            lab_test_number : seedLab[0].lab_test_number,
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
        try {
          await connection.rollback();
        } catch (_) {}
        throw new GraphQLError(error.message);
      } finally {
        connection.release();
      }
    },
  },
};

export default seedLabResolvers;
