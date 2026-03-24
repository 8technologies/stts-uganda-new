import xlsx from 'xlsx';
import { db } from '../../config/config.js';

// ─── Header alias map ───────────────────────────────────────────────────────────
const HEADER_ALIASES = {
  field_name:       ['field_name', 'field name', 'fieldname', 'garden name', 'garden_name', 'field'],
  name:             ['name', 'grower_name', 'grower name', 'farmer name', 'farmer_name', 'applicant_name', 'applicant name', 'person responsible', 'person_responsible'],
  size:             ['size', 'area_ha', 'area ha', 'area_(ha)', 'area (ha)', 'area', 'hectares', 'ha'],
  crop:             ['crop', 'crop and variety', 'crop_variety', 'crop variety', 'crop/variety'],
  seed_class:       ['seed_class', 'seed class', 'seedclass', 'class'],
  lot_number:       ['lot_number', 'lot number', 'lot no', 'lotno', 'lot_no', 'seed lot', 'seed_lot', 'seed_lot_code'],
  source_of_seed:   ['source_of_seed', 'source of seed', 'seed source', 'seed_source'],
  planting_date:    ['planting_date', 'planting date', 'date sown', 'date_sown', 'date planted', 'date_planted'],
  quantity_planted: ['quantity_planted', 'quantity planted', 'quantity', 'qty', 'qty_planted'],
  expected_yield:   ['expected_yield', 'expected yield', 'yield'],
  phone_number:     ['phone_number', 'phone number', 'phone', 'contact', 'contact_phone', 'phoneno'],
  gps_latitude:     ['gps_latitude', 'gps latitude', 'latitude', 'lat', 'gps_lat'],
  gps_longitude:    ['gps_longitude', 'gps longitude', 'longitude', 'lng', 'lon', 'gps_lng', 'gps_long'],
  district:         ['district', 'district_name', 'location district', 'district name', 'District'],
  subcounty:        ['subcounty', 'sub_county', 'sub county', 'sub-county', 'subcounty_name'],
  village:          ['village', 'village_name'],
};

const REQUIRED_COLS = ['name', 'district', 'crop', 'seed_class', 'lot_number'];

const SEED_CLASS_MAP = {
  'pre-basic':  'Pre-Basic',
  'prebasic':   'Pre-Basic',
  'certified':  'Certified seed',
  'basic':      'Basic seed',
  'qds':        'Qds',
};

const normalizeHeader = (h) =>
  String(h).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const normalizeValue = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

function buildHeaderMap(rawHeaders) {
  const map = {};
  rawHeaders.forEach((raw, idx) => {
    const norm = normalizeHeader(raw);
    const rawLower = String(raw).toLowerCase().trim();
    for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
      if (canonical in map) continue;
      if (aliases.includes(norm) || aliases.includes(rawLower)) {
        map[canonical] = idx;
      }
    }
  });
  return map;
}

function findHeaderRowIndex(rawRows) {
  const maxScan = Math.min(rawRows.length, 15);
  let bestIdx = 0;
  let bestScore = -1;

  for (let i = 0; i < maxScan; i++) {
    const candidate = (rawRows[i] ?? []).map(h => String(h ?? '').trim());
    const score = Object.keys(buildHeaderMap(candidate)).length;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
}

const getByAliases = (row, aliases) => {
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const value = row[alias] ?? row[normalizedAlias];
    if (value !== undefined && value !== null && normalizeValue(value) !== '') {
      return normalizeValue(value);
    }
  }
  return '';
};

const getRawByAliases = (row, aliases) => {
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const value = row[alias] ?? row[normalizedAlias];
    if (value !== undefined && value !== null && normalizeValue(value) !== '') {
      return value;
    }
  }
  return null;
};

const rowHasImportData = (row) => {
  return Boolean(
    getByAliases(row, HEADER_ALIASES.field_name) ||
      getByAliases(row, HEADER_ALIASES.name) ||
      getByAliases(row, HEADER_ALIASES.crop) ||
      getByAliases(row, HEADER_ALIASES.seed_class) ||
      getByAliases(row, HEADER_ALIASES.lot_number) ||
      getByAliases(row, HEADER_ALIASES.district)
  );
};

function parseExcelDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    const baseDate = new Date(1899, 11, 30);
    baseDate.setDate(baseDate.getDate() + value);
    if (!isNaN(baseDate.getTime())) return baseDate.toISOString().split('T')[0];
  }
  if (value instanceof Date) return value.toISOString().split('T')[0];
  const str = String(value).trim();
  const parts = str.split(/[\/\-]/).map(p => p.trim());
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const candidate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(candidate.getTime())) return candidate.toISOString().split('T')[0];
  }
  const direct = new Date(str);
  if (!isNaN(direct.getTime())) return direct.toISOString().split('T')[0];
  return str;
}

/**
 * Parse a sub-growers Excel/CSV file and return an array of normalised row
 * objects ready for insertion.  Does NOT insert; the resolver does that so it
 * can track per-row results and run inside a transaction.
 *
 * Returns: { rows: ParsedRow[], headerErrors: string[] }
 *   Each ParsedRow has all mapped fields plus:
 *     _rowNum  – 1-based line number in the file
 *     _errors  – array of validation error strings (empty = valid)
 */
export async function importSubGrowers(sub_growers_file) {
  if (!sub_growers_file) {
    throw new Error('sub_growers_file path is required');
  }

  const file = `./public/Subgrower_files/${sub_growers_file}`;
  console.log('[importSubGrowers] reading file:', file);

  const workbook = xlsx.readFile(file, { cellDates: true });

  // Prefer "Sheet1" data sheet; skip hidden/helper sheets like "Crops" or "_subgrowers_dropdowns"
  const DATA_SHEET_NAMES = ['Sheet1', 'sheet1', 'Data', 'data', 'Sub-Growers', 'SubGrowers'];
  const sheetName =
    DATA_SHEET_NAMES.find((n) => workbook.SheetNames.includes(n)) ??
    workbook.SheetNames.find((n) => !n.startsWith('_')) ??
    workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];
  if (!ws) throw new Error('No worksheet found in file');

  const rawRows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rawRows.length < 2) return { rows: [], headerErrors: [] };

  const headerRowIndex = findHeaderRowIndex(rawRows);
  const objectRows = xlsx.utils.sheet_to_json(ws, {
    defval: '',
    raw: true,
    blankrows: false,
    range: headerRowIndex,
  });

  const normalizedRows = objectRows.map((row) => {
    const assoc = {};
    Object.entries(row).forEach(([key, value]) => {
      assoc[normalizeHeader(key)] = value;
    });
    return assoc;
  });
  const filteredRows = normalizedRows.filter((row) => rowHasImportData(row));
  const parsedHeaders = Object.keys(normalizedRows[0] || {});

  // Check required columns are present
  const headerErrors = REQUIRED_COLS.filter((field) => {
    const aliases = HEADER_ALIASES[field];
    return !aliases.some((alias) => parsedHeaders.includes(normalizeHeader(alias)));
  });
  if (headerErrors.length > 0) {
    return { rows: [], headerErrors, headerErrorMessage: `Missing required columns: ${headerErrors.join(', ')}` };
  }

  const parsedRows = [];

  for (let i = 0; i < filteredRows.length; i++) {
    const raw = filteredRows[i];
    const rowNum = i + 1;
    const errors = [];

    // ── Basic field extraction ──
    const name          = getByAliases(raw, HEADER_ALIASES.name);
    const district      = getByAliases(raw, HEADER_ALIASES.district);
    const cropRaw       = getByAliases(raw, HEADER_ALIASES.crop);
    const seedClassRaw  = getByAliases(raw, HEADER_ALIASES.seed_class);
    const lotNumber     = getByAliases(raw, HEADER_ALIASES.lot_number);
    const fieldName     = getByAliases(raw, HEADER_ALIASES.field_name);
    const size          = getByAliases(raw, HEADER_ALIASES.size);
    const sourceOfSeed  = getByAliases(raw, HEADER_ALIASES.source_of_seed);
    const qtyPlanted    = getByAliases(raw, HEADER_ALIASES.quantity_planted);
    const expectedYield = getByAliases(raw, HEADER_ALIASES.expected_yield);
    const phoneNumber   = getByAliases(raw, HEADER_ALIASES.phone_number);
    const gpsLat        = getByAliases(raw, HEADER_ALIASES.gps_latitude);
    const gpsLng        = getByAliases(raw, HEADER_ALIASES.gps_longitude);
    const subcounty     = getByAliases(raw, HEADER_ALIASES.subcounty);
    const village       = getByAliases(raw, HEADER_ALIASES.village);
    const plantingDateRaw = getRawByAliases(raw, HEADER_ALIASES.planting_date);
    const plantingDate = parseExcelDate(plantingDateRaw);

    // ── Required field validation ──
    if (!name)      errors.push('Name is required');
    if (!district)  errors.push('District is required');
    if (!cropRaw)   errors.push('Crop field is required');
    if (!seedClassRaw) errors.push('Seed class is required');
    if (!lotNumber) errors.push('Lot number is required');

    // ── Resolve district from DB ──
    let districtResolved = district;
    if (district) {
      const [distRows] = await db.execute(
        'SELECT name FROM districts WHERE LOWER(name) = LOWER(?)',
        [district]
      );
      if (distRows.length === 0) {
        errors.push(`District "${district}" not found in the system`);
        districtResolved = district; // keep raw value even if not found
      } else {
        districtResolved = distRows[0].name;
      }
    }

    // ── Resolve crop + variety from DB ──
    let cropId = null;
    let varietyId = null;
    if (cropRaw) {
      const m = cropRaw.match(/CROP:\s*(.*?),\s*VARIETY:\s*(.*)/i);
      if (m) {
        const cropName    = m[1].trim();
        const varietyName = m[2].trim();
        const [cropRows]    = await db.execute('SELECT id FROM crops WHERE LOWER(name) = LOWER(?)', [cropName]);
        const [varietyRows] = await db.execute('SELECT id FROM crop_varieties WHERE LOWER(name) = LOWER(?)', [varietyName]);
        if (cropRows.length === 0)    errors.push(`Crop "${cropName}" not found in the system`);
        if (varietyRows.length === 0) errors.push(`Variety "${varietyName}" not found in the system`);
        cropId    = cropRows[0]?.id    ?? null;
        varietyId = varietyRows[0]?.id ?? null;
      } else {
        errors.push('Crop field must be in format "CROP: Name, VARIETY: Name"');
      }
    }

    // ── Normalise seed class ──
    const seedClass = SEED_CLASS_MAP[seedClassRaw.toLowerCase()] ?? seedClassRaw;
    if (seedClassRaw && !SEED_CLASS_MAP[seedClassRaw.toLowerCase()]) {
      errors.push(`Unknown seed class "${seedClassRaw}"`);
    }

    parsedRows.push({
      _rowNum:        rowNum,
      _errors:        errors,
      name,
      field_name:     fieldName,
      size:           size ? Number(size) || null : null,
      crop_id:        cropId,
      variety_id:     varietyId,
      seed_class:     seedClass,
      lot_number:     lotNumber,
      source_of_seed: sourceOfSeed,
      planting_date:  plantingDate,
      quantity_planted: qtyPlanted ? Number(qtyPlanted) || null : null,
      expected_yield: expectedYield ? Number(expectedYield) || null : null,
      phone_number:   phoneNumber,
      gps_latitude:   gpsLat  ? Number(gpsLat)  || null : null,
      gps_longitude:  gpsLng  ? Number(gpsLng)  || null : null,
      district:       districtResolved,
      subcounty,
      village,
    });
  }

  return { rows: parsedRows, headerErrors: [] };
}

export default importSubGrowers;
