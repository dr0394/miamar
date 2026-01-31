CREATE TABLE `accommodation_amenities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accommodationId` int NOT NULL,
	`amenityId` int NOT NULL,
	CONSTRAINT `accommodation_amenities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accommodation_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accommodationId` int NOT NULL,
	`url` text NOT NULL,
	`fileKey` varchar(255),
	`caption` varchar(255),
	`sortOrder` int DEFAULT 0,
	`isMain` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accommodation_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accommodations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`shortDescription` text,
	`accommodationType` enum('apartment','house','room','villa','cabin','other') DEFAULT 'apartment',
	`street` varchar(255),
	`houseNumber` varchar(20),
	`city` varchar(100),
	`postalCode` varchar(20),
	`country` varchar(100) DEFAULT 'Deutschland',
	`region` varchar(100),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`maxGuests` int DEFAULT 2,
	`bedrooms` int DEFAULT 1,
	`beds` int DEFAULT 1,
	`bathrooms` int DEFAULT 1,
	`pricePerNight` decimal(10,2) NOT NULL,
	`weekendPrice` decimal(10,2),
	`cleaningFee` decimal(10,2) DEFAULT '0',
	`minNights` int DEFAULT 1,
	`maxNights` int DEFAULT 30,
	`checkInTime` varchar(10) DEFAULT '15:00',
	`checkOutTime` varchar(10) DEFAULT '11:00',
	`houseRules` text,
	`instantBooking` boolean DEFAULT false,
	`isActive` boolean DEFAULT false,
	`isPublished` boolean DEFAULT false,
	`viewCount` int DEFAULT 0,
	`bookingCount` int DEFAULT 0,
	`averageRating` decimal(3,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accommodations_id` PRIMARY KEY(`id`),
	CONSTRAINT `accommodations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `amenities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`icon` varchar(50),
	`category` enum('basics','kitchen','bathroom','bedroom','entertainment','outdoor','safety','accessibility','other') DEFAULT 'basics',
	CONSTRAINT `amenities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accommodationId` int NOT NULL,
	`date` timestamp NOT NULL,
	`status` enum('available','booked','blocked') DEFAULT 'available',
	`bookingId` int,
	`note` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accommodationId` int NOT NULL,
	`hostId` int NOT NULL,
	`guestName` varchar(255) NOT NULL,
	`guestEmail` varchar(320) NOT NULL,
	`guestPhone` varchar(32),
	`guestMessage` text,
	`checkIn` timestamp NOT NULL,
	`checkOut` timestamp NOT NULL,
	`numberOfGuests` int NOT NULL,
	`pricePerNight` decimal(10,2) NOT NULL,
	`numberOfNights` int NOT NULL,
	`cleaningFee` decimal(10,2) DEFAULT '0',
	`totalPrice` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`status` enum('pending','confirmed','rejected','cancelled','completed') DEFAULT 'pending',
	`hostNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`description` varchar(255),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_config_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`imageUrl` text,
	`accommodationCount` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	CONSTRAINT `regions_id` PRIMARY KEY(`id`),
	CONSTRAINT `regions_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`accommodationId` int NOT NULL,
	`guestName` varchar(255) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`hostResponse` text,
	`isPublished` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','host') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isVerified` boolean DEFAULT false;