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
    fullName: text('first_name'),
    arabicName: text('arabic_name'),
    portalRole: text('portal_role'),
    accountStatus: text('account_status'),
});

// Client Portal User Roles table
export const clientPortalUserRoles = pgTable('client_portal_user_roles', {
    id: uuid('id').primaryKey(),
    clientId: uuid('client_id').notNull(),
    accountId: uuid('account_id').notNull(),
    roleKey: text('role_key'),
});

// Client Portal Role Catalog table
export const clientPortalRoleCatalog = pgTable('client_portal_role_catalog', {
    key: text('key').primaryKey(),
    labelEn: text('label_en').notNull(),
    labelAr: text('label_ar').notNull(),
});
