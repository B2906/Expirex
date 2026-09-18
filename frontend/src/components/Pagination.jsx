export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 md:px-6">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <div className="flex flex-wrap justify-center gap-1">
        {pages.map((pageNumber) => (
          <button
            type="button"
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={`h-9 min-w-9 rounded-lg px-2 text-sm font-medium ${pageNumber === page ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {pageNumber}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}
