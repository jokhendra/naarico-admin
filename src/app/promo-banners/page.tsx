"use client";
import React, { useEffect, useMemo, useState } from "react";
import { promoBannersService } from "@/services/promoBannersService";
import { CreatePromoBannerPayload } from "@/lib/api/promo-banners-api";
import { toast } from "sonner";

type Placement = 'HOME_TOP' | 'HOME_MIDDLE' | 'HOME_BOTTOM' | 'CATEGORY' | 'PRODUCT' | 'CHECKOUT' | 'GLOBAL';
type Device = 'ALL' | 'DESKTOP' | 'MOBILE';

const placements: Placement[] = ['HOME_TOP', 'HOME_MIDDLE', 'HOME_BOTTOM', 'CATEGORY', 'PRODUCT', 'CHECKOUT', 'GLOBAL'];
const devices: Device[] = ['ALL', 'DESKTOP', 'MOBILE'];

export default function PromoBannersPage() {
  const [placement, setPlacement] = useState<Placement>('HOME_TOP');
  const [device, setDevice] = useState<Device>('ALL');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [form, setForm] = useState<CreatePromoBannerPayload>({
    title: '',
    imageUrl: '',
    placement: 'HOME_TOP',
    device: 'ALL',
    isActive: true,
    sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await promoBannersService.list({ placement, device, isActive: statusFilter });
      if (!res.success) throw new Error(res.error);
      setItems(res.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load banners');
      toast.error(e?.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement, device, statusFilter]);

  const resetForm = () => {
    setForm({ title: '', imageUrl: '', placement: 'HOME_TOP', device: 'ALL', isActive: true, sortOrder: 0 });
    setEditingId(null);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      if (editingId) {
        const res = await promoBannersService.update(editingId, form);
        if (!res.success) throw new Error(res.error);
        toast.success('Banner updated');
      } else {
        const res = await promoBannersService.create(form);
        if (!res.success) throw new Error(res.error);
        toast.success('Banner created');
      }
      setFormOpen(false);
      resetForm();
      fetchList();
    } catch (e: any) {
      setError(e?.message || 'Failed to save banner');
      toast.error(e?.message || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      subtitle: item.subtitle || '',
      imageUrl: item.imageUrl,
      linkUrl: item.linkUrl || '',
      ctaText: item.ctaText || '',
      backgroundColor: item.backgroundColor || '',
      textColor: item.textColor || '',
      placement: item.placement,
      device: item.device,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
      visibleFrom: item.visibleFrom || undefined,
      visibleTo: item.visibleTo || undefined,
    });
    setFormOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    const res = await promoBannersService.remove(id);
    if (!res.success) {
      setError(res.error || 'Failed to delete');
      toast.error(res.error || 'Failed to delete');
    }
    toast.success('Banner deleted');
    fetchList();
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  const toDatetimeLocalValue = (value?: string | null) => {
    if (!value) return '';
    // If value already looks like a local datetime (no timezone suffix), keep it
    const looksLocal = !/[Zz]$/.test(value) && !/[+-]\d{2}:?\d{2}$/.test(value);
    if (looksLocal) return value.slice(0, 16);
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
    const local = new Date(d.getTime() - tzOffsetMs);
    return local.toISOString().slice(0, 16);
  };

  const onToggleActive = async (item: any) => {
    const next = !item.isActive;
    const res = await promoBannersService.update(item.id, { isActive: next });
    if (!res.success) {
      toast.error(res.error || 'Failed to update status');
      return;
    }
    toast.success(next ? 'Banner activated' : 'Banner deactivated');
    fetchList();
  };

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((b) =>
      [b.title, b.subtitle, b.ctaText, b.linkUrl]
        .filter(Boolean)
        .some((t: string) => t.toLowerCase().includes(q))
    );
  }, [items, query]);

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Promo Banners</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Create eye‑catching promos with clear CTAs. Manage visibility by placement and device.</p>
        </div>
        <button
          className="px-4 py-2 rounded-md bg-gradient-to-r from-[#ed8c61] to-[#d44506] text-white shadow hover:shadow-md transition"
          onClick={() => {
            resetForm();
            setFormOpen(true);
          }}
        >
          New Banner
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center mb-4">
        <div className="flex items-center gap-3">
          <select className="border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={placement} onChange={(e) => setPlacement(e.target.value as Placement)}>
          {placements.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
          </select>
          <select className="border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={device} onChange={(e) => setDevice(e.target.value as Device)}>
          {devices.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
          </select>
          <select className="border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="flex-1">
          <div className="relative">
            <input
              placeholder="Search banners by title, subtitle, CTA or link…"
              className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>
        </div>
        <button className="px-3 py-2 border dark:border-gray-700 rounded-md hover:bg-accent" onClick={fetchList}>Refresh</button>
      </div>

      {error && <div className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border dark:border-gray-800 overflow-hidden">
                <div className="h-28 bg-gray-100 dark:bg-gray-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            ))
          : filteredItems.length === 0
          ? (
              <div className="col-span-full text-center py-16 border rounded-xl dark:border-gray-800">
                <div className="text-4xl mb-2">🎯</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No banners found</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Try changing filters or create a new banner.</p>
              </div>
            )
          : filteredItems.map((b) => (
              <div key={b.id} className="rounded-xl border dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow transition">
                <div className="relative h-36">
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.2')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-black/10 to-transparent" />
                  <div className="absolute top-2 left-2 flex gap-2">
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/90 text-gray-800 dark:bg-black/60 dark:text-gray-100 border border-white/50 dark:border-black/30">{b.placement}</span>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/90 text-gray-800 dark:bg-black/60 dark:text-gray-100 border border-white/50 dark:border-black/30">{b.device}</span>
                  </div>
                  <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] rounded-full border ${b.isActive ? 'bg-emerald-500/90 text-white border-emerald-400/50' : 'bg-gray-400/80 text-white border-gray-300/50'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-md overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                      <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate text-gray-900 dark:text-gray-100" style={{ color: b.textColor || undefined }}>{b.title}</div>
                      {b.subtitle && (
                        <div className="text-sm truncate text-gray-600 dark:text-gray-300" style={{ color: b.textColor ? undefined : undefined }}>{b.subtitle}</div>
                      )}
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Order: {b.sortOrder}{b.ctaText ? ` · CTA: ${b.ctaText}` : ''}</div>
                      <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        {formatDateTime(b.visibleFrom) ? (
                          <>
                            <span>From: {formatDateTime(b.visibleFrom)}</span>
                            {formatDateTime(b.visibleTo) && <span> · To: {formatDateTime(b.visibleTo)}</span>}
                          </>
                        ) : (
                          <span>Schedule: Always</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[60%]">{b.linkUrl || '—'}</div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 text-xs rounded-md border dark:border-gray-700 hover:bg-accent"
                        onClick={() => onToggleActive(b)}
                        aria-label={b.isActive ? 'Deactivate banner' : 'Activate banner'}
                      >
                        {b.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="px-3 py-1 text-xs rounded-md border dark:border-gray-700" onClick={() => onEdit(b)}>
                        Edit
                      </button>
                      <button className="px-3 py-1 text-xs rounded-md border dark:border-gray-700 text-red-600 dark:text-red-400" onClick={() => onDelete(b.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-banner-dialog-title"
            className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-xl shadow-xl border dark:border-gray-800 overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
              <div id="promo-banner-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">{editingId ? 'Edit Banner' : 'New Banner'}</div>
              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => setFormOpen(false)} aria-label="Close dialog">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Title</label>
                <input className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Subtitle</label>
                <input className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={form.subtitle || ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Image URL</label>
                <input className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Link URL</label>
                <input className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={form.linkUrl || ''} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">CTA Text</label>
                <input className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={form.ctaText || ''} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Shop now" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Background Color</label>
                <input className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={form.backgroundColor || ''} onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })} placeholder="#f5f2ef" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Text Color</label>
                <input className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={form.textColor || ''} onChange={(e) => setForm({ ...form, textColor: e.target.value })} placeholder="#111827" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Placement</label>
                <select className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value as Placement })}>
                  {placements.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Device</label>
                <select className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value as Device })}>
                  {devices.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Active</label>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="peer sr-only" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  <span className="w-10 h-6 rounded-full bg-gray-300 peer-checked:bg-emerald-500 relative transition">
                    <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{form.isActive ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Sort Order</label>
                <input type="number" className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={form.sortOrder || 0} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Visible From</label>
                <input type="datetime-local" className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={toDatetimeLocalValue(form.visibleFrom)} onChange={(e) => setForm({ ...form, visibleFrom: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Visible To</label>
                <input type="datetime-local" className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2" value={toDatetimeLocalValue(form.visibleTo)} onChange={(e) => setForm({ ...form, visibleTo: e.target.value })} />
              </div>
              {/* Live Preview */}
              <div className="lg:col-span-1">
                <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Live Preview</div>
                <div className="rounded-lg overflow-hidden border dark:border-gray-800">
                  <div className="relative h-40">
                    <img
                      src={form.imageUrl || 'https://via.placeholder.com/640x360?text=Preview'}
                      alt="Preview"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => ((e.target as HTMLImageElement).src = 'https://via.placeholder.com/640x360?text=Preview')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="text-white font-semibold truncate" style={{ color: form.textColor || undefined }}>{form.title || 'Your banner title'}</div>
                      {form.subtitle && <div className="text-white/90 text-sm truncate" style={{ color: form.textColor || undefined }}>{form.subtitle}</div>}
                      {form.ctaText && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-white/90 text-gray-900">
                          {form.ctaText}
                          <span>→</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 text-xs text-gray-600 dark:text-gray-300 border-t dark:border-gray-800 flex items-center justify-between">
                    <span>{form.placement} · {form.device}</span>
                    <span className="px-2 py-0.5 rounded-full border border-emerald-400/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{form.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
              </div>
            </div>
            <div className="p-4 border-t dark:border-gray-800 flex items-center justify-end gap-2">
              <button className="px-4 py-2 border dark:border-gray-700 rounded-md hover:bg-accent" onClick={() => setFormOpen(false)}>Cancel</button>
              <button className="px-4 py-2 rounded-md bg-gradient-to-r from-[#ed8c61] to-[#d44506] text-white disabled:opacity-60" onClick={onSave} disabled={saving || !form.title || !form.imageUrl}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


