import { GraphQLError } from "graphql";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Saves a GraphQL Upload to disk and returns metadata
// Params: { file, subdir?: string }
// - file: the Upload promise/object
// - subdir: sub-directory inside public/ to store files (default: 'attachments')
// Returns: { filename, path, mimetype, encoding, originalName }
const saveUpload = async ({ file, subdir = "attachments" }) => {
  try {
    const upload = await file; // { filename, mimetype, encoding, createReadStream }
    if (!upload || typeof upload.createReadStream !== "function") {
      throw new GraphQLError("Invalid upload payload");
    }

    const { filename: originalName, mimetype, encoding, createReadStream } = upload;

    const ext = path.extname(originalName || "");
    const id = uuidv4();
    const newFilename = `${id}${ext || ""}`;

    const folderPath = path.join(__dirname, "../public", subdir);
    console.log("Saving upload to:", folderPath);
    await fs.promises.mkdir(folderPath, { recursive: true });

    const filePath = path.join(folderPath, newFilename);
    const publicPath = path.posix.join(subdir, newFilename);

    const stream = createReadStream();

    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
      stream.on("error", reject);
      stream.pipe(writeStream);
    });

    return {
      filename: newFilename,
      path: publicPath, // relative to public/ (served statically)
      mimetype,
      encoding,
      originalName: originalName || newFilename,
    };
  } catch (error) {
    throw new GraphQLError(error.message || "Failed to save upload");
  }
};

export default saveUpload;

