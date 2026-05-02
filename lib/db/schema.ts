import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  index,
  smallint,
} from "drizzle-orm/pg-core";

export const userRoles = ["player"] as const;
export type UserRole = (typeof userRoles)[number];
export const userRoleEnum = pgEnum("user_roles", userRoles);

// Partners are external users who access the system through the Partner Portal.
// They are distinct from:
//   - `users`        (players / end-users)
//   - `system_users` (internal admin panel operators)

export const partnerRoles = [
  "turf_manager",   // manages turf listings
  // future: "league_organiser", "equipment_vendor", etc.
] as const;
export type PartnerRole = (typeof partnerRoles)[number];
export const partnerRoleEnum = pgEnum("partner_role", partnerRoles);

export const partnerStatuses = ["active", "inactive", "suspended"] as const;
export type PartnerStatus = (typeof partnerStatuses)[number];
export const partnerStatusEnum = pgEnum("partner_status", partnerStatuses);

export const positions = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
] as const;
export type Position = (typeof positions)[number];
export const positionEnum = pgEnum("player_positions", positions);

export const tournamentStatuses = ["UPCOMING", "ONGOING", "COMPLETED"] as const;
export type TournamentStatus = (typeof tournamentStatuses)[number];
export const tournamentStatusEnum = pgEnum(
  "tournament_status",
  tournamentStatuses,
);

export const tournamentFormats = [
  "LEAGUE",
  "KNOCKOUT",
  "GROUP_STAGE_KNOCKOUT",
  "ROUND_ROBIN",
] as const;
export type TournamentFormat = (typeof tournamentFormats)[number];
export const tournamentFormatEnum = pgEnum(
  "tournament_format",
  tournamentFormats,
);

export const fixtureStatuses = [
  "UPCOMING",
  "LIVE",
  "COMPLETED",
  "CANCELLED",
  "POSTPONED",
] as const;
export type FixtureStatus = (typeof fixtureStatuses)[number];
export const fixtureStatusEnum = pgEnum("fixture_status", fixtureStatuses);

export const paymentStatuses = ["pending", "success", "failed"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];
export const paymentStatusEnum = pgEnum("payment_status", paymentStatuses);

export const mediaTypes = ["image", "video"] as const;
export type MediaType = (typeof mediaTypes)[number];
export const mediaTypeEnum = pgEnum("media_type", mediaTypes);

export const turfSurfaces = [
  "natural_grass",
  "artificial_turf",
  "futsal_floor",
  "indoor",
] as const;
export type TurfSurface = (typeof turfSurfaces)[number];
export const turfSurfaceEnum = pgEnum("turf_surface", turfSurfaces);

export const systemUserStatuses = ["active", "inactive", "suspended"] as const;
export type SystemUserStatus = (typeof systemUserStatuses)[number];
export const systemUserStatusEnum = pgEnum(
  "system_user_status",
  systemUserStatuses,
);

export const notificationTypes = [
  "MATCH_REMINDER",
  "PAYMENT_CONFIRMED",
  "TOURNAMENT_UPDATE",
  "TEAM_INVITE",
  "GENERAL",
] as const;
export type NotificationType = (typeof notificationTypes)[number];
export const notificationTypeEnum = pgEnum(
  "notification_type",
  notificationTypes,
);

export const challengeStatuses = [
  "PENDING", // sent, waiting for response
  "ACCEPTED", // accepted, match will be created
  "DECLINED", // challenged team declined
  "CANCELLED", // challenger withdrew
  "EXPIRED", // no response within deadline
] as const;
export type ChallengeStatus = (typeof challengeStatuses)[number];
export const challengeStatusEnum = pgEnum(
  "challenge_status",
  challengeStatuses,
);

export const kycStatuses = [
  "not_submitted", // partner registered but hasn't uploaded docs yet
  "pending",       // docs submitted, awaiting admin review
  "in_review",     // admin has opened the submission
  "approved",      // KYC passed
  "rejected",      // KYC failed — partner can resubmit if allowed
  "expired",       // approval period lapsed, re-verification needed
] as const;
export type KycStatus = (typeof kycStatuses)[number];
export const kycStatusEnum = pgEnum("kyc_status", kycStatuses);


export const kycDocumentStatuses = [
  "pending",   // uploaded, not yet reviewed
  "accepted",  // admin marked this doc as valid
  "rejected",  // admin rejected this specific doc
] as const;
export type KycDocumentStatus = (typeof kycDocumentStatuses)[number];
export const kycDocumentStatusEnum = pgEnum(
  "kyc_document_status",
  kycDocumentStatuses,
);



/**
 * System roles — distinct from player role.
 * These are for the admin panel (e.g., Super Admin, Match Manager, Finance Officer).
 */
export const systemRole = pgTable("system_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  description: varchar("description", { length: 256 }),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Individual permission strings stored here.
 * Seeded from the Permission enum in code.
 */
export const permission = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(), // e.g. "CREATE_USER"
  group: varchar("group", { length: 64 }), // e.g. "User"
  description: varchar("description", { length: 256 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Many-to-many: system roles ↔ permissions
 */
export const rolePermission = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: uuid("role_id")
      .references(() => systemRole.id, { onDelete: "cascade" })
      .notNull(),
    permissionId: uuid("permission_id")
      .references(() => permission.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueRolePermission: uniqueIndex("unique_role_permission").on(
      table.roleId,
      table.permissionId,
    ),
  }),
);

/**
 * System users — admin panel operators. NOT the same as regular players.
 * Examples: Super Admin, Finance Officer, Match Manager.
 */
export const systemUser = pgTable("system_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  email: varchar("email", { length: 64 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  password: varchar("password", { length: 256 }).notNull(), // bcrypt hash, longer buffer
  phone: varchar("phone", { length: 15 }),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  status: systemUserStatusEnum("status").notNull().default("active"),
  roleId: uuid("role_id").references(() => systemRole.id, {
    onDelete: "set null",
  }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});



export const user = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull(),
  email: varchar("email", { length: 64 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  password: varchar("password", { length: 256 }).notNull(),
  phone: varchar("phone", { length: 15 }),
  position: positionEnum("position").notNull(),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  role: userRoleEnum("role").notNull().default("player"),
  bio: text("bio"),
  isActive: boolean("is_active").notNull().default(true),
  stats: jsonb("stats").$type<{
    matchesPlayed: number;
    goals: number;
    assists: number;
    motm: number;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
  }>(),
  attributes: jsonb("attributes").$type<{
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defense: number;
    physical: number;
    stamina: number;
    workRate: number;
  }>(),
  aiAnalysis: text("ai_analysis"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const partner = pgTable("partners", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  email: varchar("email", { length: 64 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  password: varchar("password", { length: 256 }).notNull(),
  phone: varchar("phone", { length: 15 }),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  businessName: varchar("business_name", { length: 128 }),
  role: partnerRoleEnum("role").notNull().default("turf_manager"),
  status: partnerStatusEnum("status").notNull().default("active"),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("not_submitted"),
  kycSubmittedAt: timestamp("kyc_submitted_at", { withTimezone: true }),
  kycReviewedAt: timestamp("kyc_reviewed_at", { withTimezone: true }),
  kycReviewedBy: uuid("kyc_reviewed_by").references(() => systemUser.id, { onDelete: "set null" }),
  kycRejectionReason: text("kyc_rejection_reason"),
  kycResubmissionCount: integer("kyc_resubmission_count").notNull().default(0),
  commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const turf = pgTable("turfs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  area: varchar("area", { length: 128 }),
  city: varchar("city", { length: 64 }).notNull(),
  address: text("address"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  surface: turfSurfaceEnum("surface"),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  pricePerHour: numeric("price_per_hour", { precision: 10, scale: 2 }),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").notNull().default(0),
  capacity: integer("capacity"),
  partnerId: uuid("partner_id").references(() => partner.id, { onDelete: "set null" }), // turf manager
  isActive: boolean("is_active").notNull().default(true),
  images: jsonb("images").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});



export const team = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  badgeUrl: varchar("badge_url", { length: 512 }),
  badgeFallback: varchar("badge_fallback", { length: 8 }), // initials
  type: varchar("type", { length: 64 }), // e.g. "Club", "National", "5-a-side"
  bio: text("bio"),
  captainId: uuid("captain_id").references(() => user.id, {
    onDelete: "set null",
  }),
  homePitchId: uuid("home_pitch_id").references(() => turf.id, {
    onDelete: "set null",
  }),
  trainingPitchId: uuid("training_pitch_id").references(() => turf.id, {
    onDelete: "set null",
  }),
  stats: jsonb("stats").$type<{
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    rating: number;
  }>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const teamMember = pgTable(
  "team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .references(() => team.id, { onDelete: "cascade" })
      .notNull(),
    playerId: uuid("player_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    position: positionEnum("position"),
    jerseyNumber: smallint("jersey_number"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => ({
    uniqueTeamMember: uniqueIndex("unique_team_member").on(
      table.teamId,
      table.playerId,
    ),
    teamIdx: index("team_member_team_idx").on(table.teamId),
    playerIdx: index("team_member_player_idx").on(table.playerId),
  }),
);

export const challenge = pgTable(
  "challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // The team sending the challenge
    challengerTeamId: uuid("challenger_team_id")
      .references(() => team.id, { onDelete: "cascade" })
      .notNull(),
    // The team being challenged
    challengedTeamId: uuid("challenged_team_id")
      .references(() => team.id, { onDelete: "cascade" })
      .notNull(),
    // Proposed match details
    proposedDate: timestamp("proposed_date", { withTimezone: true }),
    proposedTurfId: uuid("proposed_turf_id").references(() => turf.id, {
      onDelete: "set null",
    }),
    proposedLocation: varchar("proposed_location", { length: 256 }),
    mode: varchar("mode", { length: 32 }).notNull().default("5v5"),
    message: text("message"), // optional trash talk / context
    status: challengeStatusEnum("status").notNull().default("PENDING"),
    // If accepted, the resulting match
    matchId: uuid("match_id").references(() => match.id, {
      onDelete: "set null",
    }),
    // Who acted last (for audit)
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Prevent duplicate pending challenges between same two teams
    uniquePendingChallenge: uniqueIndex("unique_pending_challenge").on(
      table.challengerTeamId,
      table.challengedTeamId,
    ),
    challengerIdx: index("challenge_challenger_idx").on(table.challengerTeamId),
    challengedIdx: index("challenge_challenged_idx").on(table.challengedTeamId),
    statusIdx: index("challenge_status_idx").on(table.status),
  }),
);



export const tournament = pgTable("tournaments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 256 }),
  turfId: uuid("turf_id").references(() => turf.id, { onDelete: "set null" }),
  prizePool: numeric("prize_pool", { precision: 12, scale: 2 }).default("0.00"),
  entryFee: numeric("entry_fee", { precision: 10, scale: 2 }).default("0.00"),
  maxTeams: integer("max_teams"),
  maxPlayersPerTeam: integer("max_players_per_team"),
  format: tournamentFormatEnum("format").notNull().default("KNOCKOUT"),
  status: tournamentStatusEnum("status").notNull().default("UPCOMING"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  registrationDeadline: timestamp("registration_deadline", {
    withTimezone: true,
  }),
  rules: text("rules"),
  bannerId: uuid("banner_id").references(() => media.id, {
    onDelete: "set null",
  }),
  organizedBy: uuid("organized_by").references(() => systemUser.id, {
    onDelete: "set null",
  }),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Teams registered in a tournament */
export const tournamentTeam = pgTable(
  "tournament_teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .references(() => tournament.id, { onDelete: "cascade" })
      .notNull(),
    teamId: uuid("team_id")
      .references(() => team.id, { onDelete: "cascade" })
      .notNull(),
    registeredAt: timestamp("registered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
    isEliminated: boolean("is_eliminated").notNull().default(false),
    groupName: varchar("group_name", { length: 8 }), // e.g. "A", "B" for group stage
  },
  (table) => ({
    uniqueTournamentTeam: uniqueIndex("unique_tournament_team").on(
      table.tournamentId,
      table.teamId,
    ),
    tournamentIdx: index("tournament_team_tournament_idx").on(
      table.tournamentId,
    ),
  }),
);

/** Individual player participants in a tournament (for individual-based tournaments) */
export const tournamentParticipant = pgTable(
  "tournament_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .references(() => tournament.id, { onDelete: "cascade" })
      .notNull(),
    playerId: uuid("player_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    registeredAt: timestamp("registered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
  },
  (table) => ({
    uniqueTournamentParticipant: uniqueIndex(
      "unique_tournament_participant",
    ).on(table.tournamentId, table.playerId),
  }),
);

/**
 * Standings for a tournament — computed and cached here.
 * Can represent team standings or individual player standings.
 */
export const standing = pgTable(
  "standings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentId: uuid("tournament_id")
      .references(() => tournament.id, { onDelete: "cascade" })
      .notNull(),
    teamId: uuid("team_id").references(() => team.id, { onDelete: "cascade" }),
    playerId: uuid("player_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    groupName: varchar("group_name", { length: 8 }),
    rank: integer("rank").notNull().default(0),
    matchesPlayed: integer("matches_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    draws: integer("draws").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    goalsFor: integer("goals_for").notNull().default(0),
    goalsAgainst: integer("goals_against").notNull().default(0),
    goalDifference: integer("goal_difference").notNull().default(0),
    points: integer("points").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    tournamentIdx: index("standing_tournament_idx").on(table.tournamentId),
    tournamentTeamIdx: index("standing_tournament_team_idx").on(
      table.tournamentId,
      table.teamId,
    ),
  }),
);



export const match = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    location: varchar("location", { length: 256 }).notNull(),
    turfId: uuid("turf_id").references(() => turf.id, { onDelete: "set null" }),
    tournamentId: uuid("tournament_id").references(() => tournament.id, {
      onDelete: "set null",
    }),
    homeTeamId: uuid("home_team_id").references(() => team.id, {
      onDelete: "set null",
    }),
    awayTeamId: uuid("away_team_id").references(() => team.id, {
      onDelete: "set null",
    }),
    /** Legacy/open match: list of player IDs on each side */
    homeTeam: jsonb("home_team").$type<string[]>().notNull().default([]),
    awayTeam: jsonb("away_team").$type<string[]>().notNull().default([]),
    mode: varchar("mode", { length: 32 }).notNull(), // "5v5", "7v7", "11v11"
    price: numeric("price", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    maxPlayers: integer("max_players").notNull().default(14),
    registeredPlayerIds: jsonb("registered_player_ids")
      .$type<string[]>()
      .notNull()
      .default([]),
    status: fixtureStatusEnum("status").notNull().default("UPCOMING"),
    completed: boolean("completed").notNull().default(false),
    score: jsonb("score").$type<{ home: number; away: number }>(),
    matchReport: text("match_report"),
    isPublic: boolean("is_public").notNull().default(true),
    roundName: varchar("round_name", { length: 64 }), // "Quarter Final", "Group Stage - MD1"
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    tournamentIdx: index("match_tournament_idx").on(table.tournamentId),
    dateIdx: index("match_date_idx").on(table.date),
    statusIdx: index("match_status_idx").on(table.status),
  }),
);

/** Players in a match with their position and performance */
export const matchPlayer = pgTable(
  "match_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .references(() => match.id, { onDelete: "cascade" })
      .notNull(),
    playerId: uuid("player_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    position: positionEnum("position").notNull(),
    team: varchar("team", { length: 8 }).notNull().default("home"), // "home" | "away"
    goals: smallint("goals").notNull().default(0),
    assists: smallint("assists").notNull().default(0),
    yellowCards: smallint("yellow_cards").notNull().default(0),
    redCard: boolean("red_card").notNull().default(false),
    rating: numeric("rating", { precision: 4, scale: 2 }),
    motm: boolean("motm").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniquePlayerPerMatch: uniqueIndex("unique_match_player").on(
      table.matchId,
      table.playerId,
    ),
    matchIdx: index("match_player_match_idx").on(table.matchId),
    playerIdx: index("match_player_player_idx").on(table.playerId),
  }),
);


export const media = pgTable(
  "media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    uploaderId: uuid("uploader_id").references(() => user.id, {
      onDelete: "set null",
    }),
    type: mediaTypeEnum("type").notNull(),
    url: varchar("url", { length: 1024 }).notNull(),
    caption: varchar("caption", { length: 256 }),
    mimeType: varchar("mime_type", { length: 64 }),
    sizeBytes: integer("size_bytes"),
    /** Polymorphic reference: what entity this media belongs to */
    entityType: varchar("entity_type", { length: 64 }), // "tournament" | "match" | "team" | "turf"
    entityId: uuid("entity_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    entityIdx: index("media_entity_idx").on(table.entityType, table.entityId),
    uploaderIdx: index("media_uploader_idx").on(table.uploaderId),
  }),
);



export const payment = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => user.id)
      .notNull(),
    matchId: uuid("match_id").references(() => match.id, {
      onDelete: "set null",
    }),
    tournamentId: uuid("tournament_id").references(() => tournament.id, {
      onDelete: "set null",
    }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("KES"),
    phone: varchar("phone", { length: 15 }).notNull(),
    checkoutRequestId: varchar("checkout_request_id", { length: 128 }).unique(),
    merchantRequestId: varchar("merchant_request_id", { length: 128 }),
    mpesaReceiptNumber: varchar("mpesa_receipt_number", { length: 64 }),
    status: paymentStatusEnum("status").notNull().default("pending"),
    failureReason: varchar("failure_reason", { length: 256 }),
    emailSent: boolean("email_sent").notNull().default(false),
    metadata: jsonb("metadata"), // extra Mpesa/provider fields
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index("payment_user_idx").on(table.userId),
    matchIdx: index("payment_match_idx").on(table.matchId),
    statusIdx: index("payment_status_idx").on(table.status),
  }),
);



export const notification = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    type: notificationTypeEnum("type").notNull().default("GENERAL"),
    title: varchar("title", { length: 128 }).notNull(),
    body: text("body"),
    isRead: boolean("is_read").notNull().default(false),
    entityType: varchar("entity_type", { length: 64 }),
    entityId: uuid("entity_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("notification_user_idx").on(table.userId),
    readIdx: index("notification_read_idx").on(table.userId, table.isRead),
  }),
);



export const systemLog = pgTable(
  "system_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id"), // system_user or user who performed action
    actorType: varchar("actor_type", { length: 16 }), // "system_user" | "user"
    action: varchar("action", { length: 128 }).notNull(), // e.g. "CREATE_MATCH"
    entityType: varchar("entity_type", { length: 64 }),
    entityId: uuid("entity_id"),
    description: text("description"),
    ipAddress: varchar("ip_address", { length: 45 }), // supports IPv6
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    actorIdx: index("system_log_actor_idx").on(table.actorId),
    actionIdx: index("system_log_action_idx").on(table.action),
    createdAtIdx: index("system_log_created_at_idx").on(table.createdAt),
  }),
);



export const verificationToken = pgTable(
  "verification_tokens",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    email: varchar("email", { length: 64 }).notNull(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    emailTokenUnique: uniqueIndex("email_token_unique").on(
      table.email,
      table.token,
    ),
  }),
);

export const passwordResetToken = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    email: varchar("email", { length: 64 }).notNull(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: index("password_reset_email_idx").on(table.email),
  }),
);

 
export const kycSubmission = pgTable(
  "kyc_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partnerId: uuid("partner_id")
      .references(() => partner.id, { onDelete: "cascade" })
      .notNull(),
    // Which attempt this is (1 = first, 2 = first resubmission, etc.)
    attemptNumber: integer("attempt_number").notNull().default(1),
    status: kycStatusEnum("status").notNull().default("pending"),
    // Admin who reviewed this submission
    reviewedBy: uuid("reviewed_by"), // references systemUser.id
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    // Admin notes (internal, not shown to partner)
    adminNotes: text("admin_notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    partnerIdx: index("kyc_submission_partner_idx").on(table.partnerId),
    statusIdx: index("kyc_submission_status_idx").on(table.status),
  }),
);

 
export const kycDocument = pgTable(
  "kyc_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id")
      .references(() => kycSubmission.id, { onDelete: "cascade" })
      .notNull(),
    partnerId: uuid("partner_id")
      .references(() => partner.id, { onDelete: "cascade" })
      .notNull(),
    // Matches the `id` field in KycDocument[] from KycFlowSettings (e.g. "national_id")
    documentTypeId: varchar("document_type_id", { length: 64 }).notNull(),
    documentLabel: varchar("document_label", { length: 128 }).notNull(),
    fileUrl: varchar("file_url", { length: 1024 }).notNull(),
    mimeType: varchar("mime_type", { length: 64 }),
    sizeBytes: integer("size_bytes"),
    status: kycDocumentStatusEnum("status").notNull().default("pending"),
    rejectionNote: text("rejection_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    submissionIdx: index("kyc_doc_submission_idx").on(table.submissionId),
    partnerIdx: index("kyc_doc_partner_idx").on(table.partnerId),
  }),
);

 
export const partnerSettings = pgTable("partner_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
 
  // Access & Security
  sessionTimeoutMinutes: integer("session_timeout_minutes").notNull().default(60),
  maxFailedLogins: integer("max_failed_logins").notNull().default(5),
  autoSuspendAfterDays: integer("auto_suspend_after_days").notNull().default(90),
  passwordMinLength: integer("password_min_length").notNull().default(8),
  requirePasswordSpecialChar: boolean("require_password_special_char")
    .notNull()
    .default(true),
  requirePasswordNumber: boolean("require_password_number")
    .notNull()
    .default(true),
 
  // Email notifications
  notifyOnBookingConfirmed: boolean("notify_on_booking_confirmed")
    .notNull()
    .default(true),
  notifyOnPaymentReceived: boolean("notify_on_payment_received")
    .notNull()
    .default(true),
  notifyOnTurfReview: boolean("notify_on_turf_review").notNull().default(true),
  notifyOnAccountSuspended: boolean("notify_on_account_suspended")
    .notNull()
    .default(true),
  notifyOnKycApproved: boolean("notify_on_kyc_approved").notNull().default(true),
  notifyOnKycRejected: boolean("notify_on_kyc_rejected").notNull().default(true),
 
  // Revenue
  supportEmail: varchar("support_email", { length: 128 })
    .notNull()
    .default("partners@mkrsports.com"),
  defaultCurrency: varchar("default_currency", { length: 8 })
    .notNull()
    .default("KES"),
  defaultCommissionPercent: numeric("default_commission_percent", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("10.00"),
 
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

 
export const turfSettings = pgTable("turf_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
 
  // Booking rules
  minBookingHours: numeric("min_booking_hours", { precision: 4, scale: 1 })
    .notNull()
    .default("1.0"),
  maxBookingHours: numeric("max_booking_hours", { precision: 4, scale: 1 })
    .notNull()
    .default("8.0"),
  advanceBookingDays: integer("advance_booking_days").notNull().default(30),
  cancellationHours: integer("cancellation_hours").notNull().default(24),
 
  // Listing requirements
  autoApproveListings: boolean("auto_approve_listings").notNull().default(false),
  requireCapacity: boolean("require_capacity").notNull().default(true),
  requireSurface: boolean("require_surface").notNull().default(true),
  requireImages: boolean("require_images").notNull().default(true),
  minImages: integer("min_images").notNull().default(3),
 
  // Pricing defaults by surface (jsonb for flexibility)
  // Shape: { natural_grass: 3000, artificial_turf: 2500, futsal_floor: 2000, indoor: 3500 }
  surfacePriceDefaults: jsonb("surface_price_defaults")
    .$type<Record<string, number>>()
    .default({}),
 
  // Amenity vocabulary
  // Ordered list of amenity strings partners can pick from
  amenityOptions: jsonb("amenity_options")
    .$type<string[]>()
    .default([]),
 
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

 
export const kycSettings = pgTable("kyc_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
 
  // Approval
  approvalMode: varchar("approval_mode", { length: 16 })
    .notNull()
    .default("manual"), // "manual" | "auto"
  reviewSlaHours: integer("review_sla_hours").notNull().default(48),
  expiryDays: integer("expiry_days").notNull().default(365),
  allowResubmission: boolean("allow_resubmission").notNull().default(true),
  maxResubmissions: integer("max_resubmissions").notNull().default(3),
 
  // Admin notifications
  notifyAdminOnSubmission: boolean("notify_admin_on_submission")
    .notNull()
    .default(true),
  adminNotificationEmail: varchar("admin_notification_email", { length: 128 })
    .notNull()
    .default("kyc@mkrsports.com"),
 
  // Email templates
  approvalEmailTemplate: text("approval_email_template").notNull().default(
    "Congratulations! Your KYC documents have been verified and your partner account is now active.",
  ),
  rejectionEmailTemplate: text("rejection_email_template").notNull().default(
    "We were unable to verify your submitted documents. Please review the feedback below and resubmit.",
  ),
 
  // Required documents config
  // Stored as jsonb — shape matches KycDocument[] from KycFlowSettings.tsx:
  // [{ id, label, description, required, acceptedTypes, maxSizeMb }]
  requiredDocuments: jsonb("required_documents")
    .$type<
      {
        id: string;
        label: string;
        description: string;
        required: boolean;
        acceptedTypes: "image" | "pdf" | "any";
        maxSizeMb: number;
      }[]
    >()
    .default([]),
 
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});



export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Partner = typeof partner.$inferSelect;
export type NewPartner = typeof partner.$inferInsert;
export type SystemUser = typeof systemUser.$inferSelect;
export type NewSystemUser = typeof systemUser.$inferInsert;
export type SystemRole = typeof systemRole.$inferSelect;
export type NewSystemRole = typeof systemRole.$inferInsert;
export type Permission = typeof permission.$inferSelect;
export type NewPermission = typeof permission.$inferInsert;
export type RolePermission = typeof rolePermission.$inferSelect;
export type Turf = typeof turf.$inferSelect;
export type NewTurf = typeof turf.$inferInsert;
export type Team = typeof team.$inferSelect;
export type NewTeam = typeof team.$inferInsert;
export type TeamMember = typeof teamMember.$inferSelect;
export type Challenge = typeof challenge.$inferSelect;
export type NewChallenge = typeof challenge.$inferInsert;
export type Tournament = typeof tournament.$inferSelect;
export type NewTournament = typeof tournament.$inferInsert;
export type TournamentTeam = typeof tournamentTeam.$inferSelect;
export type TournamentParticipant = typeof tournamentParticipant.$inferSelect;
export type Standing = typeof standing.$inferSelect;
export type Match = typeof match.$inferSelect;
export type NewMatch = typeof match.$inferInsert;
export type MatchPlayer = typeof matchPlayer.$inferSelect;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;
export type Notification = typeof notification.$inferSelect;
export type SystemLog = typeof systemLog.$inferSelect;
export type KycSubmission = typeof kycSubmission.$inferSelect;
export type NewKycSubmission = typeof kycSubmission.$inferInsert;
export type KycDocument = typeof kycDocument.$inferSelect;
export type NewKycDocument = typeof kycDocument.$inferInsert;
export type PartnerSettings = typeof partnerSettings.$inferSelect;
export type TurfSettings = typeof turfSettings.$inferSelect;
export type KycSettings = typeof kycSettings.$inferSelect;
