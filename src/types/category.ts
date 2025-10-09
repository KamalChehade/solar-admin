export type CategoryTranslation = {
  id: number;
  categoryId: number;
  lang: 'en' | 'ar';
  name: string;
};

export type Category = {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  translations?: CategoryTranslation[];
};

export type CategoryListResult = {
  rows: Category[];
  count: number;
};

export default Category;
