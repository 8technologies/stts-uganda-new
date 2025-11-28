import { db } from "../../config/config.js";

const normalizeDate = (value) =>
  value ? new Date(value).toISOString() : null;

const fetchSeedLabByLot = async (lotNumber) => {
  const [rows] = await db.execute(
    `SELECT sl.*, sl.id AS lab_id,
            se.id AS examination_id,
            se.yield AS inspection_yield,
            se.field_size,
            inspector.name AS inspector_name
     FROM seed_labs sl
     LEFT JOIN stock_examinations se ON se.id = sl.stock_examination_id
     LEFT JOIN users inspector ON inspector.id = sl.inspector_id
     WHERE sl.deleted = 0 AND sl.lot_number = ?
     ORDER BY sl.created_at DESC
     LIMIT 1`,
    [lotNumber]
  );
  return rows[0] || null;
};

const fetchSeedLabelBySeedLab = async (seedLabId) => {
  if (!seedLabId) return null;
  const [rows] = await db.execute(
    `SELECT sl.*, sl.id AS label_id,
            u.name AS applicant_name,
            cv.name AS variety_name,
            c.name AS crop_name
     FROM seed_labels sl
     LEFT JOIN users u ON u.id = sl.user_id
     LEFT JOIN seed_labs lab ON lab.id = sl.seed_lab_id
     LEFT JOIN stock_examinations se ON se.id = lab.stock_examination_id
     LEFT JOIN crop_varieties cv ON cv.id = se.crop_variety_id
     LEFT JOIN crops c ON c.id = cv.crop_id
     WHERE sl.deleted = 0 AND sl.seed_lab_id = ?
     ORDER BY sl.created_at DESC
     LIMIT 1`,
    [seedLabId]
  );
  return rows[0] || null;
};

const fetchMotherLot = async (lotNumber) => {
  const [rows] = await db.execute(
    `SELECT se.*, inspector.name AS inspector_name
     FROM stock_examinations se
     LEFT JOIN users inspector ON inspector.id = se.inspector_id
     WHERE se.deleted = 0 AND se.lot_number = ?
     ORDER BY se.created_at DESC
     LIMIT 1`,
    [lotNumber]
  );
  return rows[0] || null;
};

const trackTraceResolvers = {
  Query: {
    trackTrace: async (_parent, { lotNumber }) => {
      const trimmed = lotNumber?.trim();
      if (!trimmed) {
        throw new Error("Lot number is required");
      }

      const seedLabRow = await fetchSeedLabByLot(trimmed);
      const seedLabelRow = seedLabRow
        ? await fetchSeedLabelBySeedLab(seedLabRow.lab_id)
        : null;
      const motherLotRow = await fetchMotherLot(trimmed);

      return {
        lotNumber: trimmed,
        seedDetails: seedLabelRow
          ? {
              id: seedLabelRow.label_id?.toString(),
              status: seedLabelRow.status,
              crop: seedLabelRow.crop_name,
              variety: seedLabelRow.variety_name,
              quantity: seedLabelRow.quantity
                ? `${seedLabelRow.quantity} kgs`
                : null,
              labelPackage: seedLabelRow.label_package,
              applicant: seedLabelRow.applicant_name,
              createdAt: normalizeDate(seedLabelRow.created_at),
            }
          : null,
        seedLab: seedLabRow
          ? {
              id: seedLabRow.lab_id?.toString(),
              lotNumber: seedLabRow.lot_number,
              status: seedLabRow.status,
              labTestNumber: seedLabRow.lab_test_number,
              inspector: seedLabRow.inspector_name,
              collectedAt: normalizeDate(seedLabRow.collection_date),
              receivedAt: normalizeDate(seedLabRow.created_at),
            }
          : null,
        motherLot: motherLotRow
          ? {
              id: motherLotRow.id?.toString(),
              lotNumber: motherLotRow.lot_number,
              seedClass: motherLotRow.seed_class,
              yieldAmount: motherLotRow.yield,
              fieldSize: motherLotRow.field_size,
              inspector: motherLotRow.inspector_name,
              status: motherLotRow.status,
              createdAt: normalizeDate(motherLotRow.created_at),
            }
          : null,
      };
    },
  },
};

export default trackTraceResolvers;
