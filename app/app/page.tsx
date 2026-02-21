'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGallery } from '@/hooks/useGallery';
import { useGeneration } from '@/hooks/useGeneration';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { useToast } from '@/hooks/useToast';
import { useCredits } from '@/hooks/useCredits';
import { Header } from '@/components/Header';
import { SubjectSelector } from '@/components/SubjectSelector';
import { SubjectModal } from '@/components/SubjectModal';
import { GarmentGrid } from '@/components/GarmentGrid';
import { SettingsPanel } from '@/components/SettingsPanel';
import { PromptBar } from '@/components/PromptBar';
import { ResultDisplay } from '@/components/ResultDisplay';
import { Gallery } from '@/components/Gallery';
import { ToastContainer } from '@/components/Toast';
import { VideoGenerator } from '@/components/VideoGenerator';
import { VideoControls } from '@/components/VideoControls';
import { TemplatesExplorer, type TemplateOption } from '@/components/TemplatesExplorer';
import { BulkBackgroundRemover } from '@/components/BulkBackgroundRemover';
import { AssistantWorkspace } from '@/components/AssistantWorkspace';
import { GuideWorkspace } from '@/components/GuideWorkspace';
import { AcademyWorkspace } from '@/components/AcademyWorkspace';
import { DEFAULT_PROMPT, MAX_GARMENTS, MAX_FILE_SIZE_BYTES } from '@/lib/constants';
import { fileToBase64, readFileToDataUrl } from '@/lib/utils';
import type { UploadedImage, GenerationMode, ToolMode, GalleryItem } from '@/types';
import { PostHogIdentify } from '@/components/PostHogIdentify';
import { Loader2, Images } from 'lucide-react';

export default function HomePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const { credits, plan, refreshCredits } = useCredits(user?.id ?? null);
  const maxGenerations = plan === 'free' ? 1 : 4;

  // Tool mode
  const [currentTool, setCurrentTool] = useState<ToolMode>('style-studio');

  // Generation inputs
  const [personImage, setPersonImage] = useState<UploadedImage | null>(null);
  const [garments, setGarments] = useState<UploadedImage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('single');

  // Settings
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [resolution, setResolution] = useState('2K');
  const [generationCount, setGenerationCount] = useState(1);
  const [scene, setScene] = useState('');
  const [visualStyle, setVisualStyle] = useState('');

  useEffect(() => {
    setGenerationCount((prev) => Math.min(Math.max(prev, 1), maxGenerations));
  }, [maxGenerations]);

  // Subject modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'home' | 'templates' | 'assistant' | 'guide' | 'academy'>('templates');
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  // Gallery
  const gallery = useGallery({ userId: user?.id ?? null });

  // Generation
  const generation = useGeneration({
    onGenerationSaved: gallery.addGeneration,
    onCreditsRefresh: refreshCredits,
  });

  // Video generation
  const video = useVideoGeneration({
    onVideoSaved: gallery.addVideo,
    onCreditsRefresh: refreshCredits,
  });

  // Handlers
  const handleGarmentChange = useCallback(
    (image: UploadedImage | null, index: number) => {
      setGarments((prev) => {
        const next = [...prev];
        if (image) {
          next[index] = image;
        } else {
          next.splice(index, 1);
        }
        return next;
      });
    },
    [],
  );

  const handleGallerySelect = useCallback(
    async (item: GalleryItem, target: 'person' | 'garment') => {
      try {
        const uploadedImage = await gallery.selectGalleryItem(item);
        if (target === 'person') {
          setPersonImage(uploadedImage);
        } else {
          setGarments((prev) => {
            if (prev.length < MAX_GARMENTS) {
              return [...prev, uploadedImage];
            }
            addToast('All garment slots are full.', 'info');
            return prev;
          });
        }
      } catch {
        addToast('Failed to load image from gallery.', 'error');
      }
    },
    [gallery, addToast],
  );

  const handleSubjectGallerySelect = useCallback(
    async (item: GalleryItem) => {
      const uploadedImage = await gallery.selectGalleryItem(item);
      setPersonImage(uploadedImage);
      setShowSubjectModal(false);
    },
    [gallery],
  );

  const handleGenerate = useCallback(() => {
    if (credits !== null && credits <= 0) {
      addToast('You are out of credits. Upgrade your plan to continue.', 'error');
      window.location.href = '/pricing';
      return;
    }
    if (!personImage) {
      addToast('Please select a subject model first.', 'info');
      return;
    }
    if (garments.length === 0) {
      addToast('Please add at least one garment.', 'info');
      return;
    }

    generation.generateImage({
      personImage,
      garments,
      prompt: prompt || DEFAULT_PROMPT,
      mode,
      scene,
      visualStyle,
      aspectRatio,
      resolution,
      numGenerations: generationCount,
    });
  }, [credits, personImage, garments, prompt, mode, scene, visualStyle, aspectRatio, resolution, generationCount, generation, addToast]);

  // Remove background (gallery images)
  const [removingBgId, setRemovingBgId] = useState<string | null>(null);

  // Remove background (garment slots) — tracked as a Set to support parallel removals
  const [removingBgSlots, setRemovingBgSlots] = useState<Set<number>>(new Set());

  // Core BG removal for a single slot; takes the image directly to avoid stale closure issues
  const removeBgForSlot = useCallback(async (index: number, garment: UploadedImage) => {
    setRemovingBgSlots((prev) => new Set(prev).add(index));
    try {
      const res = await fetch('/api/generate/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: garment.base64, mimeType: garment.mimeType, saveToGallery: false }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Background removal failed');
      }
      const result = await res.json();
      setGarments((prev) => {
        const next = [...prev];
        next[index] = { base64: result.base64, previewUrl: result.previewUrl, mimeType: result.mimeType };
        return next;
      });
    } finally {
      setRemovingBgSlots((prev) => { const s = new Set(prev); s.delete(index); return s; });
    }
  }, []);

  const handleGarmentRemoveBg = useCallback(async (index: number) => {
    const garment = garments[index];
    if (!garment) return;
    try {
      await removeBgForSlot(index, garment);
      addToast('Background removed!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Background removal failed.', 'error');
    }
  }, [garments, addToast, removeBgForSlot]);

  const handleBulkGarmentDrop = useCallback(async (files: File[]) => {
    const availableSlots = MAX_GARMENTS - garments.length;
    if (availableSlots <= 0) {
      addToast('All garment slots are full.', 'info');
      return;
    }
    const toProcess = files
      .filter((f) => f.type.startsWith('image/') && f.size <= MAX_FILE_SIZE_BYTES)
      .slice(0, availableSlots);
    if (toProcess.length === 0) return;
    if (toProcess.length < files.length) {
      addToast(`${files.length - toProcess.length} file(s) skipped (wrong type or too large).`, 'info');
    }

    // Convert files → UploadedImage in parallel for instant previews
    const uploaded = await Promise.all(
      toProcess.map(async (file) => {
        const [previewUrl, base64] = await Promise.all([readFileToDataUrl(file), fileToBase64(file)]);
        return { file, previewUrl, base64, mimeType: file.type } as UploadedImage;
      }),
    );

    const startIndex = garments.length;
    // Show originals immediately
    setGarments((prev) => {
      const next = [...prev];
      uploaded.forEach((img, i) => { next[startIndex + i] = img; });
      return next;
    });

    // BG removal in parallel — failures toast per-slot but don't block others
    await Promise.allSettled(
      uploaded.map((img, i) =>
        removeBgForSlot(startIndex + i, img).catch((error) => {
          addToast(`Slot ${startIndex + i + 1}: ${error instanceof Error ? error.message : 'BG removal failed'}`, 'error');
        }),
      ),
    );
  }, [garments, addToast, removeBgForSlot]);

  const handleRemoveBg = useCallback(async (imageUrl: string, galleryId?: string) => {
    setRemovingBgId(galleryId ?? 'unsaved');
    try {
      const res = await fetch('/api/generate/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, galleryId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Background removal failed');
      }
      const saved = await res.json();
      gallery.addGeneration(saved);
      addToast('Background removed! New image saved to gallery.', 'success');
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Background removal failed.',
        'error',
      );
    } finally {
      setRemovingBgId(null);
    }
  }, [gallery, addToast]);

  const handleVideoGenerate = useCallback(async () => {
    if (credits !== null && credits <= 0) {
      addToast('You are out of credits. Upgrade your plan to continue.', 'error');
      window.location.href = '/pricing';
      return;
    }
    const err = await video.generate();
    if (err) addToast(err, 'info');
  }, [credits, video, addToast]);

  const handleUseTemplate = useCallback((template: TemplateOption) => {
    if (template.targetTool === 'style-studio') {
      setPrompt(template.defaultPrompt);
      if (template.generationMode) {
        setMode(template.generationMode);
      }
      setCurrentTool('style-studio');
    } else if (template.targetTool === 'video-generator') {
      video.setPrompt(template.defaultPrompt);
      setCurrentTool('video-generator');
    } else {
      setCurrentTool('bg-remover');
    }
    setActiveSection('home');
    addToast(`${template.title} loaded. Customize and generate when ready.`, 'success');
  }, [video, addToast]);

  const navigateHome = useCallback(() => {
    setActiveSection('home');
  }, []);

  const navigateTemplates = useCallback(() => {
    setActiveSection('templates');
  }, []);

  const navigateAssistant = useCallback(() => {
    setActiveSection('assistant');
  }, []);

  const navigateGuide = useCallback(() => {
    setActiveSection('guide');
  }, []);

  const navigateAcademy = useCallback(() => {
    setActiveSection('academy');
  }, []);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <PostHogIdentify user={user} />
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-10 bg-black/25 md:hidden"
        />
      )}
      {/* Left Sidebar */}
      <aside
        className={`z-20 flex h-screen shrink-0 flex-col border-r border-gray-100 bg-white transition-all duration-300 ${
          isMenuOpen ? 'w-80' : 'w-[78px]'
        }`}
      >
        <Header
          activeSection={activeSection}
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
          onNavigateHome={navigateHome}
          onNavigateTemplates={navigateTemplates}
          onNavigateAssistant={navigateAssistant}
          onNavigateGuide={navigateGuide}
          onNavigateAcademy={navigateAcademy}
          onSignOut={signOut}
          userEmail={user.email}
          credits={credits}
          plan={plan}
        />

        {!isMenuOpen ? (
          <div className="flex-1" />
        ) : activeSection === 'templates' || activeSection === 'assistant' || activeSection === 'guide' || activeSection === 'academy' ? (
          <div className="flex-1" />
        ) : currentTool === 'style-studio' ? (
          <div className="flex-1 px-6 py-4 space-y-6 overflow-y-auto custom-scrollbar">
            <SubjectSelector
              personImage={personImage}
              onOpenModal={() => setShowSubjectModal(true)}
              onSaveUpload={gallery.saveUpload}
              savingId={gallery.savingId}
            />

            <GarmentGrid
              garments={garments}
              onGarmentChange={handleGarmentChange}
              onSaveUpload={gallery.saveUpload}
              savingId={gallery.savingId}
              onRemoveBg={handleGarmentRemoveBg}
              removingBgSlots={removingBgSlots}
              onBulkDrop={handleBulkGarmentDrop}
            />

            <SettingsPanel
              aspectRatio={aspectRatio}
              resolution={resolution}
              scene={scene}
              visualStyle={visualStyle}
              onAspectRatioChange={setAspectRatio}
              onResolutionChange={setResolution}
              onSceneChange={setScene}
              onVisualStyleChange={setVisualStyle}
            />
          </div>
        ) : currentTool === 'video-generator' ? (
          <div className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar">
            <VideoControls
              referenceImage={video.referenceImage}
              onReferenceImageChange={video.setReferenceImage}
              aspectRatio={video.aspectRatio}
              onAspectRatioChange={video.setAspectRatio}
              duration={video.duration}
              onDurationChange={video.setDuration}
              sound={video.sound}
              onSoundChange={video.setSound}
            />
          </div>
        ) : currentTool === 'bg-remover' ? (
          <div className="flex-1 px-6 py-5 overflow-y-auto custom-scrollbar">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Tool</p>
              <h3 className="mt-1 text-sm font-semibold text-gray-900">Bulk Background Removal</h3>
              <p className="mt-2 text-sm text-gray-600">
                Drop multiple images, process in one batch, and download transparent outputs.
              </p>
            </div>
          </div>
        ) : null}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {activeSection === 'templates' ? (
          <div className="h-[calc(100vh-1.5rem)] p-3 md:p-6">
            <TemplatesExplorer onUseTemplate={handleUseTemplate} />
          </div>
        ) : activeSection === 'assistant' ? (
          <AssistantWorkspace />
        ) : activeSection === 'guide' ? (
          <GuideWorkspace />
        ) : activeSection === 'academy' ? (
          <AcademyWorkspace />
        ) : currentTool === 'style-studio' ? (
          <>
            {/* Top Bar - Gallery Toggle */}
            <div className="p-4 flex justify-end gap-2">
              <button
                onClick={navigateTemplates}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                Templates
              </button>
              <button
                onClick={() => gallery.setShowLibrary(!gallery.showLibrary)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  gallery.showLibrary
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Images size={16} />
                Gallery
              </button>
            </div>

            {/* Result / Gallery Area */}
            <div className="flex-1 px-8 pb-24">
              {gallery.showLibrary ? (
                <Gallery
                  uploads={gallery.uploads}
                  generations={gallery.generations}
                  videos={gallery.videos}
                  onSelectUpload={handleGallerySelect}
                  onDelete={gallery.deleteItem}
                  onDeleteVideo={gallery.deleteVideo}
                  onUpload={gallery.directUpload}
                />
              ) : (
                <ResultDisplay
                  status={generation.status}
                  resultImage={generation.resultImage}
                  generations={gallery.generations}
                  progress={generation.progress}
                  onReset={generation.reset}
                  onDelete={(id) => gallery.deleteItem(id, 'generation')}
                  onRemoveBg={handleRemoveBg}
                  removingBgId={removingBgId}
                />
              )}
            </div>

            {/* Floating Prompt Bar */}
            {!gallery.showLibrary && (
              <PromptBar
                prompt={prompt}
                onPromptChange={setPrompt}
                onGenerate={handleGenerate}
                status={generation.status}
                generationCount={generationCount}
                maxGenerations={maxGenerations}
                onGenerationCountChange={(next) =>
                  setGenerationCount(
                    Math.min(maxGenerations, Math.max(1, next)),
                  )
                }
                credits={credits}
              />
            )}
          </>
        ) : currentTool === 'video-generator' ? (
          <>
            <div className="p-4 flex justify-end">
              <button
                onClick={navigateTemplates}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                Templates
              </button>
            </div>
            <VideoGenerator
              status={video.status}
              videos={video.videos}
              progress={video.progress}
              errorMsg={video.errorMsg}
              prompt={video.prompt}
              onPromptChange={video.setPrompt}
              onGenerate={handleVideoGenerate}
              onReset={video.reset}
              onRemoveVideo={video.removeVideo}
              credits={credits}
            />
          </>
        ) : (
          <>
            <div className="p-4 flex justify-end">
              <button
                onClick={navigateTemplates}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                Templates
              </button>
            </div>
            <div className="flex-1 pb-4">
              <BulkBackgroundRemover />
            </div>
          </>
        )}
      </main>

      {/* Subject Selection Modal */}
      <SubjectModal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        onSelectImage={setPersonImage}
        galleryUploads={gallery.uploads}
        onGallerySelect={handleSubjectGallerySelect}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
