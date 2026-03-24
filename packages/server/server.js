// npm install @apollo/server @as-integrations/express5 express graphql cors
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { typeDefs, resolvers } from "./schema/index.js";
import { host, port, db } from "./config/config.js";
import authenticateUser from "./middleware/auth.js";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import ExcelJS from "exceljs";

// Required logic for integrating with Express
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.

// ── Dynamic sub-growers template (enriched with live DB dropdowns) ───────────
app.get("/templates/sub-growers-template.xlsx", async (_req, res) => {
  try {
    const templatePath = path.join(
      __dirname,
      "templates",
      "sub-growers-template.xlsx"
    );
    console.log("[template] Generating sub-growers template from:", templatePath);
    
    const [districtRows] = await db.execute(
      "SELECT name FROM districts ORDER BY name ASC"
    );
    console.log("[template] Fetched districts:", districtRows.length);
    const [cropRows] = await db.execute(`
      SELECT CONCAT('CROP: ', c.name, ', VARIETY: ', cv.name) AS label
      FROM crop_varieties cv
      INNER JOIN crops c ON c.id = cv.crop_id
      ORDER BY c.name ASC, cv.name ASC
    `);

    const districts = districtRows.map((row) => String(row.name ?? "").trim()).filter(Boolean);
    const cropVarieties = cropRows.map((row) => String(row.label ?? "").trim()).filter(Boolean);
    const seedClasses = ["Certified", "Basic", "Pre-basic", "Qds"];

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet =
      workbook.getWorksheet("Sheet1") ??
      workbook.worksheets.find((sheet) => !String(sheet.name).startsWith("_")) ??
      workbook.addWorksheet("Sheet1");

    const existingHelper = workbook.getWorksheet("_subgrowers_dropdowns");
    if (existingHelper) {
      workbook.removeWorksheet(existingHelper.id);
    }

    const helperSheet = workbook.addWorksheet("_subgrowers_dropdowns", {
      state: "veryHidden",  // <-- must be here, not assigned later
    });

    districts.forEach((value, index) => {
      helperSheet.getCell(index + 1, 1).value = value;
    });
    cropVarieties.forEach((value, index) => {
      helperSheet.getCell(index + 1, 2).value = value;
    });
    seedClasses.forEach((value, index) => {
      helperSheet.getCell(index + 1, 3).value = value;
    });

    // Remove and recreate the Crops sheet cleanly.
    const existingCrops = workbook.getWorksheet("Crops");
    if (existingCrops) {
      workbook.removeWorksheet(existingCrops.id);
    }
    const cropsSheet = workbook.addWorksheet("Crops", {
      state: "hidden",  // use "hidden" (user can unhide) or "veryHidden" (only VBA can unhide)
    });
    cropsSheet.getCell(1, 1).value = "ID";
    cropsSheet.getCell(1, 2).value = "Label";
    cropsSheet.getColumn(1).width = 10;
    cropsSheet.getColumn(2).width = 60;
    cropVarieties.forEach((value, index) => {
      cropsSheet.getCell(index + 2, 1).value = index + 1;
      cropsSheet.getCell(index + 2, 2).value = value;
    });

    const maxRow = 5000;

    if (cropVarieties.length > 0) {
      worksheet.dataValidations.add(`D2:D${maxRow}`, {
        type: "list",
        allowBlank: true,
        formulae: [`'_subgrowers_dropdowns'!$B$1:$B$${cropVarieties.length}`],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: "Invalid Crop/Variety",
        error: 'Select a value from the dropdown or use the format "CROP: Name, VARIETY: Name".',
        showInputMessage: true,
        promptTitle: "Crop and Variety",
        prompt: 'Choose a crop/variety from the list.',
      });
    }

    worksheet.dataValidations.add(`E2:E${maxRow}`, {
      type: "list",
      allowBlank: true,
      formulae: [`'_subgrowers_dropdowns'!$C$1:$C$${seedClasses.length}`],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Invalid Seed Class",
      error: "Please select a valid seed class.",
      showInputMessage: true,
      promptTitle: "Seed Class",
      prompt: "Choose a seed class from the list.",
    });

    if (districts.length > 0) {
      worksheet.dataValidations.add(`N2:N${maxRow}`, {
        type: "list",
        allowBlank: true,
        formulae: [`'_subgrowers_dropdowns'!$A$1:$A$${districts.length}`],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: "Invalid District",
        error: "Please select a district from the dropdown list.",
        showInputMessage: true,
        promptTitle: "District",
        prompt: "Choose a district from the list.",
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sub-growsers-template.xlsx"'
    );
    res.setHeader("X-Template-Generated", "sub-growers");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("[template] sub-growers generation error:", err);
    res.status(500).json({
      error: "Failed to generate template",
      details: err?.message ?? "Unknown error",
    });
  }
});

app.use(express.static("public"));
app.use("/templates", express.static("templates"));
app.use(cors({ origin: "*" }));
const httpServer = http.createServer(app);

const escapeHtml = (value = "") => 
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatExpiryDate = (date) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()] || "";
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const getSeasonAndExpiry = (baseDate) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const isSeasonA = month < 6;
  const season = `${year}${isSeasonA ? "A" : "B"}`;
  const expiryDate = isSeasonA
    ? new Date(year, 11, 31)
    : new Date(year + 1, 5, 30);
  return { season, expiry: formatExpiryDate(expiryDate) };
};

const buildVerificationPage = ({ isValid, message, label }) => {
  const statusClass = isValid ? "status-valid" : "status-invalid";
  const issuedDate = label?.created_at ? new Date(label.created_at) : new Date();
  const { season, expiry } = getSeasonAndExpiry(issuedDate);
  const details = label
    ? [
        // ["Label ID", label.id],
        ["Status", label.status?.toUpperCase() ?? "—"],
        ["Crop", label.crop_name ?? "—"],
        ["Variety", label.variety_name ?? "—"],
        ["Season", season],
        ["Expiry", expiry],
        ["Quantity", label.quantity ? `${label.quantity} kgs` : "—"],
        ["Package", label.label_package ?? "—"],
        ["Applicant", label.applicant_name ?? label.username ?? "—"],
        ["Location", label.location ?? "—"],
        [
          "Issued",
          label.created_at
            ? new Date(label.created_at).toLocaleDateString("en-GB")
            : "—",
        ],
      ]
        .map(
          ([title, value]) => `
        <div class="row">
          <dt>${escapeHtml(title)}</dt>
          <dd>${escapeHtml(value ?? "—")}</dd>
        </div>`
        )
        .join("")
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>Seed Label Verification</title>
    <style>
      body {
        margin: 0;
        padding: 32px 16px;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f1f5f9;
        color: #0f172a;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card {
        width: 100%;
        max-width: 520px;
        background: #fff;
        border-radius: 18px;
        padding: clamp(20px, 5vw, 32px);
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
        border: 1px solid #e2e8f0;
      }
      h1 {
        margin: 0;
        font-size: 28px;
        letter-spacing: 0.02em;
      }
      p.message {
        margin: 12px 0 24px;
        font-size: 16px;
        color: #475569;
      }
      .status-valid {
        color: #0f766e;
      }
      .status-invalid {
        color: #b91c1c;
      }
      .details {
        display: grid;
        gap: 12px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px dashed #e2e8f0;
        padding-bottom: 8px;
      }
      dt {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.08em;
        color: #64748b;
        flex: 1;
      }
      dd {
        margin: 0;
        flex: 1.3;
        text-align: right;
        font-weight: 600;
        color: #0f172a;
      }
      .footer-note {
        margin-top: 24px;
        font-size: 13px;
        color: #94a3b8;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1 class="${statusClass}">${
        isValid ? "Seed Label Verified" : "Invalid Seed Label"
      }</h1>
      <p class="message">${escapeHtml(message)}</p>
      <section class="details">
        ${details}
      </section>
      <p class="footer-note">STTS • Ministry of Agriculture, Animal Industry and Fisheries</p>
    </main>
  </body>
</html>`;
};

app.get("/verify/seed-label/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).send(
      buildVerificationPage({
        isValid: false,
        message: "Invalid request. Label identifier is missing.",
      })
    );
  }

  try {
    const [rows] = await db.execute(
      `SELECT
        sl.id,
        sl.status,
        sl.label_package,
        sl.quantity,
        sl.created_at,
        u.name AS applicant_name,
        u.username,
        COALESCE(NULLIF(CONCAT_WS(', ', u.premises_location, u.district), ''), NULL) AS location,
        cv.name AS variety_name,
        c.name AS crop_name
      FROM seed_labels sl
      LEFT JOIN users u ON u.id = sl.user_id
      LEFT JOIN crop_varieties cv ON cv.id = sl.crop_variety_id
      LEFT JOIN crops c ON c.id = cv.crop_id
      WHERE sl.deleted = 0 AND sl.id = ?
      LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).send(
        buildVerificationPage({
          isValid: false,
          message: "Seed label not found or has been revoked.",
        })
      );
    }

    const label = rows[0];
    const normalizedStatus = String(label.status || "").toLowerCase();
    const isValid = ["printed", "approved"].includes(normalizedStatus);

    const message = isValid
      ? "This seed label matches a printed record in the national tracking system."
      : "This record exists but is not currently marked as a valid printed label.";

    return res
      .status(isValid ? 200 : 400)
      .send(buildVerificationPage({ isValid, message, label }));
  } catch (error) {
    console.error("Seed label verification error:", error);
    return res.status(500).send(
      buildVerificationPage({
        isValid: false,
        message:
          "Unable to verify this label right now. Please try again later.",
      })
    );
  }
});

// cointries api
app.get("/countries", async (req, res) => {
  try {
    const response = await fetch("https://www.apicountries.com/countries");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  csrfPrevention: true,
});
// Ensure we wait for our server to start
await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
  "/graphql",
  cors("*"),
  express.json(),
  graphqlUploadExpress(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      const operationName = req.body.operationName;
      const exemptOperations = new Set([
        "Login",
        "IntrospectionQuery",
        "System_settings",
        "Register",
      ]);

      // token: req.headers.token

      if (!exemptOperations.has(operationName)) {
        await authenticateUser({ req });
      }

      return {
        req,
        res,
        // loaders: createLoaders(),
        // logUserAction: (params) =>
        //   logUserAction({
        //     ...params,
        //     ip_address: req.ip,
        //     user_agent: req.headers["user-agent"],
        //   }),
      };
    },
  })
);

// Modified server startup
await new Promise((resolve) => httpServer.listen({ port }, resolve));
console.log(`🚀 Server ready at http://${host}:${port}`);
