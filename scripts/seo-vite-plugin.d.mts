import type { Plugin } from 'vite';
export const REVIEW_SCRIPT: string;
export function shouldIncludeReviewScript(options: { command: string; base: string; mode: string; ads: { publisherId: string; enabled: boolean; siteApproved: boolean } }, env: Record<string, string | undefined>): boolean;
export function seoReviewPlugin(): Plugin;
