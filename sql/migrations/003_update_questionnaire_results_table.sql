-- 添加问卷结果表的新字段
ALTER TABLE questionnaire_results 
ADD COLUMN IF NOT EXISTS questionnaire_name VARCHAR(100) COMMENT '问卷名称';

ALTER TABLE questionnaire_results 
ADD COLUMN IF NOT EXISTS questionnaire_type VARCHAR(50) COMMENT '问卷类型';

ALTER TABLE questionnaire_results 
ADD COLUMN IF NOT EXISTS depression_level VARCHAR(50) COMMENT '严重程度等级';

ALTER TABLE questionnaire_results 
ADD COLUMN IF NOT EXISTS level_description TEXT COMMENT '等级描述';

-- 如果旧的 type 列存在，复制数据到新的 questionnaire_type 列
UPDATE questionnaire_results SET questionnaire_type = type WHERE questionnaire_type IS NULL;
