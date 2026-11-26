import React, { useEffect, useState } from 'react';
import { Globe, Eye, UploadCloud, BookOpen, Plus } from 'lucide-react';
import { adminApi, formatDateTime } from '../services/adminApi';
import { PageHeader, Card, Badge, Button, Modal, statusBadgeVariant, useToastStore } from '../components/ui';

export const WebsiteContentPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [tab, setTab] = useState<'CMS' | 'KNOWLEDGE' | 'FAQS'>('CMS');
  const [items, setItems] = useState<any[]>([]);
  const [knowledge, setKnowledge] = useState<{ articles: any[]; faqs: any[] }>({
    articles: [],
    faqs: [],
  });
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [createModal, setCreateModal] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    contentType: 'ANNOUNCEMENT',
    title: '',
    subtitle: '',
    badge: 'NEW',
    ctaLabel: 'Browse Deals',
    ctaUrl: '/deals',
    imageUrl: '',
    startDate: '',
    endDate: '',
    position: 1,
  });

  const [khModal, setKhModal] = useState(false);
  const [editingKhId, setEditingKhId] = useState<string | null>(null);
  const [khForm, setKhForm] = useState({
    title: '',
    category: 'Structural Engineering',
    summary: '',
    content: '',
    imageUrl: '',
  });

  const [faqModal, setFaqModal] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'Delivery & Pricing',
  });

  const loadData = async () => {
    const [cms, kh] = await Promise.all([adminApi.getContent(), adminApi.getKnowledgeHub()]);
    setItems(cms || []);
    setKnowledge(kh || { articles: [], faqs: [] });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublish = async (id: string) => {
    try {
      await adminApi.publishContent(id);
      pushToast({
        title: 'Published to Customer Website',
        message: 'Storefront `/api/v1/content/storefront` now serves this update.',
      });
      loadData();
    } catch (err: any) {
      pushToast({ title: 'Publish Failed', message: err.message, variant: 'error' });
    }
  };

  const handleUnpublish = async (id: string) => {
    await adminApi.unpublishContent(id);
    pushToast({ title: 'Unpublished from Storefront', variant: 'info' });
    loadData();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Website Content & Storefront CMS"
        description="Draft, preview, publish & sync banners, announcements, featured deals, guides & FAQs to Customer Website."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={tab === 'CMS' ? 'primary' : 'outline'} onClick={() => setTab('CMS')}>
              <Globe className="w-4 h-4" /> Storefront Blocks
            </Button>
            <Button size="sm" variant={tab === 'KNOWLEDGE' ? 'primary' : 'outline'} onClick={() => setTab('KNOWLEDGE')}>
              <BookOpen className="w-4 h-4" /> Knowledge Hub
            </Button>
            <Button size="sm" variant={tab === 'FAQS' ? 'primary' : 'outline'} onClick={() => setTab('FAQS')}>
              FAQs
            </Button>
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                if (tab === 'CMS') {
                  setEditingContentId(null);
                  setForm({ contentType: 'ANNOUNCEMENT', title: '', subtitle: '', badge: 'NEW', ctaLabel: 'Browse Deals', ctaUrl: '/deals', imageUrl: '', startDate: '', endDate: '', position: 1 });
                  setCreateModal(true);
                } else if (tab === 'KNOWLEDGE') {
                  setEditingKhId(null);
                  setKhForm({ title: '', category: 'Structural Engineering', summary: '', content: '', imageUrl: '' });
                  setKhModal(true);
                } else {
                  setEditingFaqId(null);
                  setFaqForm({ question: '', answer: '', category: 'Delivery & Pricing' });
                  setFaqModal(true);
                }
              }}
            >
              <Plus className="w-4 h-4" /> {tab === 'CMS' ? 'New Content Block' : tab === 'KNOWLEDGE' ? 'New Article' : 'New FAQ'}
            </Button>
          </div>
        }
      />

      {tab === 'CMS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              title={item.title}
              subtitle={`${item.contentType} • Slot #${item.position} • Updated ${formatDateTime(item.updatedAt)}`}
              action={<Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>}
            >
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.title} className="w-full h-28 object-cover rounded-lg mb-2.5 border border-[#E5DCD3]" />
              )}
              <p className="text-xs text-[#6E6859] mb-3">{item.subtitle}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E5DCD3]">
                <span className="text-[11px] font-mono text-[#6E6859]">
                  CTA: {item.ctaLabel} → {item.ctaUrl}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setPreviewItem(item)}>
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingContentId(item.id);
                      setForm({
                        contentType: item.contentType || 'BANNER',
                        title: item.title || '',
                        subtitle: item.subtitle || '',
                        badge: item.badge || '',
                        ctaLabel: item.ctaLabel || '',
                        ctaUrl: item.ctaUrl || '',
                        imageUrl: item.imageUrl || '',
                        startDate: item.startDate || '',
                        endDate: item.endDate || '',
                        position: item.position || 1,
                      });
                      setCreateModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  {item.status !== 'PUBLISHED' ? (
                    <Button size="sm" variant="success" onClick={() => handlePublish(item.id)}>
                      <UploadCloud className="w-3.5 h-3.5" /> Publish
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleUnpublish(item.id)}>
                      Unpublish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await adminApi.deleteContent(item.id);
                      pushToast({ title: 'Block Deleted' });
                      loadData();
                    }}
                  >
                    Del
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : tab === 'KNOWLEDGE' ? (
        <Card title="Knowledge Hub Articles & Guides">
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(knowledge.articles || []).map((art) => (
              <div key={art.id} className="py-3 flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-[#5E5946]">{art.title}</p>
                  <p className="text-[#6E6859] mt-0.5">{art.summary}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="info">{art.category}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingKhId(art.id);
                      setKhForm({
                        title: art.title || '',
                        category: art.category || 'Structural Engineering',
                        summary: art.summary || '',
                        content: art.content || '',
                        imageUrl: art.imageUrl || '',
                      });
                      setKhModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await adminApi.deleteKnowledgeArticle(art.id);
                      pushToast({ title: 'Article Deleted' });
                      loadData();
                    }}
                  >
                    Del
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card title="Customer & Trade FAQs" subtitle="Published dynamically on Storefront Help / Static pages">
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(knowledge.faqs || []).map((faq: any) => (
              <div key={faq.id} className="py-3 flex justify-between items-start gap-4">
                <div>
                  <p className="font-semibold text-[#5E5946]">{faq.question}</p>
                  <p className="text-[#6E6859] mt-0.5">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="info">{faq.category || 'General'}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingFaqId(faq.id);
                      setFaqForm({ question: faq.question || '', answer: faq.answer || '', category: faq.category || 'Delivery & Pricing' });
                      setFaqModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await adminApi.deleteFaq(faq.id);
                      pushToast({ title: 'FAQ Removed' });
                      loadData();
                    }}
                  >
                    Del
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Storefront Preview Modal */}
      <Modal
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title="Customer Website Storefront Preview"
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-[#5E5946] text-white space-y-2">
              {previewItem.badge && (
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#AE887B] text-white text-[10px] font-bold uppercase">
                  {previewItem.badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-white">{previewItem.title}</h3>
              <p className="text-xs text-[#F0DED0]/90">{previewItem.subtitle}</p>
              <div className="pt-2">
                <span className="inline-block px-4 py-1.5 rounded-lg bg-[#AE887B] text-white text-xs font-semibold">
                  {previewItem.ctaLabel}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewItem(null)}>
                Close
              </Button>
              {previewItem.status !== 'PUBLISHED' && (
                <Button
                  variant="success"
                  onClick={() => {
                    handlePublish(previewItem.id);
                    setPreviewItem(null);
                  }}
                >
                  Publish to Customer Web
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Content Block Create/Edit Modal */}
      <Modal
        open={createModal}
        onClose={() => {
          setCreateModal(false);
          setEditingContentId(null);
        }}
        title={editingContentId ? 'Edit Website Content Block' : 'Draft Website Content'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (editingContentId) {
              await adminApi.updateContentDraft(editingContentId, form);
              pushToast({ title: 'Content Block Updated' });
            } else {
              await adminApi.createContent(form);
              pushToast({ title: 'Draft Saved', message: 'Preview or publish when ready.' });
            }
            setCreateModal(false);
            setEditingContentId(null);
            loadData();
          }}
          className="space-y-3 text-xs"
        >
          <select
            value={form.contentType}
            onChange={(e) => setForm({ ...form, contentType: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          >
            <option value="ANNOUNCEMENT">Top Announcement Bar</option>
            <option value="BANNER">Homepage Hero Banner</option>
            <option value="DEAL">Featured Deal Block</option>
            <option value="NEW_LAUNCH">New Launch Highlight</option>
            <option value="HOMEPAGE_SECTION">Custom Homepage Section</option>
          </select>
          <input
            required
            placeholder="Headline / Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <textarea
            placeholder="Subtitle / supporting text"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="CTA Button Label"
              value={form.ctaLabel}
              onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
            <input
              placeholder="CTA Target Route (/deals)"
              value={form.ctaUrl}
              onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Banner Image URL (or upload below)"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const uploaded = await adminApi.uploadCatalogImage(file);
                setForm((prev) => ({ ...prev, imageUrl: uploaded.url }));
              }}
              className="px-2 py-1.5 bg-white border border-[#E5DCD3] rounded-lg text-[11px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingContentId ? 'Update Draft' : 'Save as Draft'}</Button>
          </div>
        </form>
      </Modal>

      {/* Knowledge Hub Article Modal */}
      <Modal
        open={khModal}
        onClose={() => {
          setKhModal(false);
          setEditingKhId(null);
        }}
        title={editingKhId ? 'Edit Knowledge Hub Guide' : 'Publish Knowledge Hub Guide'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (editingKhId) {
              await adminApi.updateKnowledgeArticle(editingKhId, khForm);
              pushToast({ title: 'Article Updated' });
            } else {
              await adminApi.createKnowledgeArticle(khForm);
              pushToast({ title: 'Article Published' });
            }
            setKhModal(false);
            setEditingKhId(null);
            loadData();
          }}
          className="space-y-3 text-xs"
        >
          <input
            required
            placeholder="Article Title"
            value={khForm.title}
            onChange={(e) => setKhForm({ ...khForm, title: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <input
            required
            placeholder="Category"
            value={khForm.category}
            onChange={(e) => setKhForm({ ...khForm, category: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <textarea
            required
            rows={4}
            placeholder="Construction engineering summary..."
            value={khForm.summary}
            onChange={(e) => setKhForm({ ...khForm, summary: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setKhModal(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingKhId ? 'Update Guide' : 'Publish Guide'}</Button>
          </div>
        </form>
      </Modal>

      {/* FAQ Modal */}
      <Modal
        open={faqModal}
        onClose={() => {
          setFaqModal(false);
          setEditingFaqId(null);
        }}
        title={editingFaqId ? 'Edit FAQ' : 'Add Storefront FAQ'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (editingFaqId) {
              await adminApi.updateFaq(editingFaqId, faqForm);
              pushToast({ title: 'FAQ Updated' });
            } else {
              await adminApi.createFaq(faqForm);
              pushToast({ title: 'FAQ Added' });
            }
            setFaqModal(false);
            setEditingFaqId(null);
            loadData();
          }}
          className="space-y-3 text-xs"
        >
          <input
            required
            placeholder="Question"
            value={faqForm.question}
            onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <input
            placeholder="Category"
            value={faqForm.category}
            onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <textarea
            required
            rows={4}
            placeholder="Answer..."
            value={faqForm.answer}
            onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setFaqModal(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingFaqId ? 'Save FAQ' : 'Publish FAQ'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
