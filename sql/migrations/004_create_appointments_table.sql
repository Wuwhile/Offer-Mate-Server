-- 创建预约表
CREATE TABLE IF NOT EXISTS appointments (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  doctor_name VARCHAR(100),
  patient_name VARCHAR(100) NOT NULL,
  patient_age INT,
  patient_gender VARCHAR(20),
  patient_phone VARCHAR(20) NOT NULL,
  consultation_content TEXT,
  urgency VARCHAR(50),
  time_preference VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_doctor_id (doctor_id),
  KEY idx_patient_phone (patient_phone),
  KEY idx_status (status),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
