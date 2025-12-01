import { db } from "../../config/config.js";

const numberOrZero = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const countQuery = async (sql, params = []) => {
  const [[row]] = await db.execute(sql, params);
  return numberOrZero(row?.total ?? row?.count ?? 0);
};

const fetchInspectionSlices = async () => {
  const [rows] = await db.execute(`
    SELECT COALESCE(status, 'pending') AS status, COUNT(*) AS total
    FROM stock_examinations
    WHERE deleted = 0
    GROUP BY status
  `);

  const buckets = {
    completed: 0,
    pending: 0,
    skipped: 0,
  };

  rows.forEach((row) => {
    const count = numberOrZero(row.total);
    const normalized = String(row.status || '').toLowerCase();

    if (["accepted", "approved", "completed"].includes(normalized)) {
      buckets.completed += count;
    } else if (["rejected", "skipped", "halted"].includes(normalized)) {
      buckets.skipped += count;
    } else {
      buckets.pending += count;
    }
  });

  return [
    { label: "Completed", value: buckets.completed },
    { label: "Pending", value: buckets.pending },
    { label: "Skipped", value: buckets.skipped },
  ];
};

const fetchSeedStockPoints = async () => {
  const [rows] = await db.execute(`
    SELECT
      QUARTER(created_at) AS quarter,
      COALESCE(SUM(CAST(quantity AS DECIMAL(20,2))), 0) AS total
    FROM stock_records
    WHERE deleted = 0 AND created_at IS NOT NULL
    GROUP BY QUARTER(created_at)
    ORDER BY quarter ASC
  `);

  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const totalsByQuarter = new Map();

  rows.forEach((row) => {
    const quarterIndex = numberOrZero(row.quarter);
    totalsByQuarter.set(quarterIndex, Number(row.total) || 0);
  });

  return quarters.map((label, index) => ({
    label,
    total: totalsByQuarter.get(index + 1) ?? 0,
  }));
};

const toTimestamp = (value) => {
  if (!value) {
    return new Date().toISOString();
  }
  const dateValue = value instanceof Date ? value : new Date(value);
  return Number.isNaN(dateValue?.getTime())
    ? new Date().toISOString()
    : dateValue.toISOString();
};

const fetchRecentActivities = async () => {
  const [permitRows] = await db.execute(`
    SELECT id, supplier_name, permit_number, status, updated_at, created_at
    FROM permits
    ORDER BY updated_at DESC
    LIMIT 5
  `);

  const [inspectionRows] = await db.execute(`
    SELECT id, category, status, updated_at, created_at
    FROM stock_examinations
    WHERE deleted = 0
    ORDER BY updated_at DESC
    LIMIT 5
  `);

  const [labelRows] = await db.execute(`
    SELECT id, quantity, status, updated_at, created_at
    FROM seed_labels
    WHERE deleted = 0
    ORDER BY updated_at DESC
    LIMIT 5
  `);

  const activities = [];

  permitRows.forEach((row) => {
    activities.push({
      id: `permit-${row.id}`,
      title: row.permit_number
        ? `Import permit ${row.permit_number}`
        : `Import permit #${row.id}`,
      entity: row.supplier_name,
      status: row.status,
      category: "permit",
      timestamp: toTimestamp(row.updated_at || row.created_at),
    });
  });

  inspectionRows.forEach((row) => {
    activities.push({
      id: `inspection-${row.id}`,
      title: row.category ? `Inspection (${row.category})` : "Stock inspection",
      entity: row.status ? row.status.replace(/_/g, " ") : undefined,
      status: row.status,
      category: "inspection",
      timestamp: toTimestamp(row.updated_at || row.created_at),
    });
  });

  labelRows.forEach((row) => {
    activities.push({
      id: `label-${row.id}`,
      title: `Seed label request #${row.id}`,
      entity: row.quantity ? `${row.quantity} units` : undefined,
      status: row.status,
      category: "label",
      timestamp: toTimestamp(row.updated_at || row.created_at),
    });
  });

  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);
};

const ACTIVE_FORM_STATUSES = [
  "pending",
  "assigned_inspector",
  "recommended",
];

const ACTIVE_PERMIT_STATUSES = ["pending", "assigned_inspector"];
const ASSIGNED_ONLY_STATUS = ["assigned_inspector"];
const PENDING_INSPECTION_STATUSES = ["pending", "inspector_assigned"];

const dashboardResolvers = {
  Query: {
    dashboardStats: async (_parent, _args, context) => {
      const userId = context?.req?.user?.id;

      if (!userId) {
        throw new Error("Unauthorized");
      }

      try {
        const [
          registeredUsers,
          userPermits,
          pendingPermits,
          cropDeclarations,
          printedLabels,
          pendingLabels,
          inspections,
          seedStock,
          recentActivities,
          myActiveForms,
          myActivePermits,
          myApprovedPlantingReturns,
          assignedForms,
          assignedPermits,
          assignedPlantingReturns,
          pendingInspections,
          receivedLabRequests,
          haltedLabRequests,
          marketableSeed,
          nonMarketableSeed,
        ] = await Promise.all([
          countQuery("SELECT COUNT(*) AS total FROM users WHERE deleted = 0"),
          countQuery("SELECT COUNT(*) AS total FROM permits"),
          countQuery(
            "SELECT COUNT(*) AS total FROM permits WHERE status IN ('pending', 'assigned_inspector')"
          ),
          countQuery("SELECT COUNT(*) AS total FROM qds_crop_declaration WHERE deleted = 0"),
          countQuery(
            "SELECT COUNT(*) AS total FROM seed_labels WHERE deleted = 0 AND status = 'printed'"
          ),
          countQuery(
            "SELECT COUNT(*) AS total FROM seed_labels WHERE deleted = 0 AND status = 'pending'"
          ),
          fetchInspectionSlices(),
          fetchSeedStockPoints(),
          fetchRecentActivities(),
          countQuery(
            `SELECT COUNT(*) AS total FROM application_forms WHERE deleted = 0 AND user_id = ? AND status IN (${ACTIVE_FORM_STATUSES.map(() => "?").join(", ")})`,
            [userId, ...ACTIVE_FORM_STATUSES]
          ),
          countQuery(
            `SELECT COUNT(*) AS total FROM permits WHERE user_id = ? AND status IN (${ACTIVE_PERMIT_STATUSES.map(() => "?").join(", ")})`,
            [userId, ...ACTIVE_PERMIT_STATUSES]
          ),
          countQuery(
            "SELECT COUNT(*) AS total FROM planting_returns WHERE created_by = ? AND status = 'approved'",
            [userId]
          ),
          countQuery(
            `SELECT COUNT(*) AS total FROM application_forms WHERE deleted = 0 AND inspector_id = ? AND status IN (${ASSIGNED_ONLY_STATUS.map(() => "?").join(", ")})`,
            [userId, ...ASSIGNED_ONLY_STATUS]
          ),
          countQuery(
            `SELECT COUNT(*) AS total FROM permits WHERE inspector_id = ? AND status IN (${ASSIGNED_ONLY_STATUS.map(() => "?").join(", ")})`,
            [userId, ...ASSIGNED_ONLY_STATUS]
          ),
          countQuery(
            `SELECT COUNT(*) AS total FROM planting_returns WHERE inspector_id = ? AND status IN (${ASSIGNED_ONLY_STATUS.map(() => "?").join(", ")})`,
            [userId, ...ASSIGNED_ONLY_STATUS]
          ),
          countQuery(
            `SELECT COUNT(*) AS total FROM stock_examinations WHERE deleted = 0 AND inspector_id = ? AND (status IS NULL OR status IN (${PENDING_INSPECTION_STATUSES.map(() => "?").join(", ")}))`,
            [userId, ...PENDING_INSPECTION_STATUSES]
          ),
          countQuery(
            "SELECT COUNT(*) AS total FROM seed_labs WHERE deleted = 0 AND status = 'received'"
          ),
          countQuery(
            "SELECT COUNT(*) AS total FROM seed_labs WHERE deleted = 0 AND status IN ('halted', 'rejected')"
          ),
          countQuery(
            "SELECT COUNT(*) AS total FROM seed_labs WHERE deleted = 0 AND status = 'marketable'"
          ),
          countQuery(
            "SELECT COUNT(*) AS total FROM seed_labs WHERE deleted = 0 AND status = 'not_marketable'"
          ),
        ]);

        const totalInspections = inspections.reduce((sum, item) => sum + numberOrZero(item.value), 0);
        const pendingCorrectiveActions = inspections.find((item) => item.label === "Skipped")?.value ?? 0;

        return {
          registeredUsers,
          userPermits,
          pendingPermits,
          cropDeclarations,
          printedLabels,
          pendingLabels,
          myActiveForms,
          myActivePermits,
          myApprovedPlantingReturns,
          assignedForms,
          assignedPermits,
          assignedPlantingReturns,
          pendingInspections,
          receivedLabRequests,
          haltedLabRequests,
          marketableSeed,
          nonMarketableSeed,
          totalInspections,
          scheduledVisits: totalInspections,
          pendingCorrectiveActions,
          inspections,
          seedStock,
          recentActivities,
        };
      } catch (error) {
        throw new Error(`Failed to load dashboard stats: ${error.message}`);
      }
    },
  },
};

export default dashboardResolvers;
