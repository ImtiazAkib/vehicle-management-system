/*
  Who may read or post in a conversation. A conversation is exactly one owner and one service center; this
  pure check is the single arbiter both the service and its unit test lean on, so "only the two participants"
  is provable without a database. The center is identified by its `ServiceCenterProfile` id, resolved from
  the session before this is called.
*/

export type ConversationParticipants = {
  ownerId: string;
  serviceCenterId: string;
};

/**
 * Whether an actor is one of a conversation's two participants.
 *
 * @param conversation - The conversation's owner and service-center ids.
 * @param userId - The actor's user id (matches the owner).
 * @param centerProfileId - The actor's `ServiceCenterProfile` id, or null when the actor is not a center.
 *
 * @returns `true` only for the owner or the assigned center.
 */
export function isConversationParticipant(conversation: ConversationParticipants, userId: string, centerProfileId: string | null): boolean {
  if (conversation.ownerId === userId) {
    return true;
  }

  return centerProfileId !== null && conversation.serviceCenterId === centerProfileId;
}
