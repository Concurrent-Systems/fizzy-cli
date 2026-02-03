// fizzy attach - Upload a file and attach it to a card

import type { FizzyClient } from '../../client';
import { markdownToHtml } from '../../utils/markdown';
import { uploadFile, createAttachmentHtml } from '../../utils/upload';

export async function attachFile(
  client: FizzyClient,
  cardNumber: string,
  filePath: string,
  comment?: string
): Promise<void> {
  console.log(`Uploading file: ${filePath}`);

  // Upload the file and get signed_id
  const signedId = await uploadFile(client, filePath);

  console.log('File uploaded. Attaching to card...');

  // Create comment with attachment
  const commentText = comment || 'Attached file';
  const attachmentHtml = createAttachmentHtml(signedId);
  const body = `<p>${markdownToHtml(commentText)}</p>${attachmentHtml}`;

  await client.post(`/cards/${cardNumber}/comments.json`, {
    comment: { body },
  });

  console.log(`File attached to card #${cardNumber}`);
  console.log(`URL: ${client.baseUrl}/cards/${cardNumber}`);
}
