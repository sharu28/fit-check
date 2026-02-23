'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Circle, Shirt, User } from 'lucide-react';

interface SingleSwapGuideProps {
  hasGarment: boolean;
  hasSubject: boolean;
  garmentPreviewUrl?: string;
  subjectPreviewUrl?: string;
  onUploadGarment?: (file: File) => void | Promise<void>;
  onUploadSubject?: (file: File) => void | Promise<void>;
  onAddGarment: () => void;
  onAddSubject: () => void;
}

function StepItem({
  label,
  done,
}: {
  label: string;
  done: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-sm font-medium text-gray-700">
      {done ? (
        <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />
      ) : (
        <Circle size={16} className="text-gray-400" aria-hidden="true" />
      )}
      <span>{label}</span>
    </li>
  );
}

interface RequiredCardProps {
  title: string;
  description: string;
  previewUrl?: string;
  complete: boolean;
  onAction: () => void;
  actionLabel: string;
  icon: ReactNode;
}

function RequiredCard({
  title,
  description,
  previewUrl,
  complete,
  onAction,
  actionLabel,
  icon,
}: RequiredCardProps) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            {icon}
          </span>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            complete
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {complete ? 'Ready' : 'Required'}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-2">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`${title} preview`}
            className="h-28 w-full rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-xs font-medium text-gray-400">
            No file selected
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onAction}
        className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        {actionLabel}
      </button>
    </article>
  );
}

export function SingleSwapGuide({
  hasGarment,
  hasSubject,
  garmentPreviewUrl,
  subjectPreviewUrl,
  onUploadGarment,
  onUploadSubject,
  onAddGarment,
  onAddSubject,
}: SingleSwapGuideProps) {
  const readyToGenerate = hasGarment && hasSubject;
  const garmentInputRef = useRef<HTMLInputElement | null>(null);
  const subjectInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="w-full h-full min-h-[430px] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-5 md:p-8">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Single Swap Workflow
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-gray-900">Add required assets to generate</h3>
          <p className="mt-2 text-sm text-gray-600">
            Upload one garment, choose one subject, then generate your first result.
          </p>
        </header>

        <ol className="mt-5 grid grid-cols-1 gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:grid-cols-3">
          <StepItem label="1. Upload Garment" done={hasGarment} />
          <StepItem label="2. Choose Subject" done={hasSubject} />
          <StepItem label="3. Generate" done={readyToGenerate} />
        </ol>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <RequiredCard
            title="Garment"
            description="Upload the clothing item first"
            previewUrl={garmentPreviewUrl}
            complete={hasGarment}
            onAction={() => {
              if (onUploadGarment) {
                garmentInputRef.current?.click();
                return;
              }
              onAddGarment();
            }}
            actionLabel={hasGarment ? 'Change Garment' : 'Upload Garment'}
            icon={<Shirt size={16} />}
          />
          <RequiredCard
            title="Subject"
            description="Select the model / person"
            previewUrl={subjectPreviewUrl}
            complete={hasSubject}
            onAction={() => {
              if (onUploadSubject) {
                subjectInputRef.current?.click();
                return;
              }
              onAddSubject();
            }}
            actionLabel={hasSubject ? 'Change Subject' : 'Upload Subject'}
            icon={<User size={16} />}
          />
        </div>

        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onAddSubject}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Choose Subject From Library
          </button>
        </div>

        <input
          ref={garmentInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file && onUploadGarment) {
              void onUploadGarment(file);
            }
          }}
        />
        <input
          ref={subjectInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file && onUploadSubject) {
              void onUploadSubject(file);
            }
          }}
        />

        <p className="mt-4 text-center text-sm font-medium text-gray-600">
          {readyToGenerate
            ? 'Ready to generate. Use the Generate button below.'
            : 'Generate unlocks after both required inputs are added.'}
        </p>
      </div>
    </div>
  );
}
