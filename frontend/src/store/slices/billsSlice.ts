import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// Types
export interface Bill {
  id: string
  billNumber: string
  billType: string
  recipientName: string
  amount: number
  issueDate: string
  verificationCount: number
  status: 'active' | 'verified' | 'pending'
  createdBy: string
  createdAt: string
}

export interface BillsState {
  bills: Bill[]
  filteredBills: Bill[]
  loading: boolean
  error: string | null
  filters: {
    search: string
    billType: string
    status: string
    dateFrom: string
    dateTo: string
  }
  sort: {
    field: 'date' | 'amount' | 'billNumber'
    order: 'asc' | 'desc'
  }
  pagination: {
    currentPage: number
    pageSize: number
    totalPages: number
  }
}

// Initial state
const initialState: BillsState = {
  bills: [],
  filteredBills: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    billType: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  },
  sort: {
    field: 'date',
    order: 'desc',
  },
  pagination: {
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
  },
}

// Mock data generator
const generateMockBills = (): Bill[] => {
  const billTypes = ['Sales Invoice', 'Purchase Invoice', 'Salary Slip', 'Medical Bill', 'Education Fee', 'Rent Receipt']
  const recipients = ['John Enterprises', 'Tech Solutions', 'Rahul Kumar', 'Global Corp', 'Mega Industries', 'Finance Ltd']
  const statuses: Array<'active' | 'verified' | 'pending'> = ['active', 'verified', 'pending']
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `bill-${i + 1}`,
    billNumber: `BILL${Date.now() - i * 100000}${Math.floor(Math.random() * 1000)}`,
    billType: billTypes[Math.floor(Math.random() * billTypes.length)],
    recipientName: recipients[Math.floor(Math.random() * recipients.length)],
    amount: Math.floor(Math.random() * 100000) + 5000,
    issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    verificationCount: Math.floor(Math.random() * 10),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdBy: 'Current User',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }))
}

// Slice
const billsSlice = createSlice({
  name: 'bills',
  initialState,
  reducers: {
    // Load bills (mock data for now)
    loadBills: (state) => {
      state.loading = true
    },
    loadBillsSuccess: (state, action: PayloadAction<Bill[]>) => {
      state.loading = false
      state.bills = action.payload
      state.filteredBills = action.payload
      billsSlice.caseReducers.applyFiltersAndSort(state)
    },
    loadBillsError: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    // Set search query
    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload
      state.pagination.currentPage = 1
      billsSlice.caseReducers.applyFiltersAndSort(state)
    },

    // Set bill type filter
    setBillTypeFilter: (state, action: PayloadAction<string>) => {
      state.filters.billType = action.payload
      state.pagination.currentPage = 1
      billsSlice.caseReducers.applyFiltersAndSort(state)
    },

    // Set status filter
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.filters.status = action.payload
      state.pagination.currentPage = 1
      billsSlice.caseReducers.applyFiltersAndSort(state)
    },

    // Set date range filter
    setDateRange: (state, action: PayloadAction<{ from: string; to: string }>) => {
      state.filters.dateFrom = action.payload.from
      state.filters.dateTo = action.payload.to
      state.pagination.currentPage = 1
      billsSlice.caseReducers.applyFiltersAndSort(state)
    },

    // Set sort
    setSort: (state, action: PayloadAction<{ field: 'date' | 'amount' | 'billNumber'; order: 'asc' | 'desc' }>) => {
      state.sort = action.payload
      billsSlice.caseReducers.applyFiltersAndSort(state)
    },

    // Set page
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload
    },

    // Set page size
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload
      state.pagination.currentPage = 1
      billsSlice.caseReducers.applyFiltersAndSort(state)
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = initialState.filters
      state.pagination.currentPage = 1
      billsSlice.caseReducers.applyFiltersAndSort(state)
    },

    // Apply filters and sort (internal helper)
    applyFiltersAndSort: (state) => {
      let filtered = [...state.bills]

      // Apply search
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(
          bill =>
            bill.billNumber.toLowerCase().includes(search) ||
            bill.recipientName.toLowerCase().includes(search)
        )
      }

      // Apply bill type filter
      if (state.filters.billType !== 'all') {
        filtered = filtered.filter(bill => bill.billType === state.filters.billType)
      }

      // Apply status filter
      if (state.filters.status !== 'all') {
        filtered = filtered.filter(bill => bill.status === state.filters.status)
      }

      // Apply date range filter
      if (state.filters.dateFrom) {
        filtered = filtered.filter(bill => bill.issueDate >= state.filters.dateFrom)
      }
      if (state.filters.dateTo) {
        filtered = filtered.filter(bill => bill.issueDate <= state.filters.dateTo)
      }

      // Apply sort
      filtered.sort((a, b) => {
        let aVal: any, bVal: any

        switch (state.sort.field) {
          case 'date':
            aVal = new Date(a.issueDate).getTime()
            bVal = new Date(b.issueDate).getTime()
            break
          case 'amount':
            aVal = a.amount
            bVal = b.amount
            break
          case 'billNumber':
            aVal = a.billNumber
            bVal = b.billNumber
            break
        }

        if (state.sort.order === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })

      state.filteredBills = filtered
      state.pagination.totalPages = Math.ceil(filtered.length / state.pagination.pageSize)
    },

    // Initialize with mock data
    initializeMockData: (state) => {
      const mockBills = generateMockBills()
      state.bills = mockBills
      state.filteredBills = mockBills
      billsSlice.caseReducers.applyFiltersAndSort(state)
    },
  },
})

// Export actions
export const {
  loadBills,
  loadBillsSuccess,
  loadBillsError,
  setSearch,
  setBillTypeFilter,
  setStatusFilter,
  setDateRange,
  setSort,
  setPage,
  setPageSize,
  clearFilters,
  initializeMockData,
} = billsSlice.actions

// Export reducer
export default billsSlice.reducer

// Selectors
export const selectAllBills = (state: { bills: BillsState }) => state.bills.bills
export const selectFilteredBills = (state: { bills: BillsState }) => state.bills.filteredBills
export const selectPaginatedBills = (state: { bills: BillsState }) => {
  const { filteredBills, pagination } = state.bills
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize
  const endIndex = startIndex + pagination.pageSize
  return filteredBills.slice(startIndex, endIndex)
}
export const selectLoading = (state: { bills: BillsState }) => state.bills.loading
export const selectFilters = (state: { bills: BillsState }) => state.bills.filters
export const selectSort = (state: { bills: BillsState }) => state.bills.sort
export const selectPagination = (state: { bills: BillsState }) => state.bills.pagination