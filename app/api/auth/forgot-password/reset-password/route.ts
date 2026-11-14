import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { errorFields } from "@/app/lib/utils/errorFields";

export async function POST(req: NextRequest) {
    try {
        const { email, newPassword } = await req.json();

        // Validation
        if (!email || !newPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email and new password are required",
                },
                { status: 400 }
            );
        }

        // Password validation
        if (newPassword.length < 8) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Password must be at least 8 characters",
                },
                { status: 400 }
            );
        }

        // Verify reset token from cookie
        const resetToken = req.cookies.get("resetToken")?.value;
        if (!resetToken) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid or expired reset token. Please verify OTP again.",
                },
                { status: 401 }
            );
        }

        // verfy and decode jwt token
        let decoded: jwt.JwtPayload;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET!) as jwt.JwtPayload
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid or expired reset token. Please verify OTP again.",
                },
                { status: 401 }
            );
        }

        // Validate token type
        if (decoded.type !== "password_reset") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid token type",
                },
                { status: 401 }
            );
        }

        // Verify email matches token
        if (decoded.email !== email.toLowerCase()) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email mismatch",
                },
                { status: 401 }
            );
        }

        // Verify OTP was verified. verify-otp extends expiresAt to match the
        // 15-minute reset token, so this check lines up with the JWT expiry.
        const otpRecord = await prisma.otp.findFirst({
            where: {
                id: decoded.otpId,
                email: email.toLowerCase(),
                verified: true,
                expiresAt: { gt: new Date() },
            },
        });

        if (!otpRecord) {
            return NextResponse.json(
                {
                    success: false,
                    message: "OTP verification required. Please verify OTP again.",
                },
                { status: 401 }
            );
        }

        // Check if user exists and get current password
        // (fetched WITH password for comparison; never returned to client)
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User not found",
                },
                { status: 404 }
            );
        }

        // Validate new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "New password must be different from your current password",
                },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await prisma.user.update({
            where: { email: email.toLowerCase() },
            data: { password: hashedPassword },
        });

        // Delete used OTP
        await prisma.otp.deleteMany({ where: { id: otpRecord.id } });

        // Clear reset token cookie
        const response = NextResponse.json({
            success: true,
            message: "Password reset successfully",
        });

        response.cookies.delete("resetToken");

        return response;


    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? errorFields(error).message : undefined,
            },
            { status: 500 }
        );
    }
}
