import { z } from 'zod';

/*
  Sending a message. Text only in this step — the attachment path (magic-byte verification into GridFS) is
  deferred. The body is bounded to what the model stores.
*/
export const MessageSendSchema = z.object({
  conversationId: z.string().min(1, 'Missing conversation.'),
  body: z.string().trim().min(1, 'Type a message.').max(5000, 'Message is too long.'),
});

export type MessageSendOutput = z.output<typeof MessageSendSchema>;
