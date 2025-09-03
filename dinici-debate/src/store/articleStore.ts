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

// 初始文章为空数组，将从数据库加载
const INITIAL_ARTICLES: Article[] = [];

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