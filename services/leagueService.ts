import type { SupabaseClient } from '@supabase/supabase-js';
import type { League, LeagueMembership, LeagueRow, LeagueMembershipRow } from '@/types/arena';
import { mapLeagueRow, mapLeagueMembershipRow } from '@/types/arena';
import { LEAGUE_CONFIG, LEAGUE_TIERS } from '@/config/arena';
import type { LeagueTier } from '@/config/arena';
import { matchUsersIntoLeagues } from '@/services/matchmakingService';
import { updateUserStats } from '@/models/userStats';
import { getIsoWeekDateRange, getIsoWeekInfo, getPreviousIsoWeek } from '@/lib/iso-week';

/* ——————————————————————————————————————————————————————————
 * League Service
 *
 * Manages weekly league lifecycle: end-of-week processing
 * (rank, promote, demote), new-week league creation via
 * matchmaking, and current-league queries for leaderboard
 * display.
 * —————————————————————————————————————————————————————————— */

/* ——— Helpers ——— */

function getNextTier(tier: LeagueTier): LeagueTier {
  const idx = LEAGUE_TIERS.indexOf(tier);
  return idx < LEAGUE_TIERS.length - 1 ? LEAGUE_TIERS[idx + 1] : tier;
}

function getPreviousTier(tier: LeagueTier): LeagueTier {
  const idx = LEAGUE_TIERS.indexOf(tier);
  return idx > 0 ? LEAGUE_TIERS[idx - 1] : tier;
}

function getCurrentWeekAndYear(): { weekNumber: number; year: number } {
  return getIsoWeekInfo();
}

/**
 * Returns Monday 00:00:00 UTC and Sunday 23:59:59 UTC for a
 * given ISO week number and year.
 */
function getWeekDateRange(
  weekNumber: number,
  year: number,
): { startsAt: string; endsAt: string } {
  return getIsoWeekDateRange(weekNumber, year);
}

/* ——— Process Week End ——— */

export async function processWeekEnd(
  supabase: SupabaseClient,
  targetWeek?: { weekNumber: number; year: number },
): Promise<void> {
  const { weekNumber, year } = targetWeek ?? getCurrentWeekAndYear();

  // 1. Get all leagues for the current week
  const { data: leagues, error: leagueError } = await supabase
    .from('leagues')
    .select('*')
    .eq('week_number', weekNumber)
    .eq('year', year);

  if (leagueError) {
    console.error('[leagues] Failed to fetch current-week leagues:', leagueError.message);
    throw new Error(`Failed to fetch current-week leagues: ${leagueError.message}`);
  }

  if (!leagues || leagues.length === 0) return;

  // 2. For each league, calculate final rankings and set promotion/demotion
  for (const leagueRow of leagues as LeagueRow[]) {
    const { data: memberships, error: memberError } = await supabase
      .from('league_memberships')
      .select('*')
      .eq('league_id', leagueRow.id)
      .order('weekly_xp', { ascending: false });

    if (memberError) {
      console.error('[leagues] Failed to fetch memberships for league:', memberError.message);
      continue;
    }

    if (!memberships || memberships.length === 0) continue;

    const memberRows = memberships as LeagueMembershipRow[];

    // Assign ranks and promotion/demotion flags
    for (let i = 0; i < memberRows.length; i++) {
      const rank = i + 1;
      const isPromoted = rank <= LEAGUE_CONFIG.PROMOTION_COUNT;
      const isDemoted = rank > memberRows.length - LEAGUE_CONFIG.DEMOTION_COUNT;

      const { error: updateError } = await supabase
        .from('league_memberships')
        .update({
          rank,
          promoted: isPromoted,
          demoted: isDemoted,
        })
        .eq('id', memberRows[i].id);

      if (updateError) {
        console.error('[leagues] Failed to update membership rank:', updateError.message);
        continue;
      }

      // Update user's current_league_tier based on promotion/demotion
      if (isPromoted) {
        const nextTier = getNextTier(leagueRow.tier);
        if (nextTier !== leagueRow.tier) {
          await updateUserStats(supabase, memberRows[i].user_id, {
            currentLeagueTier: nextTier,
          });
        }
      } else if (isDemoted) {
        const prevTier = getPreviousTier(leagueRow.tier);
        if (prevTier !== leagueRow.tier) {
          await updateUserStats(supabase, memberRows[i].user_id, {
            currentLeagueTier: prevTier,
          });
        }
      }
    }
  }
}

/* ——— Create New Week Leagues ——— */

export async function createNewWeekLeagues(
  supabase: SupabaseClient,
  weekNumber: number,
  year: number,
): Promise<void> {
  // 1. Get all users with league access (active pro subscribers)
  const { data: proUsers, error: proError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active')
    .eq('plan_id', 'pro');

  if (proError) {
    console.error('[leagues] Failed to fetch pro users:', proError.message);
    throw new Error(`Failed to fetch pro users: ${proError.message}`);
  }

  if (!proUsers || proUsers.length === 0) return;

  const userIds = proUsers.map((row: { user_id: string }) => row.user_id);

  // 2. Get each user's current_league_tier from user_stats
  const { data: statsRows, error: statsError } = await supabase
    .from('user_stats')
    .select('user_id, current_league_tier')
    .in('user_id', userIds);

  if (statsError) {
    console.error('[leagues] Failed to fetch user stats:', statsError.message);
    throw new Error(`Failed to fetch user stats: ${statsError.message}`);
  }

  // Build a map of userId -> tier (default to bronze for users without stats)
  const tierMap = new Map<string, LeagueTier>();
  for (const row of (statsRows ?? []) as { user_id: string; current_league_tier: LeagueTier }[]) {
    tierMap.set(row.user_id, row.current_league_tier);
  }

  // 3. Get each user's previous week XP from league_memberships
  const previousWeek = getPreviousIsoWeek(weekNumber, year);
  const prevWeek = previousWeek.weekNumber;
  const prevYear = previousWeek.year;

  const { data: prevMemberships, error: prevError } = await supabase
    .from('league_memberships')
    .select('user_id, weekly_xp, leagues!inner(week_number, year)')
    .eq('leagues.week_number', prevWeek)
    .eq('leagues.year', prevYear)
    .in('user_id', userIds);

  if (prevError) {
    console.error('[leagues] Failed to fetch previous week memberships:', prevError.message);
    // Non-fatal: proceed with 0 XP for all
  }

  const prevXpMap = new Map<string, number>();
  if (prevMemberships) {
    for (const row of prevMemberships as { user_id: string; weekly_xp: number }[]) {
      prevXpMap.set(row.user_id, row.weekly_xp);
    }
  }

  // 4. Build user array for matchmaking
  const users = userIds.map((userId: string) => ({
    userId,
    tier: tierMap.get(userId) ?? ('bronze' as LeagueTier),
    previousWeekXp: prevXpMap.get(userId) ?? 0,
  }));

  // 5. Match users into leagues
  const leagueGroups = matchUsersIntoLeagues(users, LEAGUE_CONFIG.USERS_PER_LEAGUE);

  // 6. Calculate week date range
  const { startsAt, endsAt } = getWeekDateRange(weekNumber, year);

  // 7. Create league rows + membership rows in batch
  for (const group of leagueGroups) {
    const { data: leagueRow, error: leagueInsertError } = await supabase
      .from('leagues')
      .insert({
        tier: group.tier,
        week_number: weekNumber,
        year,
        starts_at: startsAt,
        ends_at: endsAt,
      })
      .select()
      .single();

    if (leagueInsertError || !leagueRow) {
      console.error('[leagues] Failed to create league:', leagueInsertError?.message ?? 'unknown error');
      continue;
    }

    const membershipInserts = group.userIds.map((userId: string) => ({
      league_id: leagueRow.id,
      user_id: userId,
      weekly_xp: 0,
      rank: null,
      promoted: false,
      demoted: false,
    }));

    const { error: memberInsertError } = await supabase
      .from('league_memberships')
      .insert(membershipInserts);

    if (memberInsertError) {
      console.error('[leagues] Failed to create league memberships:', memberInsertError.message);
    }
  }
}

/* ——— Get User League (Current Week) ——— */

export async function getUserLeague(
  supabase: SupabaseClient,
  userId: string,
): Promise<(League & { memberships: LeagueMembership[] }) | null> {
  const { weekNumber, year } = getCurrentWeekAndYear();

  // Find the user's membership for the current week
  const { data: membership, error: memberError } = await supabase
    .from('league_memberships')
    .select('league_id, leagues!inner(week_number, year)')
    .eq('user_id', userId)
    .eq('leagues.week_number', weekNumber)
    .eq('leagues.year', year)
    .maybeSingle();

  if (memberError) {
    console.error('[leagues] Failed to find user league membership:', memberError.message);
    throw new Error(`Failed to find user league membership: ${memberError.message}`);
  }

  if (!membership) return null;

  // Get the full league row
  const { data: leagueData, error: leagueError } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', membership.league_id)
    .single();

  if (leagueError || !leagueData) {
    console.error('[leagues] Failed to fetch league:', leagueError?.message ?? 'unknown error');
    throw new Error(`Failed to fetch league: ${leagueError?.message ?? 'unknown error'}`);
  }

  // Get all memberships for this league, ordered by weekly_xp DESC
  const { data: allMemberships, error: allMemberError } = await supabase
    .from('league_memberships')
    .select('*, profiles:user_id(display_name)')
    .eq('league_id', membership.league_id)
    .order('weekly_xp', { ascending: false });

  if (allMemberError) {
    console.error('[leagues] Failed to fetch league memberships:', allMemberError.message);
    throw new Error(`Failed to fetch league memberships: ${allMemberError.message}`);
  }

  return {
    ...mapLeagueRow(leagueData as LeagueRow),
    memberships: (allMemberships as LeagueMembershipRow[] ?? []).map(mapLeagueMembershipRow),
  };
}

/* ——— Get League Membership For User ——— */

export async function getLeagueMembershipForUser(
  supabase: SupabaseClient,
  userId: string,
  weekNumber: number,
  year: number,
): Promise<LeagueMembership | null> {
  const { data, error } = await supabase
    .from('league_memberships')
    .select('*, leagues!inner(week_number, year)')
    .eq('user_id', userId)
    .eq('leagues.week_number', weekNumber)
    .eq('leagues.year', year)
    .maybeSingle();

  if (error) {
    // PGRST116 = row not found
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[leagues] Failed to get league membership:', error.message);
    throw new Error(`Failed to get league membership: ${error.message}`);
  }

  if (!data) return null;

  return mapLeagueMembershipRow(data as LeagueMembershipRow);
}
