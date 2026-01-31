import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getAccommodationById: vi.fn(),
  checkAvailability: vi.fn(),
  createBooking: vi.fn(),
  getBookingsByHost: vi.fn(),
  getBookingById: vi.fn(),
  updateBookingStatus: vi.fn(),
  blockDates: vi.fn(),
  getPlatformConfig: vi.fn(() => ({
    platform_name: "Test Platform",
    currency_symbol: "€",
  })),
  getAllAmenities: vi.fn(() => []),
  getFeaturedAccommodations: vi.fn(() => []),
  getPublishedAccommodations: vi.fn(() => []),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createGuestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createHostContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "host-user",
    email: "host@example.com",
    name: "Test Host",
    loginMethod: "manus",
    role: "host",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Platform Config", () => {
  it("returns platform configuration", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    const config = await caller.config.get();

    expect(config).toBeDefined();
    expect(config.platform_name).toBe("Test Platform");
    expect(config.currency_symbol).toBe("€");
  });
});

describe("Amenities", () => {
  it("returns list of amenities", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    const amenities = await caller.amenities.list();

    expect(Array.isArray(amenities)).toBe(true);
  });
});

describe("Accommodations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns featured accommodations", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    const featured = await caller.accommodations.featured();

    expect(Array.isArray(featured)).toBe(true);
    expect(db.getFeaturedAccommodations).toHaveBeenCalledWith(8);
  });

  it("searches accommodations with filters", async () => {
    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.accommodations.search({
      city: "Berlin",
      minPrice: 50,
      maxPrice: 200,
      minGuests: 2,
    });

    expect(Array.isArray(results)).toBe(true);
    expect(db.getPublishedAccommodations).toHaveBeenCalledWith(
      expect.objectContaining({
        city: "Berlin",
        minPrice: 50,
        maxPrice: 200,
        minGuests: 2,
      })
    );
  });
});

describe("Bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a booking request", async () => {
    const mockAccommodation = {
      id: 1,
      hostId: 2,
      pricePerNight: "100",
      cleaningFee: "50",
      instantBooking: false,
    };

    vi.mocked(db.getAccommodationById).mockResolvedValue(mockAccommodation as any);
    vi.mocked(db.checkAvailability).mockResolvedValue(true);
    vi.mocked(db.createBooking).mockResolvedValue(1);

    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.create({
      accommodationId: 1,
      guestName: "Max Mustermann",
      guestEmail: "max@example.com",
      guestPhone: "+49123456789",
      checkIn: "2026-03-01",
      checkOut: "2026-03-05",
      numberOfGuests: 2,
    });

    expect(result.id).toBe(1);
    expect(result.status).toBe("pending");
    expect(db.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        guestName: "Max Mustermann",
        guestEmail: "max@example.com",
        numberOfGuests: 2,
        status: "pending",
      })
    );
  });

  it("creates instant booking when enabled", async () => {
    const mockAccommodation = {
      id: 1,
      hostId: 2,
      pricePerNight: "100",
      cleaningFee: "50",
      instantBooking: true,
    };

    vi.mocked(db.getAccommodationById).mockResolvedValue(mockAccommodation as any);
    vi.mocked(db.checkAvailability).mockResolvedValue(true);
    vi.mocked(db.createBooking).mockResolvedValue(1);

    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.create({
      accommodationId: 1,
      guestName: "Max Mustermann",
      guestEmail: "max@example.com",
      checkIn: "2026-03-01",
      checkOut: "2026-03-05",
      numberOfGuests: 2,
    });

    expect(result.status).toBe("confirmed");
  });

  it("rejects booking when dates are not available", async () => {
    const mockAccommodation = {
      id: 1,
      hostId: 2,
      pricePerNight: "100",
      cleaningFee: "50",
      instantBooking: false,
    };

    vi.mocked(db.getAccommodationById).mockResolvedValue(mockAccommodation as any);
    vi.mocked(db.checkAvailability).mockResolvedValue(false);

    const ctx = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.create({
        accommodationId: 1,
        guestName: "Max Mustermann",
        guestEmail: "max@example.com",
        checkIn: "2026-03-01",
        checkOut: "2026-03-05",
        numberOfGuests: 2,
      })
    ).rejects.toThrow("Die gewählten Daten sind nicht verfügbar");
  });

  it("host can get their bookings", async () => {
    vi.mocked(db.getBookingsByHost).mockResolvedValue([]);

    const ctx = createHostContext();
    const caller = appRouter.createCaller(ctx);

    const bookings = await caller.bookings.myBookings({});

    expect(Array.isArray(bookings)).toBe(true);
    expect(db.getBookingsByHost).toHaveBeenCalledWith(1, undefined);
  });

  it("host can filter bookings by status", async () => {
    vi.mocked(db.getBookingsByHost).mockResolvedValue([]);

    const ctx = createHostContext();
    const caller = appRouter.createCaller(ctx);

    await caller.bookings.myBookings({ status: "pending" });

    expect(db.getBookingsByHost).toHaveBeenCalledWith(1, "pending");
  });

  it("host can update booking status", async () => {
    const mockBooking = {
      id: 1,
      hostId: 1,
      accommodationId: 1,
      checkIn: new Date("2026-03-01"),
      checkOut: new Date("2026-03-05"),
    };

    vi.mocked(db.getBookingById).mockResolvedValue(mockBooking as any);
    vi.mocked(db.updateBookingStatus).mockResolvedValue(undefined);
    vi.mocked(db.blockDates).mockResolvedValue(undefined);

    const ctx = createHostContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.updateStatus({
      id: 1,
      status: "confirmed",
    });

    expect(result.success).toBe(true);
    expect(db.updateBookingStatus).toHaveBeenCalledWith(1, "confirmed", undefined);
    expect(db.blockDates).toHaveBeenCalled(); // Dates should be blocked on confirmation
  });
});
