import multer from "multer";
import AppError from "../utils/AppError.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

    const allowed = [

        "image/png",

        "image/jpeg",

        "application/pdf"

    ];

    if (allowed.includes(file.mimetype)) {

        cb(null, true);

    } else {

        cb(
    new AppError(
        "Only PNG, JPEG and PDF files are allowed.",
        400
    )
);

    }

};

export const uploadSingle = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
}).single("file");