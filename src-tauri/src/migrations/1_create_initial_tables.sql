-- SQLite version of the initial tables

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT,
  description TEXT,
  name TEXT NOT NULL UNIQUE
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT,
  description TEXT,
  name TEXT NOT NULL UNIQUE
);

-- Create system_metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_time TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  server_info TEXT
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  updated_at TEXT,
  username TEXT NOT NULL UNIQUE
);

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_name TEXT NOT NULL,
  account_no TEXT NOT NULL UNIQUE,
  balance REAL NOT NULL,
  bank_name TEXT NOT NULL,
  created_at TEXT,
  currency TEXT NOT NULL DEFAULT 'CNY',
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  updated_at TEXT,
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attachments TEXT,
  bank_account TEXT,
  business_license TEXT,
  business_scope TEXT,
  certification_info TEXT,
  company_name TEXT NOT NULL UNIQUE,
  company_type TEXT,
  contact_email TEXT,
  contact_landline TEXT,
  contact_mobile TEXT,
  contact_name TEXT,
  contact_position TEXT,
  created_at TEXT,
  credit_code TEXT NOT NULL UNIQUE,
  emergency_contact TEXT,
  emergency_phone TEXT,
  established_date TEXT,
  historical_projects TEXT,
  industry_filing_info TEXT,
  invoice_info TEXT,
  legal_representative_contact TEXT,
  legal_representative_id_card TEXT,
  legal_representative_name TEXT,
  office_address TEXT,
  organizational_structure TEXT,
  qualification TEXT,
  reg_address TEXT NOT NULL,
  registered_capital REAL,
  remarks TEXT,
  safety_production_license TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  tax_registration_no TEXT,
  updated_at TEXT,
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Create data_exports table
CREATE TABLE IF NOT EXISTS data_exports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  error_message TEXT,
  export_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  created_by INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actual_end_date TEXT,
  client_name TEXT NOT NULL,
  created_at TEXT,
  description TEXT,
  name TEXT NOT NULL,
  planned_end_date TEXT NOT NULL,
  project_no TEXT NOT NULL UNIQUE,
  start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  total_budget REAL NOT NULL,
  updated_at TEXT,
  company_id INTEGER,
  created_by INTEGER NOT NULL,
  manager_id INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies (id),
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (manager_id) REFERENCES users (id),
  FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles (id),
  FOREIGN KEY (permission_id) REFERENCES permissions (id)
);

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_message TEXT,
  execution_time INTEGER,
  ip_address TEXT,
  module TEXT NOT NULL,
  operation TEXT NOT NULL,
  operation_time TEXT NOT NULL,
  request_method TEXT,
  request_params TEXT,
  request_url TEXT,
  response_data TEXT,
  status INTEGER,
  user_agent TEXT,
  operator_id INTEGER NOT NULL,
  FOREIGN KEY (operator_id) REFERENCES users (id)
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (role_id) REFERENCES roles (id)
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  contract_no TEXT NOT NULL UNIQUE,
  contract_type TEXT NOT NULL,
  created_at TEXT,
  end_date TEXT NOT NULL,
  party_a TEXT NOT NULL,
  party_b TEXT NOT NULL,
  signed_at TEXT NOT NULL,
  start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  updated_at TEXT,
  created_by INTEGER NOT NULL,
  project_id INTEGER,
  updated_by INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Create payment_receipts table
CREATE TABLE IF NOT EXISTS payment_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  created_at TEXT,
  currency TEXT NOT NULL DEFAULT 'CNY',
  description TEXT,
  exchange_rate REAL,
  payment_method TEXT NOT NULL,
  receipt_no TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  transaction_date TEXT NOT NULL,
  type TEXT NOT NULL,
  updated_at TEXT,
  bank_account_id INTEGER,
  contract_id INTEGER,
  created_by INTEGER NOT NULL,
  project_id INTEGER,
  updated_by INTEGER NOT NULL,
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id),
  FOREIGN KEY (contract_id) REFERENCES contracts (id),
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Create project_budgets table
CREATE TABLE IF NOT EXISTS project_budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actual_amount REAL,
  category TEXT NOT NULL,
  created_at TEXT,
  item_name TEXT NOT NULL,
  planned_amount REAL NOT NULL,
  remarks TEXT,
  updated_at TEXT,
  created_by INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Create project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actual_date TEXT,
  created_at TEXT,
  description TEXT,
  planned_date TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  updated_at TEXT,
  created_by INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Create project_progress table
CREATE TABLE IF NOT EXISTS project_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actual_end_date TEXT,
  actual_start_date TEXT,
  completion_percentage REAL,
  created_at TEXT,
  description TEXT,
  phase_name TEXT NOT NULL,
  planned_end_date TEXT NOT NULL,
  planned_start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  updated_at TEXT,
  created_by INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Create contract_approvals table
CREATE TABLE IF NOT EXISTS contract_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  approval_level INTEGER NOT NULL,
  approved_at TEXT,
  comments TEXT,
  created_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approver_id INTEGER NOT NULL,
  contract_id INTEGER NOT NULL,
  FOREIGN KEY (approver_id) REFERENCES users (id),
  FOREIGN KEY (contract_id) REFERENCES contracts (id)
);

-- Create contract_documents table
CREATE TABLE IF NOT EXISTS contract_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TEXT,
  contract_id INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL,
  FOREIGN KEY (contract_id) REFERENCES contracts (id),
  FOREIGN KEY (uploaded_by) REFERENCES users (id)
);

-- Create contract_items table
CREATE TABLE IF NOT EXISTS contract_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT,
  delivery_date TEXT,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  remarks TEXT,
  specification TEXT,
  total_amount REAL NOT NULL,
  unit_price REAL NOT NULL,
  contract_id INTEGER NOT NULL,
  FOREIGN KEY (contract_id) REFERENCES contracts (id)
);

-- Create fund_transactions table
CREATE TABLE IF NOT EXISTS fund_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  balance REAL NOT NULL,
  category TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  created_at TEXT NOT NULL,
  description TEXT,
  transaction_date TEXT NOT NULL,
  transaction_no TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  bank_account_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  receipt_id INTEGER,
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id),
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (receipt_id) REFERENCES payment_receipts (id)
);

-- Create payment_plans table
CREATE TABLE IF NOT EXISTS payment_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  created_at TEXT,
  currency TEXT NOT NULL DEFAULT 'CNY',
  description TEXT,
  payment_method TEXT NOT NULL,
  plan_no TEXT NOT NULL UNIQUE,
  planned_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  updated_at TEXT,
  contract_id INTEGER,
  created_by INTEGER NOT NULL,
  project_id INTEGER,
  receipt_id INTEGER,
  updated_by INTEGER NOT NULL,
  FOREIGN KEY (contract_id) REFERENCES contracts (id),
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (receipt_id) REFERENCES payment_receipts (id),
  FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- Create payment_plan_approvals table
CREATE TABLE IF NOT EXISTS payment_plan_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  approval_level INTEGER NOT NULL,
  approved_at TEXT,
  comments TEXT,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approver_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  FOREIGN KEY (approver_id) REFERENCES users (id),
  FOREIGN KEY (plan_id) REFERENCES payment_plans (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_projects_project_no ON projects(project_no);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_no ON contracts(contract_no);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_receipt_no ON payment_receipts(receipt_no);
CREATE INDEX IF NOT EXISTS idx_companies_credit_code ON companies(credit_code);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_account_no ON bank_accounts(account_no);
CREATE INDEX IF NOT EXISTS idx_payment_plans_plan_no ON payment_plans(plan_no);
