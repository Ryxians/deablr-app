CREATE TABLE `property` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`types` text NOT NULL,
	`tags` text NOT NULL,
	`art_path` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`score` integer NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `property`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_property_id_unique` ON `review` (`property_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `review_score_unique` ON `review` (`score`);