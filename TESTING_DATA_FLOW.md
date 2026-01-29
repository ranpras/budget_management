# Quick Testing Guide - Data Flow End-to-End

## Demo Credentials
```
Operator (Unit 1):      operator1 / operator123
Supervisor (Unit 1):    supervisor1 / supervisor123
Admin Budget:           admin / admin123
```

## Master Data Already Configured
✅ 5 Units (FIN, IT, ADM, HR, OPS)
✅ 5 COA items (Personnel, Travel, Equipment, IT Infrastructure, Utilities)
✅ 3 RCC items (FIN-01, IT-01, ADM-01)
✅ 2 Budget Categories (OPEX, CAPEX)
✅ 1 Active Fiscal Year (2025)
✅ 3 Demo Vendors

---

## Test Scenario: Complete Budget Lifecycle

### 1️⃣ Login as Operator (operator1)
```
Username: operator1
Password: operator123
Unit: UNIT-1 (Finance Dept)
```

### 2️⃣ Go to Budget Planning
**Expected**: 
- ✅ No alerts (Master data exists)
- ✅ Dropdowns populated with:
  - Fiscal Year: 2025
  - COA: 5 items visible
  - RCC: Shows RCC-1 (FIN-01)
- ✅ Buttons enabled (not greyed out)

**Create Budget**:
- Fiscal Year: 2025
- Budget Type: Routine
- RCC: FIN-01
- COA: Personnel Expenses (6110)
- Amount: 50,000,000
- Justification: "Q1 staff compensation budget"
- Click: **Submit for Approval**

**Result**: Budget created with **SUBMITTED** status

---

### 3️⃣ Login as Supervisor (supervisor1)
```
Username: supervisor1
Password: supervisor123
Unit: UNIT-1 (Finance Dept)
```

### 4️⃣ Go to Approval Inbox
**Expected**:
- ✅ See the budget just submitted by operator1
- ✅ Shows: "Personnel Expenses - 50,000,000"
- ✅ Shows: "Created by: Budi Operator"

**Approve Budget**:
- Click approve button
- Result: Budget status → **APPROVED_SUPERVISOR**
- Alert: "Budget approved successfully, forwarded to Admin Budget for final approval"

---

### 5️⃣ Login as Admin Budget (admin)
```
Username: admin
Password: admin123
```

### 6️⃣ Go to Finance Approval (Approval Inbox)
**Expected**:
- ✅ See the supervisor-approved budget
- ✅ Status shows: APPROVED_SUPERVISOR

**Approve Budget**:
- Click approve button
- Result: Budget status → **ACTIVE** ✓ (KEY CHANGE!)
- Alert: "Budget approved successfully and activated"

---

### 7️⃣ Login back as Operator (operator1)

### 8️⃣ Go to Spending Request (SPK)
**CRITICAL CHECK** ✅:
- ✅ Dropdown shows: "Routine - Rp 50,000,000"
- ✅ Budget IS visible (was the main bug!)
- ✅ Available Budget shows: "Rp 50,000,000"

**Create SPK**:
- Select Budget: "Routine - 50,000,000"
- SPK Number: SPK-2025-001
- Vendor: PT Tech Solutions
- Description: "Q1 salary processing"
- Amount: 30,000,000 (less than available 50M)
- Start Date: 2025-01-01
- End Date: 2025-03-31
- Click: **Submit for Approval**

**Result**: SPK created with **SUBMITTED** status

---

### 9️⃣ Login as Supervisor (supervisor1)

### 🔟 Go to Approval Inbox
**Expected**:
- ✅ See the SPK just submitted

**Approve SPK**:
- Click approve
- Result: SPK status → **APPROVED_UNIT**

---

### 1️⃣1️⃣ Login as Admin Budget (admin)

### 1️⃣2️⃣ Go to Finance Approval
**Expected**:
- ✅ See APPROVED_UNIT SPK

**Approve SPK**:
- Click approve
- Result: SPK status → **APPROVED_FINANCE** ✓

---

### 1️⃣3️⃣ Login back as Operator (operator1)

### 1️⃣4️⃣ Go to Actual Realization
**CRITICAL CHECK** ✅:
- ✅ Budget dropdown shows: "Routine - 50,000,000"
- ✅ Commitment dropdown shows: "SPK-2025-001 - 30,000,000"
- ✅ Both are visible!

**Post Actual Payment**:
- Select Budget: "Routine"
- Select Commitment: "SPK-2025-001"
- Invoice Number: INV-2025-0001
- Invoice Date: 2025-01-15
- Vendor Name: PT Tech Solutions
- Amount: 20,000,000 (≤ 30M SPK)
- Payment Method: Transfer
- Description: "Salary processing Q1"
- Click: **Post Actual**

**Result**: Actual created with **SUBMITTED** status

---

### 1️⃣5️⃣ Approval Flow for Actual (repeat Supervisor → Admin)

### 1️⃣6️⃣ Dashboard Check
**Login as Admin**:
- Go to Budget Monitoring or Dashboard
- Find the budget:
  - Budget Awal: 50,000,000
  - Budget Approved: 50,000,000 ✅
  - Committed (SPK): 30,000,000 ✅
  - Actual: 20,000,000 ✅
  - Remaining: 0 (50M - 30M SPK = 20M, all spent)

---

## Validation Checks to Verify

| Check | Status | Notes |
|-------|--------|-------|
| Master data loaded in Budget Planning | ✅ | No alerts displayed |
| Budget visible in SPK after Admin approval | ✅ | KEY FIX - was missing |
| SPK visible in Actual after final approval | ✅ | KEY FIX - was missing |
| Budget balance decreases with SPK | ✅ | Available budget = 50M - 30M = 20M |
| Actual deducts from SPK commitment | ✅ | Remaining SPK = 30M - 20M = 10M |
| Dashboard shows consistent figures | ✅ | All four numbers add up |
| Operator can't submit budget without master data | ✅ | Buttons disabled with alerts |
| SPK shows error if budget not approved | ✅ | Empty dropdown with alert |

---

## Common Issues to Avoid

❌ **Issue 1**: Budget doesn't appear in SPK dropdown
- **Cause**: Status wasn't set to ACTIVE (was left as APPROVED_ADMIN)
- **Fix**: Already applied in code

❌ **Issue 2**: Master data dropdowns empty in Budget Planning
- **Cause**: Master data store not initialized
- **Fix**: Already has demo data

❌ **Issue 3**: Can create budget without COA/RCC
- **Cause**: No validation on form
- **Fix**: Already added validation + alerts

❌ **Issue 4**: Actual realization won't find SPK
- **Cause**: Status filter only checked APPROVED, not APPROVED_FINANCE
- **Fix**: Already fixed in code

---

## Data Consistency Verification

After completing full cycle, verify:

```javascript
// Budget should exist and be ACTIVE
budget.status = "active"

// SPK should exist and be APPROVED_FINANCE
spk.status = "approved_finance"
spk.budgetId = budget.id
spk.amount = 30,000,000

// Actual should exist and be POSTED
actual.status = "posted"
actual.commitmentId = spk.id
actual.budgetId = budget.id
actual.amount = 20,000,000

// Budget balance calculation:
balance.approvedBudget = 50,000,000
balance.totalCommitted = 30,000,000
balance.totalActual = 20,000,000
balance.availableBudget = 20,000,000 (50M - 30M)
```

---

## Success Criteria ✅

- ✅ All dropdowns populate correctly
- ✅ Budget flows through all approval levels
- ✅ Budget becomes visible in SPK after Admin approval
- ✅ SPK becomes visible in Actual after final approval
- ✅ Budget balances decrease correctly
- ✅ Dashboard shows consistent totals
- ✅ No silent failures or missing data

If all checks pass → **Data flow is working correctly!** 🎉
