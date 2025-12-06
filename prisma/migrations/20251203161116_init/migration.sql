-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('EVENTO', 'MILITAR', 'GENERAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "habboName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "rankId" INTEGER NOT NULL DEFAULT 10,
    "avatarUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "roleDescription" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_habboName_key" ON "User"("habboName");

-- CreateIndex
CREATE INDEX "User_rankId_idx" ON "User"("rankId");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_order_key" ON "Rank"("order");

-- CreateIndex
CREATE INDEX "News_authorId_idx" ON "News"("authorId");

-- CreateIndex
CREATE INDEX "News_category_idx" ON "News"("category");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
