# Budget Management System - Business Flow Architecture

## SECTION 1: SYSTEM OVERVIEW

This document explains how the Budget Management System transforms existing UI into a business-flow-driven system with proper state management and financial controls.

### Key Design Principles
1. **No manual editing of calculated values** - All financial metrics (Available Budget, Monthly Actuals, Balance) are derived
2. **Status-driven state changes** - Only approved transactions affect budget availability
3. **Immutable history** - All transactions maintain audit trail; posted actuals cannot be edited
4. **Transactional integrity** - Budget constraints enforced at creation/submission time

---

## SECTION 2: DATA FLOW ARCHITECTURE

### 2.1 Entity Relationships & Dependencies

\`\`\`
Budget (Master)
  ├── BudgetRevision (adjusts baseline via delta)
  │   └── Only Approved revisions update Available Budget
  │
  ├── Commitment (SPK - locks budget)
  │   ├── Only Approved SPKs reduce Available Budget
  │   └── Cancelled SPKs restore budget
  │
  └── ActualPayment (consumption)
      ├── Only Posted actuals finalize spend
      └── Reduces Remaining Commitment
\`\`\`

### 2.2 Master Record: Budget Baseline

The **Budget Baseline** is the immutable source of truth created when a budget is APPROVED:

\`\`\`
Budget Baseline = Initial Amount ± Approved Revisions

Example:
- Initial Budget: 1,000M (created, status: Draft)
- Submit & Approve: 1,000M (status: Approved)
  → Creates Baseline: 1,000M
  → Available Budget = 1,000M (nothing committed/actual yet)

- Later: Revision submitted for +100M
  → Revision in Draft/Submitted (no impact yet)
  
- Finance Approves Revision:
  → Baseline Updated: 1,100M (stores original + delta)
  → Revision stored separately (preserves history)
  → Available Budget recalculated: 1,100M - existing commitments
\`\`\`

### 2.3 Financial State Calculations (Real-Time)

All calculations are **read-only** and derived at runtime:

\`\`\`typescript
// At any given moment:

Approved Budget = Initial Amount + SUM(Approved Revisions.Difference)
  └─ Source: budget.initialAmount + sum of revision.difference where status=APPROVED

Total Committed = SUM(Commitment.Amount where status=APPROVED)
  └─ Source: all approved SPKs in commitments[] array
  └─ NOT including: Draft, Submitted, Cancelled SPKs

Total Actual = SUM(ActualPayment.Amount where status=POSTED)
  └─ Source: all posted payments in actuals[] array
  └─ NOT including: Draft, Submitted, Cancelled payments

Available Budget = Approved Budget - Total Committed - Total Actual
  └─ Most critical formula: determines if new commitment can be created
  └─ Recalculated EVERY time: revision approved, SPK approved, actual posted

Remaining Commitment (per SPK) = SPK Amount - SUM(Posted Actuals against this SPK)
  └─ Determines if new actual payment can be posted against this SPK
  └─ Recalculated when payment is posted

Budget Utilization % = (Total Actual / Approved Budget) × 100
  └─ KPI metric used in Budget vs Actual monitoring
\`\`\`

---

## SECTION 3: TRANSACTION LIFECYCLE & STATE CHANGES

### 3.1 Budget Lifecycle

\`\`\`
State Flow:
Draft → Submitted → Approved → Closed
           ↓           ↓
        Rejected   (no further action)

Critical Points:
✓ Draft: Editable, no system impact
✓ Submitted: Sent to Finance for approval, immutable
✓ Approved: NOW creates Available Budget = Initial Amount
  - This is when budget baseline is established
  - Budget is now available for commitments
  - Revisions can now be submitted
✓ Closed: No more revisions (year-end)
✓ Rejected: No budget created, requester can resubmit as Draft
\`\`\`

### 3.2 Revision Lifecycle

\`\`\`
State Flow:
Draft → Submitted → Approved
           ↓           ↓
        Rejected   (Baseline Updated + Difference applied)

Critical Points:
✓ Draft: Changes saved locally, no impact
✓ Submitted: Sent for approval
✓ Approved: 
  - Difference is ADDED to budget baseline (not replaced)
  - History preserved: old baseline, revision record, new baseline
  - Available Budget immediately recalculated
  - Example: Was 1M → +100K revision → Now 1.1M
\`\`\`

### 3.3 Commitment (SPK) Lifecycle

\`\`\`
State Flow:
Draft → Submitted → Approved → Completed
           ↓           ↓
        Rejected   Cancelled

Critical Points:
✓ Draft: Stored locally, validation skipped
✓ Submitted: Sent for approval
✓ Approved: 
  - IMMEDIATE: Available Budget reduced
  - Commitment amount is LOCKED (cannot edit)
  - Multiple actuals can be posted against it
  - Example: Available = 1M, approve 400K SPK → Available = 600K
✓ Cancelled: 
  - ANY time before completion
  - Restores locked budget immediately
✓ Completed:
  - Marks delivery done, but actuals still can be posted
  - No further SPKs against this line
\`\`\`

### 3.4 Actual Payment Lifecycle

\`\`\`
State Flow:
Draft → Submitted → Posted
           ↓           
        Cancelled

Critical Points:
✓ Draft: Local only, validation skipped
✓ Submitted: Sent for posting
✓ Posted:
  - IMMUTABLE: Cannot edit amount, date, or description
  - Remaining Commitment recalculated
  - Available Budget reduced
  - Monthly Actuals column updated in Budget vs Actual
  - Only way to undo: Cancel with reversal entry
✓ Cancelled:
  - Creates reversal: amount becomes 0 or negative
  - Restores commitment balance
\`\`\`

---

## SECTION 4: STATE CHANGE TRIGGERS & GLOBAL IMPACT

### 4.1 When Budget State Changes

**Event: Budget Approved (Draft → Approved)**
\`\`\`javascript
// State before:
store.budgets = [{id: BDG-123, status: DRAFT, initialAmount: 1000M}]
store.commitments = []
store.actuals = []

// Trigger: User clicks "Submit" → Finance clicks "Approve"
store.approveBudget("BDG-123")

// State after:
store.budgets = [{id: BDG-123, status: APPROVED, initialAmount: 1000M}]
// IMPACT:
// ✓ getBudgetBalance(BDG-123) now returns:
//   {approvedBudget: 1000M, totalCommitted: 0, totalActual: 0, available: 1000M}
// ✓ Dashboard updates: Approved Budget card shows 1000M
// ✓ Budget vs Actual: New row appears for this budget
// ✓ Spending Request screen: This budget now appears in dropdown
\`\`\`

### 4.2 When Commitment Is Approved

**Event: SPK Approved (Submitted → Approved)**
\`\`\`javascript
// State before:
store.commitments = [{id: SPK-456, budgetId: BDG-123, amount: 400M, status: SUBMITTED}]
// getBudgetBalance(BDG-123) = {available: 1000M}

// Trigger: Finance clicks "Approve SPK"
store.approveCommitment("SPK-456")

// State after:
store.commitments = [{id: SPK-456, budgetId: BDG-123, amount: 400M, status: APPROVED}]
// IMPACT:
// ✓ getBudgetBalance(BDG-123) now returns:
//   {approvedBudget: 1000M, totalCommitted: 400M, totalActual: 0, available: 600M}
// ✓ Dashboard Pending Request removed
// ✓ Dashboard summary cards update: Available Budget = 600M
// ✓ Budget vs Actual row: Committed column = 400M
// ✓ Actual Realization screen: This SPK now appears in dropdown
// ✓ Spending Request screen: Available budget shown as 600M (preventing over-commit)
\`\`\`

### 4.3 When Actual Payment Is Posted

**Event: Payment Posted (Submitted → Posted)**
\`\`\`javascript
// State before:
store.actuals = [{id: ACT-789, commitmentId: SPK-456, budgetId: BDG-123, 
                  amount: 150M, status: SUBMITTED}]
// getBudgetBalance(BDG-123) = {available: 600M}
// Remaining SPK-456 = 400M

// Trigger: Finance clicks "Post Payment"
store.postActual("ACT-789")

// State after:
store.actuals = [{id: ACT-789, commitmentId: SPK-456, budgetId: BDG-123, 
                  amount: 150M, status: POSTED, postedAt: now()}]
// IMPACT:
// ✓ getBudgetBalance(BDG-123) now returns:
//   {approvedBudget: 1000M, totalCommitted: 400M, totalActual: 150M, available: 450M}
// ✓ Dashboard summary: Available Budget = 450M
// ✓ Budget vs Actual: Monthly column (April) += 150M
// ✓ Budget vs Actual: Total Actual column = 150M
// ✓ Budget vs Actual: Balance = 1000 - 400 - 150 = 450M
// ✓ Budget vs Actual: Utilization % = (150/1000) × 100 = 15%
// ✓ Remaining SPK-456 = 400M - 150M = 250M (for next payment)
\`\`\`

### 4.4 When Revision Is Approved

**Event: Revision Approved (Submitted → Approved)**
\`\`\`javascript
// State before:
store.budgets = [{id: BDG-123, initialAmount: 1000M, status: APPROVED}]
store.revisions = [{id: REV-999, budgetId: BDG-123, oldAmount: 1000M, 
                    newAmount: 1100M, difference: +100M, status: SUBMITTED}]
store.commitments = [{id: SPK-456, budgetId: BDG-123, amount: 400M, status: APPROVED}]
store.actuals = [{id: ACT-789, amount: 150M, status: POSTED}]
// getBudgetBalance(BDG-123) = {approvedBudget: 1000M, available: 450M}

// Trigger: Finance clicks "Approve Revision"
store.approveRevision("REV-999")

// State after:
store.revisions = [{id: REV-999, ..., status: APPROVED, approvedAt: now()}]
// NOTE: Budget record stays APPROVED, revision is separate record
// IMPACT:
// ✓ getBudgetBalance(BDG-123) now returns:
//   {approvedBudget: 1100M, totalCommitted: 400M, totalActual: 150M, available: 550M}
// ✓ Dashboard: Approved Budget = 1100M
// ✓ Dashboard: Available Budget = 550M (gained +100M)
// ✓ Budget vs Actual: Approved Budget = 1100M
// ✓ Utilization % recalculated = (150/1100) × 100 = 13.6%
// ✓ Spending Request: Available budget shown as 550M
\`\`\`

---

## SECTION 5: FULL END-TO-END USE CASE EXECUTION

### Scenario: Core System Upgrade Project Budget Cycle

**Setup:**
- Unit: IT Dept
- Fiscal Year: 2025
- Budget Type: Project
- Project Name: Core System Upgrade

---

#### **STEP 1: Budget Planning (January 2025)**

**User Action (IT Manager):** Budget Planning screen
\`\`\`
Inputs:
  Fiscal Year: 2025
  Unit: IT Dept
  Budget Type: Project
  Project Name: Core System Upgrade
  COA: 6140 - IT Infrastructure
  Amount: 1,000,000,000
  Justification: Replace legacy systems...

Click: "Save Draft"
\`\`\`

**System State (Zustand):**
\`\`\`typescript
store.createBudget({
  fiscalYear: 2025,
  unit: "IT Dept",
  budgetType: BudgetType.PROJECT,
  projectName: "Core System Upgrade",
  coa: "6140",
  initialAmount: 1000000000,
  status: BudgetStatus.DRAFT,
  justification: "..."
})

Result: budgets[] = [
  {
    id: "BDG-1704067200000",
    fiscalYear: 2025,
    unit: "IT Dept",
    budgetType: "project",
    projectName: "Core System Upgrade",
    coa: "6140",
    initialAmount: 1000000000,
    status: "draft",
    createdAt: 2025-01-10T10:00:00Z
  }
]
\`\`\`

**UI Behavior:**
- ✓ Form remains editable
- ✓ Success message "Draft saved"
- ✓ Form clears after 2 seconds
- ✓ Budget NOT visible in Dashboard (still Draft)
- ✓ Budget NOT visible in Budget vs Actual (still Draft)

---

**User Action (IT Manager):** Click "Submit"
\`\`\`typescript
store.submitBudget("BDG-1704067200000")

Result: status = "submitted"
\`\`\`

**UI Behavior:**
- ✓ Form becomes read-only
- ✓ Moved to "Pending Approvals" section on Dashboard
- ✓ Finance team notified (in real implementation, notification system)

---

**User Action (Finance Manager):** Dashboard → Pending Approvals
\`\`\`
Sees: "Core System Upgrade - 1,000,000,000"
Click: "Approve"
\`\`\`

\`\`\`typescript
store.approveBudget("BDG-1704067200000")

Result: status = "approved", approvedAt = now()
\`\`\`

**UI Behavior & State Impact:**
\`\`\`
✓ Budget status → APPROVED
✓ Budget Baseline established: 1,000,000,000
✓ Available Budget calculated: 1,000,000,000

Dashboard updates:
  - Budget Card: 1,000,000,000
  - Committed Card: 0
  - Actual Card: 0
  - Available Card: 1,000,000,000
  - Budget vs Actual: New row appears

Budget vs Actual screen shows:
  Project: Core System Upgrade
  Budget: 1,000,000,000
  Committed: 0
  Jan, Feb, Mar, ... Dec: all 0
  Total Actual: 0
  Balance: 1,000,000,000
  Utilization %: 0%

Spending Request dropdown now includes this budget
\`\`\`

---

#### **STEP 2: First SPK (February 2025)**

**User Action (Procurement):** Spending Request screen
\`\`\`
Select Budget: "Core System Upgrade - 1,000,000,000"
  → System calculates: Available Budget = 1,000,000,000 (displays on screen)

Inputs:
  SPK Number: SPK-2025-001
  Vendor: Dell Technologies
  Description: Server hardware + licensing
  Amount: 400,000,000
  COA: 6140
  Start Date: 2025-02-01
  End Date: 2025-03-31

Click: "Save Draft"
\`\`\`

\`\`\`typescript
store.createCommitment({
  budgetId: "BDG-1704067200000",
  spkNumber: "SPK-2025-001",
  fiscalYear: 2025,
  unit: "IT Dept",
  vendorName: "Dell Technologies",
  description: "Server hardware + licensing",
  amount: 400000000,
  coa: "6140",
  status: CommitmentStatus.DRAFT
})

Result: commitments[] = [{
  id: "SPK-1704153600000",
  budgetId: "BDG-1704067200000",
  spkNumber: "SPK-2025-001",
  amount: 400000000,
  status: "draft"
}]
\`\`\`

**UI Behavior:**
- ✓ Form editable
- ✓ Available Budget displayed: 1,000,000,000 (unchanged - SPK still Draft)

---

**User Action (Procurement):** Click "Submit"
\`\`\`typescript
store.submitCommitment("SPK-1704153600000")

Result: status = "submitted"
\`\`\`

---

**User Action (Finance):** Dashboard → Pending Approvals
\`\`\`
Sees: "SPK-2025-001 - Dell Technologies - 400,000,000"
Click: "Approve"
\`\`\`

\`\`\`typescript
// CRITICAL VALIDATION:
const validation = store.canCreateCommitment("BDG-1704067200000", 400000000)
// Returns: {allowed: true} because 400M <= Available Budget 1000M

store.approveCommitment("SPK-1704153600000")

Result: status = "approved", approvedAt = now()
\`\`\`

**UI Behavior & State Impact:**
\`\`\`
✓ SPK status → APPROVED
✓ IMMEDIATE: Budget is LOCKED

getB udgetBalance("BDG-1704067200000") now returns:
  approvedBudget: 1,000,000,000
  totalCommitted: 400,000,000  ← LOCKED
  totalActual: 0
  availableBudget: 600,000,000  ← REDUCED

Dashboard updates:
  - Committed Card: 400,000,000
  - Available Card: 600,000,000

Budget vs Actual row updates:
  Committed: 400,000,000
  Balance: 600,000,000

Actual Realization dropdown now shows SPK-2025-001 (can create payments against it)
\`\`\`

---

**User Action (Procurement):** Spending Request screen → Create 2nd SPK
\`\`\`
Select Budget: Still "Core System Upgrade"
  → System calculates: Available Budget = 600,000,000 (displays on screen)

Inputs:
  SPK Number: SPK-2025-002
  Vendor: Oracle
  Amount: 300,000,000  ← Valid: 300M <= 600M available

Click: Submit
\`\`\`

\`\`\`typescript
// In Finance approval flow:
const validation = store.canCreateCommitment("BDG-1704067200000", 300000000)
// Returns: {allowed: true} because 300M <= Available Budget 600M

store.approveCommitment("SPK-2025-002")

Result: 2nd SPK approved
\`\`\`

**UI State:**
\`\`\`
getBudgetBalance() returns:
  approvedBudget: 1,000,000,000
  totalCommitted: 700,000,000  ← SPK-001 + SPK-002
  totalActual: 0
  availableBudget: 300,000,000  ← FURTHER REDUCED

Dashboard:
  - Committed: 700,000,000
  - Available: 300,000,000

Budget vs Actual:
  Committed: 700,000,000
  Balance: 300,000,000
\`\`\`

---

#### **STEP 3: First Payment (April 2025)**

**User Action (Finance):** Actual Realization screen
\`\`\`
Select SPK: "SPK-2025-001 - Dell - 400,000,000"
  → System displays: Commitment: 400,000,000, Paid: 0, Remaining: 400,000,000

Inputs:
  Invoice Date: 2025-04-15
  Invoice Number: INV-2025-0045
  Amount: 150,000,000  ← Valid: 150M <= Remaining 400M
  Payment Method: Transfer
  Description: Initial hardware delivery

Click: "Save Draft"
\`\`\`

\`\`\`typescript
store.createActual({
  budgetId: "BDG-1704067200000",
  commitmentId: "SPK-1704153600000",
  invoiceNumber: "INV-2025-0045",
  invoiceDate: new Date("2025-04-15"),
  vendorName: "Dell Technologies",
  amount: 150000000,
  paymentMethod: "Transfer"
})

Result: actuals[] = [{
  id: "ACT-1712188800000",
  commitmentId: "SPK-1704153600000",
  amount: 150000000,
  invoiceDate: 2025-04-15,
  status: "draft"
}]
\`\`\`

---

**User Action (Finance):** Click "Submit" → "Post"
\`\`\`typescript
store.submitActual("ACT-1712188800000")
store.postActual("ACT-1712188800000")

Result: status = "posted", postedAt = now()
\`\`\`

**UI Behavior & State Impact:**
\`\`\`
✓ Actual status → POSTED (IMMUTABLE now)

getBudgetBalance() returns:
  approvedBudget: 1,000,000,000
  totalCommitted: 700,000,000
  totalActual: 150,000,000  ← INCREASED
  availableBudget: 150,000,000  ← FURTHER REDUCED

Dashboard:
  - Actual Card: 150,000,000
  - Available Card: 150,000,000

Budget vs Actual:
  - April column: 150,000,000 (visible in row)
  - Total Actual: 150,000,000
  - Balance: 150,000,000
  - Utilization %: 15%

Remaining SPK-2025-001:
  = 400,000,000 - 150,000,000 = 250,000,000
  (for next payment)
\`\`\`

**User Double-Clicks April Cell in Budget vs Actual:**
\`\`\`
Drill-Down Modal Shows:
  Invoice: INV-2025-0045
  Date: 2025-04-15
  Vendor: Dell Technologies
  Amount: 150,000,000
  Description: Initial hardware delivery
\`\`\`

---

#### **STEP 4: Budget Revision (May 2025)**

**User Action (IT Manager):** Budget Revision screen
\`\`\`
Select Budget: "Core System Upgrade - 1,000,000,000"
  → System displays:
    Current Budget: 1,000,000,000
    Current Committed: 700,000,000
    Current Actual: 150,000,000
    Minimum Unbudget: 850,000,000 (committed + actual)

New Budget: 1,100,000,000
  → System calculates: Difference = +100,000,000
  → Validation: 1,100,000,000 >= 850,000,000 ✓ (can unbudget down to this)

Reason: Include mandatory vendor training 50 users × 2M

Click: "Submit"
\`\`\`

\`\`\`typescript
store.createRevision({
  budgetId: "BDG-1704067200000",
  oldAmount: 1000000000,
  newAmount: 1100000000,
  difference: 100000000,
  reason: "Include mandatory vendor training..."
})

Result: revisions[] = [{
  id: "REV-1712275200000",
  budgetId: "BDG-1704067200000",
  difference: 100000000,
  status: "submitted"
}]
\`\`\`

---

**User Action (Finance):** Dashboard → Pending Approvals
\`\`\`
Sees: "Revision: Core System Upgrade | +100,000,000"
Click: "Approve"
\`\`\`

\`\`\`typescript
store.approveRevision("REV-1712275200000")

Result: status = "approved", approvedAt = now()
\`\`\`

**UI Behavior & State Impact:**
\`\`\`
✓ Revision status → APPROVED
✓ Budget baseline UPDATED: 1,100,000,000 (history preserved in revisions[])

getBudgetBalance() returns:
  approvedBudget: 1,100,000,000  ← INCREASED by +100M
  totalCommitted: 700,000,000
  totalActual: 150,000,000
  availableBudget: 250,000,000  ← GAINED +100M

Dashboard:
  - Budget Card: 1,100,000,000
  - Available Card: 250,000,000

Budget vs Actual:
  - Budget column: 1,100,000,000
  - Balance: 250,000,000
  - Utilization %: 13.6% (150/1100 × 100)

Spending Request: Available budget shown as 250,000,000 (can still create SPKs)
\`\`\`

---

#### **STEP 5: Second Payment (June 2025)**

**User Action (Finance):** Actual Realization screen
\`\`\`
Select SPK: "SPK-2025-002 - Oracle - 300,000,000"
  → System displays: Remaining: 300,000,000

Inputs:
  Invoice Date: 2025-06-10
  Invoice Number: INV-2025-0078
  Amount: 250,000,000

Click: "Submit" → "Post"
\`\`\`

\`\`\`typescript
store.postActual("ACT-2nd-payment-id")

Result: status = "posted"
\`\`\`

**UI Behavior & State Impact:**
\`\`\`
getBudgetBalance() returns:
  approvedBudget: 1,100,000,000
  totalCommitted: 700,000,000
  totalActual: 400,000,000  ← 150M + 250M
  availableBudget: 0  ← 1100 - 700 - 400

Dashboard:
  - Actual Card: 400,000,000
  - Available Card: 0 (RED - over budget)
  - Summary: "No available budget for new commitments"

Budget vs Actual:
  - June column: 250,000,000
  - Total Actual: 400,000,000
  - Balance: 0
  - Utilization %: 36.4%

Spending Request: Available budget shown as 0 (cannot create new SPKs)
\`\`\`

---

### Summary State Table

| Stage | Action | Budget | Committed | Actual | Available | Utilization % |
|-------|--------|--------|-----------|--------|-----------|---|
| Initial | Budget Approved | 1,000 | 0 | 0 | 1,000 | 0% |
| Feb | SPK-001 Approved | 1,000 | 400 | 0 | 600 | 0% |
| Feb | SPK-002 Approved | 1,000 | 700 | 0 | 300 | 0% |
| Apr | Payment 1 Posted | 1,000 | 700 | 150 | 150 | 15% |
| May | Revision +100 | **1,100** | 700 | 150 | **250** | 13.6% |
| Jun | Payment 2 Posted | 1,100 | 700 | 400 | 0 | 36.4% |

---

## SECTION 6: HOW THE UI ENFORCES BUDGET CONTROL

### 6.1 Spending Request Screen Validation

**Available Budget Display (Read-Only):**
\`\`\`tsx
// Displayed when SPK budget is selected
const availableBalance = store.getBudgetBalance(budgetId)
UI shows: "Available Budget: Rp 250,000,000"

// This value recalculates in real-time based on:
// 1. Approved budget (including revisions)
// 2. All approved SPKs
// 3. All posted actuals
// Cannot be manually edited
\`\`\`

**Amount Input Validation (Client-Side):**
\`\`\`tsx
const validation = store.canCreateCommitment(budgetId, inputAmount)

if (!validation.allowed) {
  // Show error message
  "Amount (400M) exceeds available budget (250M)"
  // Disable Submit button
}
\`\`\`

**Result:** User cannot create SPK exceeding available budget

---

### 6.2 Actual Realization Screen Validation

**Remaining Commitment Display (Read-Only):**
\`\`\`tsx
const commitment = store.commitments.find(c => c.id === selectedSPK)
const postedSoFar = store.actuals
  .filter(a => a.commitmentId === selectedSPK && a.status === "posted")
  .reduce((sum, a) => sum + a.amount, 0)
const remaining = commitment.amount - postedSoFar

UI shows: "Commitment: 400,000,000 | Paid: 150,000,000 | Remaining: 250,000,000"
\`\`\`

**Amount Input Validation:**
\`\`\`tsx
const validation = store.canPostActual(commitmentId, inputAmount)

if (!validation.allowed) {
  "Amount (300M) exceeds remaining commitment (250M)"
  // Disable Post button
}
\`\`\`

**Result:** User cannot post actual exceeding remaining SPK balance

---

### 6.3 Budget vs Actual Read-Only Enforcement

**All Values Derived:**
\`\`\`tsx
// No input fields - all cells display calculated values

Monthly Actual = SUM(posted actuals for that month)
  ← Cannot be edited; only way to change: cancel actual & create new

Total Committed = SUM(approved SPKs)
  ← Cannot be edited; only way to change: cancel SPK & create new

Available Balance = Budget - Committed - Actual
  ← Formula only; cannot edit

Utilization % = (Total Actual / Budget) × 100
  ← Formula only; cannot edit

// Drill-down shows transaction source - audit trail
\`\`\`

---

### 6.4 Dashboard Approval Flow Control

**Pending Approvals Section:**
\`\`\`tsx
// Shows all items needing action:
// - Submitted budgets
// - Submitted revisions
// - Submitted SPKs
// - Submitted actuals

// Only Finance can approve/reject

// Approval immediately triggers:
// - Status update
// - State recalculation
// - Dashboard/Budget vs Actual refresh
\`\`\`

---

## SECTION 7: DATA PERSISTENCE & REAL-TIME SYNC

### Current Implementation (In-Memory)

The system uses **Zustand** store in-memory state (browser only):

\`\`\`typescript
const useBudgetStore = create<BudgetStore>((set, get) => ({
  budgets: [],
  revisions: [],
  commitments: [],
  actuals: []
  // All actions update state immediately
  // Renders trigger on state change
}))
\`\`\`

**For Production Implementation:**
1. Persist state to backend (Supabase/database)
2. Add timestamp tracking for audit logs
3. Implement optimistic updates for better UX
4. Add server-side validation before any write
5. Implement role-based access control (Requester vs Finance)

---

## SECTION 8: KEY TAKEAWAYS

### What Makes This System "Business-Flow-Driven"

1. **Status = Authorization** - Transactions only affect budget when status changes to approved/posted
2. **Immutable Baselines** - Original budget never changes; revisions create delta records
3. **Calculated State** - All financial metrics (Available, Balance, Utilization) derived at runtime
4. **Constraint Enforcement** - Cannot commit more than available; cannot pay more than committed
5. **Audit Trail** - Every transaction has creation/approval dates and user info
6. **Real-Time Recalculation** - Dashboard/Budget vs Actual update immediately on state changes

### Critical State Transitions

| Trigger | Status Change | Impact |
|---------|---|---|
| User submits budget | Draft → Submitted | Sent for approval |
| Finance approves | Submitted → Approved | **Creates baseline; enables commitments** |
| Finance approves SPK | Submitted → Approved | **Locks budget; reduces available immediately** |
| Finance posts actual | Submitted → Posted | **Finalizes spend; immutable** |
| Finance approves revision | Submitted → Approved | **Updates baseline; recalcs all balances** |

### Formulas that Drive Decisions

| Formula | Who Uses | Purpose |
|---------|----------|---------|
| `Available = Budget - Committed - Actual` | Spending Request | Can I create new SPK? |
| `Remaining = Commitment - Posted Actuals` | Actual Realization | Can I post this payment? |
| `Approved = Initial + Revisions` | Budget vs Actual | What is current baseline? |
| `Utilization = Actual / Budget × 100` | Dashboard/Monitoring | Budget health check |

---

This architecture ensures the Budget Management System is not just UI, but a complete business process with proper financial controls.
