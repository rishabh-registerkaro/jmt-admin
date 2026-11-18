// What a user owns, so their work can be handed over before they are removed.

import prisma from "@/app/lib/config/db";

export async function countOwnedWork(userId: string) {
  const where = { authorId: userId };
  const [posts, servicePages, packageBlocks, jmtServicePages, autosaves] = await Promise.all([
    prisma.post.count({ where }),
    prisma.servicePage.count({ where }),
    prisma.packageBlock.count({ where }),
    prisma.jmtServicePage.count({ where }),
    prisma.jmtServiceAutosave.count({ where: { userId } }),
  ]);
  return { posts, servicePages, packageBlocks, jmtServicePages, autosaves };
}

export type OwnedWork = Awaited<ReturnType<typeof countOwnedWork>>;

export const ownsWork = (owned: OwnedWork) => Object.values(owned).some((count) => count > 0);
