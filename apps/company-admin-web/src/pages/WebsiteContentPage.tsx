import React, { useEffect, useState } from 'react';
import { Globe, Eye, UploadCloud, BookOpen, Plus } from 'lucide-react';
import { adminApi, formatDateTime } from '../services/adminApi';
import { PageHeader, Card, Badge, Button, Modal, statusBadgeVariant, useToastStore } from '../components/ui';

export const WebsiteContentPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [tab, setTab] = useState<'CMS' | 'KNOWLEDGE'>('CMS');
  const [items, setItems] = useState<any[]>([]);
  const [knowledge, setKnowledge] = useState<{ articles: any[]; faqs: any[] }>({
    articles: [],
    faqs: [],
  });
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({
    contentType: 'ANNOUNCEMENT',
    title: '',
    subtitle: '',
    badge: 'NEW',
    ctaLabel: 'Browse Deals',
    ctaUrl: '/deals',
    position: 1,
  });

  const [khModal, setKhModal] = useState(false);
  const [khForm, setKhForm] = useState({
    title: '',
    category: 'Structural Engineering',
    summary: '',
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
        description="Draft, preview, publish & sync banners, announcements, featured deals & knowledge hub articles to Customer Website."
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={tab === 'CMS' ? 'primary' : 'outline'}
              onClick={() => setTab('CMS')}
            >
              <Globe className="w-4 h-4" /> Storefront Blocks
            </Button>
            <Button
              size="sm"
              variant={tab === 'KNOWLEDGE' ? 'primary' : 'outline'}
              onClick={() => setTab('KNOWLEDGE')}
            >
              <BookOpen className="w-4 h-4" /> Knowledge Hub & FAQs
            </Button>
            <Button
              size="sm"
              variant="accent"
              onClick={() => (tab === 'CMS' ? setCreateModal(true) : setKhModal(true))}
            >
              <Plus className="w-4 h-4" /> {tab === 'CMS' ? 'New Content Block' : 'New Article'}
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
              <p className="text-xs text-[#6E6859] mb-3">{item.subtitle}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E5DCD3]">
                <span className="text-[11px] font-mono text-[#6E6859]">
                  CTA: {item.ctaLabel} → {item.ctaUrl}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewItem(item)}>
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </Button>
                  {item.status !== 'PUBLISHED' ? (
                    <Button size="sm" variant="success" onClick={() => handlePublish(item.id)}>
                      <UploadCloud className="w-3.5 h-3.5" /> Publish Live
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleUnpublish(item.id)}>
                      Unpublish
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card title="Knowledge Hub Articles & Guides">
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(knowledge.articles || []).map((art) => (
              <div key={art.id} className="py-3 flex justify-between items-start gap-4">
                <div>
                  <p className="font-semibold text-[#5E5946]">{art.title}</p>
                  <p className="text-[#6E6859] mt-0.5">{art.summary}</p>
                </div>
                <Badge variant="info">{art.category}</Badge>
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

      {/* New Content Draft Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Draft Website Content">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await adminApi.createContent(form);
            pushToast({ title: 'Draft Saved', message: 'Preview or publish when ready.' });
            setCreateModal(false);
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
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save as Draft</Button>
          </div>
        </form>
      </Modal>

      {/* Knowledge Hub Article Modal */}
      <Modal open={khModal} onClose={() => setKhModal(false)} title="Publish Knowledge Hub Guide">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await adminApi.createKnowledgeArticle(khForm);
            pushToast({ title: 'Article Published' });
            setKhModal(false);
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
            <Button type="submit">Publish Guide</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
