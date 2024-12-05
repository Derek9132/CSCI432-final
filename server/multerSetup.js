import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "imgUploads/")
    },
    filename: (req, file, cb) => {
        // Generate a unique filename using the current timestamp
        cb(null, Date.now() + path.extname(file.originalname));
    }
})

export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB size limit
    fileFilter: (req, file, cb) => {
        // Allow only image files (e.g., .jpg, .jpeg, .png)
        const fileTypes = /jpeg|jpg|png/;
        const mimeType = fileTypes.test(file.mimetype);
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extName) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed.'));
        }
    }
}).single("profileImage"); // Expect the image file to be named "profileImage" in the form

export default upload
