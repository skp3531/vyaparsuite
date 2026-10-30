'use client';

import * as React from 'react';
import {
  Landmark,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileSpreadsheet,
  Download,
  Eye,
  FileText,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  Scale,
  Maximize2,
  Minimize2,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
  Input,
  NativeSelect,
  EmptyState,
  useToast,
} from '@/components/ui';
import { Decimal } from '@/lib/utils/decimal';

export type RootAccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export type AccountType =
  | 'Group'
  | 'Bank'
  | 'Cash'
  | 'Receivable'
  | 'Payable'
  | 'Stock'
  | 'Tax'
  | 'Fixed Asset'
  | 'Accumulated Depreciation'
  | 'Current Liability'
  | 'Non-Current Liability'
  | 'Equity'
  | 'Reserve'
  | 'Retained Earnings'
  | 'Direct Income'
  | 'Indirect Income'
  | 'Direct Expense'
  | 'Indirect Expense'
  | 'Depreciation';

export interface AccountNode {
  id: string;
  code: string;
  name: string;
  root_type: RootAccountType;
  account_type: AccountType;
  is_group: boolean;
  parent_id: string | null;
  balance: number; // Signed balance in INR (Debit positive for Assets/Expenses, Credit positive for Liabilities/Equity/Income)
  balance_type: 'Dr' | 'Cr';
  currency: string;
  children?: AccountNode[];
}

const INITIAL_COA_DATA: AccountNode[] = [
  // ==========================================
  // 1000 - ASSETS
  // ==========================================
  {
    id: 'acc-1000',
    code: '1000',
    name: 'Application of Funds (Assets)',
    root_type: 'Asset',
    account_type: 'Group',
    is_group: true,
    parent_id: null,
    balance: 24580000,
    balance_type: 'Dr',
    currency: 'INR',
    children: [
      {
        id: 'acc-1100',
        code: '1100',
        name: 'Current Assets',
        root_type: 'Asset',
        account_type: 'Group',
        is_group: true,
        parent_id: 'acc-1000',
        balance: 16780000,
        balance_type: 'Dr',
        currency: 'INR',
        children: [
          {
            id: 'acc-1110',
            code: '1110',
            name: 'Cash and Bank Balances',
            root_type: 'Asset',
            account_type: 'Group',
            is_group: true,
            parent_id: 'acc-1100',
            balance: 6450000,
            balance_type: 'Dr',
            currency: 'INR',
            children: [
              {
                id: 'acc-1111',
                code: '1111',
                name: 'Petty Cash - Main Office',
                root_type: 'Asset',
                account_type: 'Cash',
                is_group: false,
                parent_id: 'acc-1110',
                balance: 50000,
                balance_type: 'Dr',
                currency: 'INR',
              },
              {
                id: 'acc-1112',
                code: '1112',
                name: 'HDFC Bank Operating Current A/c #502000',
                root_type: 'Asset',
                account_type: 'Bank',
                is_group: false,
                parent_id: 'acc-1110',
                balance: 4200000,
                balance_type: 'Dr',
                currency: 'INR',
              },
              {
                id: 'acc-1113',
                code: '1113',
                name: 'ICICI Bank Collection A/c #000405',
                root_type: 'Asset',
                account_type: 'Bank',
                is_group: false,
                parent_id: 'acc-1110',
                balance: 2200000,
                balance_type: 'Dr',
                currency: 'INR',
              },
            ],
          },
          {
            id: 'acc-1120',
            code: '1120',
            name: 'Accounts Receivable (Sundry Debtors)',
            root_type: 'Asset',
            account_type: 'Group',
            is_group: true,
            parent_id: 'acc-1100',
            balance: 4850000,
            balance_type: 'Dr',
            currency: 'INR',
            children: [
              {
                id: 'acc-1121',
                code: '1121',
                name: 'Domestic Trade Receivables',
                root_type: 'Asset',
                account_type: 'Receivable',
                is_group: false,
                parent_id: 'acc-1120',
                balance: 3850000,
                balance_type: 'Dr',
                currency: 'INR',
              },
              {
                id: 'acc-1122',
                code: '1122',
                name: 'Export Trade Debtors (Zero Rated)',
                root_type: 'Asset',
                account_type: 'Receivable',
                is_group: false,
                parent_id: 'acc-1120',
                balance: 1000000,
                balance_type: 'Dr',
                currency: 'INR',
              },
            ],
          },
          {
            id: 'acc-1130',
            code: '1130',
            name: 'Stock in Hand / Inventory Assets',
            root_type: 'Asset',
            account_type: 'Group',
            is_group: true,
            parent_id: 'acc-1100',
            balance: 4250000,
            balance_type: 'Dr',
            currency: 'INR',
            children: [
              {
                id: 'acc-1131',
                code: '1131',
                name: 'Raw Materials Stores Stock',
                root_type: 'Asset',
                account_type: 'Stock',
                is_group: false,
                parent_id: 'acc-1130',
                balance: 2150000,
                balance_type: 'Dr',
                currency: 'INR',
              },
              {
                id: 'acc-1132',
                code: '1132',
                name: 'Work In Progress (WIP) Shopfloor',
                root_type: 'Asset',
                account_type: 'Stock',
                is_group: false,
                parent_id: 'acc-1130',
                balance: 650000,
                balance_type: 'Dr',
                currency: 'INR',
              },
              {
                id: 'acc-1133',
                code: '1133',
                name: 'Finished Goods Inventory Depot',
                root_type: 'Asset',
                account_type: 'Stock',
                is_group: false,
                parent_id: 'acc-1130',
                balance: 1450000,
                balance_type: 'Dr',
                currency: 'INR',
              },
            ],
          },
          {
            id: 'acc-1140',
            code: '1140',
            name: 'Statutory GST Tax Input Credits',
            root_type: 'Asset',
            account_type: 'Group',
            is_group: true,
            parent_id: 'acc-1100',
            balance: 1230000,
            balance_type: 'Dr',
            currency: 'INR',
            children: [
              {
                id: 'acc-1141',
                code: '1141',
                name: 'Input Tax Credit - CGST',
                root_type: 'Asset',
                account_type: 'Tax',
                is_group: false,
                parent_id: 'acc-1140',
                balance: 480000,
                balance_type: 'Dr',
                currency: 'INR',
              },
              {
                id: 'acc-1142',
                code: '1142',
                name: 'Input Tax Credit - SGST',
                root_type: 'Asset',
                account_type: 'Tax',
                is_group: false,
                parent_id: 'acc-1140',
                balance: 480000,
                balance_type: 'Dr',
                currency: 'INR',
              },
              {
                id: 'acc-1143',
                code: '1143',
                name: 'Input Tax Credit - IGST',
                root_type: 'Asset',
                account_type: 'Tax',
                is_group: false,
                parent_id: 'acc-1140',
                balance: 270000,
                balance_type: 'Dr',
                currency: 'INR',
              },
            ],
          },
        ],
      },
      {
        id: 'acc-1200',
        code: '1200',
        name: 'Fixed Assets (Property, Plant & Equipment)',
        root_type: 'Asset',
        account_type: 'Group',
        is_group: true,
        parent_id: 'acc-1000',
        balance: 7800000,
        balance_type: 'Dr',
        currency: 'INR',
        children: [
          {
            id: 'acc-1210',
            code: '1210',
            name: 'Plant & Industrial Machinery',
            root_type: 'Asset',
            account_type: 'Fixed Asset',
            is_group: false,
            parent_id: 'acc-1200',
            balance: 5200000,
            balance_type: 'Dr',
            currency: 'INR',
          },
          {
            id: 'acc-1220',
            code: '1220',
            name: 'Computer Equipment & Server Racks',
            root_type: 'Asset',
            account_type: 'Fixed Asset',
            is_group: false,
            parent_id: 'acc-1200',
            balance: 1800000,
            balance_type: 'Dr',
            currency: 'INR',
          },
          {
            id: 'acc-1230',
            code: '1230',
            name: 'Office Furniture & Fixtures',
            root_type: 'Asset',
            account_type: 'Fixed Asset',
            is_group: false,
            parent_id: 'acc-1200',
            balance: 800000,
            balance_type: 'Dr',
            currency: 'INR',
          },
        ],
      },
    ],
  },

  // ==========================================
  // 2000 - LIABILITIES
  // ==========================================
  {
    id: 'acc-2000',
    code: '2000',
    name: 'Sources of Funds (Liabilities)',
    root_type: 'Liability',
    account_type: 'Group',
    is_group: true,
    parent_id: null,
    balance: 8940000,
    balance_type: 'Cr',
    currency: 'INR',
    children: [
      {
        id: 'acc-2100',
        code: '2100',
        name: 'Current Liabilities & Statutory Dues',
        root_type: 'Liability',
        account_type: 'Group',
        is_group: true,
        parent_id: 'acc-2000',
        balance: 4940000,
        balance_type: 'Cr',
        currency: 'INR',
        children: [
          {
            id: 'acc-2110',
            code: '2110',
            name: 'Accounts Payable (Sundry Creditors)',
            root_type: 'Liability',
            account_type: 'Group',
            is_group: true,
            parent_id: 'acc-2100',
            balance: 3450000,
            balance_type: 'Cr',
            currency: 'INR',
            children: [
              {
                id: 'acc-2111',
                code: '2111',
                name: 'Domestic Trade Creditors (MSME Vendors)',
                root_type: 'Liability',
                account_type: 'Payable',
                is_group: false,
                parent_id: 'acc-2110',
                balance: 1850000,
                balance_type: 'Cr',
                currency: 'INR',
              },
              {
                id: 'acc-2112',
                code: '2112',
                name: 'Other Trade Creditors (Non-MSME)',
                root_type: 'Liability',
                account_type: 'Payable',
                is_group: false,
                parent_id: 'acc-2110',
                balance: 1600000,
                balance_type: 'Cr',
                currency: 'INR',
              },
            ],
          },
          {
            id: 'acc-2120',
            code: '2120',
            name: 'Statutory Duties & Tax Payables',
            root_type: 'Liability',
            account_type: 'Group',
            is_group: true,
            parent_id: 'acc-2100',
            balance: 1490000,
            balance_type: 'Cr',
            currency: 'INR',
            children: [
              {
                id: 'acc-2121',
                code: '2121',
                name: 'Output GST Payable (CGST)',
                root_type: 'Liability',
                account_type: 'Tax',
                is_group: false,
                parent_id: 'acc-2120',
                balance: 550000,
                balance_type: 'Cr',
                currency: 'INR',
              },
              {
                id: 'acc-2122',
                code: '2122',
                name: 'Output GST Payable (SGST)',
                root_type: 'Liability',
                account_type: 'Tax',
                is_group: false,
                parent_id: 'acc-2120',
                balance: 550000,
                balance_type: 'Cr',
                currency: 'INR',
              },
              {
                id: 'acc-2123',
                code: '2123',
                name: 'TDS Payable (Sec 194C / 194J Contractors)',
                root_type: 'Liability',
                account_type: 'Tax',
                is_group: false,
                parent_id: 'acc-2120',
                balance: 240000,
                balance_type: 'Cr',
                currency: 'INR',
              },
              {
                id: 'acc-2124',
                code: '2124',
                name: 'Provident Fund (PF) Statutory Payable',
                root_type: 'Liability',
                account_type: 'Current Liability',
                is_group: false,
                parent_id: 'acc-2120',
                balance: 150000,
                balance_type: 'Cr',
                currency: 'INR',
              },
            ],
          },
        ],
      },
      {
        id: 'acc-2200',
        code: '2200',
        name: 'Long-Term Loans & Borrowings',
        root_type: 'Liability',
        account_type: 'Group',
        is_group: true,
        parent_id: 'acc-2000',
        balance: 4000000,
        balance_type: 'Cr',
        currency: 'INR',
        children: [
          {
            id: 'acc-2210',
            code: '2210',
            name: 'HDFC Secured Machinery Term Loan',
            root_type: 'Liability',
            account_type: 'Non-Current Liability',
            is_group: false,
            parent_id: 'acc-2200',
            balance: 3200000,
            balance_type: 'Cr',
            currency: 'INR',
          },
          {
            id: 'acc-2220',
            code: '2220',
            name: 'Directors Unsecured Subordinated Loan',
            root_type: 'Liability',
            account_type: 'Non-Current Liability',
            is_group: false,
            parent_id: 'acc-2200',
            balance: 800000,
            balance_type: 'Cr',
            currency: 'INR',
          },
        ],
      },
    ],
  },

  // ==========================================
  // 3000 - EQUITY
  // ==========================================
  {
    id: 'acc-3000',
    code: '3000',
    name: 'Shareholders Equity & Reserves',
    root_type: 'Equity',
    account_type: 'Group',
    is_group: true,
    parent_id: null,
    balance: 10000000,
    balance_type: 'Cr',
    currency: 'INR',
    children: [
      {
        id: 'acc-3100',
        code: '3100',
        name: 'Issued & Paid-up Share Capital',
        root_type: 'Equity',
        account_type: 'Equity',
        is_group: false,
        parent_id: 'acc-3000',
        balance: 5000000,
        balance_type: 'Cr',
        currency: 'INR',
      },
      {
        id: 'acc-3200',
        code: '3200',
        name: 'General Reserves & Statutory Surplus',
        root_type: 'Equity',
        account_type: 'Reserve',
        is_group: false,
        parent_id: 'acc-3000',
        balance: 2500000,
        balance_type: 'Cr',
        currency: 'INR',
      },
      {
        id: 'acc-3300',
        code: '3300',
        name: 'Retained Earnings / P&L Carry Forward',
        root_type: 'Equity',
        account_type: 'Retained Earnings',
        is_group: false,
        parent_id: 'acc-3000',
        balance: 2500000,
        balance_type: 'Cr',
        currency: 'INR',
      },
    ],
  },

  // ==========================================
  // 4000 - INCOME
  // ==========================================
  {
    id: 'acc-4000',
    code: '4000',
    name: 'Operating & Non-Operating Income',
    root_type: 'Income',
    account_type: 'Group',
    is_group: true,
    parent_id: null,
    balance: 14200000,
    balance_type: 'Cr',
    currency: 'INR',
    children: [
      {
        id: 'acc-4100',
        code: '4100',
        name: 'Operating Revenue from Operations',
        root_type: 'Income',
        account_type: 'Group',
        is_group: true,
        parent_id: 'acc-4000',
        balance: 13800000,
        balance_type: 'Cr',
        currency: 'INR',
        children: [
          {
            id: 'acc-4110',
            code: '4110',
            name: 'Domestic Finished Goods Sales (GST 18%)',
            root_type: 'Income',
            account_type: 'Direct Income',
            is_group: false,
            parent_id: 'acc-4100',
            balance: 11200000,
            balance_type: 'Cr',
            currency: 'INR',
          },
          {
            id: 'acc-4120',
            code: '4120',
            name: 'Export Sales of Electronic Equipment',
            root_type: 'Income',
            account_type: 'Direct Income',
            is_group: false,
            parent_id: 'acc-4100',
            balance: 1800000,
            balance_type: 'Cr',
            currency: 'INR',
          },
          {
            id: 'acc-4130',
            code: '4130',
            name: 'Annual Maintenance Service Revenue',
            root_type: 'Income',
            account_type: 'Direct Income',
            is_group: false,
            parent_id: 'acc-4100',
            balance: 800000,
            balance_type: 'Cr',
            currency: 'INR',
          },
        ],
      },
      {
        id: 'acc-4200',
        code: '4200',
        name: 'Other Non-Operating Income',
        root_type: 'Income',
        account_type: 'Group',
        is_group: true,
        parent_id: 'acc-4000',
        balance: 400000,
        balance_type: 'Cr',
        currency: 'INR',
        children: [
          {
            id: 'acc-4210',
            code: '4210',
            name: 'Interest on Bank Fixed Deposits',
            root_type: 'Income',
            account_type: 'Indirect Income',
            is_group: false,
            parent_id: 'acc-4200',
            balance: 280000,
            balance_type: 'Cr',
            currency: 'INR',
          },
          {
            id: 'acc-4220',
            code: '4220',
            name: 'Foreign Exchange Fluctuation Gain',
            root_type: 'Income',
            account_type: 'Indirect Income',
            is_group: false,
            parent_id: 'acc-4200',
            balance: 120000,
            balance_type: 'Cr',
            currency: 'INR',
          },
        ],
      },
    ],
  },

  // ==========================================
  // 5000 - EXPENSES
  // ==========================================
  {
    id: 'acc-5000',
    code: '5000',
    name: 'Cost of Sales & Operating Expenses',
    root_type: 'Expense',
    account_type: 'Group',
    is_group: true,
    parent_id: null,
    balance: 8560000,
    balance_type: 'Dr',
    currency: 'INR',
    children: [
      {
        id: 'acc-5100',
        code: '5100',
        name: 'Cost of Goods Sold (COGS)',
        root_type: 'Expense',
        account_type: 'Group',
        is_group: true,
        parent_id: 'acc-5000',
        balance: 5400000,
        balance_type: 'Dr',
        currency: 'INR',
        children: [
          {
            id: 'acc-5110',
            code: '5110',
            name: 'Raw Material Consumption',
            root_type: 'Expense',
            account_type: 'Direct Expense',
            is_group: false,
            parent_id: 'acc-5100',
            balance: 4100000,
            balance_type: 'Dr',
            currency: 'INR',
          },
          {
            id: 'acc-5120',
            code: '5120',
            name: 'Direct Shopfloor Factory Labor',
            root_type: 'Expense',
            account_type: 'Direct Expense',
            is_group: false,
            parent_id: 'acc-5100',
            balance: 950000,
            balance_type: 'Dr',
            currency: 'INR',
          },
          {
            id: 'acc-5130',
            code: '5130',
            name: 'Inward Freight & Logistics Charges',
            root_type: 'Expense',
            account_type: 'Direct Expense',
            is_group: false,
            parent_id: 'acc-5100',
            balance: 350000,
            balance_type: 'Dr',
            currency: 'INR',
          },
        ],
      },
      {
        id: 'acc-5200',
        code: '5200',
        name: 'Administrative & Operating Overheads',
        root_type: 'Expense',
        account_type: 'Group',
        is_group: true,
        parent_id: 'acc-5000',
        balance: 2680000,
        balance_type: 'Dr',
        currency: 'INR',
        children: [
          {
            id: 'acc-5210',
            code: '5210',
            name: 'Salaries, Allowances & Benefits',
            root_type: 'Expense',
            account_type: 'Indirect Expense',
            is_group: false,
            parent_id: 'acc-5200',
            balance: 1650000,
            balance_type: 'Dr',
            currency: 'INR',
          },
          {
            id: 'acc-5220',
            code: '5220',
            name: 'Premises Rent & Utility Charges',
            root_type: 'Expense',
            account_type: 'Indirect Expense',
            is_group: false,
            parent_id: 'acc-5200',
            balance: 480000,
            balance_type: 'Dr',
            currency: 'INR',
          },
          {
            id: 'acc-5230',
            code: '5230',
            name: 'Software Licenses & Cloud Telemetry',
            root_type: 'Expense',
            account_type: 'Indirect Expense',
            is_group: false,
            parent_id: 'acc-5200',
            balance: 320000,
            balance_type: 'Dr',
            currency: 'INR',
          },
          {
            id: 'acc-5240',
            code: '5240',
            name: 'Statutory CARO Audit & Legal Fees',
            root_type: 'Expense',
            account_type: 'Indirect Expense',
            is_group: false,
            parent_id: 'acc-5200',
            balance: 230000,
            balance_type: 'Dr',
            currency: 'INR',
          },
        ],
      },
      {
        id: 'acc-5300',
        code: '5300',
        name: 'Financial Charges & Depreciation',
        root_type: 'Expense',
        account_type: 'Group',
        is_group: true,
        parent_id: 'acc-5000',
        balance: 480000,
        balance_type: 'Dr',
        currency: 'INR',
        children: [
          {
            id: 'acc-5310',
            code: '5310',
            name: 'Bank Financing Interest on Term Loans',
            root_type: 'Expense',
            account_type: 'Indirect Expense',
            is_group: false,
            parent_id: 'acc-5300',
            balance: 340000,
            balance_type: 'Dr',
            currency: 'INR',
          },
          {
            id: 'acc-5320',
            code: '5320',
            name: 'Depreciation on Machinery & Hardware',
            root_type: 'Expense',
            account_type: 'Depreciation',
            is_group: false,
            parent_id: 'acc-5300',
            balance: 140000,
            balance_type: 'Dr',
            currency: 'INR',
          },
        ],
      },
    ],
  },
];

export default function ChartOfAccountsPage() {
  const { toast } = useToast();

  const [treeData, setTreeData] = React.useState<AccountNode[]>(INITIAL_COA_DATA);
  const [expandedNodeIds, setExpandedNodeIds] = React.useState<Set<string>>(
    new Set(['acc-1000', 'acc-1100', 'acc-2000', 'acc-3000', 'acc-4000', 'acc-5000'])
  );
  const [selectedRootFilter, setSelectedRootFilter] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Add Account Modal state
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = React.useState(false);
  const [selectedParentId, setSelectedParentId] = React.useState<string>('acc-1110');
  const [newAccount, setNewAccount] = React.useState<Partial<AccountNode>>({
    root_type: 'Asset',
    account_type: 'Bank',
    is_group: false,
    balance: 0,
    balance_type: 'Dr',
    currency: 'INR',
  });

  // Collect all group accounts for parent selector
  const allGroupAccounts = React.useMemo(() => {
    const list: { id: string; code: string; name: string; root_type: RootAccountType }[] = [];
    const traverse = (nodes: AccountNode[]) => {
      for (const node of nodes) {
        if (node.is_group) {
          list.push({
            id: node.id,
            code: node.code,
            name: `${node.code} - ${node.name}`,
            root_type: node.root_type,
          });
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    };
    traverse(treeData);
    return list;
  }, [treeData]);

  // Expand / collapse single node
  const toggleNode = (nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Expand all nodes
  const expandAll = () => {
    const allIds = new Set<string>();
    const traverse = (nodes: AccountNode[]) => {
      for (const node of nodes) {
        allIds.add(node.id);
        if (node.children) traverse(node.children);
      }
    };
    traverse(treeData);
    setExpandedNodeIds(allIds);
  };

  // Collapse all nodes except roots
  const collapseAll = () => {
    setExpandedNodeIds(new Set(['acc-1000', 'acc-2000', 'acc-3000', 'acc-4000', 'acc-5000']));
  };

  // Handle open Add Account modal with pre-selected parent
  const handleOpenAddAccount = (parent?: AccountNode) => {
    if (parent) {
      setSelectedParentId(parent.id);
      setNewAccount({
        root_type: parent.root_type,
        account_type: parent.root_type === 'Asset' ? 'Bank' : parent.root_type === 'Expense' ? 'Indirect Expense' : 'Payable',
        is_group: false,
        balance: 0,
        balance_type: parent.balance_type,
        currency: 'INR',
      });
    } else {
      setSelectedParentId('acc-1110');
      setNewAccount({
        root_type: 'Asset',
        account_type: 'Bank',
        is_group: false,
        balance: 0,
        balance_type: 'Dr',
        currency: 'INR',
      });
    }
    setIsAddAccountModalOpen(true);
  };

  // Add Account submit handler
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name?.trim()) {
      toast.error('Account name is required');
      return;
    }
    if (!newAccount.code?.trim()) {
      toast.error('Account code is required');
      return;
    }

    const createdNode: AccountNode = {
      id: `acc-${Date.now()}`,
      code: newAccount.code.trim(),
      name: newAccount.name.trim(),
      root_type: (newAccount.root_type as RootAccountType) || 'Asset',
      account_type: (newAccount.account_type as AccountType) || 'Bank',
      is_group: Boolean(newAccount.is_group),
      parent_id: selectedParentId,
      balance: Number(newAccount.balance) || 0,
      balance_type: (newAccount.balance_type as 'Dr' | 'Cr') || 'Dr',
      currency: 'INR',
      children: newAccount.is_group ? [] : undefined,
    };

    // Recursively append into tree under parent_id
    const insertIntoTree = (nodes: AccountNode[]): AccountNode[] => {
      return nodes.map((node) => {
        if (node.id === selectedParentId) {
          return {
            ...node,
            children: [...(node.children || []), createdNode],
          };
        }
        if (node.children) {
          return {
            ...node,
            children: insertIntoTree(node.children),
          };
        }
        return node;
      });
    };

    setTreeData((prev) => insertIntoTree(prev));
    setExpandedNodeIds((prev) => new Set([...prev, selectedParentId]));
    setIsAddAccountModalOpen(false);

    toast.success(`Account ${createdNode.code} created successfully!`, {
      description: `${createdNode.name} added to General Ledger tree`,
    });
  };

  // Filter tree nodes by root type and search keywords
  const filterNodes = React.useCallback(
    (nodes: AccountNode[]): AccountNode[] => {
      return nodes
        .filter((node) => {
          if (selectedRootFilter !== 'all' && node.root_type !== selectedRootFilter) {
            return false;
          }
          return true;
        })
        .map((node) => {
          if (!searchTerm.trim()) {
            return node;
          }

          const matchesSelf =
            node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.account_type.toLowerCase().includes(searchTerm.toLowerCase());

          const filteredChildren = node.children ? filterNodes(node.children) : [];

          if (matchesSelf || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter((node): node is AccountNode => node !== null);
    },
    [selectedRootFilter, searchTerm]
  );

  const displayedTree = React.useMemo(() => {
    return filterNodes(treeData);
  }, [treeData, filterNodes]);

  // Overall Financial Summaries
  const totals = React.useMemo(() => {
    const assets = treeData.find((n) => n.code === '1000')?.balance || 0;
    const liabilities = treeData.find((n) => n.code === '2000')?.balance || 0;
    const equity = treeData.find((n) => n.code === '3000')?.balance || 0;
    const income = treeData.find((n) => n.code === '4000')?.balance || 0;
    const expenses = treeData.find((n) => n.code === '5000')?.balance || 0;
    const netProfit = income - expenses;

    return { assets, liabilities, equity, income, expenses, netProfit };
  }, [treeData]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: AccountNode, depth: number = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = expandedNodeIds.has(node.id) || Boolean(searchTerm.trim());

    // Account Type badge color helper
    const getAccountTypeBadge = (type: AccountType) => {
      switch (type) {
        case 'Group':
          return <Badge variant="secondary" size="xs">Group</Badge>;
        case 'Bank':
          return <Badge variant="success" size="xs">Bank A/c</Badge>;
        case 'Cash':
          return <Badge variant="warning" size="xs">Cash</Badge>;
        case 'Receivable':
          return <Badge variant="primary" size="xs">Debtor</Badge>;
        case 'Payable':
          return <Badge variant="warning" size="xs">Creditor</Badge>;
        case 'Stock':
          return <Badge variant="info" size="xs">Inventory</Badge>;
        case 'Tax':
          return <Badge variant="outline" size="xs">GST / Tax</Badge>;
        case 'Fixed Asset':
          return <Badge variant="info" size="xs">Fixed Asset</Badge>;
        case 'Direct Income':
        case 'Indirect Income':
          return <Badge variant="success" size="xs">Revenue</Badge>;
        case 'Direct Expense':
        case 'Indirect Expense':
        case 'Depreciation':
          return <Badge variant="danger" size="xs">Expense</Badge>;
        default:
          return <Badge variant="outline" size="xs">{type}</Badge>;
      }
    };

    return (
      <div key={node.id} className="select-none">
        <div
          className={`group flex items-center justify-between py-2 px-3 rounded-lg border transition-all duration-150 ${
            node.is_group
              ? 'bg-slate-50/70 dark:bg-slate-900/60 font-semibold border-slate-200/60 dark:border-slate-800 my-0.5 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
              : 'hover:bg-brand-50/40 dark:hover:bg-slate-800/40 border-transparent hover:border-slate-200/60 dark:hover:border-slate-800 my-0.5'
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 24 + 12)}px` }}
        >
          {/* Left: Expander + Icon + Code + Name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {node.is_group ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-6 shrink-0 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              </span>
            )}

            <div className="shrink-0">
              {node.is_group ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                ) : (
                  <Folder className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                )
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-slate-400" />
              )}
            </div>

            <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
              {node.code}
            </span>

            <span
              className={`text-xs sm:text-sm truncate ${
                node.is_group
                  ? 'text-slate-900 dark:text-slate-100 font-semibold'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {node.name}
            </span>

            <div className="hidden sm:inline-block ml-1">
              {getAccountTypeBadge(node.account_type)}
            </div>
          </div>

          {/* Right: Balance + Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Balance Badge with Dr / Cr indicator */}
            <div className="text-right">
              <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                {Decimal.from(node.balance).format({ currency: 'INR' })}
              </span>
              <span
                className={`ml-1 text-[10px] font-bold px-1 py-0.5 rounded ${
                  node.balance_type === 'Dr'
                    ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60'
                    : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60'
                }`}
              >
                {node.balance_type}
              </span>
            </div>

            {/* Quick Actions (visible on hover) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {node.is_group && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleOpenAddAccount(node)}
                  title="Add Sub-account"
                  className="h-6 w-6 p-0 text-brand-600 dark:text-brand-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="xs"
                onClick={() =>
                  toast.info(`Opening General Ledger for ${node.code} - ${node.name}...`)
                }
                title="View General Ledger"
                className="h-6 w-6 p-0 text-slate-500 hover:text-slate-800"
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Recursive Children Container */}
        {hasChildren && isExpanded && (
          <div className="border-l border-slate-200/80 dark:border-slate-800/80 ml-5 pl-1 space-y-0.5">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-lg border border-brand-200/60 dark:border-brand-800">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Chart of Accounts (CoA)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Visual hierarchical tree structure of the General Ledger per Indian Accounting Standards (Ind AS).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={() => toast.info('Exporting Chart of Accounts tree structure...')}
          >
            Export Tree
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => handleOpenAddAccount()}
          >
            Add Account
          </Button>
        </div>
      </div>

      {/* Financial Health / Summary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card variant="default">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Assets (1000)
            </span>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {Decimal.from(totals.assets).format({ currency: 'INR', places: 0 })}
            </div>
            <span className="text-[10px] text-blue-600 font-semibold">Debit Balance</span>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Liabilities (2000)
            </span>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {Decimal.from(totals.liabilities).format({ currency: 'INR', places: 0 })}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Credit Balance</span>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Shareholders Equity
            </span>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {Decimal.from(totals.equity).format({ currency: 'INR', places: 0 })}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Credit Balance</span>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Operating Revenue
            </span>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {Decimal.from(totals.income).format({ currency: 'INR', places: 0 })}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Credit Revenue</span>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Expenses
            </span>
            <div className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {Decimal.from(totals.expenses).format({ currency: 'INR', places: 0 })}
            </div>
            <span className="text-[10px] text-red-600 font-semibold">Debit Expenses</span>
          </CardContent>
        </Card>

        <Card variant="default" className="bg-brand-50/50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 block">
              Net Profit (YTD)
            </span>
            <div className="text-sm sm:text-base font-bold font-mono text-brand-700 dark:text-brand-300 mt-0.5">
              {Decimal.from(totals.netProfit).format({ currency: 'INR', places: 0 })}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Surplus</span>
          </CardContent>
        </Card>
      </div>

      {/* Tree Controls Toolbar */}
      <Card variant="default">
        <CardContent className="p-3 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Input
                placeholder="Search ledger accounts by code, name, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<Search className="h-4 w-4 text-slate-400" />}
                clearable
                onClear={() => setSearchTerm('')}
                size="sm"
              />
            </div>

            {/* Root Type Tabs / Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
              {[
                { label: 'All Accounts', value: 'all' },
                { label: 'Assets', value: 'Asset' },
                { label: 'Liabilities', value: 'Liability' },
                { label: 'Equity', value: 'Equity' },
                { label: 'Income', value: 'Income' },
                { label: 'Expenses', value: 'Expense' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSelectedRootFilter(tab.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    selectedRootFilter === tab.value
                      ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tree Toggle Expand / Collapse Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Maximize2 className="h-3 w-3" />}
                onClick={expandAll}
                title="Expand All Nodes"
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Minimize2 className="h-3 w-3" />}
                onClick={collapseAll}
                title="Collapse All Nodes"
              >
                Collapse All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Visual Tree View */}
      <Card variant="default">
        <CardHeader className="py-3 px-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Scale className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <span>General Ledger Hierarchy</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Click chevrons to expand nested groups. Hover over group accounts to insert sub-accounts.
            </CardDescription>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Currency: INR (₹)
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4">
          {displayedTree.length === 0 ? (
            <EmptyState
              icon={<Landmark className="h-8 w-8 text-slate-400" />}
              title="No accounts match your search"
              description="Check your search keywords or root type filter."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRootFilter('all');
                  }}
                >
                  Reset Filter
                </Button>
              }
            />
          ) : (
            <div className="space-y-1">
              {displayedTree.map((rootNode) => renderTreeNode(rootNode, 0))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* ADD ACCOUNT MODAL */}
      {/* ============================================================== */}
      <Modal open={isAddAccountModalOpen} onOpenChange={setIsAddAccountModalOpen}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>Add Chart of Accounts Node</ModalTitle>
            <ModalDescription>
              Create a new ledger posting account or group account in your general ledger tree.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleCreateAccount} className="space-y-4">
            {/* Parent Account */}
            <div>
              <NativeSelect
                label="Parent Account (Group) *"
                value={selectedParentId}
                onChange={(e) => {
                  setSelectedParentId(e.target.value);
                  const parent = allGroupAccounts.find((g) => g.id === e.target.value);
                  if (parent) {
                    setNewAccount((prev) => ({ ...prev, root_type: parent.root_type }));
                  }
                }}
                required
                size="sm"
              >
                {allGroupAccounts.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.root_type})
                  </option>
                ))}
              </NativeSelect>
            </div>

            {/* Account Code & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Input
                  label="Account Code *"
                  placeholder="e.g. 1114"
                  value={newAccount.code || ''}
                  onChange={(e) =>
                    setNewAccount((prev) => ({ ...prev, code: e.target.value }))
                  }
                  required
                  size="sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Account Name *"
                  placeholder="e.g. Axis Bank Operating Current A/c"
                  value={newAccount.name || ''}
                  onChange={(e) =>
                    setNewAccount((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  size="sm"
                />
              </div>
            </div>

            {/* Root Type & Account Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NativeSelect
                label="Root Type *"
                value={newAccount.root_type || 'Asset'}
                onChange={(e) =>
                  setNewAccount((prev) => ({
                    ...prev,
                    root_type: e.target.value as RootAccountType,
                  }))
                }
                size="sm"
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Income">Income / Revenue</option>
                <option value="Expense">Expense</option>
              </NativeSelect>

              <NativeSelect
                label="Account Classification *"
                value={newAccount.account_type || 'Bank'}
                onChange={(e) =>
                  setNewAccount((prev) => ({
                    ...prev,
                    account_type: e.target.value as AccountType,
                  }))
                }
                size="sm"
              >
                <option value="Bank">Bank Account</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Receivable">Receivable / Customer Debtor</option>
                <option value="Payable">Payable / Vendor Creditor</option>
                <option value="Stock">Stock / Inventory Asset</option>
                <option value="Tax">Duties & Taxes (GST, TDS)</option>
                <option value="Fixed Asset">Fixed Asset</option>
                <option value="Direct Income">Operating Direct Income</option>
                <option value="Indirect Income">Indirect Other Income</option>
                <option value="Direct Expense">Direct COGS Expense</option>
                <option value="Indirect Expense">Operating Overheads</option>
                <option value="Group">Sub-Group Folder</option>
              </NativeSelect>
            </div>

            {/* Opening Balance and Nature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
              <Input
                label="Opening Balance (INR ₹)"
                type="number"
                placeholder="0"
                value={newAccount.balance || ''}
                onChange={(e) =>
                  setNewAccount((prev) => ({ ...prev, balance: Number(e.target.value) }))
                }
                prefix="₹"
                size="sm"
              />

              <NativeSelect
                label="Balance Nature"
                value={newAccount.balance_type || 'Dr'}
                onChange={(e) =>
                  setNewAccount((prev) => ({
                    ...prev,
                    balance_type: e.target.value as 'Dr' | 'Cr',
                  }))
                }
                size="sm"
              >
                <option value="Dr">Debit (Dr)</option>
                <option value="Cr">Credit (Cr)</option>
              </NativeSelect>
            </div>

            {/* Is Group Account checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is-group-flag"
                checked={Boolean(newAccount.is_group)}
                onChange={(e) =>
                  setNewAccount((prev) => ({ ...prev, is_group: e.target.checked }))
                }
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <label
                htmlFor="is-group-flag"
                className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Is Group Account (Can contain sub-accounts, cannot receive direct vouchers)
              </label>
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddAccountModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Create Account Node
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
