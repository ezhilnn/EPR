import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Copy,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Eye,
  AlertCircle
} from 'lucide-react'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  initializeMockData,
  setSearch,
  setBillTypeFilter,
  setStatusFilter,
  setSort,
  setPage,
  setPageSize,
  clearFilters,
  selectPaginatedBills,
  selectFilters,
  selectSort,
  selectPagination,
  selectFilteredBills,
} from '../../store/slices/billsSlice'
import styles from './BillList.module.css'

function BillList() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  // Redux selectors
  const paginatedBills = useAppSelector(selectPaginatedBills)
  const allFilteredBills = useAppSelector(selectFilteredBills)
  const filters = useAppSelector(selectFilters)
  const sort = useAppSelector(selectSort)
  const pagination = useAppSelector(selectPagination)

  // Initialize mock data on mount
  useEffect(() => {
    dispatch(initializeMockData())
  }, [dispatch])

  // Bill types for filter
  const billTypes = [
    'Sales Invoice',
    'Purchase Invoice',
    'Salary Slip',
    'Medical Bill',
    'Education Fee',
    'Rent Receipt',
  ]

  // Handle search
  const handleSearch = (value: string) => {
    dispatch(setSearch(value))
  }

  // Handle filter change
  const handleBillTypeFilter = (value: string) => {
    dispatch(setBillTypeFilter(value))
  }

  const handleStatusFilter = (value: string) => {
    dispatch(setStatusFilter(value))
  }

  // Handle sort
  const handleSort = (field: 'date' | 'amount' | 'billNumber') => {
    const newOrder = sort.field === field && sort.order === 'desc' ? 'asc' : 'desc'
    dispatch(setSort({ field, order: newOrder }))
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    dispatch(setPage(page))
  }

  const handlePageSizeChange = (size: number) => {
    dispatch(setPageSize(size))
  }

  // Handle actions
  const handleViewBill = (billNumber: string) => {
    navigate(`/institution/bills/${billNumber}`)
  }

  const handleDownloadPDF = (billNumber: string) => {
    alert(`Downloading PDF for ${billNumber}`)
  }

  const handleCopyLink = (billNumber: string) => {
    const link = `${window.location.origin}/verify?bill=${billNumber}`
    navigator.clipboard.writeText(link)
    alert('Verification link copied to clipboard!')
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className={styles.badgeActive}><CheckCircle size={14} /> Active</span>
      case 'verified':
        return <span className={styles.badgeVerified}><Eye size={14} /> Verified</span>
      case 'pending':
        return <span className={styles.badgePending}><AlertCircle size={14} /> Pending</span>
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(pagination.totalPages, start + maxVisible - 1)

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>All Bills</h1>
          <p className={styles.subtitle}>
            Manage and track all generated bills
          </p>
        </div>
        <Button
          variant="primary"
          icon={<FileText size={18} />}
          onClick={() => navigate('/institution/generate')}
        >
          Generate New Bill
        </Button>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsRow}>
        <Card variant="bordered" padding="medium">
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Bills</span>
            <span className={styles.statValue}>{allFilteredBills.length}</span>
          </div>
        </Card>
        <Card variant="bordered" padding="medium">
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Amount</span>
            <span className={styles.statValue}>
              {formatCurrency(allFilteredBills.reduce((sum, bill) => sum + bill.amount, 0))}
            </span>
          </div>
        </Card>
        <Card variant="bordered" padding="medium">
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Active</span>
            <span className={styles.statValue}>
              {allFilteredBills.filter(b => b.status === 'active').length}
            </span>
          </div>
        </Card>
        <Card variant="bordered" padding="medium">
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Verified</span>
            <span className={styles.statValue}>
              {allFilteredBills.filter(b => b.status === 'verified').length}
            </span>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="large">
        <div className={styles.filterSection}>
          {/* Search */}
          <div className={styles.searchBox}>
            <Input
              type="text"
              placeholder="Search by bill number or recipient..."
              icon={<Search size={18} />}
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Filters Row */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <Filter size={16} /> Bill Type:
              </label>
              <select
                className={styles.filterSelect}
                value={filters.billType}
                onChange={(e) => handleBillTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {billTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status:</label>
              <select
                className={styles.filterSelect}
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="small"
              onClick={() => dispatch(clearFilters())}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Results Info */}
        <div className={styles.resultsInfo}>
          <span>
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, allFilteredBills.length)} of {allFilteredBills.length} bills
          </span>
          <div className={styles.pageSizeSelector}>
            <span>Show:</span>
            <select
              className={styles.pageSizeSelect}
              value={pagination.pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>per page</span>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => handleSort('billNumber')} className={styles.sortable}>
                  Bill Number {sort.field === 'billNumber' && (sort.order === 'asc' ? '↑' : '↓')}
                </th>
                <th>Bill Type</th>
                <th>Recipient</th>
                <th onClick={() => handleSort('amount')} className={styles.sortable}>
                  Amount {sort.field === 'amount' && (sort.order === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('date')} className={styles.sortable}>
                  Date {sort.field === 'date' && (sort.order === 'asc' ? '↑' : '↓')}
                </th>
                <th>Verifications</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBills.map((bill) => (
                <tr key={bill.id}>
                  <td>
                    <span className={styles.billNumber}>
                      <FileText size={16} />
                      {bill.billNumber}
                    </span>
                  </td>
                  <td>
                    <span className={styles.billType}>{bill.billType}</span>
                  </td>
                  <td>{bill.recipientName}</td>
                  <td className={styles.amount}>{formatCurrency(bill.amount)}</td>
                  <td>
                    <span className={styles.date}>
                      <Calendar size={14} />
                      {formatDate(bill.issueDate)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.verificationCount}>
                      <Eye size={14} />
                      {bill.verificationCount}
                    </span>
                  </td>
                  <td>{getStatusBadge(bill.status)}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleViewBill(bill.billNumber)}
                        title="View Details"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleDownloadPDF(bill.billNumber)}
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleCopyLink(bill.billNumber)}
                        title="Copy Verification Link"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <div className={styles.pageNumbers}>
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  className={`${styles.pageNumber} ${
                    page === pagination.currentPage ? styles.pageNumberActive : ''
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className={styles.pageButton}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Empty State */}
        {paginatedBills.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={48} color="var(--color-text-light)" />
            <h3>No bills found</h3>
            <p>
              {filters.search || filters.billType !== 'all' || filters.status !== 'all'
                ? 'Try adjusting your filters'
                : 'Generate your first bill to see it here'}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default BillList