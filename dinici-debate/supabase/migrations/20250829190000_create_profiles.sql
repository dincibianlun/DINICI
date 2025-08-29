-- 创建用户profile表
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用RLS并设置权限
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 管理员可以管理所有用户
CREATE POLICY "管理员可管理用户" ON profiles
  FOR ALL USING (auth.role() = 'admin');

-- 用户可以管理自己的资料
CREATE POLICY "用户可管理自己资料" ON profiles
  FOR ALL USING (auth.uid() = id);