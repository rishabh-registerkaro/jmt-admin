import { NextRequest, NextResponse } from "next/server"
import { intParam } from "@/app/lib/utils/pagination";
import prisma from "@/app/lib/config/db"
import bcrypt from "bcrypt"
import { errorFields } from "@/app/lib/utils/errorFields"
import { resolveUserAccess } from "@/app/lib/server/rbac"
import { getCurrentUser } from "@/app/lib/utils/getCurrentUser"
import { PERMISSIONS } from "@/app/lib/constants/permissions"

export async function GET(req: NextRequest) {
    try {
        // Shared check: valid token, user exists, password not changed since sign-in.
        const decoded = await getCurrentUser(req)
        if (decoded instanceof NextResponse) return decoded

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true,
                roleId: true, adminRole: { select: { id: true, key: true, name: true, permissions: true } },
            },
        });
        if (!user) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, { status: 404 })
        }
        // role (legacy enum) is kept for older screens; access checks use permissions.
        const access = await resolveUserAccess(user);
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                ...access,
            }
        })
    } catch (error) {
        console.error("Get profile error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch profile data." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {

        // Verify authentication (valid token, user exists, password unchanged).
        const access = await getCurrentUser(req);
        if (access instanceof NextResponse) return access;

        const body = await req.json();

        // Only your own content, unless you can manage users.
        if (body.userId && body.userId !== access.id && !access.permissions.includes(PERMISSIONS.USERS_MANAGE)) {
            return NextResponse.json({ success: false, message: "Access denied." }, { status: 403 });
        }

        const { userId, page: pageParam, limit: limitParam, postsPage: postsPageParam, pagesPage: pagesPageParam, postsLimit: postsLimitParam, pagesLimit: pagesLimitParam } = body;

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "userId is required"
            }, { status: 400 });
        }

        // Validate userId format
        if (!(typeof userId === "string" && userId.length > 0)) {
            return NextResponse.json({
                success: false,
                message: "Invalid userId format"
            }, { status: 400 });
        }

        // Pagination defaults and validation
        const defaultLimit = 10;
        const maxLimit = 100;

        // Posts pagination
        const postsPage = Math.max(1, intParam(postsPageParam || pageParam, 1));
        const postsLimit = Math.min(maxLimit, Math.max(1, intParam(postsLimitParam || limitParam, defaultLimit)));
        const postsSkip = (postsPage - 1) * postsLimit;

        // Pages pagination
        const pagesPage = Math.max(1, intParam(pagesPageParam || pageParam, 1));
        const pagesLimit = Math.min(maxLimit, Math.max(1, intParam(pagesLimitParam || limitParam, defaultLimit)));
        const pagesSkip = (pagesPage - 1) * pagesLimit;

        // Run posts and services queries in parallel
        const [totalPostsCount, publishedPosts, totalServicesCount, services] = await Promise.all([
            prisma.post.count({
                // Must match the list below (published only) or the pager overcounts
                where: { authorId: userId, status: "published" },
            }),
            prisma.post.findMany({
                where: { authorId: userId, status: "published" },
                select: { id: true, title: true, slug: true, status: true, publishedAt: true, createdAt: true, updatedAt: true },
                orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
                skip: postsSkip,
                take: postsLimit,
            }),
            prisma.servicePage.count({ where: { authorId: userId } }),
            prisma.servicePage.findMany({
                where: { authorId: userId },
                select: { id: true, slug: true, status: true, content: true, createdAt: true, updatedAt: true },
                orderBy: { updatedAt: "desc" },
                skip: pagesSkip,
                take: pagesLimit,
            }),
        ]);

        const totalPostsPages = Math.ceil(totalPostsCount / postsLimit);
        const totalServicesPages = Math.ceil(totalServicesCount / pagesLimit);

        return NextResponse.json({
            success: true,
            data: {
                posts: publishedPosts.map(post => ({
                    _id: post.id,
                    title: post.title,
                    slug: post.slug,
                    status: post.status,
                    publishedAt: post.publishedAt,
                    createdAt: post.createdAt,
                    updatedAt: post.updatedAt,
                })),
                pages: services.map((svc) => ({
                    _id: svc.id,
                    pageTitle: (svc.content as { badge?: unknown } | null)?.badge || svc.slug,
                    pageSlug: svc.slug,
                    status: svc.status,
                    createdAt: svc.createdAt,
                    updatedAt: svc.updatedAt,
                })),
                pagination: {
                    posts: {
                        currentPage: postsPage,
                        limit: postsLimit,
                        totalItems: totalPostsCount,
                        totalPages: totalPostsPages,
                        hasNextPage: postsPage < totalPostsPages,
                        hasPrevPage: postsPage > 1,
                    },
                    pages: {
                        currentPage: pagesPage,
                        limit: pagesLimit,
                        totalItems: totalServicesCount,
                        totalPages: totalServicesPages,
                        hasNextPage: pagesPage < totalServicesPages,
                        hasPrevPage: pagesPage > 1,
                    },
                },
            },
        });
    } catch (error) {
        console.error("Get user published content error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch user published content." },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        // Verify authentication (valid token, user exists, password unchanged).
        const decoded = await getCurrentUser(req);
        if (decoded instanceof NextResponse) return decoded;

        // Parse request body
        const body = await req.json().catch(() => null);
        const { email, username, currentPassword } = body ?? {};

        // Validate required fields (strings only — anything else would crash below)
        if (typeof email !== "string" || typeof username !== "string" || !email.trim() || !username.trim()) {
            return NextResponse.json({
                success: false,
                message: "Email and username are required"
            }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({
                success: false,
                message: "Please provide a valid email address"
            }, { status: 400 });
        }

        // Validate username length
        if (username.length < 3 || username.length > 30) {
            return NextResponse.json({
                success: false,
                message: "Username must be between 3 and 30 characters"
            }, { status: 400 });
        }

        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            // password is read only to confirm an email change; never returned.
            select: { id: true, email: true, username: true, password: true, createdAt: true, updatedAt: true },
        });
        if (!currentUser) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }

        // Check if email is being changed and validate uniqueness
        if (email.toLowerCase().trim() !== currentUser.email.toLowerCase()) {
            // The email is where password-reset codes go, so changing it needs
            // the current password — otherwise a stolen session could take the
            // account over for good via "Forgot password".
            if (typeof currentPassword !== "string" || !currentPassword) {
                return NextResponse.json({
                    success: false,
                    message: "Enter your current password to change your email"
                }, { status: 400 });
            }
            if (!(await bcrypt.compare(currentPassword, currentUser.password))) {
                return NextResponse.json({
                    success: false,
                    message: "Current password is incorrect"
                }, { status: 401 });
            }

            const emailExists = await prisma.user.findFirst({
                where: {
                    email: email.toLowerCase().trim(),
                    id: { not: decoded.id },
                },
                select: { id: true },
            });

            if (emailExists) {
                return NextResponse.json({
                    success: false,
                    message: "Email already exists. Please use a different email."
                }, { status: 400 });
            }
        }

        // Check if username is being changed and validate uniqueness
        if (username.trim() !== currentUser.username.trim()) {
            const usernameExists = await prisma.user.findFirst({
                where: {
                    username: username.trim(),
                    id: { not: decoded.id },
                },
                select: { id: true },
            });

            if (usernameExists) {
                return NextResponse.json({
                    success: false,
                    message: "Username already exists. Please use a different username."
                }, { status: 400 });
            }
        }

        // Update user (only email and username)
        const updatedUser = await prisma.user.update({
            where: { id: decoded.id },
            data: {
                email: email.toLowerCase().trim(),
                username: username.trim(),
            },
            select: { id: true, email: true, username: true, createdAt: true, updatedAt: true },
        });

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                username: updatedUser.username,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);

        // Handle duplicate key error (Prisma unique constraint violation)
        if (errorFields(error).code === "P2002") {
            const target = String(errorFields(errorFields(error).meta).target ?? "");
            const field = target.includes("email") ? "email" : "username";
            return NextResponse.json({
                success: false,
                message: `${field === 'email' ? 'Email' : 'Username'} already exists. Please use a different ${field}.`
            }, { status: 400 });
        }

        return NextResponse.json(
            { success: false, message: "Failed to update profile." },
            { status: 500 }
        );
    }
}
