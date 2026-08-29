import { MessageSquare } from 'lucide-react';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { MessageService } from '@/lib/services';

import { ConversationList, MessageComposer, MessageThread } from '@/components/messages';
import { EmptyState, PageHeader } from '@/components/shared';

import type { MessageDto } from '@/types';

const messageService = new MessageService();

type SearchParams = Promise<{ c?: string }>;

export default async function CenterMessagesPage({ searchParams }: { searchParams: SearchParams }) {
  const center = await requireRole(USER_ROLES.SERVICE_CENTER);
  const { c } = await searchParams;

  const conversations = (await messageService.listForCenter(center.userId)).result ?? [];
  const actor = { userId: center.userId, role: center.role };

  let messages: MessageDto[] = [];
  let activeId: string | undefined;

  if (c) {
    const list = await messageService.listMessages(actor, c);
    if (list.success) {
      messages = list.result ?? [];
      activeId = c;
      await messageService.markRead(actor, c);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Messages" description="Conversations with owners about their bookings." />

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="When an owner messages you about a booking, the thread appears here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
          <aside className="surface-card h-fit p-2">
            <ConversationList conversations={conversations} basePath={ROUTES.CENTER_MESSAGES.HREF} activeId={activeId} />
          </aside>
          <div className="surface-card flex flex-col gap-4 p-4">
            {activeId ? (
              <>
                <MessageThread messages={messages} currentUserId={center.userId} />
                <MessageComposer conversationId={activeId} />
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Select a conversation to read it.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
