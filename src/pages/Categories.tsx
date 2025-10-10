import React, { useState } from 'react';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';
import translate from '../api/translate';
import useCategories from '../hooks/useCategories';
import type { Category as CategoryType } from '../types/category';

export const Categories: React.FC = () => {
  const { categories, count, fetch, create, update, remove } = useCategories();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const totalPages = Math.max(1, Math.ceil((count || 0) / perPage));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryType | null>(null);
  const [formName, setFormName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isArModalOpen, setIsArModalOpen] = useState(false);
  const [arName, setArName] = useState('');
  const [isArTranslating, setIsArTranslating] = useState(false);
  // filter categories by current site language
  // removed manual lang selector; derive from locale
  const { showToast } = useToast();
  const { t, lang } = useLocale();
  const primaryLang = lang as 'en' | 'ar';
  const secondaryLang = primaryLang === 'en' ? 'ar' : 'en';

  // Submit English name: create or update immediately (English only).
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
  // create with the current site language as the primary translation
  const translations = [{ lang: primaryLang, name: formName }];

      if (editingCategory) {
        // include existing secondary translation when updating so we don't overwrite it
        const existingSecondary = (editingCategory as any).translations?.find((tr: any) => tr.lang !== primaryLang)?.name;
        const combined = [{ lang: primaryLang, name: formName }];
        if (existingSecondary) combined.push({ lang: primaryLang === 'en' ? 'ar' : 'en', name: existingSecondary });
        // update primary (and keep any existing secondary)
        await update(Number(editingCategory.id), { translations: combined });
  showToast(t('category_updated') || 'Category updated successfully', 'success');
        // instead of closing, open the secondary-language modal (same flow as Add)
        setIsModalOpen(false);
        setIsArModalOpen(true);
        setArName(existingSecondary || '');

        // try to auto-translate and persist the secondary translation
        (async () => {
          setIsArTranslating(true);
          try {
            const translated = await translate(formName, primaryLang, secondaryLang);
            if (translated && typeof translated === 'string' && translated.trim()) {
              setArName(translated);
              try {
                await update(Number(editingCategory.id), { translations: [{ lang: primaryLang, name: formName }, { lang: secondaryLang, name: translated }] });
                showToast(t('translation_saved') || 'Translation saved successfully', 'success');
              } catch (err) {
                console.warn('Error saving translated name after edit', err);
              }
            }
          } catch (err) {
            console.warn('Auto-translate after edit failed', err);
          } finally {
            setIsArTranslating(false);
          }
        })();
      } else {
        // create and then open Arabic modal to allow user to add Arabic translation
        const created = await create({ translations });
  showToast(t('category_created') || 'Category created successfully', 'success');
        // created may be the new category object; set it for updating later
        if (created && created.id) {
          setEditingCategory(created as any);
          // keep formName so confirmSave can include English translation
          setArName('');
          setIsModalOpen(false);
          setIsArModalOpen(true);

          // try to auto-translate immediately and persist the secondary language so it's available
          // in the modal and in the backend without waiting for manual confirm
          (async () => {
            setIsArTranslating(true);
            try {
              const translated = await translate(formName, primaryLang, secondaryLang);
              if (translated && typeof translated === 'string' && translated.trim()) {
                setArName(translated);
                try {
                  // save both primary and secondary to avoid overwriting the primary on the backend
                  await update(Number((created as any).id), { translations: [{ lang: primaryLang, name: formName }, { lang: secondaryLang, name: translated }] });
                  showToast(t('translation_saved') || 'Translation saved successfully', 'success');
                } catch (err) {
                  // non-fatal: keep modal open for manual save
                  console.warn('Error saving translated name after create', err);
                }
              }
            } catch (err) {
              console.warn('Auto-translate after create failed', err);
            } finally {
              setIsArTranslating(false);
            }
          })();
        } else {
          // fallback: just close modal
          setIsModalOpen(false);
          setFormName('');
        }
      }
    } catch (error) {
      showToast('Error saving category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Second step: confirm Arabic translation and persist category
  const confirmSave = async () => {
    setIsSaving(true);
    try {
      // For existing categories (including the one we just created), send only the Arabic
      // translation in the update payload so the backend can add/merge it.
      if (editingCategory) {
        if (arName && arName.trim()) {
          // save both languages to avoid overwriting
          const payload = [{ lang: primaryLang, name: formName } as any, { lang: secondaryLang, name: arName } as any];
          await update(Number(editingCategory.id), { translations: payload });
          showToast(t('translation_saved') || 'Translation saved successfully', 'success');
        } else {
          showToast(t('name_empty') || 'Name is empty', 'error');
        }
      } else {
        // No existing category (edge case): create with both primary and secondary translations
        const translations = [{ lang: primaryLang, name: formName }];
        if (arName && arName.trim()) translations.push({ lang: secondaryLang, name: arName });
        await create({ translations });
  showToast(t('category_created') || 'Category created successfully', 'success');
      }

      setIsArModalOpen(false);
      setEditingCategory(null);
      setFormName('');
      setArName('');
      await fetch();
    } catch (error) {
      showToast(t('error_saving') || 'Error saving category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-translate when Arabic modal opens for a newly-created category
  React.useEffect(() => {
    let mounted = true;
    const doTranslate = async () => {
      if (!isArModalOpen) return;
  // only auto-translate when we have a name to translate
  if (!formName || !formName.trim()) return;

      setIsArTranslating(true);
      try {
  // translate from the primary language to the secondary language
  const res = await translate(formName, primaryLang, secondaryLang);
        if (!mounted) return;
        if (res && typeof res === 'string' && res.trim()) {
          setArName(res);
        } else {
          // no automatic translation returned
          setArName('');
          showToast(t('auto_translation_unavailable') || 'Auto-translation not available. Please enter the name manually.', 'info');
        }
      } catch (err) {
        if (!mounted) return;
        console.warn('translate error', err);
        showToast(t('error_auto_translating') || 'Error auto-translating. Please enter the name manually.', 'error');
        setArName('');
      } finally {
        if (mounted) setIsArTranslating(false);
      }
    };

    doTranslate();
    return () => {
      mounted = false;
    };
  }, [isArModalOpen, formName, showToast]);

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await remove(Number(deletingCategory.id));
  showToast(t('category_deleted') || 'Category deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
      await fetch();
    } catch (error) {
  showToast(t('error_deleting') || 'Error deleting category', 'error');
    }
  };

  const openEditModal = (category: CategoryType) => {
    setEditingCategory(category);
    // prefill with the translation that matches the current site language; fall back to English
    const name = (category as any).translations?.find((tr: any) => tr.lang === lang)?.name
      || (category as any).translations?.find((tr: any) => tr.lang === 'en')?.name
      || '';
    setFormName(name);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setIsModalOpen(true);
  };

  const loadPage = async (p: number, pp: number) => {
    const pageNum = Math.max(1, Math.floor(p));
    setPage(pageNum);
    await fetch(pp, (pageNum - 1) * pp);
  };

  // refresh when perPage changes
  React.useEffect(() => {
    loadPage(page, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  const columns = [
    {
      key: 'name',
      label: t('name'),
      render: (category: CategoryType) => {
        // prefer current site language, fall back to English then dash
        return (
          (category.translations?.find((tr) => tr.lang === lang)?.name as string)
          || (category.translations?.find((tr) => tr.lang === 'en')?.name as string)
          || '-'
        );
      },
    },
    {
      key: 'createdAt',
      label: t('created'),
      render: (category: CategoryType) => (category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '-'),
    },
    {
      key: 'actions',
      label: t('actions'),
      render: (category: CategoryType) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(category);
            }}
            className="p-2 text-[#0077B6] hover:bg-[#0077B6]/10 rounded-lg transition-colors"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingCategory(category);
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
            <FolderOpen className="text-[#00A86B]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('categories')}</h1>
            <p className="text-gray-600">{t('manage_article_categories')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openCreateModal} className="gap-2">
            <Plus size={20} />
            {t('add_category')}
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={categories.filter((c) => c.translations && c.translations.some((tr: any) => tr.lang === lang))}
        keyExtractor={(cat) => String((cat as any).id)}
        searchPlaceholder={t('search_categories') || 'Search categories...'}
      />

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">{t('items_per_page') || 'Items per page'}</label>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="border rounded p-1"
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => loadPage(page - 1, perPage)}
            disabled={page <= 1}
          >
            {t('prev') || 'Prev'}
          </button>
          <div className="text-sm text-gray-700">{t('page') || 'Page'} {page} / {totalPages}</div>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => loadPage(page + 1, perPage)}
            disabled={page >= totalPages}
          >
            {t('next') || 'Next'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
  title={editingCategory ? (t('edit_category') || 'Edit Category') : (t('add_category') || 'Add Category')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('name') || 'Name'}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? (t('saving') || 'Saving...') : (editingCategory ? (t('update') || 'Update') : (t('create') || 'Create'))}</Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation modal for the secondary language */}
      <Modal
        isOpen={isArModalOpen}
        onClose={() => {
          // go back to primary language modal for edits
          setIsArModalOpen(false);
          setIsModalOpen(true);
        }}
        title={
          // e.g. "Confirm Arabic Translation" or localized equivalent
          (t('confirm_translation') || 'Confirm') + ' ' + (secondaryLang === 'ar' ? (t('arabic') || 'Arabic') : (t('english') || 'English')) + ' ' + (t('translation') || 'Translation')
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {(t('auto_translated_name') || 'Auto-translated {lang} name. Please confirm or edit before saving.').replace('{lang}', secondaryLang === 'ar' ? (t('arabic') || 'Arabic') : (t('english') || 'English'))}
          </p>
          {/* While translating, show a disabled input and placeholder */}
          <Input
            label={secondaryLang === 'ar' ? (t('arabic_name') || 'Arabic Name') : (t('english_name') || 'English Name')}
            value={arName}
            onChange={(e) => setArName(e.target.value)}
            disabled={isArTranslating}
            placeholder={isArTranslating ? (t('translating') || 'Translating...') : undefined}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => { setIsArModalOpen(false); setIsModalOpen(true); }}>
              {t('back') || 'Back'}
            </Button>
            <Button onClick={confirmSave} disabled={isSaving || isArTranslating || !arName.trim()}>
              {isSaving ? (t('saving') || 'Saving...') : (isArTranslating ? (t('translating') || 'Translating...') : (t('save') || 'Save'))}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
  title={t('delete') || 'Delete'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('are_you_sure_delete') || 'Are you sure you want to delete'} <strong>{deletingCategory?.translations?.find((tr: any) => tr.lang === lang)?.name || deletingCategory?.translations?.find((tr: any) => tr.lang === 'en')?.name || '-'}</strong>? {t('will_permanently_remove') || 'This will permanently remove the item and all associated data.'}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isSaving}>
              {isSaving ? t('deleting') : t('delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
