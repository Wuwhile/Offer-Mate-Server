-- 为预约表添加user_id字段
ALTER TABLE appointments 
ADD COLUMN user_id INT AFTER id,
ADD CONSTRAINT fk_appointments_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 为user_id添加索引
ALTER TABLE appointments 
ADD KEY idx_user_id (user_id);

-- 根据patient_phone填充现有数据的user_id（如果有关联的话）
UPDATE appointments a
LEFT JOIN users u ON a.patient_phone = u.phone
SET a.user_id = u.id
WHERE a.user_id IS NULL AND u.id IS NOT NULL;
