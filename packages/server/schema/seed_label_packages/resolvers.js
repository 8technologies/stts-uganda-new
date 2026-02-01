
import { GraphQLError } from "graphql";
import { db } from "../../config/config.js";
import saveData from "../../utils/db/saveData.js";
import checkPermission from "../../helpers/checkPermission.js";
import hasPermission from "../../helpers/hasPermission.js";

let seedLabelPackageColumns = null;

const loadSeedLabelPackageColumns = async () => {
  if (seedLabelPackageColumns) {
    return seedLabelPackageColumns;
  }

  const [columns] = await db.execute("SHOW COLUMNS FROM seed_label_packages");
  seedLabelPackageColumns = new Set(columns.map((col) => col.Field));
  return seedLabelPackageColumns;
};

const ensureSeedLabelPackageSchema = async () => {
  const columns = await loadSeedLabelPackageColumns();
  const required = [
    "name",
    "package_size_kg",
    "labels_per_package",
    "price_ugx",
    "is_active",
  ];
  const missing = required.filter((col) => !columns.has(col));
  if (missing.length) {
    throw new GraphQLError(
      "Seed label packages table is out of date. Please run packages/server/sql/seed_label_packages.sql to update it."
    );
  }
};

const mapSeedLabelPackagesRow = (row) => {
  const name =
    row.name ||
    (row.crop_id ? `Crop ${row.crop_id}` : `Package ${row.id ?? ""}`.trim());
  const packageSizeKg =
    row.package_size_kg != null ? Number(row.package_size_kg) : Number(row.quantity || 0);
  const labelsPerPackage = row.labels_per_package ?? row.labelsPerPackage ?? 1;
  const priceUgx =
    row.price_ugx != null ? Number(row.price_ugx) : Number(row.price || 0);
  const isActive =
    row.is_active != null ? Boolean(row.is_active) : !Boolean(row.deleted);
  return {
    id: row.id?.toString(),
    name,
    packageSizeKg,
    labelsPerPackage,
    priceUgx,
    isActive,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  };
};

export const fetchSeedLabelPackages = async ({
  id = null,
  activeOnly = false,
} = {}) => {
  try {
    const columns = await loadSeedLabelPackageColumns();
    const values = [];
    const where = [];

    if (id) {
      where.push("id = ?");
      values.push(id);
    }

    if (activeOnly) {
      if (columns.has("is_active")) {
        where.push("is_active = 1");
      } else if (columns.has("deleted")) {
        where.push("deleted = 0");
      }
    }

    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const query = `SELECT * FROM seed_label_packages ${clause} ORDER BY created_at DESC`;
    const [rows] = await db.execute(query, values);
    return rows.map(mapSeedLabelPackagesRow);
  } catch (error) {
    throw new GraphQLError(error.message);
  }
};

const SeedLabelPackagesResolver = {
  Query: {
    seedLabelPackages: async (_parent, args, context) => {
      try {
        const userPermissions = context?.req?.user?.permissions || [];
        const canViewPackages =
          hasPermission(userPermissions, "can_manage_seed_label_packages") ||
          hasPermission(userPermissions, "can_manage_seed_labels") ||
          hasPermission(userPermissions, "can_view_seed_labels") ||
          hasPermission(userPermissions, "can_print_seed_labels") ||
          hasPermission(userPermissions, "can_approve_seed_labels");

        if (!canViewPackages) {
          checkPermission(
            userPermissions,
            "can_manage_seed_label_packages",
            "You dont have permissions to view seed label packages"
          );
        }

        return await fetchSeedLabelPackages({
          activeOnly: Boolean(args?.activeOnly),
        });
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
  Mutation: {
    saveSeedLabelPackage: async (_parent, args, context) => {
      try {
        const userPermissions = context?.req?.user?.permissions || [];
        checkPermission(
          userPermissions,
          "can_manage_seed_label_packages",
          "You dont have permissions to manage seed label packages"
        );

        await ensureSeedLabelPackageSchema();

        const input = args.input || {};
        const {
          id,
          name,
          packageSizeKg,
          labelsPerPackage,
          priceUgx,
          isActive,
        } = input;

        const data = {
          name,
          package_size_kg: packageSizeKg,
          labels_per_package: labelsPerPackage,
          price_ugx: priceUgx,
          is_active: isActive == null ? 1 : isActive ? 1 : 0,
        };

        const saveId = await saveData({
          table: "seed_label_packages",
          data,
          id: id ?? null,
        });

        return {
          success: true,
          message: id
            ? "Seed label package updated successfully"
            : "Seed label package created successfully",
          package: mapSeedLabelPackagesRow({
            id: id ?? saveId,
            name: data.name,
            package_size_kg: data.package_size_kg,
            labels_per_package: data.labels_per_package,
            price_ugx: data.price_ugx,
            is_active: data.is_active,
            created_at: new Date(),
            updated_at: new Date(),
          }),
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    deleteSeedLabelPackage: async (_parent, args, context) => {
      try {
        const userPermissions = context?.req?.user?.permissions || [];
        checkPermission(
          userPermissions,
          "can_manage_seed_label_packages",
          "You dont have permissions to manage seed label packages"
        );

        const id = args.id;

        const columns = await loadSeedLabelPackageColumns();
        if (columns.has("is_active")) {
          await saveData({
            table: "seed_label_packages",
            data: {
              is_active: 0,
            },
            id,
          });
        } else if (columns.has("deleted")) {
          await saveData({
            table: "seed_label_packages",
            data: {
              deleted: 1,
            },
            id,
          });
        } else {
          await db.execute("DELETE FROM seed_label_packages WHERE id = ?", [
            id,
          ]);
        }

        return {
          success: true,
          message: "Seed label package deleted successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default SeedLabelPackagesResolver;
