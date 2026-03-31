import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file harus PNG, JPG, JPEG, WEBP"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 512 * 1024,
  },
  fileFilter,
});

export default upload;
