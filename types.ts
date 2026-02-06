
export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '16:9' | '4:3' | '9:16';

export interface EmailCampaign {
  id: string;
  title: string;
  subjectLines: string[];
  previewText: string;
  bodyHtml: string;
  visualPrompt: string;
  imageUrl?: string;
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GenerationState {
  isGeneratingCopy: boolean;
  isGeneratingImage: boolean;
  error: string | null;
}
