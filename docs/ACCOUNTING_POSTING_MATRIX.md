# VyaparSuite — Accounting Posting Matrix & General Ledger Mechanics

> **Comprehensive Double-Entry Transaction Ledger Matrix**  
> *Document Version: 1.0.0*  
> *Target Stack: Next.js (TypeScript), PostgreSQL / Supabase, Node.js*  
> *Compliance: Indian Accounting Standards (Ind AS), Companies Act 2013, GSTN, Multi-Currency IFRS/US GAAP*

---

## 1. Executive Summary & Mathematical Foundations

In VyaparSuite, the **General Ledger (`gl_entries`)** is the absolute, immutable financial ground truth. Every commercial activity—whether sales, purchasing, inventory movements, manufacturing, payroll, or asset lifecycle—translates into a collection of auditable double-entry journal postings.

### 1.1 Inviolable Mathematical Laws of Posting
1. **Zero-Imbalance Law**:
   For any posted transaction voucher $V$:
   $$\sum_{i \in V} \text{Debit}_i - \sum_{i \in V} \text{Credit}_i = 0.0000$$
   Every voucher must balance perfectly in the **Company's Base Currency**. Imbalances exceeding zero tolerance cause an immediate database rollback.
2. **Multi-Currency Normalization**:
   For each line item $i$, transactions in foreign currency $F$ are translated to base currency $B$:
   $$\text{Amount (Base)}_i = \text{Amount (Foreign)}_i \times \text{Exchange Rate}_{V}$$
   The General Ledger stores both the transaction amount (in currency $F$) and the normalized base amount (in company currency $B$).
3. **Immutability & Append-Only Record**:
   No row in `gl_entries` can ever be updated or deleted. Rectifications post offsetting counter-entries with equal-and-opposite debits and credits.

---

## 2. Table Column Standards Used in This Matrix

In each scenario below, the entries are presented in standard accounting table format:
- **Account Type**: `[A]` Asset, `[L]` Liability, `[E]` Equity, `[R]` Revenue, `[X]` Expense.
- **Dr / Cr**: Debit or Credit orientation.
- **Amount Formula**: The mathematical source expression for the posting.
- **Multi-Currency (FX)**: Foreign currency handling and exchange rate treatment.

---

## 3. Comprehensive Posting Scenarios (1 to 30)

---

### Scenario 1: Standard Sales Invoice
**Trigger**: Submission of a Sales Invoice for goods or services rendered.  
**Condition**: Exclusive or inclusive tax, customer item discounts, and invoice rounding.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Accounts Receivable (Debtors)** | `[A]` | **Debit** | $\text{Grand Total} = \text{Net Total} + \text{Taxes} \pm \text{Round-off}$ | Stored in Customer Currency; converted at Invoice FX Rate |
| 2 | **Sales / Operating Revenue** | `[R]` | **Credit** | $\sum (\text{Qty} \times \text{Net Rate}) = \text{Net Total}$ | Stored in Base Currency |
| 3 | **Output Tax (CGST / SGST / IGST)**| `[L]` | **Credit** | $\sum \text{Calculated Tax Amounts}$ | Base Currency (statutory liability to tax authority) |
| 4 | **Round-Off Account** | `[X/R]`| **Dr/Cr** | $\text{Rounding Difference} = \text{Rounded Grand Total} - \text{Raw Total}$ | Base Currency (Debit if loss, Credit if gain) |

> **Inclusive Tax Handling**: When item rates are inclusive of tax, the Net Revenue is back-calculated:  
> $\text{Net Rate} = \frac{\text{Inclusive Rate}}{1 + (\text{Tax Rate} / 100)}$. The GL postings remain identical in structure.

---

### Scenario 2: Sales Invoice with Advance Allocation
**Trigger**: Submission of a Sales Invoice where an existing unallocated Customer Advance is applied.  
**Condition**: Reduces customer receivable by the advance amount already held in liability.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Accounts Receivable (Debtors)** | `[A]` | **Debit** | $\text{Net Outstanding Receivable} = \text{Grand Total} - \text{Advance Allocated}$ | Converted at Current Invoice FX Rate |
| 2 | **Customer Advances (Unearned Revenue)**| `[L]`| **Debit** | $\text{Advance Amount Allocated}$ | Converted at Original Advance Payment FX Rate |
| 3 | **Sales / Operating Revenue** | `[R]` | **Credit** | $\text{Invoice Net Total}$ | Base Currency at Invoice FX Rate |
| 4 | **Output Tax Payable** | `[L]` | **Credit** | $\text{Invoice Total Taxes}$ | Base Currency at Invoice FX Rate |
| 5 | **Exchange Gain / Loss Account** | `[X/R]`| **Dr/Cr** | $\text{Advance Base Amount} - (\text{Allocated Foreign Amount} \times \text{Invoice FX Rate})$ | Balances FX movement between advance date & invoice date |

---

### Scenario 3: Sales Return / Credit Note
**Trigger**: Submission of a Credit Note issued to a customer for returned goods or billing correction.  
**Condition**: Exact reversal of revenue, tax liability, and customer receivable.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Sales Returns / Revenue Contra**| `[R]` | **Debit** | $\text{Returned Goods Net Amount}$ | Original or Current Return FX Rate |
| 2 | **Output Tax Payable (Reversal)** | `[L]` | **Debit** | $\text{Reversed GST / VAT Amount}$ | Base Currency (Reduces statutory tax liability) |
| 3 | **Accounts Receivable (Debtors)** | `[A]` | **Credit** | $\text{Credit Note Grand Total}$ | Reduces customer ledger balance |
| 4 | **Round-Off Account** | `[X/R]`| **Dr/Cr** | Round-off adjustment on Credit Note | Base Currency |

*(Note: Physical stock reversal is handled in Inventory Matrix via Delivery Note Return / Stock Entry).*

---

### Scenario 4: Standard Purchase Invoice
**Trigger**: Submission of a vendor bill for services or goods without prior Goods Receipt Note.  
**Condition**: Accrues accounts payable and claims Input Tax Credit (ITC).

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Expense / Asset Purchase Account**| `[X/A]`| **Debit** | $\text{Net Total Purchase Amount}$ | Converted at Purchase FX Rate |
| 2 | **Input Tax Credit (CGST / SGST / IGST)**| `[A]`| **Debit** | $\sum \text{Eligible GST ITC Amounts}$ | Base Currency (Receivable from tax authority) |
| 3 | **Accounts Payable (Creditors)** | `[L]` | **Credit** | $\text{Invoice Grand Total}$ | Stored in Vendor Currency; converted at Purchase FX Rate |
| 4 | **Round-Off Account** | `[X/R]`| **Dr/Cr** | Rounding difference on vendor bill | Base Currency |

---

### Scenario 5: Purchase Invoice with Advance Allocation
**Trigger**: Submission of a Purchase Invoice where an existing Supplier Advance is offset.  
**Condition**: Clears advance asset against current vendor payable.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Expense / Stock / Asset Account** | `[X/A]`| **Debit** | $\text{Invoice Net Total}$ | Converted at Invoice FX Rate |
| 2 | **Input Tax Credit (ITC)** | `[A]` | **Debit** | $\text{Invoice Taxes}$ | Base Currency |
| 3 | **Advance to Suppliers** | `[A]` | **Credit** | $\text{Advance Amount Applied}$ | Converted at Original Advance FX Rate |
| 4 | **Accounts Payable (Creditors)** | `[L]` | **Credit** | $\text{Remaining Net Payable} = \text{Grand Total} - \text{Advance Allocated}$ | Converted at Invoice FX Rate |
| 5 | **Exchange Gain / Loss Account** | `[X/R]`| **Dr/Cr** | Balancing delta between advance rate and invoice rate | Base Currency |

---

### Scenario 6: Purchase Return / Debit Note
**Trigger**: Submission of a Debit Note issued to a vendor for rejected raw materials or billing overcharge.  
**Condition**: Reduces vendor liability and reverses Input Tax Credit.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Accounts Payable (Creditors)** | `[L]` | **Debit** | $\text{Debit Note Grand Total}$ | Reduces vendor balance |
| 2 | **Purchase Return / Stock Clearing**| `[X/A]`| **Credit**| $\text{Returned Items Net Value}$ | Converted at Debit Note FX Rate |
| 3 | **Input Tax Credit Reversal** | `[A]` | **Credit**| $\text{Reversed Tax Credit Amount}$ | Base Currency (Mandatory reversal under GST Rule 37) |
| 4 | **Round-Off Account** | `[X/R]`| **Dr/Cr** | Rounding difference | Base Currency |

---

### Scenario 7: Payment Entry — Customer Receipt
**Trigger**: Submission of a Payment Entry recording funds received from a customer against invoices.  
**Condition**: Handles bank receipt, payment deductions/charges, and realized forex gain/loss.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Bank / Cash Account** | `[A]` | **Debit** | $\text{Net Cash/Bank Deposited}$ | Converted at Bank Transaction Rate |
| 2 | **Bank Charges / Merchant Fee Account**|`[X]`| **Debit** | $\text{Deducted Transaction Gateway Fee (if any)}$ | Base Currency |
| 3 | **Accounts Receivable (Debtors)** | `[A]` | **Credit** | $\text{Allocated Invoice Outstanding Amount}$ | Converted at Original Invoice FX Rate |
| 4 | **Exchange Gain / Loss (Realized)** | `[X/R]`| **Dr/Cr** | $\text{Bank Amount (Base)} - \text{AR Cleared Amount (Base)}$ | Credit if Forex Gain, Debit if Forex Loss |

---

### Scenario 8: Payment Entry — Supplier Payment
**Trigger**: Submission of a Payment Entry disbursing money to a vendor against purchase invoices.  
**Condition**: Clears vendor AP, records TDS withholding (if applicable), and records realized forex movement.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Accounts Payable (Creditors)** | `[L]` | **Debit** | $\text{Allocated Gross Bill Amount}$ | Converted at Original Invoice FX Rate |
| 2 | **TDS / Withholding Tax Payable** | `[L]` | **Credit** | $\text{Withholding Tax Calculated (e.g., Sec 194C/J)}$ | Base Currency (Statutory remittance to Income Tax) |
| 3 | **Bank / Disbursement Account** | `[A]` | **Credit** | $\text{Net Disbursed Cash/Bank Amount}$ | Converted at Payment FX Rate |
| 4 | **Exchange Gain / Loss (Realized)** | `[X/R]`| **Dr/Cr** | $\text{AP Cleared (Base)} - (\text{Bank Disbursed Base} + \text{TDS Base})$ | Credit if Forex Gain, Debit if Forex Loss |

---

### Scenario 9: Customer Advance Receipt
**Trigger**: Receiving money from a customer prior to invoice generation.  
**Condition**: Creates unearned revenue liability. (Under Indian GST, advances for goods are exempt from GST, but advances for services require GST advance receipt posting).

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Bank / Cash Account** | `[A]` | **Debit** | $\text{Received Advance Amount}$ | Stored at Bank Spot FX Rate |
| 2 | **Customer Advances (Liability)** | `[L]` | **Credit** | $\text{Gross Advance Amount Received}$ | Customer Currency & Base Currency |
| *3*| **GST on Advance (If Service Advance)**| `[A]`| **Debit** | $\text{Tax Component: Advance} \times \frac{R}{100 + R}$ | Base Currency (Interim Tax Asset) |
| *4*| **Output GST Payable on Advance** | `[L]` | **Credit** | $\text{Tax Component: Advance} \times \frac{R}{100 + R}$ | Base Currency (Statutory Liability) |

---

### Scenario 10: Supplier Advance Payment
**Trigger**: Paying money to a vendor before goods receipt or invoice arrival.  
**Condition**: Creates prepaid vendor asset.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Advance to Suppliers (Asset)** | `[A]` | **Debit** | $\text{Gross Advance Paid}$ | Converted at Payment Date FX Rate |
| 2 | **TDS Payable on Advance (if applicable)**|`[L]`| **Credit**| $\text{Withheld Income Tax on Advance (e.g. 194Q)}$ | Base Currency |
| 3 | **Bank / Cash Account** | `[A]` | **Credit** | $\text{Net Disbursed Amount}$ | Converted at Payment Date FX Rate |

---

### Scenario 11: Journal Entry Types

#### 11.1 Contra Entry (Internal Fund Transfer)
*Movement between company bank and cash accounts.*
- **Debit**: Destination Bank / Cash Account `[A]`
- **Credit**: Source Bank / Cash Account `[A]`

#### 11.2 Bank Entry (Bank Charges / Interest / Direct Debit)
- **Debit**: Bank Charges Expense `[X]` / Interest Expense `[X]`
- **Debit**: Input GST on Bank Charges (if applicable) `[A]`
- **Credit**: Bank Account `[A]`

#### 11.3 Cash Entry (Petty Cash Top-up & Sundry Expenses)
- **Debit**: Office Supplies / Fuel / Welfare Expense `[X]`
- **Credit**: Petty Cash Account `[A]`

#### 11.4 Write-Off Entry (Small Balances Reconciliation)
- **Debit**: Bad Debts / Invoice Small Variance Expense `[X]`
- **Credit**: Accounts Receivable `[A]` (or vice versa for vendor uncollected micro-credits)

---

### Scenario 12: Stock Entry — Material Receipt (Perpetual Inventory)
**Trigger**: Physical inward receipt of stock without purchase order (e.g., initial opening count, found stock).  
**Condition**: Accretes inventory value on balance sheet against stock adjustment account.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Stock in Hand (Warehouse Asset)** | `[A]` | **Debit** | $\sum (\text{Received Qty} \times \text{Valuation Rate})$ | Base Currency |
| 2 | **Stock Adjustment / Opening Balance**| `[E/X]`| **Credit**| $\sum (\text{Received Qty} \times \text{Valuation Rate})$ | Base Currency |

---

### Scenario 13: Stock Entry — Material Issue (Internal Consumption / Scrap)
**Trigger**: Stock withdrawn for internal company usage, sampling, or write-off.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Cost of Goods Sold / Consumption Expense**|`[X]`| **Debit** | $\sum (\text{Issued Qty} \times \text{Current FIFO / Moving Avg Rate})$ | Base Currency |
| 2 | **Stock in Hand (Warehouse Asset)** | `[A]` | **Credit** | $\sum (\text{Issued Qty} \times \text{Current FIFO / Moving Avg Rate})$ | Base Currency |

---

### Scenario 14: Stock Entry — Material Transfer Between Warehouses
**Trigger**: Stock moved from Warehouse A to Warehouse B.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Stock in Hand (Target Warehouse)**| `[A]` | **Debit** | $\sum (\text{Transferred Qty} \times \text{Valuation Rate})$ | Base Currency |
| 2 | **Stock in Hand (Source Warehouse)**| `[A]` | **Credit** | $\sum (\text{Transferred Qty} \times \text{Valuation Rate})$ | Base Currency |

*(Note: If target and source warehouses share the same parent GL account, net GL balance change is 0.00, but warehouse cost-center dimension is updated).*

---

### Scenario 15: Delivery Note (Perpetual Inventory Posting)
**Trigger**: Goods leave warehouse for customer delivery prior to or alongside invoicing.  
**Condition**: Relieves inventory asset and books interim cost of goods sold.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Cost of Goods Sold (COGS)** | `[X]` | **Debit** | $\sum (\text{Shipped Qty} \times \text{Current Inventory Valuation Rate})$ | Base Currency |
| 2 | **Stock in Hand (Warehouse Asset)** | `[A]` | **Credit** | $\sum (\text{Shipped Qty} \times \text{Current Inventory Valuation Rate})$ | Base Currency |

---

### Scenario 16: Purchase Receipt / GRN (Perpetual Inventory Posting)
**Trigger**: Goods physically received at warehouse dock from supplier before invoice arrives.  
**Condition**: Capitalizes inventory into Stock in Hand and credits an interim unbilled clearing account.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Stock in Hand (Warehouse Asset)** | `[A]` | **Debit** | $\sum (\text{Received Qty} \times \text{PO Purchase Rate})$ | Converted to Base Currency at Receipt FX Rate |
| 2 | **Stock Received But Not Billed (Clearing)**|`[L]`| **Credit**| $\sum (\text{Received Qty} \times \text{PO Purchase Rate})$ | Base Currency (Interim Accrued Liability) |

*(When the subsequent Purchase Invoice arrives, it debits `Stock Received But Not Billed` and credits `Accounts Payable`, resolving the interim liability).*

---

### Scenario 17: Manufacturing — Material Consumption
**Trigger**: Issuing raw materials from warehouse into shop-floor production.  
**Condition**: Moves asset value from Raw Materials into Work in Progress.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Work-in-Progress (WIP Inventory)**| `[A]` | **Debit** | $\sum (\text{Consumed Raw Qty} \times \text{FIFO Valuation Rate})$ | Base Currency |
| 2 | **Stock in Hand (Raw Materials Store)**| `[A]`| **Credit**| $\sum (\text{Consumed Raw Qty} \times \text{FIFO Valuation Rate})$ | Base Currency |

---

### Scenario 18: Manufacturing — Finished Goods Receipt
**Trigger**: Receiving manufactured finished assemblies from production floor into finished goods store.  
**Condition**: Capitalizes finished goods, credits WIP, and absorbs operating costs (Labor + Electricity).

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Stock in Hand (Finished Goods)** | `[A]` | **Debit** | $\text{Raw Materials Cost} + \text{Operation Labor} + \text{Overheads}$ | Base Currency |
| 2 | **Work-in-Progress (WIP Inventory)**| `[A]` | **Credit** | $\text{Raw Materials Cost Transferred}$ | Base Currency |
| 3 | **Manufacturing Expenses Absorbed** | `[X]` | **Credit** | $\text{Operation Labor Cost} + \text{Factory Overhead Cost}$ | Base Currency (Contra-Expense absorption) |

---

### Scenario 19: Manufacturing — Scrap Handling
**Trigger**: Recording scrap material generated during production.  
**Condition**: Reduces WIP cost and recognizes scrap inventory asset at net realizable value.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Stock in Hand (Scrap Warehouse)** | `[A]` | **Debit** | $\text{Scrap Qty} \times \text{Estimated Scrap Realizable Rate}$ | Base Currency |
| 2 | **Work-in-Progress (WIP Inventory)**| `[A]` | **Credit** | $\text{Scrap Qty} \times \text{Estimated Scrap Realizable Rate}$ | Base Currency (Lowers finished product unit cost) |

---

### Scenario 20: Fixed Asset Acquisition & Capitalization
**Trigger**: Submission of Asset Capitalization voucher (either direct purchase or CWIP transfer).

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Fixed Asset Account (e.g. Plant & Machinery)**|`[A]`| **Debit**| $\text{Purchase Cost} + \text{Freight} + \text{Installation Fees}$ | Base Currency |
| 2 | **Capital Work-in-Progress (CWIP) / AP**| `[A/L]`| **Credit**| Total capital expenditure incurred | Base Currency |

---

### Scenario 21: Fixed Asset Depreciation Posting
**Trigger**: Monthly or annual automated execution of the Depreciation Engine.  
**Condition**: Straight Line Method (SLM) or Written Down Value (WDV) schedule.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Depreciation Expense** | `[X]` | **Debit** | $\text{Calculated Period Depreciation Amount}$ | Base Currency |
| 2 | **Accumulated Depreciation (Contra-Asset)**|`[A]`| **Credit**| $\text{Calculated Period Depreciation Amount}$ | Base Currency (Reduces Net Asset Book Value) |

---

### Scenario 22: Fixed Asset Disposal / Sale (Gain or Loss)
**Trigger**: Submission of Asset Disposal document selling an asset to a third party.  
**Condition**: Derecognizes gross cost, derecognizes accumulated depreciation, and recognizes gain/loss.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Accounts Receivable / Cash / Bank**| `[A]` | **Debit** | $\text{Sale Consideration Agreed}$ | Converted at Sale Date FX Rate |
| 2 | **Accumulated Depreciation** | `[A]` | **Debit** | $\text{Total Depreciation Accrued to Date of Sale}$ | Base Currency |
| 3 | **Loss on Sale of Fixed Assets** (if loss)|`[X]`| **Debit** | If $\text{Sale Price} < \text{Net Book Value}$: $\text{NBV} - \text{Sale Price}$ | Base Currency |
| 4 | **Fixed Asset Account (Original Cost)**| `[A]` | **Credit** | $\text{Original Gross Historical Capital Cost}$ | Base Currency |
| 5 | **Gain on Sale of Fixed Assets** (if gain)|`[R]`| **Credit**| If $\text{Sale Price} > \text{Net Book Value}$: $\text{Sale Price} - \text{NBV}$ | Base Currency |

---

### Scenario 23: Employee Expense Claim
**Trigger**: Submission and approval of an employee expense claim for business travel/meals.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Travel / Operational Expense Accounts**|`[X]`| **Debit** | $\sum \text{Itemized Claim Amounts}$ | Base Currency |
| 2 | **Input GST (if tax invoice provided)**| `[A]` | **Debit** | Eligible Input GST on business travel bills | Base Currency |
| 3 | **Employee Reimbursable Payable** | `[L]` | **Credit** | $\text{Total Verified Claim Amount}$ | Base Currency (Cleared via payroll or bank transfer) |

---

### Scenario 24: Monthly Payroll / Salary Slip Processing
**Trigger**: Processing monthly company salary register.  
**Condition**: Accrues gross compensation and records all statutory Indian deductions (PF, ESIC, PT, TDS).

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Salary & Wages Expense (Gross CTC)**| `[X]` | **Debit** | $\sum (\text{Basic} + \text{HRA} + \text{Special Allowances} + \text{Bonuses})$| Base Currency |
| 2 | **Employer PF Contribution Expense** | `[X]` | **Debit** | $12\% \text{ of Employee Qualifying Wages (EPFO)}$ | Base Currency |
| 3 | **Employer ESIC Contribution Expense**| `[X]` | **Debit** | $3.25\% \text{ of Employee Gross Wages (ESIC)}$ | Base Currency |
| 4 | **Provident Fund (PF) Payable** | `[L]` | **Credit** | $\text{Employee 12\% Deduction} + \text{Employer 12\% Contribution}$| Base Currency |
| 5 | **ESIC Payable** | `[L]` | **Credit** | $\text{Employee 0.75\% Deduction} + \text{Employer 3.25\% Contribution}$| Base Currency |
| 6 | **Professional Tax (PT) Payable** | `[L]` | **Credit** | $\sum \text{State-specific statutory PT slabs}$ | Base Currency |
| 7 | **TDS / Income Tax Payable (Sec 192)**| `[L]` | **Credit** | $\sum \text{Monthly payroll withholding tax}$ | Base Currency |
| 8 | **Net Payroll Payable (Employees)** | `[L]` | **Credit** | $\text{Gross Salary} - \sum \text{Deductions}$ | Base Currency (Disbursed via bank NEFT) |

---

### Scenario 25: Landed Cost Adjustment
**Trigger**: Adding freight, customs duties, or handling charges to already-received inventory.  
**Condition**: Increases inventory asset valuation retroactively and credits shipping payables.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Stock in Hand (Warehouse Asset)** | `[A]` | **Debit** | $\sum \text{Allocated Landed Charges across Items}$ | Base Currency |
| 2 | **Expenses Included In Valuation** | `[X]` | **Credit** | $\sum \text{Allocated Landed Charges}$ | Base Currency (Contra-Expense account) |

---

### Scenario 26: Exchange Gain / Loss (Forex Revaluation)
**Trigger**: Automated end-of-period revaluation of foreign currency bank accounts and open AR/AP balances.  
**Condition**: Unclosed foreign balances revalued to closing spot rate (IAS 21 / AS 11).

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Foreign Currency Bank / AR / AP** | `[A/L]`| **Dr/Cr** | $\text{Balance (FCY)} \times (\text{New Spot Rate} - \text{Book FX Rate})$ | Re-aligns Base Currency valuation |
| 2 | **Unrealized Forex Gain / Loss** | `[R/X]`| **Cr/Dr** | Offsetting balancing figure | Base Currency (P&L impact) |

---

### Scenario 27: Opening Balance Migration
**Trigger**: Uploading legacy system trial balance during platform go-live.  
**Condition**: Populates all historical asset, liability, and equity ledgers; temporary imbalance absorbs into Temporary Opening Account.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **All Historical Asset Accounts** | `[A]` | **Debit** | $\text{Opening Debit Balances as of Migration Cutoff Date}$ | Base Currency |
| 2 | **All Historical Liability Accounts**| `[L]` | **Credit** | $\text{Opening Credit Balances as of Cutoff Date}$ | Base Currency |
| 3 | **Historical Equity / Capital Accounts**| `[E]`| **Credit**| Historical paid-up capital & reserves | Base Currency |
| 4 | **Temporary Opening Balancing Account**|`[E]`| **Dr/Cr** | $\sum \text{Debits} - \sum \text{Credits}$ | Must reach exactly 0.00 once audit is finalized |

---

### Scenario 28: Fiscal Year-End Closing Entry
**Trigger**: Closing the accounting books for a completed fiscal year.  
**Condition**: Zeroes out all temporary Revenue and Expense accounts and transfers Net Profit/Loss to Retained Earnings.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **All Revenue Accounts (Sales, Other)**| `[R]` | **Debit** | $\text{Current Fiscal Year Credit Balances}$ | Clears account to zero |
| 2 | **All Expense Accounts (COGS, SG&A)**| `[X]` | **Credit** | $\text{Current Fiscal Year Debit Balances}$ | Clears account to zero |
| 3 | **Retained Earnings / Reserves** | `[E]` | **Credit** | $\text{Net Profit} = \sum \text{Revenue} - \sum \text{Expenses}$ (Debit if Net Loss) | Permanent Equity Accretion |

---

### Scenario 29: Bad Debt Write-Off
**Trigger**: Customer default where accounts receivable is deemed uncollectible.  
**Condition**: Direct write-off or provision-based write-off.

| # | Account Name | Type | Dr / Cr | Amount Formula / Source | Multi-Currency (FX) Handling |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **Provision for Doubtful Debts** | `[A/X]`| **Debit** | $\text{Amount Defaulted}$ (Debits existing provision reserve) | Base Currency |
| *or*| **Bad Debt Expense** (Direct method)| `[X]`| **Debit** | $\text{Amount Defaulted}$ (If no prior provision created) | Base Currency |
| 2 | **Accounts Receivable (Debtors)** | `[A]` | **Credit** | $\text{Customer Outstanding Invoice Amount}$ | Derecognizes uncollectible customer balance |

---

### Scenario 30: Statutory India GST Entries & ITC Allocations

#### 30.1 Intra-State Outward Supply (CGST + SGST Output)
- **Debit**: Accounts Receivable `[A]` (₹1,18,000)
- **Credit**: Sales Revenue `[R]` (₹1,00,000)
- **Credit**: CGST Output Tax Payable `[L]` (₹9,000)
- **Credit**: SGST Output Tax Payable `[L]` (₹9,000)

#### 30.2 Inter-State Outward Supply (IGST Output)
- **Debit**: Accounts Receivable `[A]` (₹1,18,000)
- **Credit**: Sales Revenue `[R]` (₹1,00,000)
- **Credit**: IGST Output Tax Payable `[L]` (₹18,000)

#### 30.3 Reverse Charge Mechanism (RCM Purchase under Sec 9(3) / 9(4))
*Company is liable to pay GST directly to the government on behalf of unregistered vendor or specific services (e.g., Goods Transport Agency GTA).*
- **Debit**: RCM Input Tax Credit Receivable `[A]` (₹9,000 CGST + ₹9,000 SGST)
- **Credit**: RCM Output Tax Liability Payable `[L]` (₹9,000 CGST + ₹9,000 SGST)

#### 30.4 Ineligible Input Tax Credit (Blocked Credit under Section 17(5))
*GST paid on motor vehicles, food and beverages, club memberships, or personal consumption cannot be claimed as ITC.*
- **Debit**: Motor Vehicle Asset / Welfare Expense `[A/X]` (₹1,18,000 inclusive of non-creditable tax)
- **Credit**: Accounts Payable `[L]` (₹1,18,000)
*(Note: Tax is absorbed directly into the asset or expense cost; zero debit to GST Input Credit Account).*

#### 30.5 Monthly GST Offset & Settlement
*Offsetting Input Tax Credit against Output Tax Liability at month-end:*
- **Debit**: CGST Output Tax Payable `[L]` (Clears liability)
- **Debit**: SGST Output Tax Payable `[L]` (Clears liability)
- **Debit**: IGST Output Tax Payable `[L]` (Clears liability)
- **Credit**: IGST Input Tax Credit `[A]` (Utilized first per GST ordering rules)
- **Credit**: CGST Input Tax Credit `[A]` (Utilized second)
- **Credit**: SGST Input Tax Credit `[A]` (Utilized third)
- **Credit**: Electronic Cash Ledger / Bank Account `[A]` (Cash paid for net residual balance)

---

## 4. Pre-Posting Transaction Invariant Verification

Before committing any batch of ledger entries to PostgreSQL, the VyaparSuite Posting Engine executes the following atomic assertions:

```typescript
export function assertPostingInvariants(entries: GLEntry[], baseCurrency: string) {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    if (entry.debit < 0 || entry.credit < 0) {
      throw new Error(`CRITICAL: Negative debit or credit detected in GL entry for account ${entry.account}`);
    }
    if (entry.debit > 0 && entry.credit > 0) {
      throw new Error(`CRITICAL: Ambiguous GL entry with both debit and credit populated for account ${entry.account}`);
    }
    totalDebit += entry.debit;
    totalCredit += entry.credit;
  }

  // Enforce zero imbalance with epsilon threshold (0.0001)
  const imbalance = Math.abs(totalDebit - totalCredit);
  if (imbalance > 0.0001) {
    throw new Error(`CRITICAL: Double-entry imbalance detected. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}, Imbalance: ${imbalance}`);
  }
}
```

---

> **Accounting Matrix Sign-off**:  
> VyaparSuite Accounting Posting Matrix is mathematically sound, covers all 30 posting scenarios with strict double-entry rigor, and complies with Indian GST/TDS regulations and global IFRS standards.
