import { NextRequest, NextResponse } from "next/server";
import { intParam } from "@/app/lib/utils/pagination";
import prisma from "@/app/lib/config/db";
import { requirePermission } from "@/app/lib/utils/authorization";
import { PERMISSIONS } from "@/app/lib/constants/permissions";
import { canAssignRole, loadSystemRoleMap, resolveRequestedRole, userRoleView } from "@/app/lib/server/rbac";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { errorFields } from "@/app/lib/utils/errorFields";

const roleSelect = { select: { id: true, key: true, name: true, permissions: true } } as const;

// POST /api/users — create a user (users.manage).
// Body: { username, email, password, roleId }  (legacy `role` string still accepted)
export async function POST(req: NextRequest) {
    try {
        const userResult = await requirePermission(req, PERMISSIONS.USERS_MANAGE);
        if (userResult instanceof NextResponse) {
            return userResult;
        }

        const currentUser = userResult;

        const body = await req.json();
        const { username, password } = body;
        // Mongoose schema had lowercase:true on email — normalize on write
        const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : body.email;

        if (!username || !email || !password || (!body.roleId && !body.role)) {
            return NextResponse.json(
                { success: false, message: "All fields (username, email, password, role) are required" },
                { status: 400 }
            );
        }

        const role = await resolveRequestedRole(body);
        if (!role) {
            return NextResponse.json(
                { success: false, message: "Invalid role" },
                { status: 400 }
            );
        }

        // Anti-escalation: only a Super Admin can create admins / super admins,
        // and nobody can hand out permissions they don't have themselves.
        if (!canAssignRole(currentUser, role)) {
            return NextResponse.json(
                { success: false, message: `You don't have permission to create ${role.name} accounts` },
                { status: 403 }
            );
        }

        if (typeof password !== "string" || password.length < 8) {
            return NextResponse.json(
                { success: false, message: "Password must be at least 8 characters" },
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
                role: role.legacy,
                roleId: role.id,
            },
            select: { id: true, username: true, email: true, role: true, roleId: true, adminRole: roleSelect },
        });

        return NextResponse.json(
            {
                success: true,
                message: "User created successfully",
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    ...(await userRoleView(newUser, currentUser)),
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create user error:", error);
        if (errorFields(error).code === "P2002") {
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
        const userResult = await requirePermission(req, PERMISSIONS.USERS_MANAGE);
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
        const page = Math.max(1, intParam(searchParams.get('page'), 1));
        const limit = Math.min(100, Math.max(1, intParam(searchParams.get('limit'), 10))); // Max 100 per page
        const skip = (page - 1) * limit;

        // search/filter parameters
        const search = searchParams.get('search')?.trim() || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, username, email
        const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc or desc

        // building query
        const where: Prisma.UserWhereInput = {};

        if(search) {
            where.OR = [
                { username: { contains: search } },
                { email: { contains: search } },
            ];
        }

        // Building sort object
        const orderBy: Prisma.UserOrderByWithRelationInput = {};
        if(sortBy === "username" || sortBy === "email" || sortBy === "createdAt"){
            orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
        }else{
            orderBy.createdAt = "desc";
        }

        // Optimized: fetch users and total count in parallel
        const [users, total, systemRoles] = await Promise.all([
            prisma.user.findMany({
                where,
                select: { id: true, username: true, email: true, createdAt: true, updatedAt: true, role: true, roleId: true, adminRole: roleSelect },
                orderBy,
                skip,
                take: limit,
            }),

            prisma.user.count({ where }),
            loadSystemRoleMap(),
        ])

        // format users data
        const formattedUsers = await Promise.all(users.map(async (user)=> ({
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            ...(await userRoleView(user, userResult, systemRoles)),
        })))

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
