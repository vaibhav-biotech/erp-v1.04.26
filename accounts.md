# Purchase Order Workflow Brief (Market Standard)

Here is the standard market workflow for managing Purchase Orders (POs) between Account Admins and Superadmins. Please review this flow to ensure it aligns with your operations.

## 1. PO Creation (Account Admin)
- The Account Admin creates a new Purchase Order in the system.
- The PO is saved with the status **`Draft`**.
- At this stage, the PO is just a request. No inventory is updated, and no payments can be logged.

## 2. PO Approval (Superadmin)
- The Superadmin reviews the `Draft` PO.
- The Superadmin clicks **"Approve"**, which changes the PO status to **`Accepted`** (or `Sent` if it is being emailed to the supplier).
- Only after approval does the PO become an active, actionable document.

## 3. Goods Receipt & Inventory Sync (Account Admin or Store Manager)
- When the supplier delivers the items, the Account Admin logs a **Goods Received Note (GRN)** in the system.
- The PO status automatically updates to **`Partially Received`** or **`Received`** (depending on whether all items arrived).
- **Critical Action**: Upon receiving goods, the system **automatically increments the Central Inventory stock** for the received products.

## 4. Payment Logging (Account Admin)
- The Account Admin records payments made to the supplier against the approved PO.
- The admin inputs the **Amount Paid**, **Payment Date**, and optionally the **Payment Method** (e.g., Bank Transfer, Check).
- The PO's financial status updates to **`Partial`** or **`Paid`** based on the outstanding balance.

## 5. Completion (System / Superadmin)
- Once all goods are received and all payments are logged, the PO status is marked as **`Completed`**.

---

> [!IMPORTANT]
> **To proceed:** Please confirm if this high-level market standard flow is exactly what you want to implement for the ERP. If approved, I will immediately begin executing the backend and frontend changes to enforce this logic.


------------------------------------------



# "Tally-like" Simple Accounts Management Brief

To upgrade the current Accounts Dashboard into a robust, simple accounting system (like Tally) for your multi-store ERP, we need to transition from just tracking "Orders and Invoices" to tracking **Double-Entry Financial Transactions (Vouchers & Ledgers)**.

Here is the detailed architectural brief for what we need to build. Please review this and let me know if it aligns with your vision.

---

## 1. Chart of Accounts & Ledger Groups (Hierarchical)
Like Tally, ledgers will be organized hierarchically under standard Groups.
*   **Assets:** Bank Accounts, Cash-in-hand, Sundry Debtors (Customers), Closing Stock, Fixed Assets.
*   **Liabilities:** Sundry Creditors (Suppliers), Duties & Taxes (GST Payable), Capital Account, Loans.
*   **Income:** Direct Incomes (Sales - grouped by store), Indirect Incomes (Interest, Discounts Received).
*   **Expenses:** Direct Expenses (Purchases, Freight), Indirect Expenses (Rent, Salary, Marketing).

## 2. Comprehensive Voucher Types (Data Entry)
A full double-entry system relies on specific voucher types for different transactions.
*   **Sales Voucher:** *Auto-generated* when an order is completed.
*   **Purchase Voucher:** *Auto-generated* when a Purchase Order is received.
*   **Receipt Voucher:** Money received from customers or other income.
*   **Payment Voucher:** Money paid to suppliers or for expenses.
*   **Contra Voucher (NEW):** Specifically for internal transfers (e.g., Withdrawing Cash from Bank, Depositing Cash to Bank).
*   **Journal Voucher:** For non-cash adjustments (Depreciation, Provisions, Write-offs).
*   **Credit Notes & Debit Notes (NEW):** For handling Sales Returns (Customer refunds) and Purchase Returns (Returning damaged goods to supplier).

## 3. Financial Statements & Reports (Full Suite)
The core of a Tally-like system is real-time report generation.
*   **Day Book & Ledger Vouchers:** Drill-down views into daily activity and specific party accounts.
*   **Profit & Loss (P&L) Statement:** Live calculation of Gross Profit and Net Profit. Can be viewed Consolidated or filtered by Store.
*   **Trial Balance (NEW):** A mathematical check showing all debit and credit balances across all ledgers.
*   **Balance Sheet (NEW):** The ultimate financial snapshot showing Assets vs Liabilities & Equity at any given date.
*   **Bank Reconciliation Statement (BRS) (NEW):** A dedicated interface to tick off system transactions against actual Bank Statement dates.
*   **Outstanding Reports:** Detailed aging analysis (e.g., Debtors over 30/60/90 days).
*   **GST Registers (NEW):** Formatted reports ready for GST filing (GSTR-1, GSTR-2, GSTR-3B equivalents) summarizing HSN/SAC codes, CGST, SGST, IGST.

## 4. Advanced Accounting Features (NEW)
*   **Inventory Valuation Integration:** The Balance Sheet's "Closing Stock" value will automatically pull from your live Central & Store inventories (using Average Costing or FIFO).
*   **Cost Centers:** Ability to tag expenses to specific "Projects" or "Campaigns" inside a store.
*   **Audit Trail:** Strict logging of who created, edited, or deleted a voucher to ensure financial compliance and prevent fraud.

## 5. Store-Wise Cost Centers
Since you have multiple stores (e.g., Plants in Garden), every transaction (Sales, Expenses) will be tagged with a **Store ID**.
*   This allows the accountant to filter reports and see exactly how profitable a specific store is, separate from central/corporate expenses.

## 6. Financial Reports (The Dashboard)
This is what the Account Admin will primarily use to monitor business health.
*   **Day Book:** A chronological log of ALL transactions (Sales, Payments, Receipts) for a given day.
*   **Ledger Statement (Account Statement):** The ability to select a Supplier or Customer and view their opening balance, all transactions in a date range, and closing balance.
*   **Profit & Loss (P&L) Statement:** Live calculation of Revenue (Sales) minus Direct Costs (Purchases) and Indirect Expenses (Salaries, Rent) to show Net Profit. Can be filtered by Store.
*   **Outstanding Payables & Receivables:** A quick dashboard widget showing exactly who owes you money, and who you owe money to.
*   **GST Summary Report:** A simple monthly breakdown of Total Output GST vs Total Input GST for tax filing purposes.

## 7. UI/UX Dashboard Layout
The new **Accounts Overview Dashboard** will be revamped to show:
1.  **Top KPIs:** Total Cash/Bank Balance, Total Receivables (Due from customers), Total Payables (Due to suppliers), Net Profit (MTD).
2.  **Quick Actions:** Big buttons for `+ New Payment`, `+ New Receipt`, `+ Add Expense`.
3.  **Recent Activity:** A mini Day Book showing the last 10 financial transactions.
4.  **Cash Flow Graph:** A visual chart showing money coming in vs money going out over the last 30 days.

---

## 8. Architecture Plan & Module Sync (Data Flow)
To ensure we do not break any existing modules (like Store Orders, Admin, or Purchase Orders), the Accounting Module will sit as a separate layer that **subscribes** to actions from the existing modules.

### A. How Modules Will Sync (Event-Driven)
1. **Sales Module (Store Orders) `->` Accounting Module**
   - **Trigger:** When a Store Order is marked as "Delivered" or "Invoiced" in the Orders page.
   - **Sync Action:** The system automatically generates a **Sales Voucher** in the background. It Debits the Customer Ledger and Credits the Sales Ledger (Store-specific).
   
2. **Purchase Module (PO) `->` Accounting Module**
   - **Trigger:** When the Account Admin logs a "Goods Received Note" (GRN) or marks a PO as "Received" in the Purchase Orders page.
   - **Sync Action:** The system automatically generates a **Purchase Voucher**. It Debits the Purchase Ledger and Credits the Supplier Ledger.
   - **Trigger:** When the Superadmin or Accountant logs a Payment against a PO.
   - **Sync Action:** The system automatically generates a **Payment Voucher**. It Debits the Supplier Ledger and Credits the Bank/Cash Ledger.

3. **Inventory Module `->` Accounting Module**
   - **Trigger:** End of Day / On-Demand Balance Sheet Generation.
   - **Sync Action:** The Accounting module fetches the *live stock value* directly from the `Product` collection (Central & Store inventories) to dynamically calculate the "Closing Stock" asset value on the Balance Sheet. No double-entry needed for stock valuation.

### B. What Fetches What (Data Sources)
- **Customer Ledgers:** Linked directly to the existing `Customer` and `StoreCustomer` IDs.
- **Supplier Ledgers:** Linked directly to the existing `Supplier` collection.
- **Vouchers:** A new `Voucher` collection will be created, linking back to the `orderId` or `poId` so you can always click a voucher and see the exact ERP order that generated it.

---

### > Open Questions for You:
1.  **Migration:** Should we automatically convert all *existing* orders and purchase orders into historical Sales/Purchase vouchers when we deploy this, or start fresh from zero on deployment day?
2.  **Complexity:** Should we enforce strict Double-Entry accounting (every debit must have a credit), or keep it slightly relaxed (Single-entry style for expenses) for maximum simplicity?
3.  **Permissions:** Should Store Managers be allowed to log petty cash expenses for their own stores, or should ONLY the Account Admin do all data entry?
