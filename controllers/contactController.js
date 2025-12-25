import { db } from "../connection/db.js";
import APIFunctionality from "../utils/APIFunctionality.js";

// helper to use async/await with mysql2
const queryAsync = (sql, values) => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

/* ===========================
   CREATE CONTACT
=========================== */
export const createContact = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const sql = "INSERT INTO contacts (name, email, phone) VALUES (?, ?, ?)";

    await queryAsync(sql, [name, email, phone]);

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   GET CONTACTS
   (SEARCH + FILTER + PAGINATION)
=========================== */
export const getContacts = async (req, res) => {
  try {
    let baseQuery = "SELECT * FROM contacts WHERE 1=1";

    const apiFeature = new APIFunctionality(baseQuery, req.query)
      .search()
      .sort() // ✅ REQUIRED
      .pagination(5)
      .build();

    // get data
    const contacts = await queryAsync(
      apiFeature.dataQuery,
      apiFeature.paginationValues
    );

    // get total count
    const countResult = await queryAsync(
      apiFeature.countQuery,
      apiFeature.values
    );

    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      total,
      page: Number(req.query.page) || 1,
      limit: 5,
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   UPDATE CONTACT
=========================== */
export const updateContact = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const { id } = req.params;

    // 🔎 check if email or phone already exists for another user
    const checkSql = `
      SELECT id FROM contacts 
      WHERE (email = ? OR phone = ?) AND id != ?
    `;

    const existing = await queryAsync(checkSql, [email, phone, id]);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email or phone already exists",
      });
    }

    // ✅ safe update
    const updateSql = `
      UPDATE contacts 
      SET name = ?, email = ?, phone = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await queryAsync(updateSql, [name, email, phone, id]);

    res.json({
      success: true,
      message: "Contact updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   DELETE CONTACT
=========================== */
export const deleteContact = async (req, res) => {
  try {
    const sql = "DELETE FROM contacts WHERE id=?";

    const result = await queryAsync(sql, [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

import XLSX from "xlsx";

/* ================= EXCEL UPLOAD ================= */
/* ================= EXCEL UPLOAD WITH ERROR REPORT ================= */
export const uploadContacts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const workbook = XLSX.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const validRows = [];
    const errorRows = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2;

      if (!row.name || !row.email || !row.phone) {
        errorRows.push({
          row: rowNumber,
          error: "Name, Email, Phone are required",
        });
        return;
      }

      if (!/^\S+@\S+\.\S+$/.test(row.email)) {
        errorRows.push({
          row: rowNumber,
          error: "Invalid email format",
        });
        return;
      }

      if (!/^[0-9]{10}$/.test(row.phone)) {
        errorRows.push({
          row: rowNumber,
          error: "Invalid phone number",
        });
        return;
      }

      validRows.push([row.name, row.email, row.phone]);
    });

    // insert valid rows
    if (validRows.length > 0) {
      const sql = "INSERT IGNORE INTO contacts (name, email, phone) VALUES ?";
      await queryAsync(sql, [validRows]);
    }

    // generate error Excel if errors exist
    if (errorRows.length > 0) {
      const errorSheet = XLSX.utils.json_to_sheet(errorRows);
      const errorWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(errorWorkbook, errorSheet, "Errors");

      const errorBuffer = XLSX.write(errorWorkbook, {
        bookType: "xlsx",
        type: "buffer",
      });

      return res.status(200).json({
        success: true,
        inserted: validRows.length,
        errors: errorRows,
        errorReportBase64: errorBuffer.toString("base64"),
      });
    }

    res.status(200).json({
      success: true,
      inserted: validRows.length,
      errors: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= EXPORT CONTACTS TO EXCEL ================= */
export const exportContacts = async (req, res) => {
  try {
    // fetch all contacts (you can add filter/search later)
    const sql = "SELECT name, email, phone FROM contacts";
    const contacts = await queryAsync(sql);

    if (contacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No contacts found",
      });
    }

    // convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(contacts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

    // create buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // set headers for download
    res.setHeader("Content-Disposition", "attachment; filename=contacts.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= BATCH DELETE ================= */
export const batchDeleteContacts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "IDs array is required",
      });
    }

    const sql = "DELETE FROM contacts WHERE id IN (?)";
    const result = await queryAsync(sql, [ids]);

    res.status(200).json({
      success: true,
      deletedCount: result.affectedRows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
