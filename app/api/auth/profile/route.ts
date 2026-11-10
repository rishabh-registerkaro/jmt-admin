import { NextRequest, NextResponse } from "next/server"
import prisma from "@/app/lib/config/db"
import jwt from "jsonwebtoken"

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("authToken")?.value
        if (!token) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized. Please login to perform changes"
            }, { status: 401 })
        }
        const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as {
            id: string;
            username: string;
            role: string;
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true },
        });
        if (!user) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, { status: 404 })
        }
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
        })
    } catch (error: any) {
        if (error.name === "JsonWebTokenError" || error.name === 'TokenExpiredError') {
            return NextResponse.json(
                { success: false, message: "Invalid or expired token. Please login again." },
                { status: 401 }
            );
        }
        console.error("Get profile error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch profile data." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {

        // 1. Verify authentication
        const token = req.cookies.get("authToken")?.value;
        if (!token) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized. Please login to perform changes"
            }, { status: 401 });
        }

        let decoded: { id: string; username: string; role: string };
        try {
            decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as {
                id: string;
                username: string;
                role: string;
            };
        } catch (error: any) {
            if (error.name === "JsonWebTokenError" || error.name === 'TokenExpiredError') {
                return NextResponse.json(
                    { success: false, message: "Invalid or expired token. Please login again." },
                    { status: 401 }
                );
            }
            throw error;
        }

        // Verify user exists
        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true },
        });
        if (!currentUser) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }
        const body = await req.json();
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
        const postsPage = Math.max(1, parseInt(postsPageParam || pageParam || '1', 10));
        const postsLimit = Math.min(maxLimit, Math.max(1, parseInt(postsLimitParam || limitParam || String(defaultLimit), 10)));
        const postsSkip = (postsPage - 1) * postsLimit;

        // Pages pagination
        const pagesPage = Math.max(1, parseInt(pagesPageParam || pageParam || '1', 10));
        const pagesLimit = Math.min(maxLimit, Math.max(1, parseInt(pagesLimitParam || limitParam || String(defaultLimit), 10)));
        const pagesSkip = (pagesPage - 1) * pagesLimit;

        // Run posts and services queries in parallel
        const [totalPostsCount, publishedPosts, totalServicesCount, services] = await Promise.all([
            prisma.post.count({
                where: { authorId: userId, status: { in: ["published", "draft"] } },
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
                pages: services.map((svc: any) => ({
                    _id: svc.id,
                    pageTitle: svc.content?.badge || svc.slug,
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
    } catch (error: any) {
        console.error("Get user published content error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch user published content." },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        // Verify authentication
        const token = req.cookies.get("authToken")?.value;
        if (!token) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized. Please login to perform changes"
            }, { status: 401 });
        }

        let decoded: { id: string; username: string };
        try {
            decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as {
                id: string;
                username: string;
            };
        } catch (error: any) {
            if (error.name === "JsonWebTokenError" || error.name === 'TokenExpiredError') {
                return NextResponse.json(
                    { success: false, message: "Invalid or expired token. Please login again." },
                    { status: 401 }
                );
            }
            throw error;
        }

        // Parse request body
        const body = await req.json();
        const { email, username } = body;

        // Validate required fields
        if (!email || !username) {
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
            select: { id: true, email: true, username: true, createdAt: true, updatedAt: true },
        });
        if (!currentUser) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }

        // Check if email is being changed and validate uniqueness
        if (email.toLowerCase() !== currentUser.email.toLowerCase()) {
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
    } catch (error: any) {
        console.error("Update profile error:", error);

        // Handle duplicate key error (Prisma unique constraint violation)
        if (error.code === "P2002") {
            const target = String(error.meta?.target ?? "");
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
