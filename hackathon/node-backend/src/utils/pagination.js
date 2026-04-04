function getPagination(page = 1, pageSize = 10) {
  const parsedPage = Number(page);
  const parsedPageSize = Number(pageSize);

  return {
    page: parsedPage,
    pageSize: parsedPageSize,
    skip: (parsedPage - 1) * parsedPageSize,
  };
}

function buildPaginationMeta({ page, pageSize, totalItems }) {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  };
}

module.exports = {
  getPagination,
  buildPaginationMeta,
};
