import { db } from "../connection/db.js";
import APIFunctionality from "../utils/APIFunctionality.js";
import XLSX from "xlsx";

/* ===========================
   CREATE CONTACT
=========================== */
export const createContact = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const sql = "INSERT INTO contacts (name, email, phone) VALUES ($1, $2, $3)";

    await db.query(sql, [name, email, phone]);

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
=========================== */
export const getContacts = async (req, res) => {
  try {
    let baseQuery = "SELECT * FROM contacts WHERE 1=1";

    const apiFeature = new APIFunctionality(baseQuery, req.query)
      .search()
      .sort()
      .pagination(5)
      .build();

    // get data
    const contactsResult = await db.query(
      apiFeature.dataQuery,
      apiFeature.paginationValues
    );

    // get total count
    const countResult = await db.query(
      apiFeature.countQuery,
      apiFeature.values
    );

    res.status(200).json({
      success: true,
      total: Number(countResult.rows[0].total),
      page: Number(req.query.page) || 1,
      limit: 5,
      data: contactsResult.rows,
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

    // 🔎 check duplicate email or phone
    const checkSql = `
      SELECT id FROM contacts
      WHERE (email = $1 OR phone = $2) AND id != $3
    `;

    const existing = await db.query(checkSql, [email, phone, id]);

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email or phone already exists",
      });
    }

    const updateSql = `
      UPDATE contacts
      SET name = $1, email = $2, phone = $3, updated_at = NOW()
      WHERE id = $4
    `;

    await db.query(updateSql, [name, email, phone, id]);

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
    const sql = "DELETE FROM contacts WHERE id = $1 RETURNING id";

    const result = await db.query(sql, [req.params.id]);

    if (result.rows.length === 0) {
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

/* ===========================
   EXCEL UPLOAD WITH ERROR REPORT
=========================== */
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

      validRows.push(row);
    });

    for (const r of validRows) {
      await db.query(
        `
        INSERT INTO contacts (name, email, phone)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING
        `,
        [r.name, r.email, r.phone]
      );
    }

    res.status(200).json({
      success: true,
      inserted: validRows.length,
      errors: errorRows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   EXPORT CONTACTS TO EXCEL
=========================== */
export const exportContacts = async (req, res) => {
  try {
    const result = await db.query("SELECT name, email, phone FROM contacts");

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No contacts found",
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(result.rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

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

/* ===========================
   BATCH DELETE
=========================== */
export const batchDeleteContacts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "IDs array is required",
      });
    }

    const sql = `
      DELETE FROM contacts
      WHERE id = ANY($1::int[])
      RETURNING id
    `;

    const result = await db.query(sql, [ids]);

    res.status(200).json({
      success: true,
      deletedCount: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
