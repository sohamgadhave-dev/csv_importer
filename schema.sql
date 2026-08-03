-- schema.sql
-- Run this file in your MySQL database to create the necessary tables

CREATE DATABASE IF NOT EXISTS csv_importer;
USE csv_importer;

-- Imports table
CREATE TABLE IF NOT EXISTS imports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_filename VARCHAR(255) NOT NULL,
  browser_id VARCHAR(255) NOT NULL,
  total_imported INT NOT NULL DEFAULT 0,
  total_skipped INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRM Records table
CREATE TABLE IF NOT EXISTS crm_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  import_id INT NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(100),
  company VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  crm_status VARCHAR(100) DEFAULT 'New',
  data_source VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE
);

-- Skipped Records table
CREATE TABLE IF NOT EXISTS skipped_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  import_id INT NOT NULL,
  `row_number` INT,
  reason TEXT NOT NULL,
  raw_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX idx_crm_records_email ON crm_records(email);
CREATE INDEX idx_crm_records_phone ON crm_records(phone);
CREATE INDEX idx_crm_records_company ON crm_records(company);
CREATE INDEX idx_crm_records_import_id ON crm_records(import_id);
CREATE INDEX idx_skipped_records_import_id ON skipped_records(import_id);
CREATE INDEX idx_imports_browser_id ON imports(browser_id);
