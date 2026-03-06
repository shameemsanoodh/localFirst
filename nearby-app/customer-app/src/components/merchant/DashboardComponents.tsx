import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ImageIcon, Trash2 } from 'lucide-react';

// This file contains components that were originally inside MerchantDashboard.tsx
// They are moved here for better organization.

// Note: These components are not yet fully integrated with the backend and may use mock data or local state.
// The main refactoring was focused on the dashboard's data fetching logic.

export interface OfferPost {
  id: string;
  title: string;
  description?: string;
  originalPrice?: number;
  discountPrice?: number;
  imageUrl?: string;
  type: 'offer' | 'discount' | 'broadcast';
  expiresAt: string;
  createdAt: string;
}

export const CreatePostForm: React.FC<{
  onSubmit: (post: Omit<OfferPost, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    originalPrice: '',
    discountPrice: '',
    type: 'offer' as OfferPost['type'],
    expiresAt: '',
    imageUrl: '',
  });
  const [preview, setPreview] = useState<string>('');

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setPreview(url);
      setForm((f) => ({ ...f, imageUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({
      title: form.title,
      description: form.description,
      originalPrice: Number(form.originalPrice) || 0,
      discountPrice: Number(form.discountPrice) || 0,
      type: form.type,
      expiresAt: form.expiresAt || new Date(Date.now() + 24 * 3600_000).toISOString(),
      imageUrl: form.imageUrl,
    });
  };

  const discount = form.originalPrice && form.discountPrice
    ? Math.round(((+form.originalPrice - +form.discountPrice) / +form.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card rounded-2xl shadow-sm p-5 border"
    >
      <h3 className="font-bold text-foreground mb-4">Create New Post</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${preview ? 'border-transparent' : 'border-muted hover:border-primary/20 bg-muted/50'}`}
          style={{ height: preview ? 200 : 120 }}
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <ImageIcon size={28} className="mx-auto text-muted-foreground mb-1" />
              <p className="text-sm text-muted-foreground">Click to upload product image</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>

        <input
          type="text"
          placeholder="Title (e.g. Fresh Tomatoes at 50% OFF)"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
          className="w-full px-4 py-3 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
        
        <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Original Price (₹)</label>
              <input
                type="number"
                placeholder="100"
                value={form.originalPrice}
                onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Offer Price (₹) {discount > 0 && <span className="text-green-500 font-semibold">{discount}% off</span>}
              </label>
              <input
                type="number"
                placeholder="79"
                value={form.discountPrice}
                onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
          </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border text-foreground font-medium text-sm hover:bg-accent transition-colors">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm">
            Publish
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export const PostCard: React.FC<{ post: OfferPost; onDelete: (id: string) => void }> = ({ post, onDelete }) => {
    const now = new Date();
    const expiry = new Date(post.expiresAt);
    const hoursLeft = Math.max(0, (expiry.getTime() - now.getTime()) / 3_600_000);
    const discount = post.originalPrice && post.discountPrice
      ? Math.round(((post.originalPrice - post.discountPrice) / post.originalPrice) * 100)
      : 0;
  
    const typeBadge =
      post.type === 'offer'
        ? 'bg-blue-100 text-blue-600'
        : 'bg-purple-100 text-purple-600';
  
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-2xl shadow-sm border overflow-hidden"
      >
        {post.imageUrl && (
          <div className="relative h-40 overflow-hidden bg-muted">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
            {discount > 0 && (
              <div className="absolute bottom-2 left-2 text-white bg-destructive/80 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded-full">{discount}% OFF</div>
            )}
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize mb-1 ${typeBadge}`}>
                {post.type}
              </span>
              <h3 className="font-semibold text-foreground text-sm">{post.title}</h3>
            </div>
            <button
              onClick={() => onDelete(post.id)}
              className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
            >
              <Trash2 size={15} />
            </button>
          </div>
  
          <div className="flex items-center justify-between mt-3">
            {post.originalPrice && post.discountPrice ? (
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">₹{post.discountPrice}</span>
                <span className="text-xs text-muted-foreground line-through">₹{post.originalPrice}</span>
              </div>
            ) : <div />}
            <span className={`text-xs font-medium flex items-center gap-1 ${hoursLeft < 2 ? 'text-destructive' : 'text-primary'}`}>
              <Clock size={11} />
              {hoursLeft < 1 ? `${Math.round(hoursLeft * 60)}m left` : `${Math.round(hoursLeft)}h left`}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };
