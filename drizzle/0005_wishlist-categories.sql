CREATE TABLE `wishlist_category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `wishlist_item` ADD `category_id` text REFERENCES wishlist_category(id) ON DELETE set null;