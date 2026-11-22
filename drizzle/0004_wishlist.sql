CREATE TABLE `wishlist_item` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`photo_path` text,
	`links` text NOT NULL,
	`unit_cost_cents` integer,
	`quantity` integer DEFAULT 1 NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
