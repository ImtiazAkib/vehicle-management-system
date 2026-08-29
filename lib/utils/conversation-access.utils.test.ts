import { describe, expect, it } from 'vitest';

import { isConversationParticipant } from './conversation-access.utils';

const conversation = { ownerId: 'owner-1', serviceCenterId: 'center-profile-1' };

describe('isConversationParticipant', () => {
  it('admits the owner by user id', () => {
    expect(isConversationParticipant(conversation, 'owner-1', null)).toBe(true);
  });

  it('admits the assigned center by its profile id', () => {
    expect(isConversationParticipant(conversation, 'center-user-9', 'center-profile-1')).toBe(true);
  });

  it('refuses a different owner', () => {
    expect(isConversationParticipant(conversation, 'owner-2', null)).toBe(false);
  });

  it('refuses a different center profile', () => {
    expect(isConversationParticipant(conversation, 'center-user-9', 'center-profile-2')).toBe(false);
  });

  it('refuses a non-participant with no center profile', () => {
    expect(isConversationParticipant(conversation, 'supplier-3', null)).toBe(false);
  });
});
