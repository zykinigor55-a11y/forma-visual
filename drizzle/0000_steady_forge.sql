CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`source_key` text NOT NULL,
	`settings` text NOT NULL,
	`variants` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `usage` (
	`owner` text NOT NULL,
	`month` text NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`owner`, `month`)
);
