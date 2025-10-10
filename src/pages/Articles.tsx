import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, TextArea, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';
import { useAuth } from '../contexts/AuthContext';
import translate from '../api/translate';
import useArticles from '../hooks/useArticles';
import useCategories from '../hooks/useCategories';
import type { Article as ArticleType } from '../types/article';

const toIsoIfDate = (d?: string) => {
  if (!d) return null;
  if (d.length === 10) return new Date(d).toISOString();
  return d;
};

export const Articles: React.FC = () => {
  const { articles, fetch, create, update, remove } = useArticles();
  const { categories } = useCategories();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t, lang } = useLocale();
  const primaryLang = (lang as 'en' | 'ar') || 'en';
  const secondaryLang = primaryLang === 'en' ? 'ar' : 'en';

  // convert user id to numeric id
  const currentUserId: number | null = (() => {
    try {
      if (user?.id == null) return null;
      const n = Number((user as any).id);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  })();
  const IMG_URL = import.meta.env.VITE_IMAGE_URL || '';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleType | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<ArticleType | null>(null);
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // primary translation fields
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  // article meta
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [publishedDate, setPublishedDate] = useState('');
  const [readingTime, setReadingTime] = useState<number | ''>('');

  // secondary translation fields
  const [sTitle, setSTitle] = useState('');
  const [sExcerpt, setSExcerpt] = useState('');
  const [sContent, setSContent] = useState('');
  const [sAuthor, setSAuthor] = useState('');

  const openCreateModal = () => {
    setEditingArticle(null);
    setTitle('');
    setExcerpt('');
    setContent('');
    setAuthor('');
    setVideoUrl('');
    setSTitle('');
    setSExcerpt('');
    setSContent('');
    setSAuthor('');
    setCategoryId('');
    setPublishedDate('');
    setReadingTime('');
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setIsModalOpen(true);
  };

  // cleanup blob object URLs when modal closes or component unmounts
  useEffect(() => {
    return () => {
      if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(coverImagePreview);
        } catch {}
      }
    };
  }, [coverImagePreview]);

  useEffect(() => {
    if (!isModalOpen) {
      // if we had a temporary blob preview, revoke it and clear the file
      if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(coverImagePreview);
        } catch {}
        setCoverImagePreview(null);
        setCoverImageFile(null);
      }
    }
  }, [isModalOpen]);

  const openEditModal = (article: ArticleType) => {
    setEditingArticle(article);
    const trPrimary = (article.translations || []).find((t) => t.lang === primaryLang) || (article.translations || [])[0];
    const trSecondary = (article.translations || []).find((t) => t.lang === secondaryLang);

    setTitle(trPrimary?.title || '');
    setExcerpt(trPrimary?.excerpt || '');
    setContent(trPrimary?.content || '');
    setAuthor(trPrimary?.author || '');
    setSTitle(trSecondary?.title || '');
    setSExcerpt(trSecondary?.excerpt || '');
    setSContent(trSecondary?.content || '');
    setSAuthor(trSecondary?.author || '');
    setCategoryId(article.categoryId || '');
    setPublishedDate(article.published_date ? article.published_date.split('T')[0] : '');
    setReadingTime(article.reading_time || '');
    const v =
      (article as any).video_url ??
      (article as any).videoUrl ??
      '';
    setVideoUrl(v);
    // set preview from existing cover_image (absolute or relative)
    if ((article as any).cover_image) {
      const path = (article as any).cover_image as string;
      if (/^https?:\/\//i.test(path)) {
        setCoverImagePreview(path);
      } else {
        const base = (IMG_URL || '').replace(/\/+$/, '');
        const key = path.replace(/^\/+/, '');
        setCoverImagePreview(base ? `${base}/${key}` : `/${key}`);
      }
    } else {
      setCoverImagePreview(null);
    }
    setCoverImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cleanTitle = title.trim();
      const cleanExcerpt = excerpt.trim();
      const cleanContent = content.trim();
      const cleanAuthor = author.trim();

      const translations = [
        { lang: primaryLang, title: cleanTitle, excerpt: cleanExcerpt, content: cleanContent, author: cleanAuthor },
      ];

      const payload: any = {
        translations,
        categoryId: categoryId ? Number(categoryId) : null,
        published_date: toIsoIfDate(publishedDate),
        reading_time: readingTime !== '' && readingTime != null ? Number(readingTime) : null,
        created_by_id: currentUserId,
        video_url: videoUrl?.trim() || null,
      };

      if (!editingArticle && !payload.categoryId) {
        showToast(t('category_required') || 'Category is required', 'error');
        setIsSaving(false);
        return;
      }

      if (editingArticle) {
        // update with existing secondary translation
        const existingSecondary = (editingArticle.translations || []).find((tr) => tr.lang === secondaryLang);
        if (existingSecondary) {
          translations.push({
            lang: secondaryLang,
            title: existingSecondary.title,
            excerpt: existingSecondary.excerpt,
            content: existingSecondary.content,
            author: existingSecondary.author || '',
          });
        }
        // if a file is attached, send multipart/form-data
        if (coverImageFile) {
          const fd = new FormData();
          // append JSON fields
          fd.append('video_url', payload.video_url || '');
          fd.append('categoryId', String(payload.categoryId || ''));
          if (payload.published_date) fd.append('published_date', payload.published_date);
          if (payload.reading_time != null) fd.append('reading_time', String(payload.reading_time));
          fd.append('created_by_id', String(payload.created_by_id || ''));
          // translations as JSON string
          fd.append('translations', JSON.stringify(translations));
          fd.append('cover_image', coverImageFile as File);
          await update(Number(editingArticle.id), fd);
        } else {
          await update(Number(editingArticle.id), payload);
        }
        showToast(t('article_updated') || 'Article updated', 'success');
        setIsModalOpen(false);
        setIsTransModalOpen(true);

        // try to auto-translate primary -> secondary and persist the translation
        (async () => {
          setIsTranslating(true);
          try {
            const t1 = await translate(cleanTitle, primaryLang, secondaryLang);
            const t2 = await translate(cleanExcerpt, primaryLang, secondaryLang);
            const t3 = await translate(cleanContent, primaryLang, secondaryLang);
            const t4 = await translate(cleanAuthor, primaryLang, secondaryLang);
            if (t1) setSTitle(t1);
            if (t2) setSExcerpt(t2);
            if (t3) setSContent(t3);
            if (t4) setSAuthor(t4);
            // merge with any existing secondary values
            await update(Number(editingArticle.id), {
              translations: [
                { lang: primaryLang, title: cleanTitle, excerpt: cleanExcerpt, content: cleanContent, author: cleanAuthor },
                { lang: secondaryLang, title: t1 || existingSecondary?.title, excerpt: t2 || existingSecondary?.excerpt, content: t3 || existingSecondary?.content, author: t4 || existingSecondary?.author || '' },
              ],
            });
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
        if (created?.id) {
          setEditingArticle(created);
          setIsModalOpen(false);
          setIsTransModalOpen(true);
          // auto-translate primary -> secondary and persist translations
          (async () => {
            setIsTranslating(true);
            try {
              const t1 = await translate(cleanTitle, primaryLang, secondaryLang);
              const t2 = await translate(cleanExcerpt, primaryLang, secondaryLang);
              const t3 = await translate(cleanContent, primaryLang, secondaryLang);
              const t4 = await translate(cleanAuthor, primaryLang, secondaryLang);
              if (t1) setSTitle(t1);
              if (t2) setSExcerpt(t2);
              if (t3) setSContent(t3);
              if (t4) setSAuthor(t4);
              // save both translations so backend has the secondary immediately
              // build payload for update; include file if provided
              const updatePayload: any = {
                translations: [
                  { lang: primaryLang, title: cleanTitle, excerpt: cleanExcerpt, content: cleanContent, author: cleanAuthor },
                  { lang: secondaryLang, title: t1 || '', excerpt: t2 || '', content: t3 || '', author: t4 || '' },
                ],
                video_url: videoUrl?.trim() || null,
                created_by_id: currentUserId,
              };
              if (coverImageFile) {
                const fd = new FormData();
                fd.append('translations', JSON.stringify(updatePayload.translations));
                if (updatePayload.video_url) fd.append('video_url', updatePayload.video_url);
                fd.append('created_by_id', String(updatePayload.created_by_id || ''));
                fd.append('cover_image', coverImageFile as File);
                await update(Number((created as any).id), fd);
              } else {
                await update(Number((created as any).id), updatePayload);
              }
              showToast(t('translation_saved') || 'Translation saved', 'success');
            } catch (err) {
              console.warn('Auto-translate after create failed', err);
            } finally {
              setIsTranslating(false);
            }
          })();
        }
      }
    } catch (err) {
      console.error(err);
      showToast(t('error_saving_article') || 'Error saving article', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmSave = async () => {
    setIsSaving(true);
    try {
      const trans = [
        { lang: primaryLang, title: title.trim(), excerpt: excerpt.trim(), content: content.trim(), author: author.trim() },
      ];
      if (sTitle || sExcerpt || sContent || sAuthor) {
        trans.push({
          lang: secondaryLang,
          title: sTitle.trim(),
          excerpt: sExcerpt.trim(),
          content: sContent.trim(),
          author: sAuthor.trim(),
        });
      }

      if (!categoryId) {
        showToast(t('category_required') || 'Category is required', 'error');
        setIsSaving(false);
        return;
      }

      if (editingArticle) {
        await update(Number(editingArticle.id), { translations: trans });
      } else {
        await create({
          translations: trans,
          video_url: videoUrl?.trim() || null,
          categoryId: Number(categoryId),
          published_date: toIsoIfDate(publishedDate),
          reading_time: readingTime !== '' && readingTime != null ? Number(readingTime) : null,
          created_by_id: currentUserId,
        });
      }

      setIsTransModalOpen(false);
      setEditingArticle(null);
      await fetch();
      showToast(t('saved') || 'Saved', 'success');
    } catch (err) {
      console.error(err);
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
    } catch {
      showToast(t('error_deleting') || 'Error deleting', 'error');
    }
  };
  const buildImageUrl = (path?: string) => {
    if (!path) return '';
    // absolute URL? use as-is
    if (/^https?:\/\//i.test(path)) return path;
    // join with IMG_URL from env
    const base = (IMG_URL || '').replace(/\/+$/, '');
    const key = path.replace(/^\/+/, '');
    return base ? `${base}/${key}` : `/${key}`;
  };
  // Columns
  const columns = [
    {
      key: 'image',
      label: t('image'),
      render: (a: ArticleType) =>
        a.cover_image ? (
          <img
            src={buildImageUrl(a.cover_image)}
            alt={
              a.translations?.find((tr) => tr.lang === lang)?.title ||
              a.translations?.[0]?.title ||
              'cover'
            }
            className="h-20 w-20 rounded-lg object-cover border"
            // hide the broken image icon and show a dash if the URL fails
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              (e.currentTarget.parentElement as HTMLElement).innerText = '-';
            }}
          />
        ) : (
          '-'
        ),
    },
    {
      key: 'yt_video',
      label: t('yt video'),
      render: (a: ArticleType) => {
        if (!a.video_url) return '-';

        // Convert normal YouTube URL to embed URL
        const match = a.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
        const videoId = match ? match[1] : null;

        if (!videoId) return '-';

        return (
          <iframe
            width="150"
            height="100"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        );
      },
    },

    {
      key: 'title',
      label: t('title'),
      render: (a: ArticleType) =>
        a.translations?.find((tr) => tr.lang === lang)?.title || a.translations?.[0]?.title || '-',
    },
    {
      key: 'author',
      label: t('author'),
      render: (a: ArticleType) =>
        a.translations?.find((tr) => tr.lang === lang)?.author || a.translations?.[0]?.author || '-',
    },
    {
      key: 'category',
      label: t('category'),
      render: (a: ArticleType) => String(a.categoryId || '-'),
    },
    {
      key: 'published',
      label: t('published'),
      render: (a: ArticleType) =>
        a.published_date ? new Date(a.published_date).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      label: t('actions'),
      render: (a: ArticleType) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(a);
            }}
            className="p-2 text-[#0077B6] hover:bg-[#0077B6]/10 rounded-lg transition-colors"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingArticle(a);
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
          <div className="p-3 bg-[#00A86B]/10 rounded-lg">
            <FileText className="text-[#00A86B]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('articles')}</h1>
            <p className="text-gray-600">{t('manage_your_content')}</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus size={20} /> {t('add_article')}
        </Button>
      </div>

      <Table
        columns={columns}
        data={articles}
        keyExtractor={(a) => String(a.id)}
        searchPlaceholder={t('search_articles') || 'Search articles...'}
      />

      {/* Main Article Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingArticle ? t('edit_article') || 'Edit Article' : t('add_article') || 'Add Article'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('title') || 'Title'} value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label={t('author') || 'Author'} value={author} onChange={(e) => setAuthor(e.target.value)} />
          <Input label={t('video_url') || 'Video URL'} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('cover_image') || 'Cover image'}</label>

            <div className="flex items-center gap-3">
              {coverImagePreview ? (
                <img
                  src={coverImagePreview}
                  alt={t('cover_image') || 'cover'}
                  className="h-24 w-24 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg border border-dashed flex items-center justify-center text-gray-400">
                  {t('no_image') || 'No image'}
                </div>
              )}

              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md cursor-pointer text-sm text-gray-700 hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      // revoke previous blob URL if any
                      if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
                        URL.revokeObjectURL(coverImagePreview);
                      }
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setCoverImageFile(file);
                        setCoverImagePreview(url);
                      } else {
                        setCoverImageFile(null);
                        // keep existing preview if any
                      }
                    }}
                  />
                  <span className="text-sm text-[#0077B6]">{t('choose_file') || 'Choose file'}</span>
                </label>
                <p className="text-xs text-gray-500 mt-2">{t('cover_image_help') || 'Upload an image for the article cover.'}</p>
              </div>
            </div>
          </div>
          <Select
            label={t('category') || 'Category'}
            value={String(categoryId)}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            options={categories.map((c) => ({
              value: String((c as any).id),
              label:
                c.translations?.find((tr: any) => tr.lang === lang)?.name ||
                c.translations?.[0]?.name ||
                'Category',
            }))}
          />
          <Input
            label={t('published') || 'Published'}
            type="date"
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
          />
          <Input
            label={t('reading_time') || 'Reading time (mins)'}
            type="number"
            value={String(readingTime)}
            onChange={(e) => setReadingTime(Number(e.target.value))}
          />
          <TextArea label={t('excerpt') || 'Excerpt'} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          <TextArea label={t('content') || 'Content'} value={content} onChange={(e) => setContent(e.target.value)} />

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              {'إلغاء'}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (t('saving') || 'Saving...') : editingArticle ? 'تحديث' : 'إنشاء'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Secondary Translation Modal */}
      <Modal
        isOpen={isTransModalOpen}
        onClose={() => {
          setIsTransModalOpen(false);
          setIsModalOpen(true);
        }}
        title={`${t('confirm_translation') || 'Confirm'} ${secondaryLang === 'ar' ? t('arabic') || 'Arabic' : t('english') || 'English'
          } ${t('translation') || 'Translation'}`}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {(t('auto_translated_name') ||
              'Auto-translated {lang} name. Please confirm or edit before saving.').replace(
                '{lang}',
                secondaryLang === 'ar' ? t('arabic') || 'Arabic' : t('english') || 'English'
              )}
          </p>

          <Input
            label={secondaryLang === 'ar' ? t('arabic_title') || 'Arabic Title' : t('english_title') || 'English Title'}
            value={sTitle}
            onChange={(e) => setSTitle(e.target.value)}
            disabled={isTranslating}
          />
          <Input
            label={t('author') || 'Author'}
            value={sAuthor}
            onChange={(e) => setSAuthor(e.target.value)}
            disabled={isTranslating}
          />
          <TextArea
            label={secondaryLang === 'ar' ? t('arabic_excerpt') || 'Arabic Excerpt' : t('english_excerpt') || 'English Excerpt'}
            value={sExcerpt}
            onChange={(e) => setSExcerpt(e.target.value)}
            disabled={isTranslating}
          />
          <TextArea
            label={secondaryLang === 'ar' ? t('arabic_content') || 'Arabic Content' : t('english_content') || 'English Content'}
            value={sContent}
            onChange={(e) => setSContent(e.target.value)}
            disabled={isTranslating}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => { setIsTransModalOpen(false); setIsModalOpen(true); }}>
              {t('back') || 'Back'}
            </Button>
            <Button
              onClick={confirmSave}
              disabled={isSaving || isTranslating || !(sTitle.trim() || sExcerpt.trim() || sContent.trim())}
            >
              {isSaving
                ? t('saving') || 'Saving...'
                : isTranslating
                  ? t('translating') || 'Translating...'
                  : t('save') || 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('delete') || 'Delete'} size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('are_you_sure_delete') || 'Are you sure you want to delete'}{' '}
            <strong>
              {deletingArticle?.translations?.find((tr) => tr.lang === lang)?.title ||
                deletingArticle?.translations?.[0]?.title ||
                '-'}
            </strong>
            ?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t('delete') || 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Articles;
