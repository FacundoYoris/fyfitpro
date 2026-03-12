/*
  Warnings:

  - You are about to drop the column `dayId` on the `RoutineExercise` table. All the data in the column will be lost.
  - You are about to drop the column `routineId` on the `RoutineExercise` table. All the data in the column will be lost.
  - Added the required column `routineDayId` to the `RoutineExercise` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoutineExercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routineDayId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "observations" TEXT,
    CONSTRAINT "RoutineExercise_routineDayId_fkey" FOREIGN KEY ("routineDayId") REFERENCES "RoutineDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoutineExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoutineExercise" ("exerciseId", "id", "observations", "orderIndex", "reps", "sets") SELECT "exerciseId", "id", "observations", "orderIndex", "reps", "sets" FROM "RoutineExercise";
DROP TABLE "RoutineExercise";
ALTER TABLE "new_RoutineExercise" RENAME TO "RoutineExercise";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
