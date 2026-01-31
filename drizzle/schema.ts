import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended for host functionality.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "host"]).default("user").notNull(),
  phone: varchar("phone", { length: 32 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  isVerified: boolean("isVerified").default(false),
  passwordHash: varchar("passwordHash", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Accommodations (Unterkünfte)
 */
export const accommodations = mysqlTable("accommodations", {
  id: int("id").autoincrement().primaryKey(),
  hostId: int("hostId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  shortDescription: text("shortDescription"),
  accommodationType: mysqlEnum("accommodationType", ["apartment", "house", "room", "villa", "cabin", "other"]).default("apartment"),
  
  // Location
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("houseNumber", { length: 20 }),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("Deutschland"),
  region: varchar("region", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Capacity
  maxGuests: int("maxGuests").default(2),
  bedrooms: int("bedrooms").default(1),
  beds: int("beds").default(1),
  bathrooms: int("bathrooms").default(1),
  
  // Pricing
  pricePerNight: decimal("pricePerNight", { precision: 10, scale: 2 }).notNull(),
  weekendPrice: decimal("weekendPrice", { precision: 10, scale: 2 }),
  cleaningFee: decimal("cleaningFee", { precision: 10, scale: 2 }).default("0"),
  
  // Rules
  minNights: int("minNights").default(1),
  maxNights: int("maxNights").default(30),
  checkInTime: varchar("checkInTime", { length: 10 }).default("15:00"),
  checkOutTime: varchar("checkOutTime", { length: 10 }).default("11:00"),
  houseRules: text("houseRules"),
  
  // Settings
  instantBooking: boolean("instantBooking").default(false),
  isActive: boolean("isActive").default(false),
  isPublished: boolean("isPublished").default(false),
  
  // Stats
  viewCount: int("viewCount").default(0),
  bookingCount: int("bookingCount").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Accommodation = typeof accommodations.$inferSelect;
export type InsertAccommodation = typeof accommodations.$inferInsert;

/**
 * Accommodation Images
 */
export const accommodationImages = mysqlTable("accommodation_images", {
  id: int("id").autoincrement().primaryKey(),
  accommodationId: int("accommodationId").notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 255 }),
  caption: varchar("caption", { length: 255 }),
  sortOrder: int("sortOrder").default(0),
  isMain: boolean("isMain").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccommodationImage = typeof accommodationImages.$inferSelect;
export type InsertAccommodationImage = typeof accommodationImages.$inferInsert;

/**
 * Amenities (Ausstattung)
 */
export const amenities = mysqlTable("amenities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  category: mysqlEnum("category", ["basics", "kitchen", "bathroom", "bedroom", "entertainment", "outdoor", "safety", "accessibility", "other"]).default("basics"),
});

export type Amenity = typeof amenities.$inferSelect;
export type InsertAmenity = typeof amenities.$inferInsert;

/**
 * Accommodation-Amenity Junction Table
 */
export const accommodationAmenities = mysqlTable("accommodation_amenities", {
  id: int("id").autoincrement().primaryKey(),
  accommodationId: int("accommodationId").notNull(),
  amenityId: int("amenityId").notNull(),
});

export type AccommodationAmenity = typeof accommodationAmenities.$inferSelect;

/**
 * Bookings (Buchungen)
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  accommodationId: int("accommodationId").notNull(),
  hostId: int("hostId").notNull(),
  guestName: varchar("guestName", { length: 255 }).notNull(),
  guestEmail: varchar("guestEmail", { length: 320 }).notNull(),
  guestPhone: varchar("guestPhone", { length: 32 }),
  guestMessage: text("guestMessage"),
  
  checkIn: timestamp("checkIn").notNull(),
  checkOut: timestamp("checkOut").notNull(),
  numberOfGuests: int("numberOfGuests").notNull(),
  
  // Pricing
  pricePerNight: decimal("pricePerNight", { precision: 10, scale: 2 }).notNull(),
  numberOfNights: int("numberOfNights").notNull(),
  cleaningFee: decimal("cleaningFee", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  
  // Status
  status: mysqlEnum("status", ["pending", "confirmed", "rejected", "cancelled", "completed"]).default("pending"),
  hostNotes: text("hostNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Availability / Blocked Dates
 */
export const availability = mysqlTable("availability", {
  id: int("id").autoincrement().primaryKey(),
  accommodationId: int("accommodationId").notNull(),
  date: timestamp("date").notNull(),
  status: mysqlEnum("status", ["available", "booked", "blocked"]).default("available"),
  bookingId: int("bookingId"),
  note: varchar("note", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = typeof availability.$inferInsert;

/**
 * Platform Configuration (White-Label)
 */
export const platformConfig = mysqlTable("platform_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: varchar("description", { length: 255 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformConfig = typeof platformConfig.$inferSelect;
export type InsertPlatformConfig = typeof platformConfig.$inferInsert;

/**
 * Reviews (Bewertungen)
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  accommodationId: int("accommodationId").notNull(),
  guestName: varchar("guestName", { length: 255 }).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  hostResponse: text("hostResponse"),
  isPublished: boolean("isPublished").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Regions (for SEO and filtering)
 */
export const regions = mysqlTable("regions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  accommodationCount: int("accommodationCount").default(0),
  isActive: boolean("isActive").default(true),
});

export type Region = typeof regions.$inferSelect;
export type InsertRegion = typeof regions.$inferInsert;
