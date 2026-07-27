import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";

const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});

export const upload = async (file) => {

    const uniqueName =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname);

    await client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueName,
        Body: file.buffer,
        ContentType: file.mimetype
    }));

    return {
        url: `${process.env.R2_PUBLIC_URL}/${uniqueName}`,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
    };

};
