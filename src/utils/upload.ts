// File upload utilities
// Ported from fizzy-attach.sh

import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import { basename } from 'path';
import type { FizzyClient } from '../client';
import type { DirectUploadResponse } from '../types/api';

/**
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'xml': 'application/xml',
    'csv': 'text/csv',
    // Code
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'py': 'text/x-python',
    'sh': 'text/x-shellscript',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    // Archives
    'zip': 'application/zip',
    'gz': 'application/gzip',
    'tar': 'application/x-tar',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Calculate MD5 checksum of a file in base64 format
 */
function calculateChecksum(data: Buffer): string {
  return createHash('md5').update(data).digest('base64');
}

/**
 * Upload a file and return the signed_id for use in rich text attachments
 */
export async function uploadFile(
  client: FizzyClient,
  filePath: string
): Promise<string> {
  const filename = basename(filePath);
  const fileData = readFileSync(filePath);
  const byteSize = statSync(filePath).size;
  const checksum = calculateChecksum(fileData);
  const contentType = getMimeType(filename);

  // Step 1: Create direct upload
  const uploadResponse = await client.post<DirectUploadResponse>(
    '/rails/active_storage/direct_uploads',
    {
      blob: {
        filename,
        byte_size: byteSize,
        checksum,
        content_type: contentType,
      },
    }
  );

  if (!uploadResponse) {
    throw new Error('Failed to create direct upload');
  }

  const { direct_upload, signed_id } = uploadResponse;

  if (!direct_upload?.url || !signed_id) {
    throw new Error('Invalid direct upload response');
  }

  // Step 2: Upload the file to the provided URL
  await client.uploadFile(direct_upload.url, fileData, {
    'Content-Type': contentType,
    'Content-MD5': checksum,
  });

  return signed_id;
}

/**
 * Create an action-text-attachment HTML element for an uploaded file
 */
export function createAttachmentHtml(signedId: string): string {
  return `<action-text-attachment sgid="${signedId}"></action-text-attachment>`;
}
