import { pgTable, uuid, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

// Organizations table
export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
});

// Clients table
export const clients = pgTable('clients', {
    id: uuid('id').primaryKey(),
    logoUrl: text('logo_url'),
});

// Client Users table (for team members count)
export const clientUsers = pgTable('client_users', {
    id: uuid('id').primaryKey(),
    clientId: uuid('client_id').notNull(),
    userId: text('user_id'),
});

// Client Markets table
export const clientMarkets = pgTable('client_markets', {
    id: uuid('id').primaryKey(),
    clientId: uuid('client_id').notNull(),
    isActive: boolean('is_active').default(true),
});

// Client Products table
export const clientProducts = pgTable('client_products', {
    id: uuid('id').primaryKey(),
    clientId: uuid('client_id').notNull(),
    productId: uuid('product_id').notNull(),
    isActive: boolean('is_active').default(true),
});

// Visit Core table
export const visitCore = pgTable('visit_core', {
    id: uuid('id').primaryKey(),
    clientId: uuid('client_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// Accounts table
export const accounts = pgTable('accounts', {
    id: uuid('id').primaryKey(),
    authUserId: uuid('auth_user_id'),
    email: text('email'),
    username: text('username'),
    fullName: text('full_name'),
    arabicName: text('arabic_name'),
    fieldRole: text('field_role'),
    portalRole: text('portal_role'),
    accountStatus: text('account_status'),
});

// Client Portal User Roles table
export const clientPortalUserRoles = pgTable('client_portal_user_roles', {
    id: uuid('id').primaryKey(),
    clientId: uuid('client_id').notNull(),
    accountId: uuid('account_id').notNull(),
    roleKey: text('role_key'),
    divisionId: uuid('division_id'),
});

// Client Portal Role Catalog table
export const clientPortalRoleCatalog = pgTable('client_portal_role_catalog', {
    key: text('key').primaryKey(),
    labelEn: text('label_en').notNull(),
    labelAr: text('label_ar').notNull(),
});

// Markets table (branches)
export const markets = pgTable('markets', {
    id: uuid('id').primaryKey(),
    branch: text('branch'),
    branchAr: text('branch_ar'),
});

// Visit Offroute Requests table
export const visitOffrouteRequests = pgTable('visit_offroute_requests', {
    id: uuid('id').primaryKey(),
    clientId: uuid('client_id'),
    divisionId: uuid('division_id'),
    requesterAccountId: uuid('requester_account_id').notNull(),
    approverAccountId: uuid('approver_account_id'),
    marketId: uuid('market_id'),
    reasonCustom: text('reason_custom'),
    status: text('status').notNull(),
    autoApproved: boolean('auto_approved').notNull().default(false),
    requestedAt: timestamp('requested_at', { withTimezone: true }),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    waitSeconds: integer('wait_seconds'),
    source: text('source'),
});

// Notifications table
export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id'),
    titleEn: text('title_en').notNull(),
    titleAr: text('title_ar'),
    messageEn: text('message_en'),
    messageAr: text('message_ar'),
    audienceType: text('audience_type'),
    forAll: boolean('for_all'),
    forRoles: text('for_roles').array(),
    forUser: uuid('for_user'),
    unifiedStatus: text('unified_status'),
    divisionId: uuid('division_id'),
    teamLeader: uuid('team_leader'),
    createdAt: timestamp('created_at', { withTimezone: true }),
});

// Notification Reads table (for read counts)
export const notificationReads = pgTable('notification_reads', {
    notificationId: uuid('notification_id').notNull(),
    userId: uuid('user_id').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
});

// Notification Actions table (for action tracking)
export const notificationActions = pgTable('notification_actions', {
    id: uuid('id').primaryKey().defaultRandom(),
    notificationId: uuid('notification_id').notNull(),
    userId: uuid('user_id').notNull(),
    actionType: text('action_type').notNull(),
    performedAt: timestamp('performed_at', { withTimezone: true }),
});

// Client Divisions table
export const clientDivisions = pgTable('client_divisions', {
    id: uuid('id').primaryKey(),
    clientId: uuid('client_id').notNull(),
    name: text('name'),
    nameAr: text('name_ar'),
});

// Complaints table
export const complaints = pgTable('complaints', {
    id: uuid('id').primaryKey(),
    clientId: uuid('client_id').notNull(),
    requesterId: uuid('requester_id').notNull(),
    currentAssigneeId: uuid('current_assignee_id'),
    divisionId: uuid('division_id').notNull(),
    marketId: uuid('market_id'),
    category: text('category'),
    description: text('description').notNull(),
    status: text('status'),
    photos: text('photos').array(),
    slaDeadline: timestamp('sla_deadline', { withTimezone: true }).notNull(),
    targetCustomDetails: text('target_custom_details'),
    createdAt: timestamp('created_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// Complaint Targets table
export const complaintTargets = pgTable('complaint_targets', {
    id: uuid('id').primaryKey(),
    complaintId: uuid('complaint_id').notNull(),
    accountId: uuid('account_id').notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true }),
});

// Complaint Timeline table
export const complaintTimeline = pgTable('complaint_timeline', {
    id: uuid('id').primaryKey(),
    complaintId: uuid('complaint_id').notNull(),
    actorId: uuid('actor_id'),
    actionType: text('action_type').notNull(),
    messageEn: text('message_en'),
    messageAr: text('message_ar'),
    notes: text('notes'),
    evidencePhoto: text('evidence_photo'),
    createdAt: timestamp('created_at', { withTimezone: true }),
});

// Categories table
export const categories = pgTable('categories', {
    id: uuid('id').primaryKey(),
    name: text('name'),
    nameAr: text('name_ar'),
});

// Products table
export const products = pgTable('products', {
    id: uuid('id').primaryKey(),
    name: text('name'),
    nameAr: text('name_ar'),
    categoryId: uuid('category_id'),
    imageUrl: text('image_url'),
    barcode: text('barcode'),
});
