import express from "express";
import {
  createContact,
  getContacts,
  updateContact,
  deleteContact,
  uploadContacts,
  exportContacts,
  batchDeleteContacts,
} from "../controllers/contactController.js";

import { validate } from "../middlewares/validate.js";
import { contactSchema } from "../validators/contactValidator.js";
import { upload } from "../middlewares/upload.js";


const router = express.Router();

/* ✅ UPLOAD MUST COME FIRST */
router.post("/upload", upload.single("file"), uploadContacts);
router.get("/export", exportContacts);
router.delete("/batch-delete", batchDeleteContacts);


router.post("/", validate(contactSchema), createContact);
router.get("/", getContacts);
router.put("/:id", validate(contactSchema), updateContact);
router.delete("/:id", deleteContact);

export default router;
