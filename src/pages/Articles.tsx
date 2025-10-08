import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, TextArea, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  video_url: string;
  author: string;
  category_id: string | null;
  tags: string[];
  published_date: string;
  created_by_user_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

export const Articles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    cover_image: '',
    video_url: '',
    author: '',
    category_id: '',
    tags: '',
    published_date: new Date().toISOString().split('T')[0],
  });
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_date', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      showToast('Error fetching articles', 'error');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id, name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    const articleData = {
      ...formData,
      tags,
      category_id: formData.category_id || null,
      created_by_user_id: user?.id || null,
    };

    try {
      if (editingArticle) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', editingArticle.id);

        if (error) throw error;
        showToast('Article updated successfully', 'success');
      } else {
        const { error } = await supabase.from('articles').insert([articleData]);

        if (error) throw error;
        showToast('Article created successfully', 'success');
      }

      setIsModalOpen(false);
      setEditingArticle(null);
      resetForm();
      fetchArticles();
    } catch (error) {
      showToast('Error saving article', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingArticle) return;

    try {
      const { error } = await supabase.from('articles').delete().eq('id', deletingArticle.id);

      if (error) throw error;
      showToast('Article deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setDeletingArticle(null);
      fetchArticles();
    } catch (error) {
      showToast('Error deleting article', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      cover_image: '',
      video_url: '',
      author: '',
      category_id: '',
      tags: '',
      published_date: new Date().toISOString().split('T')[0],
    });
  };

  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      cover_image: article.cover_image,
      video_url: article.video_url,
      author: article.author,
      category_id: article.category_id || '',
      tags: article.tags.join(', '),
      published_date: article.published_date.split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingArticle(null);
    resetForm();
    setIsModalOpen(true);
  };

  const getCategoryName = (categoryId: string | null) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'category_id',
      label: 'Category',
      render: (article: Article) => (
        <span className="px-2 py-1 bg-[#00A86B]/10 text-[#00A86B] rounded-md text-sm">
          {getCategoryName(article.category_id)}
        </span>
      ),
    },
    { key: 'author', label: 'Author' },
    {
      key: 'published_date',
      label: 'Published',
      render: (article: Article) => new Date(article.published_date).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (article: Article) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(article);
            }}
            className="p-2 text-[#0077B6] hover:bg-[#0077B6]/10 rounded-lg transition-colors"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingArticle(article);
              setIsDeleteModalOpen(true);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#0077B6]/10 rounded-lg">
            <FileText className="text-[#0077B6]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
            <p className="text-gray-600">Manage your content</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus size={20} />
          Add Article
        </Button>
      </div>

      <Table
        columns={columns}
        data={articles}
        keyExtractor={(article) => article.id}
        searchPlaceholder="Search articles..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingArticle ? 'Edit Article' : 'Add Article'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Input
              label="Author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
            />
          </div>

          <TextArea
            label="Excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={3}
          />

          <TextArea
            label="Content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={8}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              options={[
                { value: '', label: 'Select Category' },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
            />
            <Input
              label="Published Date"
              type="date"
              value={formData.published_date}
              onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Tags (comma-separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="solar, energy, technology"
          />

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <ImageIcon size={20} />
              Media
            </h3>
            <Input
              label="Cover Image URL"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
            {formData.cover_image && (
              <img
                src={formData.cover_image}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <Input
              label="Video URL (YouTube)"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingArticle ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Article"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deletingArticle?.title}</strong>? This action cannot
            be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
