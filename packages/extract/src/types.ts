// ─── Types ────────────────────────────────────────────────────────────────────

export type ExtractInputFormat =
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'xlsx'
  | 'png'
  | 'jpeg'
  | 'tiff'
  | 'bmp'
  | 'webp'
  | 'html';

export type ExtractOutputFormat = 'md' | 'json';

export type ExtractJobStatus =
  | 'created'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'partial_success'
  | 'failed'
  | 'cancelled';

// ─── Job Creation Options ─────────────────────────────────────────────────────

export interface CreateExtractJobOptions {
  outputFormat?: ExtractOutputFormat;
  idempotencyKey?: string;
  webhookKey?: string;
}

// ─── Input Attach Options ─────────────────────────────────────────────────────

export interface AttachExtractFileOptions {
  filename?: string;
  contentType?: string;
  order?: number;
}

// ─── Sync Extraction ──────────────────────────────────────────────────────────

export interface ExtractOptions {
  filename?: string;
  contentType?: string;
  outputFormat?: ExtractOutputFormat;
}

// ─── Job Status and Results ────────────────────────────────────────────────────

export interface ExtractInputStatus {
  id: string;
  filename: string;
  source: 'upload';
  content: ExtractInputFormat;
  status: 'pending_upload' | 'pending' | 'processing' | 'completed' | 'failed';
  order: number;
  errorMessage?: string;
}

export interface ExtractJobStatusResponse {
  jobId: string;
  status: ExtractJobStatus;
  outputFormat: ExtractOutputFormat;
  inputs: ExtractInputStatus[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface ExtractedDocument {
  url: string;
  filename: string;
  outputFormat: ExtractOutputFormat;
  size: number;
  expiresAt?: string;
}

export interface ExtractFailedInput {
  inputId: string;
  filename: string;
  error: string;
}

export interface ExtractJobResult {
  jobId: string;
  status: ExtractJobStatus;
  documents: ExtractedDocument[];
  failed: ExtractFailedInput[];
}
