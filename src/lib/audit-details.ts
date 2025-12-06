/**
 * Audit log details builders for multi-user tracking
 * These functions create structured JSON details that include all relevant users
 */

interface UserInfo {
  id: string;
  username: string;
  habboName: string;
  rankId: number;
}

interface RankInfo {
  id: number;
  name: string;
}

export interface RankChangeDetails {
  action: 'rank_change';
  executedBy: UserInfo;
  targetUser: UserInfo;
  previousRank: RankInfo;
  newRank: RankInfo;
  reason: string;
  timestamp: string;
}

export interface UserDeleteDetails {
  action: 'user_delete';
  executedBy: UserInfo;
  deletedUser: UserInfo;
  reason: string;
  timestamp: string;
}

export interface PasswordChangeDetails {
  action: 'password_change';
  executedBy: UserInfo;
  targetUser: UserInfo;
  reason: string;
  timestamp: string;
}

export function buildRankChangeDetails(
  executedBy: UserInfo,
  targetUser: UserInfo,
  previousRank: RankInfo,
  newRank: RankInfo,
  reason: string
): RankChangeDetails {
  return {
    action: 'rank_change',
    executedBy,
    targetUser,
    previousRank,
    newRank,
    reason,
    timestamp: new Date().toISOString(),
  };
}

export function buildUserDeleteDetails(
  executedBy: UserInfo,
  deletedUser: UserInfo,
  reason: string
): UserDeleteDetails {
  return {
    action: 'user_delete',
    executedBy,
    deletedUser,
    reason,
    timestamp: new Date().toISOString(),
  };
}

export function buildPasswordChangeDetails(
  executedBy: UserInfo,
  targetUser: UserInfo,
  reason: string
): PasswordChangeDetails {
  return {
    action: 'password_change',
    executedBy,
    targetUser,
    reason,
    timestamp: new Date().toISOString(),
  };
}
