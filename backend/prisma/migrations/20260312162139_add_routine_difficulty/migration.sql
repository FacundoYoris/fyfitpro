-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Routine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER DEFAULT 60,
    "daysCount" INTEGER DEFAULT 3,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Routine" ("createdAt", "daysCount", "description", "duration", "id", "isTemplate", "name", "updatedAt", "userId") SELECT "createdAt", "daysCount", "description", "duration", "id", "isTemplate", "name", "updatedAt", "userId" FROM "Routine";
DROP TABLE "Routine";
ALTER TABLE "new_Routine" RENAME TO "Routine";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
