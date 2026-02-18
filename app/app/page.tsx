'use client';

import { useState, useCallback } from 'react';
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
import { DEFAULT_PROMPT, MAX_GARMENTS } from '@/lib/constants';
import type { UploadedImage, GenerationMode, ToolMode, GalleryItem } from '@/types';
import { AppStatus } from '@/types';
import { PostHogIdentify } from '@/components/PostHogIdentify';
import { Loader2, Images } from 'lucide-react';

export default function HomePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const { credits } = useCredits(user?.id ?? null);

  // Tool mode
  const [currentTool, setCurrentTool] = useState<ToolMode>('style-studio');

  // Generation inputs
  const [personImage, setPersonImage] = useState<UploadedImage | null>(null);
  const [garments, setGarments] = useState<UploadedImage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('single');

  // Settings
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [resolution, setResolution] = useState('1K');
  const [scene, setScene] = useState('');
  const [visualStyle, setVisualStyle] = useState('');

  // Subject modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  // Gallery
  const gallery = useGallery({ userId: user?.id ?? null });

  // Generation
  const generation = useGeneration({
    onGenerationSaved: gallery.addGeneration,
  });

  // Video generation
  const video = useVideoGeneration();

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
    });
  }, [personImage, garments, prompt, mode, scene, visualStyle, aspectRatio, resolution, generation, addToast]);

  const handleVideoGenerate = useCallback(async () => {
    const err = await video.generate();
    if (err) addToast(err, 'info');
  }, [video, addToast]);

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
      {/* Left Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 overflow-y-auto custom-scrollbar">
        <Header
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          onSignOut={signOut}
          credits={credits}
        />

        {currentTool === 'style-studio' ? (
          <div className="flex-1 px-6 py-4 space-y-6 overflow-y-auto custom-scrollbar">
            <SubjectSelector
              personImage={personImage}
              onOpenModal={() => setShowSubjectModal(true)}
              onSaveUpload={gallery.saveUpload}
              savingId={gallery.savingId}
            />

            <GarmentGrid
              garments={garments}
              mode={mode}
              onModeChange={setMode}
              onGarmentChange={handleGarmentChange}
              onSaveUpload={gallery.saveUpload}
              savingId={gallery.savingId}
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
        ) : (
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
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {currentTool === 'style-studio' ? (
          <>
            {/* Top Bar - Gallery Toggle */}
            <div className="p-4 flex justify-end">
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
                  onSelectUpload={handleGallerySelect}
                  onDelete={gallery.deleteItem}
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
              />
            )}
          </>
        ) : (
          <VideoGenerator
            status={video.status}
            videoUrl={video.videoUrl}
            progress={video.progress}
            errorMsg={video.errorMsg}
            prompt={video.prompt}
            onPromptChange={video.setPrompt}
            onGenerate={handleVideoGenerate}
            onReset={video.reset}
          />
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
