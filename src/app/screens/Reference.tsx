/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Design route B: reference images, an optional link and the changes the customer wants.

import React, { useRef, useState } from 'react';
import { ImagePlus, Info, X } from 'lucide-react';
import { garmentById, garmentName } from '../data/catalog';
import type { ReferenceImage } from '../services/types';
import { useNav } from '../nav';
import { useDraft } from '../state/orderDraft';
import { Button, DemoTag, ErrorBanner, Field, Input, Note, Screen, TextArea } from '../ui/kit';

const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/** downscale large photos so the demo can keep them on the device */
const readImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('read'));
    r.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode'));
      img.onload = () => {
        const scale = Math.min(1, 900 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = r.result as string;
    };
    r.readAsDataURL(file);
  });

export const ReferenceScreen: React.FC = () => {
  const nav = useNav();
  const { draft, update } = useDraft();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [touched, setTouched] = useState(false);

  const urlError = draft.referenceUrl && !/^https?:\/\/\S+\.\S+/.test(draft.referenceUrl) ? 'Enter a full link starting with https://' : '';
  const needsSomething = draft.references.length === 0 && !draft.referenceUrl;

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setError('');
    const room = MAX_FILES - draft.references.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setError(`You can add up to ${MAX_FILES} images.`);
    setUploading(true);
    const added: ReferenceImage[] = [];
    for (const f of list) {
      if (!TYPES.includes(f.type)) {
        setError(`${f.name}: use a JPG, PNG or WebP image.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        setError(`${f.name} is larger than 8 MB.`);
        continue;
      }
      try {
        added.push({ id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: f.name, dataUrl: await readImage(f), size: f.size, type: f.type });
      } catch {
        setError(`${f.name} couldn’t be uploaded. Try another image.`);
      }
    }
    update({ references: [...draft.references, ...added], method: 'reference' });
    setUploading(false);
    if (input.current) input.current.value = '';
  };

  return (
    <Screen
      onBack={nav.back}
      title="Reference images"
      subtitle={garmentName(garmentById(draft.garmentId))}
      footer={
        <Button
          block
          id="reference-continue"
          onClick={() => {
            setTouched(true);
            if (!needsSomething && !urlError) nav.go({ name: 'design-summary' });
          }}
        >
          Continue
        </Button>
      }
    >
      <div className="pt-4">
        {error && <ErrorBanner message={error} />}
        {touched && needsSomething && <ErrorBanner message="Add at least one image or a reference link." />}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {draft.references.map((r) => (
            <div key={r.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-black/10">
              <img src={r.dataUrl} alt={r.name} className="w-full h-full object-cover" />
              <button
                aria-label={`Remove ${r.name}`}
                onClick={() => update({ references: draft.references.filter((x) => x.id !== r.id) })}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {draft.references.length < MAX_FILES && (
            <button
              id="reference-add"
              onClick={() => input.current?.click()}
              disabled={uploading}
              className="aspect-[3/4] rounded-2xl border border-dashed border-[#174D33]/50 text-[#174D33] flex flex-col items-center justify-center gap-1 text-[12px] font-semibold"
            >
              <ImagePlus className="w-6 h-6" />
              {uploading ? 'Adding…' : 'Add image'}
            </button>
          )}
        </div>
        <input ref={input} id="reference-file" type="file" accept={TYPES.join(',')} multiple className="hidden" onChange={(e) => void addFiles(e.target.files)} />
        <p className="text-[12px] text-black/50 mb-5 flex items-center gap-2 flex-wrap">
          JPG, PNG or WebP, up to 8 MB each, {MAX_FILES} images. <DemoTag>Stored on this device only</DemoTag>
        </p>
        <Field label="Reference link" optional error={urlError}>
          <Input id="reference-url" type="url" placeholder="https://" value={draft.referenceUrl} onChange={(e) => update({ referenceUrl: e.target.value.trim(), method: 'reference' })} invalid={!!urlError} />
        </Field>
        <Field label="What would you like changed?" optional>
          <TextArea
            id="reference-changes"
            maxLength={400}
            placeholder="e.g. Same silhouette but with elbow sleeves and a deeper back."
            value={draft.changeNotes}
            onChange={(e) => update({ changeNotes: e.target.value })}
          />
        </Field>
        <Note icon={<Info className="w-4 h-4" />}>
          A reference is a starting point. Your stylist reviews it with you for fit, fabric and feasibility before anything is confirmed — a photo
          isn’t a production-ready pattern.
        </Note>
      </div>
    </Screen>
  );
};
