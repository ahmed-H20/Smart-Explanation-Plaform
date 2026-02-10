const QueryString = require("qs");
const qs = require("qs");

class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
    this.queryObj = {};
  }

  filter() {
    const excludesFields = { ...this.queryString };
    const queryWords = ["page", "limit", "sort", "search", "field"];
    // check no query words
    queryWords.forEach((element) => delete excludesFields[element]);
    const queryStr = JSON.stringify(qs.parse(excludesFields)).replace(
      /\b(gte|lte|gt|lt)\b/g,
      (match) => `$${match}`,
    );
    Object.assign(this.queryObj, JSON.parse(queryStr));
    return this;
  }

  search(modelName) {
    if (this.queryString.search) {
      const keyword = this.queryString.search;
      let searchQuery = {};
      if (modelName === "product") {
        searchQuery.$or = [
          { title: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ];
      } else {
        searchQuery = { name: { $regex: keyword, $options: "i" } };
      }
      Object.assign(this.queryObj, searchQuery);
    }
    return this;
  }

  // To Make all query in one find to search and filter work together
  build() {
    this.mongooseQuery = this.mongooseQuery.find(this.queryObj);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortedBy = this.queryString.sort.split(",").join(" "); // for many fields
      this.mongooseQuery = this.mongooseQuery.sort(sortedBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
    }

    return this;
  }

  pagination(documentsCount) {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;
    const lastIndex = page * limit;

    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.numberOfPages = Math.ceil(documentsCount / limit);

    // Next Page page * limit = 2 * 10 = 20
    if (lastIndex < documentsCount) {
      pagination.nextPage = page + 1;
    }

    // Prev Page pages skipped > 0
    if (skip > 0) {
      pagination.prevPage = page - 1;
    }

    this.pagination = pagination;

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }

  limitation() {
    if (this.queryString.field) {
      const fields = this.queryString.field.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }

  populated(path, select) {
    if (
      this.queryString.field?.includes("category") // only for products
    ) {
      this.mongooseQuery = this.mongooseQuery.populate({
        path: path,
        select: select,
      });
    }
    return this;
  }
}

module.exports = ApiFeatures;
