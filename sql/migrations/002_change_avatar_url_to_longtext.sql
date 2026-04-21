-- 修改 avatar_url 列为 LONGTEXT 以支持 Base64 编码的大图片
ALTER TABLE users MODIFY avatar_url LONGTEXT DEFAULT NULL COMMENT '头像URL（Base64编码）';
