class APIFunctionality {
  constructor(baseQuery, queryStr) {
    this.baseQuery = baseQuery;
    this.queryStr = queryStr;
    this.values = [];
    this.limit = 5;
    this.page = 1;
  }

  /* =====================
     🔍 SEARCH (Postgres)
  ===================== */
  search() {
    if (this.queryStr.keyword) {
      const index = this.values.length + 1;

      this.baseQuery += ` AND (name ILIKE $${index} OR email ILIKE $${
        index + 1
      })`;

      const keyword = `%${this.queryStr.keyword}%`;
      this.values.push(keyword, keyword);
    }
    return this;
  }

  /* =====================
     🎯 FILTER (future)
  ===================== */
  filter() {
    return this;
  }

  /* =====================
     🔃 SORT (SQL SAFE)
  ===================== */
  sort() {
    const allowedFields = ["name", "email", "created_at"];

    if (this.queryStr.sort && allowedFields.includes(this.queryStr.sort)) {
      const order =
        this.queryStr.order && this.queryStr.order.toUpperCase() === "DESC"
          ? "DESC"
          : "ASC";

      this.baseQuery += ` ORDER BY ${this.queryStr.sort} ${order}`;
    }
    return this;
  }

  /* =====================
     📄 PAGINATION
  ===================== */
  pagination(resultPerPage) {
    this.limit = resultPerPage;
    this.page = Number(this.queryStr.page) || 1;
    return this;
  }

  /* =====================
     🧱 BUILD FINAL QUERY
  ===================== */
  build() {
    const offset = this.limit * (this.page - 1);

    const limitIndex = this.values.length + 1;
    const offsetIndex = this.values.length + 2;

    return {
      dataQuery: `${this.baseQuery} LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      countQuery: `SELECT COUNT(*) as total FROM (${this.baseQuery}) as countTable`,
      values: this.values,
      paginationValues: [...this.values, this.limit, offset],
    };
  }
}

export default APIFunctionality;
