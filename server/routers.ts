import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { sdk } from "./_core/sdk";

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[char] || char))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + nanoid(6);
}

// Host-only procedure
const hostProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'host' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Host access required' });
  }
  return next({ ctx });
});

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    // E-Mail/Passwort Login
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByEmail(input.email);
        
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Ungültige E-Mail oder Passwort' });
        }
        
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Ungültige E-Mail oder Passwort' });
        }
        
        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || '',
          expiresInMs: ONE_YEAR_MS,
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        // Update last signed in
        await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
    
    // Registrierung
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if email already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Diese E-Mail-Adresse ist bereits registriert' });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 12);
        
        // Create user
        const userId = await db.createUserWithPassword({
          email: input.email,
          name: input.name,
          passwordHash,
          role: 'host', // New users are hosts by default
        });
        
        // Get the created user
        const user = await db.getUserById(userId);
        if (!user) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Benutzer konnte nicht erstellt werden' });
        }
        
        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || '',
          expiresInMs: ONE_YEAR_MS,
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    becomeHost: protectedProcedure.mutation(async ({ ctx }) => {
      await db.updateUserRole(ctx.user.id, 'host');
      return { success: true };
    }),
  }),

  // ==================== ACCOMMODATIONS ====================
  accommodations: router({
    // Public: Get featured accommodations
    featured: publicProcedure.query(async () => {
      return db.getFeaturedAccommodations(8);
    }),

    // Public: Search accommodations
    search: publicProcedure
      .input(z.object({
        city: z.string().optional(),
        region: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minGuests: z.number().optional(),
        amenityIds: z.array(z.number()).optional(),
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'newest']).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const accommodations = await db.getPublishedAccommodations({
          ...input,
          limit: input.limit || 20,
          offset: input.offset || 0,
        });
        
        // Get images for each accommodation
        const results = await Promise.all(
          accommodations.map(async (acc) => {
            const images = await db.getAccommodationImages(acc.id);
            return { ...acc, images };
          })
        );
        
        return results;
      }),

    // Public: Get single accommodation by slug
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const accommodation = await db.getAccommodationBySlug(input.slug);
        if (!accommodation) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Unterkunft nicht gefunden' });
        }
        
        // Increment view count
        await db.incrementAccommodationViews(accommodation.id);
        
        // Get related data
        const [images, amenities, reviews, host] = await Promise.all([
          db.getAccommodationImages(accommodation.id),
          db.getAccommodationAmenities(accommodation.id),
          db.getAccommodationReviews(accommodation.id),
          db.getUserById(accommodation.hostId),
        ]);
        
        return {
          ...accommodation,
          images,
          amenities: amenities.map(a => a.amenity),
          reviews,
          host: host ? { id: host.id, name: host.name, avatarUrl: host.avatarUrl, bio: host.bio } : null,
        };
      }),

    // Public: Get by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const accommodation = await db.getAccommodationById(input.id);
        if (!accommodation) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const images = await db.getAccommodationImages(accommodation.id);
        return { ...accommodation, images };
      }),

    // Host: Get my accommodations
    myAccommodations: hostProcedure.query(async ({ ctx }) => {
      const accommodations = await db.getAccommodationsByHost(ctx.user.id);
      const results = await Promise.all(
        accommodations.map(async (acc) => {
          const images = await db.getAccommodationImages(acc.id);
          return { ...acc, images };
        })
      );
      return results;
    }),

    // Host: Create accommodation
    create: hostProcedure
      .input(z.object({
        title: z.string().min(5),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        accommodationType: z.enum(['apartment', 'house', 'room', 'villa', 'cabin', 'other']).optional(),
        street: z.string().optional(),
        houseNumber: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
        region: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        maxGuests: z.number().optional(),
        bedrooms: z.number().optional(),
        beds: z.number().optional(),
        bathrooms: z.number().optional(),
        pricePerNight: z.string(),
        weekendPrice: z.string().optional(),
        cleaningFee: z.string().optional(),
        minNights: z.number().optional(),
        maxNights: z.number().optional(),
        checkInTime: z.string().optional(),
        checkOutTime: z.string().optional(),
        houseRules: z.string().optional(),
        instantBooking: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const slug = generateSlug(input.title);
        const id = await db.createAccommodation({
          ...input,
          hostId: ctx.user.id,
          slug,
          isActive: true,
          isPublished: false,
        });
        return { id, slug };
      }),

    // Host: Update accommodation
    update: hostProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(5).optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        accommodationType: z.enum(['apartment', 'house', 'room', 'villa', 'cabin', 'other']).optional(),
        street: z.string().optional(),
        houseNumber: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
        region: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        maxGuests: z.number().optional(),
        bedrooms: z.number().optional(),
        beds: z.number().optional(),
        bathrooms: z.number().optional(),
        pricePerNight: z.string().optional(),
        weekendPrice: z.string().optional(),
        cleaningFee: z.string().optional(),
        minNights: z.number().optional(),
        maxNights: z.number().optional(),
        checkInTime: z.string().optional(),
        checkOutTime: z.string().optional(),
        houseRules: z.string().optional(),
        instantBooking: z.boolean().optional(),
        isPublished: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        // Verify ownership
        const accommodation = await db.getAccommodationById(id);
        if (!accommodation || (accommodation.hostId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.updateAccommodation(id, data);
        return { success: true };
      }),

    // Host: Set amenities
    setAmenities: hostProcedure
      .input(z.object({
        accommodationId: z.number(),
        amenityIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const accommodation = await db.getAccommodationById(input.accommodationId);
        if (!accommodation || (accommodation.hostId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.setAccommodationAmenities(input.accommodationId, input.amenityIds);
        return { success: true };
      }),
  }),

  // ==================== IMAGES ====================
  images: router({
    add: hostProcedure
      .input(z.object({
        accommodationId: z.number(),
        url: z.string(),
        fileKey: z.string().optional(),
        caption: z.string().optional(),
        sortOrder: z.number().optional(),
        isMain: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const accommodation = await db.getAccommodationById(input.accommodationId);
        if (!accommodation || (accommodation.hostId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const id = await db.addAccommodationImage(input);
        return { id };
      }),

    delete: hostProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAccommodationImage(input.id);
        return { success: true };
      }),

    setMain: hostProcedure
      .input(z.object({ accommodationId: z.number(), imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const accommodation = await db.getAccommodationById(input.accommodationId);
        if (!accommodation || (accommodation.hostId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.setMainImage(input.accommodationId, input.imageId);
        return { success: true };
      }),
  }),

  // ==================== AMENITIES ====================
  amenities: router({
    list: publicProcedure.query(async () => {
      return db.getAllAmenities();
    }),
    
    seed: adminProcedure.mutation(async () => {
      await db.seedAmenities();
      return { success: true };
    }),
  }),

  // ==================== BOOKINGS ====================
  bookings: router({
    // Public: Create booking request
    create: publicProcedure
      .input(z.object({
        accommodationId: z.number(),
        guestName: z.string().min(2),
        guestEmail: z.string().email(),
        guestPhone: z.string().optional(),
        guestMessage: z.string().optional(),
        checkIn: z.string(),
        checkOut: z.string(),
        numberOfGuests: z.number().min(1),
      }))
      .mutation(async ({ input }) => {
        const accommodation = await db.getAccommodationById(input.accommodationId);
        if (!accommodation) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Unterkunft nicht gefunden' });
        }

        const checkInDate = new Date(input.checkIn);
        const checkOutDate = new Date(input.checkOut);
        
        // Check availability
        const isAvailable = await db.checkAvailability(input.accommodationId, checkInDate, checkOutDate);
        if (!isAvailable) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Die gewählten Daten sind nicht verfügbar' });
        }

        // Calculate pricing
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const pricePerNight = parseFloat(accommodation.pricePerNight);
        const cleaningFee = parseFloat(accommodation.cleaningFee || '0');
        const totalPrice = (pricePerNight * nights) + cleaningFee;

        const id = await db.createBooking({
          ...input,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          hostId: accommodation.hostId,
          pricePerNight: accommodation.pricePerNight,
          numberOfNights: nights,
          cleaningFee: accommodation.cleaningFee || '0',
          totalPrice: totalPrice.toFixed(2),
          status: accommodation.instantBooking ? 'confirmed' : 'pending',
        });

        return { id, status: accommodation.instantBooking ? 'confirmed' : 'pending' };
      }),

    // Host: Get my bookings
    myBookings: hostProcedure
      .input(z.object({
        status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled', 'completed']).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const bookings = await db.getBookingsByHost(ctx.user.id, input?.status);
        // Get accommodation info for each booking
        const results = await Promise.all(
          bookings.map(async (booking) => {
            const accommodation = await db.getAccommodationById(booking.accommodationId);
            return { ...booking, accommodation };
          })
        );
        return results;
      }),

    // Host: Get single booking
    byId: hostProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking || (booking.hostId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        const accommodation = await db.getAccommodationById(booking.accommodationId);
        return { ...booking, accommodation };
      }),

    // Host: Update booking status
    updateStatus: hostProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled', 'completed']),
        hostNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking || (booking.hostId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        await db.updateBookingStatus(input.id, input.status, input.hostNotes);
        
        // If confirmed, block the dates
        if (input.status === 'confirmed') {
          const dates: Date[] = [];
          const current = new Date(booking.checkIn);
          while (current < booking.checkOut) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }
          await db.blockDates(booking.accommodationId, dates, `Buchung #${booking.id}`);
        }
        
        return { success: true };
      }),

    // Host: Get upcoming check-ins
    upcomingCheckIns: hostProcedure.query(async ({ ctx }) => {
      const bookings = await db.getUpcomingCheckIns(ctx.user.id, 14);
      const results = await Promise.all(
        bookings.map(async (booking) => {
          const accommodation = await db.getAccommodationById(booking.accommodationId);
          return { ...booking, accommodation };
        })
      );
      return results;
    }),
  }),

  // ==================== AVAILABILITY ====================
  availability: router({
    // Public: Get availability for accommodation
    get: publicProcedure
      .input(z.object({
        accommodationId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        return db.getAvailability(
          input.accommodationId,
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),

    // Public: Check if dates are available
    check: publicProcedure
      .input(z.object({
        accommodationId: z.number(),
        checkIn: z.string(),
        checkOut: z.string(),
      }))
      .query(async ({ input }) => {
        const isAvailable = await db.checkAvailability(
          input.accommodationId,
          new Date(input.checkIn),
          new Date(input.checkOut)
        );
        return { available: isAvailable };
      }),

    // Host: Block dates
    block: hostProcedure
      .input(z.object({
        accommodationId: z.number(),
        dates: z.array(z.string()),
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const accommodation = await db.getAccommodationById(input.accommodationId);
        if (!accommodation || (accommodation.hostId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.blockDates(
          input.accommodationId,
          input.dates.map(d => new Date(d)),
          input.note
        );
        return { success: true };
      }),

    // Host: Unblock dates
    unblock: hostProcedure
      .input(z.object({
        accommodationId: z.number(),
        dates: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        const accommodation = await db.getAccommodationById(input.accommodationId);
        if (!accommodation || (accommodation.hostId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db.unblockDates(
          input.accommodationId,
          input.dates.map(d => new Date(d))
        );
        return { success: true };
      }),
  }),

  // ==================== HOST DASHBOARD ====================
  dashboard: router({
    stats: hostProcedure.query(async ({ ctx }) => {
      return db.getHostStats(ctx.user.id);
    }),
  }),

  // ==================== PLATFORM CONFIG ====================
  config: router({
    get: publicProcedure.query(async () => {
      return db.getPlatformConfig();
    }),

    set: adminProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.setPlatformConfig(input.key, input.value, input.description);
        return { success: true };
      }),

    init: adminProcedure.mutation(async () => {
      await db.initDefaultPlatformConfig();
      await db.seedAmenities();
      return { success: true };
    }),
  }),

  // ==================== REGIONS ====================
  regions: router({
    list: publicProcedure.query(async () => {
      return db.getAllRegions();
    }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createRegion(input);
        return { id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
