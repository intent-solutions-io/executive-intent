import { type ClassValue, clsx } from 'clsx';
import { createTailwindMerge, getDefaultConfig } from 'tailwind-merge';

const twMerge = createTailwindMerge(() => {
  const config = getDefaultConfig();
  const mutableConfig = config as unknown as any;

  // Restrict theme colors so custom font sizes like `text-body-sm` don't get treated
  // as text colors by tailwind-merge (which would cause it to drop `text-white`, etc.).
  mutableConfig.theme.colors = [
    'inherit',
    'current',
    'transparent',
    'black',
    'white',
    'neutral',
    'primary',
    'status',
    'blue',
    'gray',
    'green',
    'red',
    'yellow',
  ];

  const fontSizeGroup = mutableConfig.classGroups?.['font-size']?.[0];
  if (fontSizeGroup && Array.isArray(fontSizeGroup.text)) {
    fontSizeGroup.text.unshift(
      'display-2xl',
      'display-xl',
      'display-lg',
      'display-md',
      'display-sm',
      'display-xs',
      'metric-lg',
      'metric-md',
      'body-xl',
      'body-lg',
      'body-md',
      'body-sm',
      'body-xs',
      'label'
    );
  }

  return config;
});

/**
 * Merge Tailwind CSS classes with clsx
 * Handles conflicts and deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
