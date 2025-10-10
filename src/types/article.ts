
export type ArticleTranslation = {
  id: number;
  articleId: number;
  lang: 'en' | 'ar';
  title: string;
  excerpt: string;
  content: string;
  author?: string | null;  
};

export type Article = {
  id: number;
  cover_image?: string | null;
  video_url?: string | null;
  categoryId: number;
  published_date?: string | null;
  reading_time?: number | null;
  created_by_id?: number | null;
  createdAt?: string;
  updatedAt?: string;
  translations?: ArticleTranslation[];
};

export type ArticleListResult = {
  rows: Article[];
  count: number;
};