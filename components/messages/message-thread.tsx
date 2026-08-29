import { cn } from '@/lib/utils';

import type { MessageDto } from '@/types';

type MessageThreadProps = {
  messages: MessageDto[];
  currentUserId: string;
};

/** The conversation body — the sender's own messages on the right in the brand color, the other's on the left. */
export function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  if (messages.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">No messages yet. Say hello.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {messages.map(message => {
        const mine = message.senderId === currentUserId;

        return (
          <li key={message.messageId} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[80%] rounded-lg px-3 py-2 text-sm', mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
              <p className="whitespace-pre-wrap">{message.body}</p>
              <p className={cn('mt-1 text-xs', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
