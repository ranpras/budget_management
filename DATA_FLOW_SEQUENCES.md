# Budget Management System - Data Flow Sequences

## FLOW 1: Complete Budget Lifecycle (Approval to Execution)

\`\`\`
REQUESTER (Budget Planning Screen)
  │
  ├─ Fill form: Amount, COA, Project Name
  │
  ├─ CLICK "Save Draft"
  │  └─ store.createBudget() → status: DRAFT
  │     └─ Store in memory: budgets[]
  │        └─ UI: "Budget saved as draft"
  │           └─ Dashboard: NOT visible (only shows Approved budgets)
  │
  └─ CLICK "Submit"
     └─ store.submitBudget() → status: SUBMITTED
        └─ Store in memory: updated budgets[]
           └─ UI: Form becomes read-only
              └─ Dashboard: Appears in "Pending Approvals"
                 └─ Finance team: Sees action item

FINANCE (Dashboard → Pending Approvals)
  │
  ├─ Reviews submitted budget
  │
  ├─ CLICK "Approve"
  │  └─ store.approveBudget() → status: APPROVED
  │     └─ Store in memory: updated budgets[]
  │        └─ getBudgetBalance() now returns:
  │           {
  │             approvedBudget: initialAmount,
  │             totalCommitted: 0,
  │             totalActual: 0,
  │             availableBudget: initialAmount
  │           }
  │        └─ UI updates trigger:
  │           ├─ Dashboard summary cards refresh
  │           ├─ Budget vs Actual: new row appears
  │           └─ Spending Request dropdown: budget now available

PROCUREMENT (Spending Request Screen)
  │
  ├─ Select approved budget from dropdown
  │  └─ UI displays: "Available Budget: [calculated value]"
  │
  ├─ Enter SPK details
  │  └─ Validate: amount <= availableBudget
  │
  ├─ CLICK "Submit"
  │  └─ store.createCommitment() → status: SUBMITTED
  │     └─ Store in memory: commitments[]
  │        └─ Dashboard: Appears in "Pending Approvals"

FINANCE (Dashboard → Pending Approvals)
  │
  ├─ CLICK "Approve SPK"
  │  └─ store.approveCommitment() → status: APPROVED
  │     └─ Store in memory: updated commitments[]
  │        └─ CRITICAL: getBudgetBalance() recalculates:
  │           {
  │             totalCommitted: += spk.amount,
  │             availableBudget: -= spk.amount
  │           }
  │        └─ ALL DEPENDENT UIs UPDATE:
  │           ├─ Dashboard: Available Budget card updated
  │           ├─ Budget vs Actual: Committed column updated
  │           ├─ Spending Request: Shows new available balance
  │           └─ Actual Realization: SPK appears in dropdown

FINANCE (Actual Realization Screen)
  │
  ├─ Select approved SPK
  │  └─ UI displays: "Remaining Commitment: [calculated]"
  │
  ├─ Enter payment details
  │  └─ Validate: amount <= remaining commitment
  │
  ├─ CLICK "Submit" → "Post"
  │  └─ store.postActual() → status: POSTED
  │     └─ Store in memory: updated actuals[]
  │        └─ CRITICAL: getBudgetBalance() recalculates:
  │           {
  │             totalActual: += payment.amount,
  │             availableBudget: -= payment.amount
  │           }
  │        └─ Monthly breakdown updated:
  │           └─ Actual for invoice.date.month += payment.amount
  │        └─ ALL DEPENDENT UIS UPDATE:
  │           ├─ Dashboard: Actual & Available cards
  │           ├─ Dashboard: Monthly chart for this month
  │           ├─ Budget vs Actual: Monthly column updated
  │           └─ Budget vs Actual: Total Actual updated

END USER (Budget vs Actual - Monitoring)
  │
  └─ Double-click monthly cell
     └─ Drill-down modal shows transactions for that month
        └─ Source of truth: Actual Payment records
           └─ Show: Invoice date, vendor, amount, description
\`\`\`

---

## FLOW 2: Budget Revision (Increasing Available Budget)

\`\`\`
REQUESTER (Budget Revision Screen)
  │
  ├─ Select existing approved budget
  │  └─ UI pre-fills:
  │     ├─ Current Budget: [approved baseline]
  │     ├─ Current Committed: [sum of approved SPKs]
  │     ├─ Current Actual: [sum of posted payments]
  │     └─ Constraint: Cannot unbudget below (committed + actual)
  │
  ├─ Enter new budget amount
  │  └─ System calculates:
  │     difference = newAmount - currentAmount
  │     If newAmount < (committed + actual): Show error
  │
  ├─ CLICK "Submit"
  │  └─ store.createRevision() → status: SUBMITTED
  │     └─ Store in memory: revisions[]
  │        └─ Original budget: UNCHANGED (still Approved)
  │        └─ Revision record: Contains delta
  │           └─ Dashboard: Appears in "Pending Approvals"

FINANCE (Dashboard → Pending Approvals)
  │
  ├─ Review revision request
  │
  ├─ CLICK "Approve"
  │  └─ store.approveRevision() → status: APPROVED
  │     └─ Store in memory: updated revisions[]
  │        └─ Budget record: UNCHANGED (stays Approved)
  │        └─ Revision: Marked as approved
  │        └─ CRITICAL: getBudgetBalance() recalculates:
  │           {
  │             approvedBudget: initialAmount + SUM(approved revisions.difference)
  │           }
  │        └─ ALL DOWNSTREAM EFFECTS:
  │           ├─ Available Budget recalculated
  │           ├─ Utilization % recalculated
  │           ├─ Dashboard summary updated
  │           ├─ Budget vs Actual: Budget column updated
  │           └─ Spending Request: New available balance shown

RESULT:
  ├─ Audit trail preserved:
  │  ├─ Original budget: 1,000,000,000
  │  ├─ Revision 1: +100,000,000 (approved 2025-05-15)
  │  ├─ Revision 2: -50,000,000 (approved 2025-06-20)
  │  └─ Current baseline: 1,050,000,000
  │
  └─ If decreased (unbudget):
     └─ Validates: newAmount >= (totalCommitted + totalActual)
     └─ Example: Cannot unbudget 1000 to 600 if already committed 700 & actual 150
\`\`\`

---

## FLOW 3: Real-Time State Recalculation Cascade

\`\`\`
TRIGGER: Finance approves SPK (SPK amount: 400M)

IMMEDIATE EFFECTS:
│
├─ Store: commitments[].status = APPROVED
│
├─ Calculation: getBudgetBalance(budgetId)
│  ├─ totalCommitted = 400M (was 0)
│  └─ availableBudget = 600M (was 1000M)
│
├─ React State Change Detected
│
└─ ALL COMPONENTS USING THIS BUDGET RE-RENDER:
   │
   ├─ Dashboard:
   │  ├─ Committed card: 0 → 400M
   │  ├─ Available card: 1000M → 600M
   │  ├─ Summary pie chart updates
   │  └─ Monthly bar chart recalculates
   │
   ├─ Spending Request Screen:
   │  ├─ Available Budget display: 1000M → 600M
   │  └─ Validation updates: Can now only create SPK up to 600M
   │
   ├─ Budget vs Actual:
   │  ├─ Committed column: 0 → 400M
   │  ├─ Balance column: 1000M → 600M
   │  ├─ Utilization %: 0% → 0% (no actual yet)
   │  └─ All calculations reflect new state
   │
   └─ Actual Realization Screen:
      └─ SPK now available in dropdown (was not selectable before)

SECOND TRIGGER: Finance posts actual payment (150M against SPK)

IMMEDIATE EFFECTS:
│
├─ Store: actuals[].status = POSTED
│
├─ Calculation: getBudgetBalance(budgetId)
│  ├─ totalActual = 150M (was 0)
│  └─ availableBudget = 450M (was 600M)
│
├─ PLUS: Monthly calculation updated
│  └─ For month of invoice date: actual for that month += 150M
│
├─ React State Change Detected
│
└─ ALL COMPONENTS RE-RENDER:
   │
   ├─ Dashboard:
   │  ├─ Actual card: 0 → 150M
   │  ├─ Available card: 600M → 450M
   │  ├─ Monthly bar chart: April bar includes 150M
   │  └─ Total utilization: 0% → 15% (150/1000)
   │
   ├─ Budget vs Actual:
   │  ├─ April column: 0 → 150M
   │  ├─ Total Actual: 0 → 150M
   │  ├─ Balance: 600M → 450M
   │  ├─ Utilization %: 0% → 15%
   │  └─ Drill-down for April now shows 1 transaction
   │
   ├─ Spending Request:
   │  └─ Available Budget: 600M → 450M (dynamic update)
   │
   └─ Actual Realization:
      └─ Remaining Commitment for this SPK: 400M → 250M

NO DATABASE CALLS: All updates are in-memory, instant
NO POLLING: Zustand triggers re-renders immediately
NO MANUAL REFRESH: User doesn't need to refresh page
\`\`\`

---

## FLOW 4: Constraint Enforcement (Prevent Over-Commitment)

\`\`\`
SCENARIO: User tries to create SPK for 700M but only 600M available

USER ACTION (Spending Request Screen):
│
├─ Select budget
│  └─ Available Budget displayed: 600M
│
├─ Enter SPK Amount: 700M
│  └─ User clicks Submit
│
└─ VALIDATION TRIGGERED:
   │
   ├─ store.canCreateCommitment(budgetId, 700000000)
   │  │
   │  ├─ Get current balance:
   │  │  budget.approvedBudget = 1000M
   │  │  totalCommitted = 400M (existing SPKs)
   │  │  totalActual = 150M (existing payments)
   │  │  availableBudget = 450M
   │  │
   │  └─ Compare: 700M > 450M ✗
   │     └─ Return: {
   │        allowed: false,
   │        reason: "Amount (700M) exceeds available budget (450M)"
   │      }
   │
   └─ UI RESPONSE:
      │
      ├─ Error message displayed (red)
      ├─ Submit button disabled
      └─ Cannot proceed until amount corrected

CORRECTED ACTION:
│
├─ User changes amount to 450M
│  └─ Validation: 450M <= 450M ✓
│
├─ Submit enabled again
│
├─ User clicks Submit
│  └─ store.createCommitment({...amount: 450M, status: DRAFT})
│
└─ Proceed normally

RESULT:
  └─ System prevents over-commitment at creation time
     └─ Maintains budget integrity
     └─ No partial approvals needed
     └─ No negative available budget
\`\`\`

---

## FLOW 5: Immutability of Posted Actuals

\`\`\`
SCENARIO: User tries to edit a posted payment

USER ACTION (Actual Realization Screen):
│
├─ Shows list of all actuals
├─ Posted actual has status: POSTED
└─ User clicks Edit on posted actual
   │
   └─ SYSTEM PREVENTS:
      ├─ Form fields: All disabled (read-only)
      ├─ Amount: Cannot change
      ├─ Invoice Date: Cannot change
      ├─ Invoice Number: Cannot change
      └─ Message shown: "Posted actuals cannot be edited"

CORRECTION REQUIRED:
│
├─ User must Cancel existing posted actual
│  └─ store.cancelActual() → status: CANCELLED
│     └─ Reverses the amount:
│        ├─ Commitment restored: 400M (was 250M)
│        ├─ Budget recalculated: available increased
│        └─ Monthly actual decreased for that month
│
├─ User creates NEW actual with correct amount
│  └─ store.createActual() → status: DRAFT
│     └─ Submit and post as normal
│
└─ RESULT:
   ├─ Audit trail shows: Original + Reversal + Correction
   ├─ Transaction history complete
   ├─ No data loss
   └─ Full compliance trail for auditors
\`\`\`

---

## KEY PRINCIPLES DEMONSTRATED

### 1. Single Source of Truth
- Budget baseline only changes via approved revisions
- Calculations only use approved transactions
- No manual override of calculated values

### 2. Cascade Updates
- One state change triggers multiple UI updates
- All derived values recalculate automatically
- No manual sync needed

### 3. Constraint Enforcement
- Validation happens before state change
- User prevented from invalid states
- System maintains integrity at all times

### 4. Immutability Where Required
- Draft: Fully editable
- Submitted: Read-only pending approval
- Approved/Posted: Immutable (only cancel & recreate)
- Cancelled: Fully reversals

### 5. Audit Trail
- Every change timestamped
- Who, what, when recorded
- Revisions don't overwrite originals
- Complete history preserved
