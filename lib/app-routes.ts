import type { ToolMode } from '@/types';

export const APP_ROUTES = {
  root: '/app',
  image: '/app/image',
  video: '/app/video',
  templates: '/app/templates',
  assistant: '/app/assistant',
  guide: '/app/guide',
  onboarding: '/app/onboarding',
  academy: '/app/academy',
} as const;

export type AppRouteSection =
  | 'home'
  | 'templates'
  | 'assistant'
  | 'guide'
  | 'academy'
  | 'onboarding';

export interface AppRouteState {
  section: AppRouteSection;
  tool: ToolMode;
}

const LEGACY_TOOL_MAP: Record<string, string> = {
  image: APP_ROUTES.image,
  'style-studio': APP_ROUTES.image,
  video: APP_ROUTES.video,
  'video-generator': APP_ROUTES.video,
  templates: APP_ROUTES.templates,
  assistant: APP_ROUTES.assistant,
  guide: APP_ROUTES.guide,
  onboarding: APP_ROUTES.onboarding,
  academy: APP_ROUTES.academy,
};

export function toToolRoute(tool: ToolMode) {
  return tool === 'video-generator' ? APP_ROUTES.video : APP_ROUTES.image;
}

export function toSectionRoute(section: AppRouteSection, currentTool: ToolMode) {
  switch (section) {
    case 'templates':
      return APP_ROUTES.templates;
    case 'assistant':
      return APP_ROUTES.assistant;
    case 'guide':
      return APP_ROUTES.guide;
    case 'academy':
      return APP_ROUTES.academy;
    case 'onboarding':
      return APP_ROUTES.onboarding;
    case 'home':
    default:
      return toToolRoute(currentTool);
  }
}

export function resolveLegacyToolRoute(toolValue: string | null | undefined) {
  if (!toolValue) return null;
  return LEGACY_TOOL_MAP[toolValue.toLowerCase()] ?? null;
}

export function resolveRouteState(pathname: string): AppRouteState {
  if (pathname.startsWith(APP_ROUTES.video)) {
    return { section: 'home', tool: 'video-generator' };
  }
  if (pathname.startsWith(APP_ROUTES.templates)) {
    return { section: 'templates', tool: 'style-studio' };
  }
  if (pathname.startsWith(APP_ROUTES.assistant)) {
    return { section: 'assistant', tool: 'style-studio' };
  }
  if (pathname.startsWith(APP_ROUTES.guide)) {
    return { section: 'guide', tool: 'style-studio' };
  }
  if (pathname.startsWith(APP_ROUTES.academy)) {
    return { section: 'academy', tool: 'style-studio' };
  }
  if (pathname.startsWith(APP_ROUTES.onboarding)) {
    return { section: 'onboarding', tool: 'style-studio' };
  }
  return { section: 'home', tool: 'style-studio' };
}
