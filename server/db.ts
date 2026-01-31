import { eq, and, gte, lte, like, desc, asc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  accommodations, InsertAccommodation, Accommodation,
  accommodationImages, InsertAccommodationImage,
  amenities, InsertAmenity,
  accommodationAmenities,
  bookings, InsertBooking, Booking,
  availability, InsertAvailability,
  platformConfig, InsertPlatformConfig,
  reviews, InsertReview,
  regions, InsertRegion
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER FUNCTIONS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "bio", "avatarUrl"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "host") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  email: string;
  name: string;
  passwordHash: string;
  role?: "user" | "admin" | "host";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate a unique openId for email-based users
  const openId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  const result = await db.insert(users).values({
    openId,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    role: data.role || 'user',
    loginMethod: 'email',
    lastSignedIn: new Date(),
  });
  
  return result[0].insertId;
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

// ==================== ACCOMMODATION FUNCTIONS ====================

export async function createAccommodation(data: InsertAccommodation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accommodations).values(data);
  return result[0].insertId;
}

export async function updateAccommodation(id: number, data: Partial<InsertAccommodation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(accommodations).set(data).where(eq(accommodations.id, id));
}

export async function getAccommodationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accommodations).where(eq(accommodations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAccommodationBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accommodations).where(eq(accommodations.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAccommodationsByHost(hostId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accommodations).where(eq(accommodations.hostId, hostId)).orderBy(desc(accommodations.createdAt));
}

export async function getPublishedAccommodations(filters?: {
  city?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  minGuests?: number;
  amenityIds?: number[];
  limit?: number;
  offset?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(accommodations).where(
    and(
      eq(accommodations.isPublished, true),
      eq(accommodations.isActive, true)
    )
  );

  // Apply filters
  const conditions = [
    eq(accommodations.isPublished, true),
    eq(accommodations.isActive, true)
  ];

  if (filters?.city) {
    conditions.push(like(accommodations.city, `%${filters.city}%`));
  }
  if (filters?.region) {
    conditions.push(eq(accommodations.region, filters.region));
  }
  if (filters?.minPrice) {
    conditions.push(gte(accommodations.pricePerNight, filters.minPrice.toString()));
  }
  if (filters?.maxPrice) {
    conditions.push(lte(accommodations.pricePerNight, filters.maxPrice.toString()));
  }
  if (filters?.minGuests) {
    conditions.push(gte(accommodations.maxGuests, filters.minGuests));
  }

  let orderBy;
  switch (filters?.sortBy) {
    case 'price_asc':
      orderBy = asc(accommodations.pricePerNight);
      break;
    case 'price_desc':
      orderBy = desc(accommodations.pricePerNight);
      break;
    case 'rating':
      orderBy = desc(accommodations.averageRating);
      break;
    case 'newest':
    default:
      orderBy = desc(accommodations.createdAt);
  }

  return db.select()
    .from(accommodations)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(filters?.limit || 20)
    .offset(filters?.offset || 0);
}

export async function getFeaturedAccommodations(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(accommodations)
    .where(and(eq(accommodations.isPublished, true), eq(accommodations.isActive, true)))
    .orderBy(desc(accommodations.bookingCount))
    .limit(limit);
}

export async function incrementAccommodationViews(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(accommodations)
    .set({ viewCount: sql`${accommodations.viewCount} + 1` })
    .where(eq(accommodations.id, id));
}

// ==================== ACCOMMODATION IMAGES ====================

export async function addAccommodationImage(data: InsertAccommodationImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accommodationImages).values(data);
  return result[0].insertId;
}

export async function getAccommodationImages(accommodationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(accommodationImages)
    .where(eq(accommodationImages.accommodationId, accommodationId))
    .orderBy(asc(accommodationImages.sortOrder));
}

export async function deleteAccommodationImage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(accommodationImages).where(eq(accommodationImages.id, id));
}

export async function setMainImage(accommodationId: number, imageId: number) {
  const db = await getDb();
  if (!db) return;
  // Reset all images
  await db.update(accommodationImages)
    .set({ isMain: false })
    .where(eq(accommodationImages.accommodationId, accommodationId));
  // Set new main
  await db.update(accommodationImages)
    .set({ isMain: true })
    .where(eq(accommodationImages.id, imageId));
}

// ==================== AMENITIES ====================

export async function getAllAmenities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(amenities).orderBy(asc(amenities.category), asc(amenities.name));
}

export async function createAmenity(data: InsertAmenity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(amenities).values(data);
  return result[0].insertId;
}

export async function getAccommodationAmenities(accommodationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ amenity: amenities })
    .from(accommodationAmenities)
    .innerJoin(amenities, eq(accommodationAmenities.amenityId, amenities.id))
    .where(eq(accommodationAmenities.accommodationId, accommodationId));
}

export async function setAccommodationAmenities(accommodationId: number, amenityIds: number[]) {
  const db = await getDb();
  if (!db) return;
  // Delete existing
  await db.delete(accommodationAmenities).where(eq(accommodationAmenities.accommodationId, accommodationId));
  // Add new
  if (amenityIds.length > 0) {
    await db.insert(accommodationAmenities).values(
      amenityIds.map(amenityId => ({ accommodationId, amenityId }))
    );
  }
}

// ==================== BOOKINGS ====================

export async function createBooking(data: {
  accommodationId: number;
  hostId: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guestMessage?: string | null;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  pricePerNight: string;
  numberOfNights: number;
  cleaningFee?: string | null;
  totalPrice: string;
  status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Explicitly construct the booking object with only the required fields
  const bookingData: InsertBooking = {
    accommodationId: data.accommodationId,
    hostId: data.hostId,
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone || null,
    guestMessage: data.guestMessage || null,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    numberOfGuests: data.numberOfGuests,
    pricePerNight: data.pricePerNight,
    numberOfNights: data.numberOfNights,
    cleaningFee: data.cleaningFee || '0',
    totalPrice: data.totalPrice,
    status: data.status || 'pending',
  };
  
  const result = await db.insert(bookings).values(bookingData);
  return result[0].insertId;
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingsByHost(hostId: number, status?: Booking['status']) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(bookings.hostId, hostId)];
  if (status) {
    conditions.push(eq(bookings.status, status));
  }
  return db.select().from(bookings).where(and(...conditions)).orderBy(desc(bookings.createdAt));
}

export async function getBookingsByAccommodation(accommodationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.accommodationId, accommodationId)).orderBy(desc(bookings.checkIn));
}

export async function updateBookingStatus(id: number, status: Booking['status'], hostNotes?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Partial<InsertBooking> = { status };
  if (hostNotes !== undefined) {
    updateData.hostNotes = hostNotes;
  }
  await db.update(bookings).set(updateData).where(eq(bookings.id, id));
}

export async function getUpcomingCheckIns(hostId: number, days = 7) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);
  
  return db.select()
    .from(bookings)
    .where(and(
      eq(bookings.hostId, hostId),
      eq(bookings.status, 'confirmed'),
      gte(bookings.checkIn, now),
      lte(bookings.checkIn, future)
    ))
    .orderBy(asc(bookings.checkIn));
}

export async function getHostStats(hostId: number) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, pendingRequests: 0, confirmedBookings: 0, occupancyRate: 0 };
  
  // Get total revenue from completed bookings
  const revenueResult = await db.select({ total: sql<string>`COALESCE(SUM(${bookings.totalPrice}), 0)` })
    .from(bookings)
    .where(and(eq(bookings.hostId, hostId), eq(bookings.status, 'completed')));
  
  // Get pending requests count
  const pendingResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(bookings)
    .where(and(eq(bookings.hostId, hostId), eq(bookings.status, 'pending')));
  
  // Get confirmed bookings count
  const confirmedResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(bookings)
    .where(and(eq(bookings.hostId, hostId), eq(bookings.status, 'confirmed')));
  
  return {
    totalRevenue: parseFloat(revenueResult[0]?.total || '0'),
    pendingRequests: pendingResult[0]?.count || 0,
    confirmedBookings: confirmedResult[0]?.count || 0,
    occupancyRate: 0 // Calculate based on availability data
  };
}

// ==================== AVAILABILITY ====================

export async function getAvailability(accommodationId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(availability)
    .where(and(
      eq(availability.accommodationId, accommodationId),
      gte(availability.date, startDate),
      lte(availability.date, endDate)
    ))
    .orderBy(asc(availability.date));
}

export async function setAvailability(data: InsertAvailability) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(availability).values(data);
}

export async function blockDates(accommodationId: number, dates: Date[], note?: string) {
  const db = await getDb();
  if (!db) return;
  
  for (const date of dates) {
    // Check if entry exists
    const existing = await db.select()
      .from(availability)
      .where(and(eq(availability.accommodationId, accommodationId), eq(availability.date, date)))
      .limit(1);
    
    if (existing.length > 0) {
      await db.update(availability)
        .set({ status: 'blocked', note })
        .where(eq(availability.id, existing[0].id));
    } else {
      await db.insert(availability).values({
        accommodationId,
        date,
        status: 'blocked',
        note
      });
    }
  }
}

export async function unblockDates(accommodationId: number, dates: Date[]) {
  const db = await getDb();
  if (!db) return;
  
  for (const date of dates) {
    await db.delete(availability)
      .where(and(
        eq(availability.accommodationId, accommodationId),
        eq(availability.date, date),
        eq(availability.status, 'blocked')
      ));
  }
}

export async function checkAvailability(accommodationId: number, checkIn: Date, checkOut: Date): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const blockedDates = await db.select()
    .from(availability)
    .where(and(
      eq(availability.accommodationId, accommodationId),
      gte(availability.date, checkIn),
      lte(availability.date, checkOut),
      inArray(availability.status, ['booked', 'blocked'])
    ));
  
  return blockedDates.length === 0;
}

// ==================== PLATFORM CONFIG ====================

export async function getPlatformConfig() {
  const db = await getDb();
  if (!db) return {};
  const configs = await db.select().from(platformConfig);
  return configs.reduce((acc, config) => {
    acc[config.key] = config.value;
    return acc;
  }, {} as Record<string, string | null>);
}

export async function setPlatformConfig(key: string, value: string, description?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(platformConfig)
    .values({ key, value, description })
    .onDuplicateKeyUpdate({ set: { value, description } });
}

export async function initDefaultPlatformConfig() {
  const db = await getDb();
  if (!db) return;
  
  const defaults = [
    { key: 'platform_name', value: 'FeWo Booking', description: 'Name der Plattform' },
    { key: 'primary_color', value: '#0ea5e9', description: 'Primärfarbe (Hex)' },
    { key: 'logo_url', value: '', description: 'URL zum Logo' },
    { key: 'support_email', value: 'support@example.com', description: 'Support E-Mail' },
    { key: 'currency', value: 'EUR', description: 'Währung' },
    { key: 'currency_symbol', value: '€', description: 'Währungssymbol' },
  ];
  
  for (const config of defaults) {
    const existing = await db.select().from(platformConfig).where(eq(platformConfig.key, config.key)).limit(1);
    if (existing.length === 0) {
      await db.insert(platformConfig).values(config);
    }
  }
}

// ==================== REGIONS ====================

export async function getAllRegions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(regions).where(eq(regions.isActive, true)).orderBy(asc(regions.name));
}

export async function createRegion(data: InsertRegion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(regions).values(data);
  return result[0].insertId;
}

// ==================== REVIEWS ====================

export async function getAccommodationReviews(accommodationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(reviews)
    .where(and(eq(reviews.accommodationId, accommodationId), eq(reviews.isPublished, true)))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reviews).values(data);
  return result[0].insertId;
}

// ==================== SEED DATA ====================

export async function seedAmenities() {
  const db = await getDb();
  if (!db) return;
  
  const existingAmenities = await db.select().from(amenities).limit(1);
  if (existingAmenities.length > 0) return; // Already seeded
  
  const defaultAmenities: InsertAmenity[] = [
    // Basics
    { name: 'WLAN', icon: 'wifi', category: 'basics' },
    { name: 'Heizung', icon: 'thermometer', category: 'basics' },
    { name: 'Klimaanlage', icon: 'snowflake', category: 'basics' },
    { name: 'TV', icon: 'tv', category: 'basics' },
    { name: 'Waschmaschine', icon: 'shirt', category: 'basics' },
    { name: 'Trockner', icon: 'wind', category: 'basics' },
    { name: 'Bügeleisen', icon: 'iron', category: 'basics' },
    // Kitchen
    { name: 'Küche', icon: 'utensils', category: 'kitchen' },
    { name: 'Kühlschrank', icon: 'refrigerator', category: 'kitchen' },
    { name: 'Geschirrspüler', icon: 'dishes', category: 'kitchen' },
    { name: 'Kaffeemaschine', icon: 'coffee', category: 'kitchen' },
    { name: 'Mikrowelle', icon: 'microwave', category: 'kitchen' },
    // Bathroom
    { name: 'Badewanne', icon: 'bath', category: 'bathroom' },
    { name: 'Dusche', icon: 'shower-head', category: 'bathroom' },
    { name: 'Fön', icon: 'wind', category: 'bathroom' },
    // Bedroom
    { name: 'Bettwäsche', icon: 'bed', category: 'bedroom' },
    { name: 'Handtücher', icon: 'towel', category: 'bedroom' },
    // Outdoor
    { name: 'Balkon', icon: 'sun', category: 'outdoor' },
    { name: 'Terrasse', icon: 'trees', category: 'outdoor' },
    { name: 'Garten', icon: 'flower', category: 'outdoor' },
    { name: 'Grill', icon: 'flame', category: 'outdoor' },
    { name: 'Parkplatz', icon: 'car', category: 'outdoor' },
    // Safety
    { name: 'Rauchmelder', icon: 'alert-circle', category: 'safety' },
    { name: 'Feuerlöscher', icon: 'flame-off', category: 'safety' },
    { name: 'Erste-Hilfe-Set', icon: 'heart-pulse', category: 'safety' },
  ];
  
  await db.insert(amenities).values(defaultAmenities);
}
