CREATE TABLE `study_records` (
	`owner_id` text NOT NULL,
	`record_key` text NOT NULL,
	`revision` integer NOT NULL,
	`value_json` text,
	`mutation_id` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner_id`, `record_key`)
);
