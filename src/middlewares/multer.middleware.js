import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueFileName = file.fieldname + Date.now();
    cb(null, uniqueFileName);
  },
});


export const upload = multer({ storage: storage });
