'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGallery } from '@/hooks/useGallery';
import { useGeneration } from '@/hooks/useGeneration';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { useToast } from '@/hooks/useToast';
import { useCredits } from '@/hooks/useCredits';
import { Header } from '@/components/Header';
import { SubjectSelector } from '@/components/SubjectSelector';
import { SubjectModal } from '@/components/SubjectModal';
import { EnvironmentPickerModal } from '@/components/EnvironmentPickerModal';
import { GarmentGrid } from '@/components/GarmentGrid';
import { SettingsPanel } from '@/components/SettingsPanel';
import { PromptBar } from '@/components/PromptBar';
import { ResultDisplay } from '@/components/ResultDisplay';
import { Gallery } from '@/components/Gallery';
import { ToastContainer } from '@/components/Toast';
import { VideoGenerator } from '@/components/VideoGenerator';
import { VideoControls } from '@/components/VideoControls';
import {
  TemplatesExplorer,
  TEMPLATE_OPTIONS,
  type TemplateOption,
} from '@/components/TemplatesExplorer';
import { BulkBackgroundRemover } from '@/components/BulkBackgroundRemover';
import { AssistantWorkspace } from '@/components/AssistantWorkspace';
import { GuideWorkspace } from '@/components/GuideWorkspace';
import { AcademyWorkspace } from '@/components/AcademyWorkspace';
import { SingleSwapGuide } from '@/components/SingleSwapGuide';
import { OnboardingQuickStartFeed } from '@/components/OnboardingQuickStartFeed';
import { TemplateIndustryPicker } from '@/components/TemplateIndustryPicker';
import { VideoTemplatePickerModal } from '@/components/VideoTemplatePickerModal';
import {
  OnboardingQuestionnaire,
  ONBOARDING_GOAL_LABELS,
  ONBOARDING_INDUSTRY_LABELS,
  type OnboardingGoal,
  type OnboardingIndustry,
} from '@/components/OnboardingQuestionnaire';
import { DEFAULT_PROMPT, MAX_GARMENTS, MAX_FILE_SIZE_BYTES } from '@/lib/constants';
import { fileToBase64, readFileToDataUrl } from '@/lib/utils';
import {
  AppStatus,
  type UploadedImage,
  type GenerationMode,
  type ToolMode,
  type GalleryItem,
  type VideoEnvironmentSelection,
} from '@/types';
import { PostHogIdentify } from '@/components/PostHogIdentify';
import { useWorkspaceState } from '@/components/WorkspaceStateProvider';
import {
  APP_ROUTES,
  resolveLegacyToolRoute,
  resolveRouteState,
  toToolRoute,
} from '@/lib/app-routes';
import { Loader2, Images } from 'lucide-react';

const ONBOARDING_GOAL_TEMPLATE_MAP: Record<OnboardingGoal, string> = {
  'product-ads': 'product-ads',
  'catalog-listings': 'marketplace-listings',
  'editorial-shoot': 'lookbook-editorial',
  'influencer-video': 'ugc-reels',
  'launch-campaign': 'launch-campaign-video',
  'whatsapp-status-pack': 'social-campaign',
};

const VIDEO_TEMPLATE_OPTIONS: TemplateOption[] = TEMPLATE_OPTIONS.filter(
  (option) => option.targetTool === 'video-generator',
);

const UI_TEST_AUTH_BYPASS = process.env.NEXT_PUBLIC_PW_E2E_AUTH_BYPASS === '1';

type OnboardingSelection = {
  industry: OnboardingIndustry;
  goal: OnboardingGoal;
};

const ONBOARDING_GOAL_TOOL_MAP: Record<OnboardingGoal, ToolMode> = {
  'product-ads': 'style-studio',
  'catalog-listings': 'bg-remover',
  'editorial-shoot': 'style-studio',
  'influencer-video': 'video-generator',
  'launch-campaign': 'video-generator',
  'whatsapp-status-pack': 'style-studio',
};

const VALID_ONBOARDING_INDUSTRIES: OnboardingIndustry[] = [
  'garments',
  'fabrics',
  'jewelry',
  'footwear',
  'bags',
  'beauty',
  'electronics',
  'home-goods',
  'other',
];

const VALID_ONBOARDING_GOALS: OnboardingGoal[] = [
  'product-ads',
  'catalog-listings',
  'editorial-shoot',
  'influencer-video',
  'launch-campaign',
  'whatsapp-status-pack',
];

function isValidIndustry(value: unknown): value is OnboardingIndustry {
  return (
    typeof value === 'string' &&
    VALID_ONBOARDING_INDUSTRIES.includes(value as OnboardingIndustry)
  );
}

function isValidGoal(value: unknown): value is OnboardingGoal {
  return (
    typeof value === 'string' &&
    VALID_ONBOARDING_GOALS.includes(value as OnboardingGoal)
  );
}

function isProductFirstIndustry(industry: OnboardingIndustry) {
  return ['jewelry', 'beauty', 'electronics', 'home-goods', 'other'].includes(
    industry,
  );
}

function buildOnboardingPrompt(selection: OnboardingSelection) {
  const industryLabel = ONBOARDING_INDUSTRY_LABELS[selection.industry];
  switch (selection.goal) {
    case 'product-ads':
      return `Create a high-conversion product ad visual for ${industryLabel}. Keep the product as hero, use clean composition, premium lighting, and mobile-first framing for social commerce.`;
    case 'catalog-listings':
      return `Generate clean catalog-ready product visuals for ${industryLabel}. Ensure accurate colors, clear edges, uncluttered background, and marketplace-friendly composition.`;
    case 'editorial-shoot':
      return `Create an editorial campaign visual for ${industryLabel} with premium art direction, intentional mood, and polished brand storytelling.`;
    case 'influencer-video':
      return `Create a short influencer-style showcase video for ${industryLabel} products with engaging pacing and social-ready storytelling.`;
    case 'launch-campaign':
      return `Produce a launch campaign concept for ${industryLabel} with bold hero moments and promotional clarity for mobile audiences.`;
    case 'whatsapp-status-pack':
      return `Create a WhatsApp status-ready product creative for ${industryLabel} with clear pricing/CTA space and fast-scanning mobile layout.`;
    default:
      return DEFAULT_PROMPT;
  }
}

function getIndustryProductLabel(industry: OnboardingIndustry) {
  switch (industry) {
    case 'garments':
      return 'garment';
    case 'fabrics':
      return 'fabric product';
    case 'jewelry':
      return 'jewelry piece';
    case 'footwear':
      return 'footwear product';
    case 'bags':
      return 'bag product';
    case 'beauty':
      return 'beauty product';
    case 'electronics':
      return 'electronic product';
    case 'home-goods':
      return 'home product';
    default:
      return 'physical product';
  }
}

function buildIndustryAwareTemplatePrompt(
  template: TemplateOption,
  industry: OnboardingIndustry,
  basePrompt: string,
) {
  if (industry === 'garments') return basePrompt;

  const industryLabel = ONBOARDING_INDUSTRY_LABELS[industry];
  const productLabel = getIndustryProductLabel(industry);

  switch (template.id) {
    case 'single-swap':
      return `Create one polished hero image featuring the uploaded ${productLabel} for ${industryLabel}. Keep product shape, color, logo, and material details accurate with clean premium lighting and mobile-first composition.`;
    case 'multi-shot':
      return `Generate a 2x2 creative set for the uploaded ${productLabel} in ${industryLabel}. Show four distinct angles or scene variations while preserving exact product details and brand consistency.`;
    case 'website-shoot':
      return `Create a storefront-ready website hero visual for the uploaded ${productLabel} in ${industryLabel}. Use clean composition, premium lighting, and conversion-focused framing.`;
    case 'social-campaign':
      return `Create a social campaign visual for the uploaded ${productLabel} in ${industryLabel} with bold framing, high contrast, and fast-scanning mobile composition.`;
    case 'product-ads':
      return `Design a conversion-focused product ad visual for the uploaded ${productLabel} in ${industryLabel}. Keep product clarity high, include CTA-safe space, and maintain accurate materials/colors.`;
    case 'launch-campaign-video':
      return `Create a launch campaign video for the uploaded ${productLabel} in ${industryLabel} with high-energy pacing, product-first storytelling, and clear promotional moments for social channels.`;
    case 'remove-background-batch':
      return `Remove backgrounds cleanly from uploaded ${industryLabel} product photos while preserving edge detail and true product color.`;
    case 'rotation-360':
      return `Create a smooth 360 rotation video of the uploaded ${productLabel} in ${industryLabel} with stable motion, clean background, and clear material visibility from all angles.`;
    case 'lookbook-editorial':
      return `Create an editorial campaign visual for the uploaded ${productLabel} in ${industryLabel} with art-directed composition, premium styling, and strong brand storytelling.`;
    case 'ugc-reels':
      return `Create a short UGC-style promo video for the uploaded ${productLabel} in ${industryLabel} with authentic pacing, product close-ups, and social-ready framing.`;
    case 'seasonal-drop':
      return `Create a seasonal launch visual for the uploaded ${productLabel} in ${industryLabel} with timely mood, strong product focus, and campaign-ready polish.`;
    case 'marketplace-listings':
      return `Generate a clean marketplace listing visual for the uploaded ${productLabel} in ${industryLabel} with neutral background, accurate colors, and platform-safe composition.`;
    default:
      return `${basePrompt} Focus on ${industryLabel} products, not clothing try-on. Keep product details accurate and clearly visible.`;
  }
}

export function AppWorkspacePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const { credits, plan, refreshCredits } = useCredits(user?.id ?? null);
  const {
    galleryOpen,
    setGalleryOpen,
    activeTemplateId,
    setActiveTemplateId,
  } = useWorkspaceState();
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

  // Subject / Environment modals
  const [subjectModalTarget, setSubjectModalTarget] = useState<'style' | 'video' | null>(null);
  const [showEnvironmentModal, setShowEnvironmentModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'home' | 'templates' | 'assistant' | 'guide' | 'academy'>('templates');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [onboardingSelection, setOnboardingSelection] = useState<OnboardingSelection | null>(null);
  const [hideOnboardingQuickStart, setHideOnboardingQuickStart] = useState(false);
  const [showTemplateIndustryPicker, setShowTemplateIndustryPicker] = useState(false);
  const [pendingTemplateSelection, setPendingTemplateSelection] = useState<TemplateOption | null>(null);
  const [showVideoTemplatePicker, setShowVideoTemplatePicker] = useState(false);
  const [videoTemplateSourceUrl, setVideoTemplateSourceUrl] = useState<string | null>(null);
  const [templateIndustryPreference, setTemplateIndustryPreference] = useState<OnboardingIndustry>('garments');
  const [guideFocusTarget, setGuideFocusTarget] = useState<'garment' | 'subject' | null>(null);
  const [showImageToVideoPrompt, setShowImageToVideoPrompt] = useState(false);
  const [imageToVideoPrompt, setImageToVideoPrompt] = useState('');
  const [pendingVideoProductSlot, setPendingVideoProductSlot] = useState<number | null>(null);
  const [videoUploadTarget, setVideoUploadTarget] = useState<'simple' | 'advanced'>('simple');
  const subjectSectionRef = useRef<HTMLDivElement | null>(null);
  const garmentSectionRef = useRef<HTMLDivElement | null>(null);
  const quickGarmentInputRef = useRef<HTMLInputElement | null>(null);
  const quickVideoProductInputRef = useRef<HTMLInputElement | null>(null);
  const onboardingStorageKey = user?.id ? `fitcheck:onboarding:intake:v1:${user.id}` : null;

  useEffect(() => {
    if (pathname !== APP_ROUTES.root) return;
    const params = new URLSearchParams(window.location.search);
    const legacyRoute = resolveLegacyToolRoute(params.get('tool'));
    router.replace(legacyRoute ?? APP_ROUTES.image);
  }, [pathname, router]);

  useEffect(() => {
    const routeState = resolveRouteState(pathname);
    if (routeState.section === 'onboarding') {
      setShowOnboardingWizard(true);
      setActiveSection('home');
      setCurrentTool('style-studio');
      return;
    }

    setShowOnboardingWizard(false);
    setActiveSection(routeState.section);
    setCurrentTool(routeState.tool);
  }, [pathname]);

  useEffect(() => {
    if (!onboardingStorageKey) {
      setShowOnboardingWizard(false);
      setOnboardingSelection(null);
      return;
    }

    let isCompleted = false;
    let loadedSelection: OnboardingSelection | null = null;
    try {
      const rawValue = window.localStorage.getItem(onboardingStorageKey);
      if (rawValue === '1') {
        isCompleted = true;
      } else if (rawValue) {
        const parsed = JSON.parse(rawValue) as {
          completed?: unknown;
          industry?: unknown;
          goal?: unknown;
        };
        if (parsed?.completed === true) {
          isCompleted = true;
        }
        if (isValidIndustry(parsed?.industry) && isValidGoal(parsed?.goal)) {
          loadedSelection = {
            industry: parsed.industry,
            goal: parsed.goal,
          };
          isCompleted = true;
        }
      }
    } catch {
      isCompleted = false;
      loadedSelection = null;
    }

    setOnboardingSelection(loadedSelection);
    // Keep quick-start auto-hidden after first-time onboarding; users can reopen onboarding manually from sidebar.
    setHideOnboardingQuickStart(isCompleted);
    if (loadedSelection?.industry) {
      setTemplateIndustryPreference(loadedSelection.industry);
    }

    if (isCompleted) {
      setShowOnboardingWizard(false);
      if (pathname === APP_ROUTES.onboarding) {
        router.replace(APP_ROUTES.image);
      }
      return;
    }

    setShowOnboardingWizard(true);
    if (pathname !== APP_ROUTES.onboarding) {
      router.replace(APP_ROUTES.onboarding);
    }
  }, [onboardingStorageKey, pathname, router]);

  // Gallery
  const gallery = useGallery({ userId: user?.id ?? null });
  const { showLibrary, setShowLibrary } = gallery;

  useEffect(() => {
    setShowLibrary(galleryOpen);
  }, [galleryOpen, setShowLibrary]);

  useEffect(() => {
    setGalleryOpen(showLibrary);
  }, [showLibrary, setGalleryOpen]);

  // Generation
  const generation = useGeneration({
    onGenerationSaved: gallery.addGeneration,
    onCreditsRefresh: refreshCredits,
    onWarning: (message) => addToast(message, 'info'),
  });

  // Video generation
  const video = useVideoGeneration({
    onVideoSaved: gallery.addVideo,
    onCreditsRefresh: refreshCredits,
    onWarning: (message) => addToast(message, 'info'),
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
      setSubjectModalTarget(null);
    },
    [gallery],
  );

  const handleGenerate = useCallback(() => {
    if (credits !== null && credits <= 0) {
      addToast('You are out of credits. Upgrade your plan to continue.', 'error');
      window.location.href = '/pricing';
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
      templateId: activeTemplateId,
    });
  }, [
    credits,
    personImage,
    garments,
    prompt,
    mode,
    scene,
    visualStyle,
    aspectRatio,
    resolution,
    generationCount,
    activeTemplateId,
    generation,
    addToast,
  ]);

  const focusGuideTarget = useCallback((target: 'garment' | 'subject') => {
    router.push(APP_ROUTES.image);
    setIsMenuOpen(true);
    setGuideFocusTarget(target);

    if (target === 'subject') {
      subjectSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSubjectModalTarget('style');
    } else {
      garmentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    window.setTimeout(() => setGuideFocusTarget(null), 1800);
  }, [router]);

  // Remove background (gallery images)
  const [removingBgId, setRemovingBgId] = useState<string | null>(null);

  // Remove background (garment slots) Ã¢â‚¬â€ tracked as a Set to support parallel removals
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

    // Convert files Ã¢â€ â€™ UploadedImage in parallel for instant previews
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

    // BG removal in parallel Ã¢â‚¬â€ failures toast per-slot but don't block others
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

  const handleVideoGenerate = useCallback(async (promptOverride?: string | unknown) => {
    if (credits !== null && credits <= 0) {
      addToast('You are out of credits. Upgrade your plan to continue.', 'error');
      window.location.href = '/pricing';
      return;
    }

    if (video.mode === 'advanced' && plan !== 'premium' && plan !== 'admin') {
      addToast('Advanced video mode is available on Premium plan.', 'info');
      return;
    }

    const safePrompt = typeof promptOverride === 'string' ? promptOverride : undefined;
    const err = await video.generate(safePrompt, { templateId: activeTemplateId });
    if (err) addToast(err, 'info');
  }, [credits, video, addToast, activeTemplateId, plan]);

  const completeOnboarding = useCallback((selection?: OnboardingSelection) => {
    setShowOnboardingWizard(false);
    setOnboardingSelection(selection ?? null);
    setHideOnboardingQuickStart(false);
    if (!onboardingStorageKey) return;

    try {
      if (selection) {
        window.localStorage.setItem(
          onboardingStorageKey,
          JSON.stringify({
            completed: true,
            industry: selection.industry,
            goal: selection.goal,
            completedAt: Date.now(),
          }),
        );
      } else {
        window.localStorage.setItem(onboardingStorageKey, '1');
      }
    } catch {
      // Ignore storage failures and continue.
    }
    if (pathname === APP_ROUTES.onboarding) {
      router.replace(APP_ROUTES.image);
    }
  }, [onboardingStorageKey, pathname, router]);

  const buildUploadedImage = useCallback(async (file: File): Promise<UploadedImage | null> => {
    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file.', 'info');
      return null;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      addToast('File is too large. Max size is 20MB.', 'info');
      return null;
    }

    const [previewUrl, base64] = await Promise.all([readFileToDataUrl(file), fileToBase64(file)]);
    return { file, previewUrl, base64, mimeType: file.type };
  }, [addToast]);

  const buildUploadedImageFromUrl = useCallback(async (imageUrl: string): Promise<UploadedImage> => {
    const fetchUrl = imageUrl.startsWith('data:')
      ? imageUrl
      : `/api/download?url=${encodeURIComponent(imageUrl)}`;

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      throw new Error('Failed to load selected image for video reference.');
    }

    const blob = await res.blob();
    const mimeType = blob.type || 'image/png';
    const extension = mimeType.includes('webp')
      ? 'webp'
      : mimeType.includes('png')
        ? 'png'
        : 'jpg';
    const file = new File([blob], `video-reference.${extension}`, {
      type: mimeType,
    });

    const [previewUrl, base64] = await Promise.all([
      readFileToDataUrl(file),
      fileToBase64(file),
    ]);

    return { file, previewUrl, base64, mimeType };
  }, []);

  const handleSingleSwapGarmentUpload = useCallback(async (file: File) => {
    const uploaded = await buildUploadedImage(file);
    if (!uploaded) return;

    setGarments((prev) => {
      if (prev.length === 0) return [uploaded];
      const next = [...prev];
      next[0] = uploaded;
      return next;
    });
  }, [buildUploadedImage]);

  const handleSingleSwapSubjectUpload = useCallback(async (file: File) => {
    const uploaded = await buildUploadedImage(file);
    if (!uploaded) return;
    setPersonImage(uploaded);
  }, [buildUploadedImage]);

  const openVideoSimpleReferenceUpload = useCallback(() => {
    setVideoUploadTarget('simple');
    setPendingVideoProductSlot(null);
    video.setMode('simple');
    quickVideoProductInputRef.current?.click();
  }, [video]);

  const openVideoProductUpload = useCallback((slotIndex?: number) => {
    if (typeof slotIndex !== 'number' && video.productImages.length >= 4) {
      addToast('Max 4 products reached. Replace an existing product slot.', 'info');
      return;
    }

    setVideoUploadTarget('advanced');
    video.setMode('advanced');
    setPendingVideoProductSlot(typeof slotIndex === 'number' ? slotIndex : null);
    quickVideoProductInputRef.current?.click();
  }, [video, addToast]);

  const handleVideoSimpleReferenceUpload = useCallback(async (file: File) => {
    const uploaded = await buildUploadedImage(file);
    if (!uploaded) return;

    video.setSimpleReferenceImage(uploaded);
    video.setMode('simple');
    addToast('Video reference image added.', 'success');
  }, [buildUploadedImage, video, addToast]);

  const handleVideoProductUpload = useCallback(async (file: File, slotIndex?: number | null) => {
    const uploaded = await buildUploadedImage(file);
    if (!uploaded) return;

    if (typeof slotIndex !== 'number' && video.productImages.length >= 4) {
      addToast('Max 4 products reached. Replace an existing product slot.', 'info');
      return;
    }

    video.addOrReplaceProduct(uploaded, typeof slotIndex === 'number' ? slotIndex : undefined);
    video.setMode('advanced');
    addToast('Product photo added for advanced video generation.', 'success');
  }, [buildUploadedImage, video, addToast]);

  const handleVideoSimpleReferenceGallerySelect = useCallback(
    async (item: GalleryItem) => {
      try {
        const uploadedImage = await gallery.selectGalleryItem(item);
        video.setSimpleReferenceImage(uploadedImage);
        video.setMode('simple');
        gallery.setShowLibrary(false);
        setPendingVideoProductSlot(null);
        addToast('Reference image selected for video generation.', 'success');
      } catch {
        addToast('Failed to load image from gallery.', 'error');
      }
    },
    [gallery, video, addToast],
  );

  const handleVideoProductGallerySelect = useCallback(
    async (item: GalleryItem, slotIndex?: number | null) => {
      try {
        if (typeof slotIndex !== 'number' && video.productImages.length >= 4) {
          addToast('Max 4 products reached. Replace an existing product slot.', 'info');
          return;
        }

        const uploadedImage = await gallery.selectGalleryItem(item);
        video.addOrReplaceProduct(uploadedImage, typeof slotIndex === 'number' ? slotIndex : undefined);
        video.setMode('advanced');
        gallery.setShowLibrary(false);
        setPendingVideoProductSlot(null);
        addToast('Product image selected for advanced video generation.', 'success');
      } catch {
        addToast('Failed to load image from gallery.', 'error');
      }
    },
    [gallery, video, addToast],
  );

  const handleVideoSubjectSelect = useCallback((image: UploadedImage) => {
    video.setMode('advanced');
    video.setSubjectImage(image);
    setSubjectModalTarget(null);
    addToast('Subject reference added.', 'success');
  }, [video, addToast]);

  const handleVideoSubjectGallerySelect = useCallback(async (item: GalleryItem) => {
    try {
      const uploadedImage = await gallery.selectGalleryItem(item);
      video.setMode('advanced');
      video.setSubjectImage(uploadedImage);
      setSubjectModalTarget(null);
      addToast('Subject selected from gallery.', 'success');
    } catch {
      addToast('Failed to load image from gallery.', 'error');
    }
  }, [gallery, video, addToast]);

  const handleVideoEnvironmentSelect = useCallback((selection: VideoEnvironmentSelection) => {
    video.setMode('advanced');
    video.setEnvironment(selection);
    setShowEnvironmentModal(false);
    addToast(
      selection.type === 'preset'
        ? 'Environment preset selected.'
        : 'Environment image selected.',
      'success',
    );
  }, [video, addToast]);

  const handleQuickStartPrimaryAction = useCallback(() => {
    router.push(APP_ROUTES.image);
    quickGarmentInputRef.current?.click();
  }, [router]);

  const handleQuickStartSecondaryAction = useCallback(() => {
    router.push(APP_ROUTES.image);
    setSubjectModalTarget('style');
  }, [router]);

  const pickTemplatePrompt = useCallback((template: TemplateOption) => {
    const presets = template.presetPrompts?.filter(Boolean) ?? [];
    if (presets.length === 0) return template.defaultPrompt;
    const index = Math.floor(Math.random() * presets.length);
    return presets[index];
  }, []);

  const applyTemplateSelection = useCallback((
    template: TemplateOption,
    options?: {
      promptContext?: string;
      successMessage?: string;
      promptOverride?: string;
    },
  ) => {
    const selectedPrompt = options?.promptOverride ?? pickTemplatePrompt(template);
    const resolvedPrompt = options?.promptContext
      ? `${selectedPrompt} ${options.promptContext}`.trim()
      : selectedPrompt;

    if (template.targetTool === 'style-studio') {
      setPrompt(resolvedPrompt);
      if (template.generationMode) {
        setMode(template.generationMode);
      }
      if (template.generationMode === 'single') {
        setIsMenuOpen(true);
      }
      router.push(APP_ROUTES.image);
    } else if (template.targetTool === 'video-generator') {
      video.setMode('simple');
      video.setPrompt(resolvedPrompt);
      router.push(APP_ROUTES.video);
    } else {
      router.push(APP_ROUTES.image);
    }
    setActiveTemplateId(template.id);
    addToast(
      options?.successMessage ??
        `${template.title} loaded. Customize and generate when ready.`,
      'success',
    );
  }, [pickTemplatePrompt, video, addToast, router, setActiveTemplateId]);

  const handleUseTemplate = useCallback((template: TemplateOption) => {
    setPendingTemplateSelection(template);
    setShowTemplateIndustryPicker(true);
  }, []);

  const handleCloseTemplateIndustryPicker = useCallback(() => {
    setShowTemplateIndustryPicker(false);
    setPendingTemplateSelection(null);
  }, []);

  const handleTemplateIndustryConfirm = useCallback((industry: OnboardingIndustry) => {
    if (!pendingTemplateSelection) {
      setShowTemplateIndustryPicker(false);
      return;
    }

    const basePrompt = pickTemplatePrompt(pendingTemplateSelection);
    const industryPrompt = buildIndustryAwareTemplatePrompt(
      pendingTemplateSelection,
      industry,
      basePrompt,
    );

    setTemplateIndustryPreference(industry);
    applyTemplateSelection(pendingTemplateSelection, {
      promptOverride: industryPrompt,
      successMessage: `${pendingTemplateSelection.title} loaded for ${ONBOARDING_INDUSTRY_LABELS[industry]}. Upload your product image to continue.`,
    });
    setShowTemplateIndustryPicker(false);
    setPendingTemplateSelection(null);

    if (pendingTemplateSelection.targetTool === 'style-studio') {
      window.setTimeout(() => {
        quickGarmentInputRef.current?.click();
      }, 140);
    }
  }, [pendingTemplateSelection, pickTemplatePrompt, applyTemplateSelection]);

  const handleOpenVideoTemplatePicker = useCallback(
    (imageUrl: string, _galleryId?: string) => {
      setVideoTemplateSourceUrl(imageUrl);
      setShowVideoTemplatePicker(true);
    },
    [],
  );

  const handleCloseVideoTemplatePicker = useCallback(() => {
    setShowVideoTemplatePicker(false);
    setVideoTemplateSourceUrl(null);
  }, []);

  const handleVideoTemplateSelectFromImage = useCallback(
    async (template: TemplateOption) => {
      if (!videoTemplateSourceUrl) return;

      try {
        const selectedPrompt = pickTemplatePrompt(template);
        const resolvedPrompt = onboardingSelection
          ? buildIndustryAwareTemplatePrompt(
              template,
              onboardingSelection.industry,
              selectedPrompt,
            )
          : selectedPrompt;

        const referenceImage = await buildUploadedImageFromUrl(
          videoTemplateSourceUrl,
        );

        video.setReferenceImage(referenceImage);
        video.setPrompt(resolvedPrompt);
        setActiveTemplateId(template.id);
        router.push(APP_ROUTES.video);
        gallery.setShowLibrary(false);
        setShowVideoTemplatePicker(false);
        setVideoTemplateSourceUrl(null);
        addToast(
          `${template.title} loaded. Click Generate to create a video from this image.`,
          'success',
        );
      } catch (error) {
        addToast(
          error instanceof Error
            ? error.message
            : 'Failed to prepare image for video generation.',
          'error',
        );
      }
    },
    [
      videoTemplateSourceUrl,
      pickTemplatePrompt,
      onboardingSelection,
      buildUploadedImageFromUrl,
      video,
      setActiveTemplateId,
      gallery,
      addToast,
      router,
    ],
  );

  const navigateHome = useCallback(() => {
    router.push(toToolRoute(currentTool));
  }, [router, currentTool]);

  const navigateImage = useCallback(() => {
    setMode('single');
    router.push(APP_ROUTES.image);
  }, [router]);

  const navigateVideo = useCallback(() => {
    router.push(APP_ROUTES.video);
  }, [router]);

  const navigateTemplates = useCallback(() => {
    router.push(APP_ROUTES.templates);
  }, [router]);

  const navigateAssistant = useCallback(() => {
    router.push(APP_ROUTES.assistant);
  }, [router]);

  const navigateGuide = useCallback(() => {
    router.push(APP_ROUTES.guide);
  }, [router]);

  const navigateOnboarding = useCallback(() => {
    setShowOnboardingWizard(true);
    router.push(APP_ROUTES.onboarding);
  }, [router]);

  const navigateAcademy = useCallback(() => {
    router.push(APP_ROUTES.academy);
  }, [router]);

  const latestImageForVideoUrl =
    generation.resultImage ?? gallery.generations[0]?.url ?? null;

  const handleUseLatestImageForVideoReference = useCallback(async () => {
    if (!latestImageForVideoUrl) {
      addToast('Generate at least one image first, then use it as video reference.', 'info');
      return;
    }

    try {
      const referenceImage = await buildUploadedImageFromUrl(latestImageForVideoUrl);
      video.setSimpleReferenceImage(referenceImage);
      video.setMode('simple');
      gallery.setShowLibrary(false);
      addToast('Latest generated image loaded as video reference.', 'success');
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : 'Failed to prepare image for video generation.',
        'error',
      );
    }
  }, [latestImageForVideoUrl, buildUploadedImageFromUrl, video, gallery, addToast]);

  const handleGenerateVideoFromImageScreen = useCallback(async () => {
    if (credits !== null && credits <= 0) {
      addToast('You are out of credits. Upgrade your plan to continue.', 'error');
      window.location.href = '/pricing';
      return;
    }

    if (!latestImageForVideoUrl) {
      addToast('Generate at least one image first, then create a video from it.', 'info');
      return;
    }

    const trimmedPrompt = imageToVideoPrompt.trim();
    if (!trimmedPrompt) {
      addToast('Please enter a prompt for the video.', 'info');
      return;
    }

    try {
      const referenceImage = await buildUploadedImageFromUrl(latestImageForVideoUrl);
      video.setReferenceImage(referenceImage);
      video.setPrompt(trimmedPrompt);

      const err = await video.generate(trimmedPrompt, {
        templateId: activeTemplateId,
      });
      if (err) {
        addToast(err, 'info');
        return;
      }

      setShowImageToVideoPrompt(false);
      setImageToVideoPrompt('');
      router.push(APP_ROUTES.video);
      gallery.setShowLibrary(false);
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : 'Failed to prepare image for video generation.',
        'error',
      );
    }
  }, [
    credits,
    latestImageForVideoUrl,
    imageToVideoPrompt,
    buildUploadedImageFromUrl,
    video,
    activeTemplateId,
    addToast,
    gallery,
    router,
  ]);

  const hasSubject = Boolean(personImage);
  const hasGarment = garments.length > 0;
  const useProductLanguage = Boolean(
    onboardingSelection && isProductFirstIndustry(onboardingSelection.industry),
  );
  const canGenerateFromInputs = hasGarment;
  const primaryInputActionLabel = useProductLanguage
    ? hasGarment
      ? 'Change Product Photo'
      : 'Upload Product Photo'
    : hasGarment
      ? 'Change Garment'
      : 'Upload Garment';
  const secondaryInputActionLabel = hasSubject
    ? 'Change Subject Reference (Optional)'
    : 'Add Subject Reference (Optional)';
  const dynamicBlockedReason = 'Upload a garment first';

  const handleOnboardingQuestionnaireComplete = useCallback((
    selection: { industry: OnboardingIndustry; goal: OnboardingGoal },
  ) => {
    const selectedTool = ONBOARDING_GOAL_TOOL_MAP[selection.goal];
    const industryLabel = ONBOARDING_INDUSTRY_LABELS[selection.industry];
    const goalLabel = ONBOARDING_GOAL_LABELS[selection.goal];
    const intakePrompt = buildOnboardingPrompt(selection);
    const templateId = ONBOARDING_GOAL_TEMPLATE_MAP[selection.goal];
    const template = TEMPLATE_OPTIONS.find((option) => option.id === templateId);

    if (selectedTool === 'video-generator') {
      video.setMode('simple');
      video.setPrompt(intakePrompt);
      router.push(APP_ROUTES.video);
      setIsMenuOpen(false);
    } else if (selectedTool === 'bg-remover') {
      router.push(APP_ROUTES.image);
      setIsMenuOpen(false);
    } else {
      setMode(template?.generationMode ?? 'single');
      setPrompt(intakePrompt);
      setScene('');
      setVisualStyle('');
      router.push(APP_ROUTES.image);
      setIsMenuOpen(false);
    }

    setTemplateIndustryPreference(selection.industry);
    setActiveTemplateId(templateId ?? null);
    setHideOnboardingQuickStart(false);
    completeOnboarding(selection);
    addToast(`Workspace set for ${goalLabel} in ${industryLabel}.`, 'success');
  }, [video, completeOnboarding, addToast, router, setActiveTemplateId]);

  const showPersonalizedQuickStart =
    activeSection === 'home' &&
    currentTool === 'style-studio' &&
    mode === 'single' &&
    !gallery.showLibrary &&
    !showOnboardingWizard &&
    generation.status !== AppStatus.GENERATING &&
    Boolean(onboardingSelection) &&
    !hideOnboardingQuickStart;

  const showSingleSwapGuide =
    activeSection === 'home' &&
    currentTool === 'style-studio' &&
    mode === 'single' &&
    !gallery.showLibrary &&
    !showOnboardingWizard &&
    generation.status !== AppStatus.GENERATING &&
    !onboardingSelection;

  const showOnboardingEmptyState =
    activeSection === 'home' &&
    currentTool === 'style-studio' &&
    mode === 'single' &&
    !gallery.showLibrary &&
    !showOnboardingWizard &&
    generation.status !== AppStatus.GENERATING &&
    Boolean(onboardingSelection) &&
    hideOnboardingQuickStart;

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!user && !UI_TEST_AUTH_BYPASS) return null;
  if (pathname === APP_ROUTES.root) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {user && <PostHogIdentify user={user} />}
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
          currentTool={currentTool}
          isOnboardingOpen={showOnboardingWizard}
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
          onNavigateHome={navigateHome}
          onNavigateImage={navigateImage}
          onNavigateVideo={navigateVideo}
          onNavigateTemplates={navigateTemplates}
          onNavigateAssistant={navigateAssistant}
          onNavigateGuide={navigateGuide}
          onNavigateOnboarding={navigateOnboarding}
          onNavigateAcademy={navigateAcademy}
          onSignOut={signOut}
          userEmail={user?.email ?? ''}
          credits={credits}
          plan={plan}
        />

        {!isMenuOpen ? (
          <div className="flex-1" />
        ) : activeSection === 'templates' || activeSection === 'assistant' || activeSection === 'guide' || activeSection === 'academy' ? (
          <div className="flex-1" />
        ) : currentTool === 'style-studio' ? (
          <div className="flex-1 px-6 py-4 space-y-6 overflow-y-auto custom-scrollbar">
            <div
              ref={subjectSectionRef}
              className={`rounded-2xl transition-all ${
                guideFocusTarget === 'subject' ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-white' : ''
              }`}
            >
              <SubjectSelector
                personImage={personImage}
                onOpenModal={() => setSubjectModalTarget('style')}
                onSaveUpload={gallery.saveUpload}
                savingId={gallery.savingId}
              />
            </div>

            <div
              ref={garmentSectionRef}
              className={`rounded-2xl transition-all ${
                guideFocusTarget === 'garment' ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-white' : ''
              }`}
            >
              <GarmentGrid
                garments={garments}
                onGarmentChange={handleGarmentChange}
                onSaveUpload={gallery.saveUpload}
                savingId={gallery.savingId}
                onRemoveBg={handleGarmentRemoveBg}
                removingBgSlots={removingBgSlots}
                onBulkDrop={handleBulkGarmentDrop}
              />
            </div>

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
            <div className="p-4 flex items-center justify-between gap-2">
              {!onboardingSelection ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => quickGarmentInputRef.current?.click()}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    {primaryInputActionLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectModalTarget('style')}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    {secondaryInputActionLabel}
                  </button>
                </div>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageToVideoPrompt((prev) => !prev)}
                  disabled={!latestImageForVideoUrl}
                  title={
                    latestImageForVideoUrl
                      ? undefined
                      : 'Generate an image first to create a video.'
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    showImageToVideoPrompt
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Create Video
                </button>
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
            </div>

            {showImageToVideoPrompt && !gallery.showLibrary && (
              <div className="px-4 pb-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Image to Video
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Use your latest generated image as the reference frame.
                  </p>
                  <textarea
                    value={imageToVideoPrompt}
                    onChange={(event) => setImageToVideoPrompt(event.target.value)}
                    placeholder="Describe the motion, camera movement, and scene..."
                    className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    rows={3}
                  />
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImageToVideoPrompt(false)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleGenerateVideoFromImageScreen()}
                      disabled={video.status === 'generating'}
                      className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    >
                      {video.status === 'generating' ? 'Generating...' : 'Generate Video'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={quickGarmentInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleSingleSwapGarmentUpload(file);
                }
                event.currentTarget.value = '';
              }}
            />

            {/* Result / Gallery Area */}
            <div className="flex-1 px-8 pb-24">
              {gallery.showLibrary ? (
                <Gallery
                  uploads={gallery.uploads}
                  generations={gallery.generations}
                  videos={gallery.videos}
                  folders={gallery.folders}
                  onSelectUpload={handleGallerySelect}
                  onDelete={gallery.deleteItem}
                  onDeleteVideo={gallery.deleteVideo}
                  onCreateVideoFromImage={(item) =>
                    handleOpenVideoTemplatePicker(item.url, item.id)
                  }
                  onUpload={gallery.directUpload}
                  onCreateFolder={gallery.createFolder}
                  onRenameFolder={gallery.renameFolder}
                  onDeleteFolder={gallery.deleteFolder}
                  onMoveItem={gallery.moveItem}
                />
              ) : (
                <ResultDisplay
                  status={generation.status}
                  resultImage={generation.resultImage}
                  generations={gallery.generations}
                  pendingCount={generationCount}
                  progress={generation.progress}
                  onReset={generation.reset}
                  onDelete={(id) => gallery.deleteItem(id, 'generation')}
                  onRemoveBg={handleRemoveBg}
                  onCreateVideo={handleOpenVideoTemplatePicker}
                  removingBgId={removingBgId}
                  emptyState={
                    showPersonalizedQuickStart && onboardingSelection ? (
                      <OnboardingQuickStartFeed
                        industry={onboardingSelection.industry}
                        goal={onboardingSelection.goal}
                        hasPrimaryInput={hasGarment}
                        hasSecondaryInput={hasSubject}
                        primaryPreviewUrl={garments[0]?.previewUrl}
                        secondaryPreviewUrl={personImage?.previewUrl}
                        onAddPrimaryInput={handleQuickStartPrimaryAction}
                        onAddSecondaryInput={handleQuickStartSecondaryAction}
                        onOpenTemplates={navigateTemplates}
                        onDismiss={() => setHideOnboardingQuickStart(true)}
                      />
                    ) : showSingleSwapGuide ? (
                      <SingleSwapGuide
                        hasGarment={hasGarment}
                        hasSubject={hasSubject}
                        garmentPreviewUrl={garments[0]?.previewUrl}
                        subjectPreviewUrl={personImage?.previewUrl}
                        onUploadGarment={handleSingleSwapGarmentUpload}
                        onUploadSubject={handleSingleSwapSubjectUpload}
                        onAddGarment={() => focusGuideTarget('garment')}
                        onAddSubject={() => focusGuideTarget('subject')}
                      />
                    ) : showOnboardingEmptyState ? (
                      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-6">
                        <div className="max-w-xl text-center">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                            Workspace Ready
                          </p>
                          <h3 className="mt-2 text-2xl font-semibold text-gray-900">
                            {useProductLanguage
                              ? 'Add your product to generate'
                              : 'Add your garment to generate'}
                          </h3>
                          <p className="mt-2 text-sm text-gray-600">
                            Upload your main product/garment first. Subject reference is optional.
                          </p>
                          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={handleQuickStartPrimaryAction}
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                              {primaryInputActionLabel}
                            </button>
                            <button
                              type="button"
                              onClick={handleQuickStartSecondaryAction}
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                              {secondaryInputActionLabel}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : undefined
                  }
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
                canGenerate={canGenerateFromInputs}
                blockedReason={dynamicBlockedReason}
              />
            )}
          </>
        ) : currentTool === 'video-generator' ? (
          <>
            <div className="flex flex-wrap items-center justify-end gap-2 p-4">
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

            <input
              ref={quickVideoProductInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  if (videoUploadTarget === 'simple') {
                    void handleVideoSimpleReferenceUpload(file);
                  } else {
                    void handleVideoProductUpload(file, pendingVideoProductSlot);
                  }
                }
                event.currentTarget.value = '';
                setVideoUploadTarget('simple');
                setPendingVideoProductSlot(null);
              }}
            />

            {gallery.showLibrary ? (
              <div className="flex-1 px-8 pb-24">
                <Gallery
                  uploads={gallery.uploads}
                  generations={gallery.generations}
                  videos={gallery.videos}
                  folders={gallery.folders}
                  onSelectUpload={(item) => {
                    if (video.mode === 'simple') {
                      void handleVideoSimpleReferenceGallerySelect(item);
                      return;
                    }
                    void handleVideoProductGallerySelect(item, pendingVideoProductSlot);
                  }}
                  onDelete={gallery.deleteItem}
                  onDeleteVideo={gallery.deleteVideo}
                  onCreateVideoFromImage={(item) =>
                    handleOpenVideoTemplatePicker(item.url, item.id)
                  }
                  onUpload={gallery.directUpload}
                  onCreateFolder={gallery.createFolder}
                  onRenameFolder={gallery.renameFolder}
                  onDeleteFolder={gallery.deleteFolder}
                  onMoveItem={gallery.moveItem}
                  selectionMode="single"
                />
              </div>
            ) : (
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
                plan={plan}
                mode={video.mode}
                onModeChange={video.setMode}
                simpleReferenceImage={video.simpleReferenceImage}
                onAddSimpleReference={openVideoSimpleReferenceUpload}
                onChooseSimpleFromGallery={() => {
                  video.setMode('simple');
                  setVideoUploadTarget('simple');
                  setPendingVideoProductSlot(null);
                  gallery.setShowLibrary(true);
                }}
                onClearSimpleReference={() => video.setSimpleReferenceImage(null)}
                onUseLatestGeneratedImage={latestImageForVideoUrl ? () => {
                  void handleUseLatestImageForVideoReference();
                } : undefined}
                productImages={video.productImages}
                subjectImage={video.subjectImage}
                environment={video.environment}
                onAddProduct={openVideoProductUpload}
                onChooseProductFromGallery={(slotIndex?: number) => {
                  video.setMode('advanced');
                  setVideoUploadTarget('advanced');
                  setPendingVideoProductSlot(typeof slotIndex === 'number' ? slotIndex : null);
                  gallery.setShowLibrary(true);
                }}
                onRemoveProduct={video.removeProduct}
                onOpenSubjectPicker={() => {
                  video.setMode('advanced');
                  setSubjectModalTarget('video');
                }}
                onClearSubject={() => video.setSubjectImage(null)}
                onOpenEnvironmentPicker={() => {
                  video.setMode('advanced');
                  setShowEnvironmentModal(true);
                }}
                onClearEnvironment={() => video.setEnvironment(null)}
              />
            )}
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

      <TemplateIndustryPicker
        isOpen={showTemplateIndustryPicker}
        templateTitle={pendingTemplateSelection?.title ?? 'Selected Template'}
        initialIndustry={onboardingSelection?.industry ?? templateIndustryPreference}
        onClose={handleCloseTemplateIndustryPicker}
        onConfirm={handleTemplateIndustryConfirm}
      />

      <VideoTemplatePickerModal
        isOpen={showVideoTemplatePicker}
        imageUrl={videoTemplateSourceUrl}
        templates={VIDEO_TEMPLATE_OPTIONS}
        onClose={handleCloseVideoTemplatePicker}
        onSelect={handleVideoTemplateSelectFromImage}
      />

      <OnboardingQuestionnaire
        isOpen={showOnboardingWizard}
        onSkip={completeOnboarding}
        onComplete={handleOnboardingQuestionnaireComplete}
      />

      {/* Subject Selection Modal */}
      <SubjectModal
        isOpen={subjectModalTarget !== null}
        onClose={() => setSubjectModalTarget(null)}
        onSelectImage={(image) => {
          if (subjectModalTarget === 'video') {
            handleVideoSubjectSelect(image);
            return;
          }
          setPersonImage(image);
        }}
        galleryUploads={gallery.uploads}
        onGallerySelect={(item) => {
          if (subjectModalTarget === 'video') {
            void handleVideoSubjectGallerySelect(item);
            return;
          }
          void handleSubjectGallerySelect(item);
        }}
      />

      <EnvironmentPickerModal
        isOpen={showEnvironmentModal}
        onClose={() => setShowEnvironmentModal(false)}
        onSelect={handleVideoEnvironmentSelect}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default AppWorkspacePage;















