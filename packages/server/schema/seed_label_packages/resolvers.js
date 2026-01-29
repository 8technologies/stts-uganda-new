
import { GraphQLError } from "graphql";
import { db } from "../../config/config.js";
import { fetchCropById } from "../crop/resolvers";
import saveData from "../../utils/db/saveData.js";

const mapSeedLabelPackagesRow = (row) => {
    return {    
        id: row.id?.toString(),
        crop_id: row.crop_id?.toString(),
        quantity: row.quantity || null,
        price: row.price != null ? parseFloat(row.price) : null,
        created_at: row.created_at ? new Date(row.created_at) : null,
    };
}

export const fetchSeedLabelPackages = async ({
    crop_id =null,
}) => {
    try{
        let values = [];
        let where = '';

        if (crop_id) {
            where += ' AND crop_id = ? ';
            values.push(crop_id);
        }
        const query = `SELECT * FROM seed_label_packages WHERE seed_label_packages.deleted =0 ${where} ORDER BY created_at DESC`;
        const [rows] = await db.execute(query, values);
        return rows.map(mapSeedLabelPackagesRow);

    } catch (error) {
        throw new GraphQLError(error.message);
    }

};

const SeedLabelPackagesResolver = {
    Query: {
        getSeedLabelPackages: async (parent, args, context) => {
            try {
                const crop_id = args.crop_id;
                
                const results = await fetchSeedLabelPackages({
                    crop_id: crop_id??null,
                });

                return results;
            } catch (error) {
                throw new GraphQLError(error.message);
            }
        }
    },
    SeedLabelPackage: {
        Crop: async (parent) => {
            try {
                const cropId = parent.crop_id;
                if (!cropId) return null;

                const crop = await fetchCropById(cropId);
                return crop;

            } catch (error) {
                throw new GraphQLError(error.message);
            }
        }
    },
    Mutation: {
        SeedLabelPackage: async (parent, args, context) => {
            try {
                const input = args.input;
                const { id, crop_id, quantity, price } = input;

                const data = {
                    crop_id,
                    quantity,
                    price,
                };

                const saveId = await saveData({
                    table:'seed_label_packages', 
                    data,
                    id: id??null,
                });

                return {
                    success: true,
                    message: id ? "Seed Label Package updated successfully" : "Seed Label Package created successfully",
                    seedLabelPackage: {...data, id: id??saveId},
                };


            } catch (error) {
                throw new GraphQLError(error.message);
            }

        },
        deleteSeedLabelPackage: async (parent, args, context) => {
            try {

                const id = args.id;

                const data = {
                    deleted: 1,
                };
                await saveData({
                    table:'seed_label_packages', 
                    data,
                    id,
                });
                return {
                    success: true,
                    message: "Seed Label Package deleted successfully",
                };


            } catch (error) {
                throw new GraphQLError(error.message);
            }
        }
    }

}

export default SeedLabelPackagesResolver;