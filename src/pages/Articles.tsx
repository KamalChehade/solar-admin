import React, { useState } from 'react';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, TextArea, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';
import translate from '../api/translate';
import useArticles from '../hooks/useArticles';
import useCategories from '../hooks/useCategories';
import type { Article as ArticleType } from '../types/article';

export const Articles: React.FC = () => {
  const { articles, fetch, create, update, remove } = useArticles();
  const { categories } = useCategories();
  const { showToast } = useToast();
  const { t, lang } = useLocale();
  const primaryLang = (lang as 'en' | 'ar') || 'en';
  const secondaryLang = primaryLang === 'en' ? 'ar' : 'en';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleType | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<ArticleType | null>(null);
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // primary language form
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [publishedDate, setPublishedDate] = useState('');
  const [readingTime, setReadingTime] = useState<number | ''>('');

  // secondary language form (auto-populated)
  const [sTitle, setSTitle] = useState('');
  const [sExcerpt, setSExcerpt] = useState('');
  const [sContent, setSContent] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
    setEditingArticle(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setAuthor('');
    setCategoryId('');
    setPublishedDate('');
    setReadingTime('');
    setIsModalOpen(true);
  };

  const openEditModal = (article: ArticleType) => {
    setEditingArticle(article);
    const tr = (article.translations || []).find((t) => t.lang === primaryLang) || (article.translations || [])[0];
    setTitle(tr?.title || '');
    setExcerpt(tr?.excerpt || '');
    setContent(tr?.content || '');
    setAuthor(article.author || '');
    setCategoryId(article.categoryId || '');
    setPublishedDate(article.published_date ? article.published_date.split('T')[0] : '');
    setReadingTime(article.reading_time || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const translations = [{ lang: primaryLang, title, excerpt, content }];
      const payload: any = { translations, author, categoryId, published_date: publishedDate || null, reading_time: readingTime || null };

      if (editingArticle) {
        const existingSecondary = (editingArticle.translations || []).find((tr) => tr.lang !== primaryLang);
        if (existingSecondary) translations.push({ lang: existingSecondary.lang, title: existingSecondary.title, excerpt: existingSecondary.excerpt, content: existingSecondary.content });
        await update(Number(editingArticle.id), payload);
        showToast(t('article_updated') || 'Article updated', 'success');

        setIsModalOpen(false);
        setIsTransModalOpen(true);
        setSTitle(existingSecondary?.title || '');
        setSExcerpt(existingSecondary?.excerpt || '');
        setSContent(existingSecondary?.content || '');

        (async () => {
          setIsTranslating(true);
          try {
            const t1 = await translate(title, primaryLang, secondaryLang);
            const t2 = await translate(excerpt, primaryLang, secondaryLang);
            const t3 = await translate(content, primaryLang, secondaryLang);
            if (t1) setSTitle(t1);
            if (t2) setSExcerpt(t2);
            if (t3) setSContent(t3);
            await update(Number(editingArticle.id), { translations: [{ lang: primaryLang, title, excerpt, content }, { lang: secondaryLang, title: t1 || existingSecondary?.title, excerpt: t2 || existingSecondary?.excerpt, content: t3 || existingSecondary?.content }] });
            showToast(t('translation_saved') || 'Translation saved', 'success');
          } catch (err) {
            console.warn('Auto-translate failed', err);
          } finally {
            setIsTranslating(false);
          }
        })();
      } else {
        const created = await create(payload);
        showToast(t('article_created') || 'Article created', 'success');
        if (created && (created as any).id) {
          setEditingArticle(created as any);
          setIsModalOpen(false);
          setIsTransModalOpen(true);
          setSTitle('');
          setSExcerpt('');
          setSContent('');

          (async () => {
            setIsTranslating(true);
            try {
              const t1 = await translate(title, primaryLang, secondaryLang);
              const t2 = await translate(excerpt, primaryLang, secondaryLang);
              const t3 = await translate(content, primaryLang, secondaryLang);
              if (t1) setSTitle(t1);
              if (t2) setSExcerpt(t2);
              if (t3) setSContent(t3);
              await update(Number((created as any).id), { translations: [{ lang: primaryLang, title, excerpt, content }, { lang: secondaryLang, title: t1, excerpt: t2, content: t3 }] });
              showToast(t('translation_saved') || 'Translation saved', 'success');
            } catch (err) {
              console.warn('Auto-translate after create failed', err);
            } finally {
              setIsTranslating(false);
            }
          })();
        }
      }

      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
      showToast(t('error_saving_article') || 'Error saving article', 'error');
    }
  };

  const confirmSave = async () => {
    setIsSaving(true);
    try {
      if (!editingArticle) {
        const translations = [{ lang: primaryLang, title, excerpt, content }];
        if (sTitle || sExcerpt || sContent) translations.push({ lang: secondaryLang, title: sTitle, excerpt: sExcerpt, content: sContent });
        await create({ translations, author, categoryId, published_date: publishedDate || null, reading_time: readingTime || null });
      } else {
        const payload = { translations: [{ lang: primaryLang, title, excerpt, content }, { lang: secondaryLang, title: sTitle, excerpt: sExcerpt, content: sContent }] };
        await update(Number(editingArticle.id), payload);
      }

      setIsTransModalOpen(false);
      setEditingArticle(null);
      setTitle('');
      setExcerpt('');
      setContent('');
      setSTitle('');
      setSExcerpt('');
      setSContent('');
      await fetch();
      showToast(t('saved') || 'Saved', 'success');
    } catch (err) {
      showToast(t('error_saving') || 'Error saving', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingArticle) return;
    try {
      await remove(Number(deletingArticle.id));
      showToast(t('article_deleted') || 'Article deleted', 'success');
      setIsDeleteModalOpen(false);
      setDeletingArticle(null);
    } catch (err) {
      showToast(t('error_deleting') || 'Error deleting', 'error');
    }
  };

  const columns = [
    {
      key: 'title',
      label: t('title'),
      render: (a: ArticleType) => (a.translations?.find((tr) => tr.lang === lang)?.title || a.translations?.[0]?.title || '-'),
    },
    { key: 'author', label: t('author'), render: (a: ArticleType) => a.author || '-' },
    { key: 'category', label: t('category'), render: (a: ArticleType) => String(a.categoryId || '-') },
    { key: 'published', label: t('published'), render: (a: ArticleType) => (a.published_date ? new Date(a.published_date).toLocaleDateString() : '-') },
    {
      key: 'actions',
      label: t('actions'),
      render: (a: ArticleType) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEditModal(a); }} className="p-2 text-[#0077B6] hover:bg-[#0077B6]/10 rounded-lg transition-colors"><Edit size={18} /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeletingArticle(a); setIsDeleteModalOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#00A86B]/10 rounded-lg"><FileText className="text-[#00A86B]" size={28} /></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('articles')}</h1>
            <p className="text-gray-600">{t('manage_your_content')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openCreateModal} className="gap-2"><Plus size={20} />{t('add_article')}</Button>
        </div>
      </div>

      <Table columns={columns} data={articles} keyExtractor={(a) => String((a as any).id)} searchPlaceholder={t('search_articles') || 'Search articles...'} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingArticle ? (t('edit_article') || 'Edit Article') : (t('add_article') || 'Add Article')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('title') || 'Title'} value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label={t('author') || 'Author'} value={author} onChange={(e) => setAuthor(e.target.value)} />
          <Select label={t('category') || 'Category'} value={String(categoryId)} onChange={(e) => setCategoryId(Number(e.target.value))} options={categories.map((c) => ({ value: String((c as any).id), label: c.translations?.find((tr: any) => tr.lang === lang)?.name || c.translations?.[0]?.name || 'Category' }))} />
          <Input label={t('published') || 'Published'} type="date" value={publishedDate} onChange={(e) => setPublishedDate(e.target.value)} />
          <Input label={t('reading_time') || 'Reading time (mins)'} type="number" value={String(readingTime)} onChange={(e) => setReadingTime(Number(e.target.value))} />
          <TextArea label={t('excerpt') || 'Excerpt'} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          <TextArea label={t('content') || 'Content'} value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('cancel') || 'Cancel'}</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? (t('saving') || 'Saving...') : (editingArticle ? (t('update') || 'Update') : (t('create') || 'Create'))}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTransModalOpen} onClose={() => { setIsTransModalOpen(false); setIsModalOpen(true); }} title={(t('confirm_translation') || 'Confirm') + ' ' + (secondaryLang === 'ar' ? (t('arabic') || 'Arabic') : (t('english') || 'English')) + ' ' + (t('translation') || 'Translation')}>
        <div className="space-y-4">
          <p className="text-gray-600">{(t('auto_translated_name') || 'Auto-translated {lang} name. Please confirm or edit before saving.').replace('{lang}', secondaryLang === 'ar' ? (t('arabic') || 'Arabic') : (t('english') || 'English'))}</p>
          <Input label={secondaryLang === 'ar' ? (t('arabic_title') || 'Arabic Title') : (t('english_title') || 'English Title')} value={sTitle} onChange={(e) => setSTitle(e.target.value)} disabled={isTranslating} />
          <TextArea label={secondaryLang === 'ar' ? (t('arabic_excerpt') || 'Arabic Excerpt') : (t('english_excerpt') || 'English Excerpt')} value={sExcerpt} onChange={(e) => setSExcerpt(e.target.value)} disabled={isTranslating} />
          <TextArea label={secondaryLang === 'ar' ? (t('arabic_content') || 'Arabic Content') : (t('english_content') || 'English Content')} value={sContent} onChange={(e) => setSContent(e.target.value)} disabled={isTranslating} />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => { setIsTransModalOpen(false); setIsModalOpen(true); }}>{t('back') || 'Back'}</Button>
            <Button onClick={confirmSave} disabled={isSaving || isTranslating || !(sTitle.trim() || sExcerpt.trim() || sContent.trim())}>{isSaving ? (t('saving') || 'Saving...') : (isTranslating ? (t('translating') || 'Translating...') : (t('save') || 'Save'))}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('delete') || 'Delete'} size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">{t('are_you_sure_delete') || 'Are you sure you want to delete'} <strong>{deletingArticle?.translations?.find((tr) => tr.lang === lang)?.title || deletingArticle?.translations?.[0]?.title || '-'}</strong>?</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>{t('cancel') || 'Cancel'}</Button>
            <Button variant="danger" onClick={handleDelete}>{t('delete') || 'Delete'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Articles;