-- Promote first admin account in current schema.
-- This project uses users(role) and id = cognito sub.
-- Replace CHANGE_ME_SUB with the Cognito sub.

UPDATE users
SET role = 'admin'
WHERE id = 'CHANGE_ME_SUB';
