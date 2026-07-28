CREATE TABLE `review_score` (
	`review_id` text NOT NULL,
	`metric` text NOT NULL,
	`score` integer NOT NULL,
	PRIMARY KEY(`review_id`, `metric`),
	FOREIGN KEY (`review_id`) REFERENCES `review`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_score_metric_score_unique` ON `review_score` (`metric`,`score`);--> statement-breakpoint
DROP INDEX `review_score_unique`;--> statement-breakpoint
ALTER TABLE `review` DROP COLUMN `score`;