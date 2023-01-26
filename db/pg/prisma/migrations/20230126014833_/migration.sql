/*
  Warnings:

  - A unique constraint covering the columns `[subdomain]` on the table `Bucket` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `query` on the `Request` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Request" DROP COLUMN "query",
ADD COLUMN     "query" JSONB NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bucket_subdomain_key" ON "Bucket"("subdomain");
