'use client';

import { Ratio, Monitor, MapPin, Palette, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { ASPECT_RATIOS, RESOLUTIONS, SCENE_PRESETS, STYLE_PRESETS } from '@/lib/constants';

interface SettingsPanelProps {
  aspectRatio: string;
  resolution: string;
  scene: string;
  visualStyle: string;
  onAspectRatioChange: (v: string) => void;
  onResolutionChange: (v: string) => void;
  onSceneChange: (v: string) => void;
  onVisualStyleChange: (v: string) => void;
}

function getRatioIcon(r: string) {
  switch (r) {
    case '1:1':
      return <Square size={12} />;
    case '16:9':
    case '21:9':
      return <RectangleHorizontal size={14} />;
    default:
      return <RectangleVertical size={14} />;
  }
}

interface ToggleGroupProps {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  allowDeselect?: boolean;
  renderIcon?: (option: string) => React.ReactNode;
}

function ToggleGroup({
  label,
  icon,
  options,
  selected,
  onSelect,
  allowDeselect = false,
  renderIcon,
}: ToggleGroupProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
        <div className="flex items-center gap-2">
          {icon} {label}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() =>
              onSelect(allowDeselect && opt === selected ? '' : opt)
            }
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              selected === opt
                ? 'bg-black text-white border-black shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {renderIcon?.(opt)}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsPanel({
  aspectRatio,
  resolution,
  scene,
  visualStyle,
  onAspectRatioChange,
  onResolutionChange,
  onSceneChange,
  onVisualStyleChange,
}: SettingsPanelProps) {
  return (
    <div className="space-y-6 pt-4 border-t border-gray-100">
      <ToggleGroup
        label="Aspect Ratio"
        icon={<Ratio size={14} />}
        options={ASPECT_RATIOS}
        selected={aspectRatio}
        onSelect={onAspectRatioChange}
        renderIcon={getRatioIcon}
      />
      <ToggleGroup
        label="Resolution"
        icon={<Monitor size={14} />}
        options={RESOLUTIONS}
        selected={resolution}
        onSelect={onResolutionChange}
      />
      <ToggleGroup
        label="Scene Environment"
        icon={<MapPin size={14} />}
        options={SCENE_PRESETS}
        selected={scene}
        onSelect={onSceneChange}
        allowDeselect
      />
      <ToggleGroup
        label="Visual Style"
        icon={<Palette size={14} />}
        options={STYLE_PRESETS}
        selected={visualStyle}
        onSelect={onVisualStyleChange}
        allowDeselect
      />
    </div>
  );
}
