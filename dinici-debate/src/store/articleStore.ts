import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  is_published: boolean;
  author_id: string;
  updated_at?: string;
}

// 初始静态文章
const INITIAL_ARTICLES: Article[] = [
  {
    id: '1',
    title: '如何使用AI辩论平台',
    content: '# 如何使用AI辩论平台\n\n这是一个示例教程文章，介绍了如何使用我们的AI辩论平台。\n\n## 主要功能\n\n1. 创建辩论\n2. 参与辩论\n3. 观看辩论结果',
    category: 'tutorial',
    tags: ['教程', '入门'],
    created_at: '2025-01-01T12:00:00Z',
    is_published: true,
    author_id: 'admin'
  },
  {
    id: '2',
    title: '平台使用常见问题',
    content: '# 平台使用常见问题\n\n## 问题1：如何注册账号？\n\n答：点击右上角的登录按钮，选择注册选项。\n\n## 问题2：如何创建辩论？\n\n答：在首页点击"开始辩论"按钮。',
    category: 'faq',
    tags: ['FAQ', '帮助'],
    created_at: '2025-01-02T12:00:00Z',
    is_published: true,
    author_id: 'admin'
  }
];

interface ArticleStore {
  articles: Article[];
  addArticle: (article: Article) => void;
  updateArticle: (id: string, article: Partial<Article>) => void;
  deleteArticle: (id: string) => void;
  getArticleById: (id: string) => Article | undefined;
}

// 创建持久化的文章存储
export const useArticleStore = create<ArticleStore>()(
  persist(
    (set, get) => ({
      articles: INITIAL_ARTICLES,
      
      addArticle: (article) => {
        set((state) => ({
          articles: [article, ...state.articles]
        }));
      },
      
      updateArticle: (id, updatedArticle) => {
        set((state) => ({
          articles: state.articles.map((article) =>
            article.id === id ? { ...article, ...updatedArticle } : article
          )
        }));
      },
      
      deleteArticle: (id) => {
        set((state) => ({
          articles: state.articles.filter((article) => article.id !== id)
        }));
      },
      
      getArticleById: (id) => {
        return get().articles.find((article) => article.id === id);
      }
    }),
    {
      name: 'article-storage', // 本地存储的键名
    }
  )
);