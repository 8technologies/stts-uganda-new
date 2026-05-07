
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
  // const required = [
  //   "name",
  //   "package_size_kg",
  //   "labels_per_package",
  //   "price_ugx",
  //   "is_active",
  // ];
  const required = [
    "crop_id",
    "quantity",
    "price",
    "deleted",
  ];
  const missing = required.filter((col) => !columns.has(col));
  if (missing.length) {
    throw new GraphQLError(
      "Seed label packages table is out of date. Please run packages/server/sql/seed_label_packages.sql to update it."
    );
  }
};

const mapSeedLabelPackagesRow = (row) => {
  const crop_id =
    // row.name ||
    (row.crop_id ? row.crop_id.toString() : null);
  const packageSizeKg =
    row.quantity != null ? Number(row.quantity) : Number(row.quantity || 0);
  // const labelsPerPackage = row.labels_per_package ?? row.labelsPerPackage ?? 1;
  const priceUgx =
    row.price != null ? Number(row.price) : Number(row.price || 0);
  const isActive =
    row.deleted != null ? !Boolean(row.deleted) : Boolean(row.is_active);
  return {
    id: row.id?.toString(),
    crop_id,
    packageSizeKg,
    // labelsPerPackage,
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
  SeedLabelPackage: {
      crop: async (parent) => {
        if (!parent.crop_id) return null;
        const [rows] = await db.execute("SELECT * FROM crops WHERE id = ?", [
          parent.crop_id,
        ]);
        return rows.length ? rows[0] : null;

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
          crop_id,
          packageSizeKg,
          priceUgx,
          isActive,
        } = input;

        const data = {
          crop_id,
          quantity: packageSizeKg,
          price: priceUgx,
          deleted: isActive == null ? 0 : isActive ? 0 : 1,
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
            crop_id: data.crop_id,
            quantity: data.quantity,
            price: data.price,
            deleted: data.deleted,
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
