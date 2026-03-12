-- AlterTable
ALTER TABLE "Routine" ADD COLUMN "daysCount" INTEGER DEFAULT 3;

-- CreateTable
CREATE TABLE "RoutineDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routineId" INTEGER NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RoutineDay_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoutineExercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routineId" INTEGER NOT NULL,
    "dayId" INTEGER,
    "exerciseId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "observations" TEXT,
    CONSTRAINT "RoutineExercise_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoutineExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "RoutineDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoutineExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoutineExercise" ("exerciseId", "id", "observations", "orderIndex", "reps", "routineId", "sets") SELECT "exerciseId", "id", "observations", "orderIndex", "reps", "routineId", "sets" FROM "RoutineExercise";
DROP TABLE "RoutineExercise";
ALTER TABLE "new_RoutineExercise" RENAME TO "RoutineExercise";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
