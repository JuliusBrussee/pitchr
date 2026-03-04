import type { LeagueTier } from '@/config/arena';
import { LEAGUE_CONFIG, LEAGUE_TIERS } from '@/config/arena';

/* ——————————————————————————————————————————————————————————
 * Matchmaking Service
 *
 * Pure function — no DB access. Groups users into league
 * cohorts by tier and XP similarity. Easy to unit test.
 * —————————————————————————————————————————————————————————— */

/* ——— Types ——— */

export interface MatchmakingUser {
  userId: string;
  tier: LeagueTier;
  previousWeekXp: number;
}

export interface LeagueGroup {
  tier: LeagueTier;
  userIds: string[];
}

/* ——— Constants ——— */

const MIN_LEAGUE_SIZE = 10;

/* ——— Helpers ——— */

/**
 * Split a sorted list of user IDs into league-sized groups.
 *
 * Rules:
 *  - Target group size is `size` (default 30).
 *  - If fewer than MIN_LEAGUE_SIZE users total, return one league.
 *  - After dividing, if the remainder is < MIN_LEAGUE_SIZE,
 *    merge it into the last full league (max size ~ size + 9).
 *  - Otherwise the remainder forms a valid smaller league
 *    (minimum size is MIN_LEAGUE_SIZE, within the ±VARIANCE window).
 */
function splitIntoGroups(userIds: string[], size: number): string[][] {
  if (userIds.length === 0) return [];
  if (userIds.length < MIN_LEAGUE_SIZE) return [userIds];

  const fullGroupCount = Math.floor(userIds.length / size);
  const remainder = userIds.length % size;

  // If everyone fits in one group (fewer than size but >= MIN_LEAGUE_SIZE)
  if (fullGroupCount === 0) {
    return [userIds];
  }

  const groups: string[][] = [];

  for (let i = 0; i < fullGroupCount; i++) {
    groups.push(userIds.slice(i * size, (i + 1) * size));
  }

  if (remainder > 0) {
    if (remainder < MIN_LEAGUE_SIZE) {
      // Merge remainder into the last group
      const lastGroup = groups[groups.length - 1];
      const remainderUsers = userIds.slice(fullGroupCount * size);
      groups[groups.length - 1] = [...lastGroup, ...remainderUsers];
    } else {
      // Remainder is large enough to form its own league
      groups.push(userIds.slice(fullGroupCount * size));
    }
  }

  return groups;
}

/* ——— Main ——— */

/**
 * Assign users into league groups for a new week.
 *
 * Algorithm:
 *  1. Group users by tier.
 *  2. Within each tier, sort by previousWeekXp DESC (similar skill together).
 *  3. Divide into groups of ~leagueSize (default 30).
 *  4. Return flat array of { tier, userIds } groups.
 */
export function matchUsersIntoLeagues(
  users: MatchmakingUser[],
  leagueSize?: number,
): LeagueGroup[] {
  if (users.length === 0) return [];

  const size = leagueSize ?? LEAGUE_CONFIG.USERS_PER_LEAGUE;

  // 1. Group users by tier
  const byTier = new Map<LeagueTier, MatchmakingUser[]>();

  for (const user of users) {
    const group = byTier.get(user.tier);
    if (group) {
      group.push(user);
    } else {
      byTier.set(user.tier, [user]);
    }
  }

  const results: LeagueGroup[] = [];

  // 2. Process tiers in canonical order (bronze -> champion)
  for (const tier of LEAGUE_TIERS) {
    const tierUsers = byTier.get(tier);
    if (!tierUsers || tierUsers.length === 0) continue;

    // Sort by previousWeekXp DESC — highest XP first so active
    // players cluster together. 0 XP users (new) sort last.
    tierUsers.sort((a, b) => b.previousWeekXp - a.previousWeekXp);

    const userIds = tierUsers.map((u) => u.userId);

    // 3. Split into league-sized groups
    const groups = splitIntoGroups(userIds, size);

    // 4. Create LeagueGroup for each
    for (const groupIds of groups) {
      results.push({ tier, userIds: groupIds });
    }
  }

  return results;
}
