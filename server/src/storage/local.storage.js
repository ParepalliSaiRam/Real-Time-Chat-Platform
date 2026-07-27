import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.resolve("uploads");

export const upload = async (file) => {

    const uniqueName =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname);

    await fs.writeFile(path.join(UPLOAD_DIR, uniqueName), file.buffer);

    return {
        url: `/uploads/${uniqueName}`,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
    };

};
