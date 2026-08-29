import type { Route } from 'next';

import Link from 'next/link';

import { cn } from '@/lib/utils';

import type { ConversationDto } from '@/types';

type ConversationListProps = {
  conversations: ConversationDto[];
  basePath: string;
  activeId?: string;
};

/** The inbox column — one entry per thread, freshest first, the open one highlighted. */
export function ConversationList({ conversations, basePath, activeId }: ConversationListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {conversations.map(conversation => (
        <li key={conversation.conversationId}>
          <Link
            href={`${basePath}?c=${conversation.conversationId}` as Route}
            className={cn(
              'block rounded-md px-3 py-2 text-sm transition-colors',
              conversation.conversationId === activeId ? 'bg-muted font-medium' : 'hover:bg-muted'
            )}>
            <span className="block">Booking conversation</span>
            <span className="text-muted-foreground text-xs">{new Date(conversation.lastMessageAt).toLocaleString()}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
