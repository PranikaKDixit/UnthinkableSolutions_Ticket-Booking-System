-- Reserve a specific seat for a waitlist offer while it is OFFERED.
ALTER TABLE "WaitlistEntry" ADD COLUMN "offeredSeatId" TEXT;

-- Speed up "next in line for this show + category" lookups.
CREATE INDEX "WaitlistEntry_showId_categoryId_status_position_idx"
  ON "WaitlistEntry" ("showId", "categoryId", "status", "position");
