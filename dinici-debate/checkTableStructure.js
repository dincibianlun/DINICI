// 检查tutorial_articles表结构的脚本
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置（需要在运行前设置这些环境变量）
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('🔍 检查 tutorial_articles 表结构');
    
    // 查询表结构
    const { data, error } = await supabase
      .from('tutorial_articles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ 查询错误:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ 表结构信息:');
      const keys = Object.keys(data[0]);
      keys.forEach(key => {
        console.log(`  ${key}: ${typeof data[0][key]}`);
      });
    } else {
      console.log('⚠️  表为空或不存在');
    }
  } catch (err) {
    console.error('💥 执行错误:', err);
  }
}

checkTableStructure();