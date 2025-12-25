class APIFunctionality {
  constructor(baseQuery, queryStr) {
    this.baseQuery = baseQuery;
    this.queryStr = queryStr;
    this.values = [];
    this.limit = 5;
    this.page = 1;
  }

  // 🔍 SEARCH
  search() {
    if (this.queryStr.keyword) {
      this.baseQuery += " AND (name LIKE ? OR email LIKE ?)";
      const keyword = `%${this.queryStr.keyword}%`;
      this.values.push(keyword, keyword);
    }
    return this;
  }

  // 🎯 FILTER (future safe)
  filter() {
    return this;
  }

  // 🔃 SORT (❗ FIX IS HERE)
  sort() {
    if (this.queryStr.sort) {
      const order =
        this.queryStr.order && this.queryStr.order.toUpperCase() === "DESC"
          ? "DESC"
          : "ASC";

      this.baseQuery += ` ORDER BY ${this.queryStr.sort} ${order}`;
    }
    return this;
  }

  // 📄 PAGINATION
  pagination(resultPerPage) {
    this.limit = resultPerPage;
    this.page = Number(this.queryStr.page) || 1;
    return this;
  }

  // 🧱 BUILD FINAL QUERY
  build() {
    const offset = this.limit * (this.page - 1);

    return {
      dataQuery: `${this.baseQuery} LIMIT ? OFFSET ?`,
      countQuery: `SELECT COUNT(*) as total FROM (${this.baseQuery}) as countTable`,
      values: this.values,
      paginationValues: [...this.values, this.limit, offset],
    };
  }
}

export default APIFunctionality;
