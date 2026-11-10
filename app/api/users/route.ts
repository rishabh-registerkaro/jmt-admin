import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/config/db";
import { requireRole } from "@/app/lib/utils/authorization";
import { ADMIN_ROLES } from "@/app/lib/constants/role";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
    try {
        const userResult = await requireRole(req, ADMIN_ROLES);
        if (userResult instanceof NextResponse) {
            return userResult;
        }

        const currentUser = userResult;

        const body = await req.json();
        const { username, password, role } = body;
        // Mongoose schema had lowercase:true on email — normalize on write
        const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : body.email;

        if (!username || !email || !password || !role) {
            return NextResponse.json(
                { success: false, message: "All fields (username, email, password, role) are required" },
                { status: 400 }
            );
        }

        // Role permission check
        const validRoles = ["superadmin", "admin", "editor", "contributor"];
        const adminAllowedRoles = ["editor", "contributor"];

        if (currentUser.role === "admin" && !adminAllowedRoles.includes(role)) {
            return NextResponse.json(
                { success: false, message: "Admins can only create Editor or Contributor accounts" },
                { status: 403 }
            );
        }

        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { success: false, message: "Invalid role" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
            select: { id: true },
        });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Username or email already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role,
            },
            select: { id: true, username: true, email: true, role: true },
        });

        return NextResponse.json(
            {
                success: true,
                message: "User created successfully",
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Create user error:", error);
        if (error.code === "P2002") {
            return NextResponse.json(
                { success: false, message: "Username or email already exists" },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { success: false, message: "Failed to create user." },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest){
    try {
        // verify authentication
        const userResult = await requireRole(req, ADMIN_ROLES);
        if(userResult instanceof NextResponse){
            return userResult; // error response
        }
        const userId = userResult.id;
        if(!userId) {
            return NextResponse.json({success: false, message: "Unauthorized User Access"},{status: 401})
        }

        // get query parameters
        const {searchParams} = new URL(req.url);

        // pagination parameters with validation
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10))); // Max 100 per page
        const skip = (page - 1) * limit;

        // search/filter parameters
        const search = searchParams.get('search')?.trim() || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, username, email
        const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc or desc

        // building query
        const where: any = {};

        if(search) {
            where.OR = [
                { username: { contains: search } },
                { email: { contains: search } },
            ];
        }

        // Building sort object
        const orderBy: any = {};
        if(sortBy === "username" || sortBy === "email" || sortBy === "createdAt"){
            orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
        }else{
            orderBy.createdAt = "desc";
        }

        // Optimized: fetch users and total count in parallel
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: { id: true, username: true, email: true, createdAt: true, updatedAt: true, role: true },
                orderBy,
                skip,
                take: limit,
            }),

            prisma.user.count({ where }),
        ])

        // format users data
        const formattedUsers = users.map((user)=> ({
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            role: user.role,

        }))

         // Calculate pagination metadata
         const totalPages = Math.ceil(total / limit);
         const hasNextPage = page < totalPages;
         const hasPrevPage = page > 1;

        return NextResponse.json({
            success: true,
            users: formattedUsers,
            pagination:{
                currentPage: page,
                totalPages,
                totalCount: total,
                limit,
                hasNextPage,
                hasPrevPage,
            },
            ...(search && { searchQuery: search }),
        },{ status: 200 })
    } catch (error) {
        console.error("Get users error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch users." },
            { status: 500 }
        );
    }
}
