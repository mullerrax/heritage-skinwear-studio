import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Archive, Check, ChevronRight, CircleUserRound, ExternalLink, ImagePlus, LogOut, Pencil, Plus, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { useClerk, useUser } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListAllReviewsQueryKey,
  getListAllProductsQueryKey,
  getListProductsQueryKey,
  useCreateProduct,
  useDeleteProduct,
  useListAllReviews,
  useListAllProducts,
  useListProducts,
  useModerateReview,
  useRequestUploadUrl,
  useUpdateProduct,
} from '@workspace/api-client-react';
import type { Product, ProductInput, ProductUpdate, Review } from '@workspace/api-client-react';
import { Link } from 'wouter';

type ProductForm = {
  name: string;
  category: string;
  description: string;
  material: string;
  imageUrl: string;
  detail: string;
  season: string;
  available: boolean;
  sortOrder: number;
};

const emptyProduct: ProductForm = {
  name: '',
  category: 'Footwear',
  description: '',
  material: 'Leather',
  imageUrl: '',
  detail: '',
  season: 'Winter',
  available: true,
  sortOrder: 0,
};

function toForm(product: Product): ProductForm {
  return {
    name: product.name,
    category: product.category,
    description: product.description,
    material: product.material,
    imageUrl: product.imageUrl,
    detail: product.detail,
    season: product.season,
    available: product.available,
    sortOrder: product.sortOrder,
  };
}

function AdminHeader() {
  const { user } = useUser();
  const { signOut } = useClerk();
  return (
    <header className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card)/.74)] px-5 py-4 backdrop-blur sm:px-8">
      <Link href="/" className="focus-ring flex items-center gap-3" data-testid="link-admin-brand">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--primary))] font-display text-lg text-[hsl(var(--secondary))]">H</span>
        <span><span className="block font-display text-xl font-semibold leading-none text-[hsl(var(--primary))]">Heritage</span><span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">Studio desk</span></span>
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/" className="focus-ring hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] sm:flex" data-testid="link-view-shop">View shop <ExternalLink size={13} /></Link>
        <span className="hidden h-6 w-px bg-[hsl(var(--border))] sm:block" />
        <span className="hidden text-xs text-[hsl(var(--muted-foreground))] md:block">{user?.firstName || user?.emailAddresses[0]?.emailAddress || 'Owner'}</span>
        <button type="button" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || '/' })} className="focus-ring flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]" data-testid="button-admin-sign-out"><LogOut size={13} /> <span className="hidden sm:inline">Sign out</span></button>
      </div>
    </header>
  );
}

function ProductEditor({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const requestUploadUrl = useRequestUploadUrl();
  const [form, setForm] = useState<ProductForm>(() => product ? toForm(product) : emptyProduct);
  const [feedback, setFeedback] = useState('');
  const [uploading, setUploading] = useState(false);
  const isEditing = Boolean(product);
  const setField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback('');
    if (!form.name.trim() || !form.category.trim() || !form.imageUrl.trim()) {
      setFeedback('Name, category, and an image URL are required.');
      return;
    }
    const data = { ...form, name: form.name.trim(), category: form.category.trim(), description: form.description.trim(), material: form.material.trim(), imageUrl: form.imageUrl.trim(), detail: form.detail.trim(), season: form.season.trim() };
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      onClose();
    };
    if (product) updateProduct.mutate({ id: product.id, data: data as ProductUpdate }, { onSuccess, onError: () => setFeedback('Could not update this piece. Please try again.') });
    else createProduct.mutate({ data: data as ProductInput }, { onSuccess, onError: () => setFeedback('Could not create this piece. Please try again.') });
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setFeedback('');
    try {
      const response = await requestUploadUrl.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type } });
      const upload = await fetch(response.uploadURL, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!upload.ok) throw new Error('Upload failed');
      setField('imageUrl', `/api/storage${response.objectPath}`);
      setFeedback('Image uploaded. Save the piece to publish the new image.');
    } catch {
      setFeedback('The image could not be uploaded. Please try another file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[hsl(var(--primary)/.58)] p-3 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-label={isEditing ? 'Edit product' : 'Create product'}>
      <form onSubmit={save} className="mx-auto max-w-4xl bg-[hsl(var(--card))] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-5 sm:px-8"><div><p className="eyebrow text-[hsl(var(--accent))]">{isEditing ? 'Edit the record' : 'New piece'}</p><h2 className="mt-1 font-display text-3xl text-[hsl(var(--primary))]">{isEditing ? product?.name : 'Add to the collection'}</h2></div><button type="button" onClick={onClose} className="focus-ring rounded-full border border-[hsl(var(--border))] p-2 text-[hsl(var(--primary))]" aria-label="Close editor" data-testid="button-close-product-editor"><X size={18} /></button></div>
        <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[.75fr_1.25fr]">
          <div><div className="relative aspect-[4/5] overflow-hidden bg-[hsl(var(--muted))]">{form.imageUrl ? <img src={form.imageUrl} alt="Product preview" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-[hsl(var(--muted-foreground))]"><ImagePlus size={27} /><span className="text-xs">Upload a generous product image</span></div>}</div><label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[hsl(var(--primary)/.28)] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]"><ImagePlus size={14} /> {uploading ? 'Uploading…' : 'Upload image'}<input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} data-testid="input-product-image" /></label><p className="mt-2 text-[10px] leading-5 text-[hsl(var(--muted-foreground))]">Or paste an existing serving URL below. Uploaded files are stored through the protected object storage flow.</p></div>
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 field-label">Product name<input required value={form.name} onChange={(event) => setField('name', event.target.value)} className="field mt-2" placeholder="e.g. Tide Line Mukluk" data-testid="input-product-name" /></label>
            <label className="field-label">Category<select value={form.category} onChange={(event) => setField('category', event.target.value)} className="field mt-2" data-testid="select-product-category"><option>Footwear</option><option>Outerwear</option><option>Accessories</option></select></label>
            <label className="field-label">Season<input value={form.season} onChange={(event) => setField('season', event.target.value)} className="field mt-2" placeholder="Winter / made to order" data-testid="input-product-season" /></label>
            <label className="sm:col-span-2 field-label">Material<input value={form.material} onChange={(event) => setField('material', event.target.value)} className="field mt-2" placeholder="Leather, sealskin, wool" data-testid="input-product-material" /></label>
            <label className="sm:col-span-2 field-label">Description<textarea required value={form.description} onChange={(event) => setField('description', event.target.value)} className="field mt-2 min-h-24 resize-y" data-testid="textarea-product-description" /></label>
            <label className="sm:col-span-2 field-label">Detail / caption<input value={form.detail} onChange={(event) => setField('detail', event.target.value)} className="field mt-2" placeholder="Wool lining · custom fit" data-testid="input-product-detail" /></label>
            <label className="sm:col-span-2 field-label">Image serving URL<input required value={form.imageUrl} onChange={(event) => setField('imageUrl', event.target.value)} className="field mt-2" placeholder="/api/storage/objects/..." data-testid="input-product-image-url" /></label>
            <label className="field-label">Sort order<input type="number" value={form.sortOrder} onChange={(event) => setField('sortOrder', Number(event.target.value))} className="field mt-2" data-testid="input-product-sort-order" /></label>
            <label className="flex items-center gap-3 self-end pb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--primary))]"><input type="checkbox" checked={form.available} onChange={(event) => setField('available', event.target.checked)} className="h-4 w-4 accent-[hsl(var(--accent))]" data-testid="checkbox-product-available" /> Available now</label>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[hsl(var(--border))] px-5 py-5 sm:px-8"><p className="text-xs text-[hsl(var(--accent))]" role="status" data-testid="status-product-editor">{feedback}</p><div className="ml-auto flex gap-3"><button type="button" onClick={onClose} className="focus-ring rounded-full border border-[hsl(var(--border))] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--primary))]" data-testid="button-cancel-product">Cancel</button><button type="submit" disabled={createProduct.isPending || updateProduct.isPending || uploading} className="focus-ring flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--card))] disabled:opacity-50" data-testid="button-save-product"><Save size={14} /> {createProduct.isPending || updateProduct.isPending ? 'Saving…' : 'Save piece'}</button></div></div>
      </form>
    </div>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const queryClient = useQueryClient();
  const moderateReview = useModerateReview();
  const moderate = (approved: boolean) => moderateReview.mutate({ id: review.id, data: { approved } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListAllReviewsQueryKey() }); queryClient.invalidateQueries({ queryKey: ['/api/reviews'] }); } });
  return <article className="grid gap-4 border-b border-[hsl(var(--border))] py-5 sm:grid-cols-[1fr_auto] sm:items-center" data-testid={`row-review-${review.id}`}><div><div className="flex flex-wrap items-center gap-3"><span className="font-semibold text-[hsl(var(--primary))]">{review.displayName}</span><span className={`status-pill ${review.approved ? 'status-approved' : 'status-pending'}`}>{review.approved ? 'Approved' : 'Awaiting review'}</span><span className="text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">{review.rating} / 5</span></div><p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{review.body}</p></div><div className="flex gap-2">{!review.approved && <button type="button" disabled={moderateReview.isPending} onClick={() => moderate(true)} className="focus-ring flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--card))]" data-testid={`button-approve-review-${review.id}`}><Check size={13} /> Approve</button>}{review.approved && <button type="button" disabled={moderateReview.isPending} onClick={() => moderate(false)} className="focus-ring flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--primary))]" data-testid={`button-hide-review-${review.id}`}><Archive size={13} /> Hide</button>}</div></article>;
}

export default function AdminDashboard() {
  const productsQuery = useListAllProducts();
  const reviewsQuery = useListAllReviews();
  const deleteProduct = useDeleteProduct();
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const products = useMemo(() => [...(productsQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id), [productsQuery.data]);
  const remove = (product: Product) => {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    deleteProduct.mutate({ id: product.id }, { onSuccess: () => { setNotice(`${product.name} was removed.`); void productsQuery.refetch(); }, onError: () => setNotice('That piece could not be removed.') });
  };
  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"><AdminHeader /><div className="mx-auto grid max-w-[1500px] lg:grid-cols-[220px_1fr]"><aside className="hidden border-r border-[hsl(var(--border))] px-5 py-8 lg:block"><p className="eyebrow text-[hsl(var(--accent))]">Owner desk</p><div className="mt-8 space-y-3 text-xs font-semibold text-[hsl(var(--muted-foreground))]"><a href="#products" className="flex items-center justify-between py-2 text-[hsl(var(--primary))]">Collection <ChevronRight size={14} /></a><a href="#reviews-admin" className="flex items-center justify-between py-2">Reviews <ChevronRight size={14} /></a></div><div className="mt-16 border-t border-[hsl(var(--border))] pt-6 text-[11px] leading-5 text-[hsl(var(--muted-foreground))]"><ShieldCheck size={18} className="mb-3 text-[hsl(var(--accent))]" />Your public shop remains open while you work here.</div></aside><main className="min-w-0 px-5 py-8 sm:px-8 sm:py-12 lg:px-12"><div className="flex flex-col justify-between gap-6 border-b border-[hsl(var(--border))] pb-8 sm:flex-row sm:items-end"><div><p className="eyebrow text-[hsl(var(--accent))]">Good morning, maker</p><h1 className="mt-3 font-display text-5xl font-semibold leading-[.9] tracking-[-.035em] text-[hsl(var(--primary))] sm:text-7xl">The studio desk.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Keep the collection clear, current, and ready for the next conversation.</p></div><div className="flex gap-3"><Link href="/" className="focus-ring flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--primary))] sm:hidden" data-testid="link-admin-mobile-shop">Shop <ExternalLink size={13} /></Link><button type="button" onClick={() => setEditing(null)} className="focus-ring flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--card))]" data-testid="button-new-product"><Plus size={15} /> New piece</button></div></div>{notice && <p className="mt-5 text-sm text-[hsl(var(--accent))]" role="status" data-testid="status-admin">{notice}</p>}<section id="products" className="pt-10"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow text-[hsl(var(--accent))]">Published inventory</p><h2 className="mt-2 font-display text-3xl text-[hsl(var(--primary))]">Collection pieces</h2></div><span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[hsl(var(--muted-foreground))]">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</span></div>{productsQuery.isLoading && <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-72" />)}</div>}{productsQuery.isError && <p className="mt-6 border border-[hsl(var(--border))] p-6 text-sm text-[hsl(var(--muted-foreground))]" data-testid="state-admin-products-error">Products could not be loaded. Check your owner session and try again.</p>}{!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && <p className="mt-6 border border-dashed border-[hsl(var(--border))] p-8 text-sm text-[hsl(var(--muted-foreground))]" data-testid="state-admin-products-empty">No products yet. Add the first piece to begin your public collection.</p>}<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <article key={product.id} className="group border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3" data-testid={`admin-card-product-${product.id}`}><div className="relative aspect-[5/4] overflow-hidden bg-[hsl(var(--muted))]"><img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" /><span className={`status-pill absolute left-3 top-3 ${product.available ? 'status-approved' : 'status-pending'}`}>{product.available ? 'Available' : 'Made to order'}</span></div><div className="p-2 pt-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[hsl(var(--accent))]">{product.category} · {product.material}</p><h3 className="mt-2 font-display text-2xl text-[hsl(var(--primary))]">{product.name}</h3></div><span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">#{product.sortOrder}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{product.description}</p><div className="mt-4 flex gap-2 border-t border-[hsl(var(--border))] pt-3"><button type="button" onClick={() => setEditing(product)} className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-full border border-[hsl(var(--border))] py-2 text-[10px] font-bold uppercase tracking-[0.11em] text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]" data-testid={`button-edit-product-${product.id}`}><Pencil size={13} /> Edit</button><button type="button" onClick={() => remove(product)} className="focus-ring rounded-full border border-[hsl(var(--border))] px-3 py-2 text-[hsl(var(--accent))] hover:bg-[hsl(var(--muted))]" aria-label={`Delete ${product.name}`} data-testid={`button-delete-product-${product.id}`}><Trash2 size={13} /></button></div></div></article>)}</div></section><section id="reviews-admin" className="mt-16 border-t border-[hsl(var(--border))] pt-10"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow text-[hsl(var(--accent))]">Community notes</p><h2 className="mt-2 font-display text-3xl text-[hsl(var(--primary))]">Review moderation</h2></div><CircleUserRound size={24} className="text-[hsl(var(--accent))]" /></div>{reviewsQuery.isLoading && <div className="mt-5 space-y-3"><div className="skeleton h-20" /><div className="skeleton h-20" /></div>}{reviewsQuery.isError && <p className="mt-5 border border-[hsl(var(--border))] p-6 text-sm text-[hsl(var(--muted-foreground))]" data-testid="state-admin-reviews-error">Reviews could not be loaded for moderation.</p>}{!reviewsQuery.isLoading && !reviewsQuery.isError && (reviewsQuery.data ?? []).length === 0 && <p className="mt-5 border border-dashed border-[hsl(var(--border))] p-6 text-sm text-[hsl(var(--muted-foreground))]" data-testid="state-admin-reviews-empty">No submitted reviews yet.</p>}<div className="mt-2">{(reviewsQuery.data ?? []).map((review) => <ReviewRow key={review.id} review={review} />)}</div></section></main></div>{editing !== undefined && <ProductEditor product={editing} onClose={() => setEditing(undefined)} />}</div>
  );
}