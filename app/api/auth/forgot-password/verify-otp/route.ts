import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Brute-force guard: a 6-digit code has only 900k values and lives 10 minutes.
// After MAX_FAILED_ATTEMPTS wrong guesses for an email, every pending code for
// it is burned and the user must request a new one. In-memory is enough for a
// single Node instance; move to a DB column if this ever runs multi-instance.
const MAX_FAILED_ATTEMPTS = 5;
const failedAttempts = new Map<string, number>();

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        // Validation
        if (!email || !otp) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email and OTP are required",
                },
                { status: 400 }
            );
        }

        // OTP format validation (must be 6 digits)
        if (typeof email !== "string" || !/^\d{6}$/.test(String(otp))) {
            return NextResponse.json(
                {
                    success: false,
                    message: "OTP must be 6 digits",
                },
                { status: 400 }
            );
        }


        // find valid otp
        const otpRecord = await prisma.otp.findFirst({
            where: {
                email: email.toLowerCase(),
                otp,
                verified: false,
                expiresAt: { gt: new Date() },
            },
        })

        if (!otpRecord) {
            const key = email.toLowerCase();
            const failures = (failedAttempts.get(key) ?? 0) + 1;
            if (failures >= MAX_FAILED_ATTEMPTS) {
                failedAttempts.delete(key);
                await prisma.otp.deleteMany({ where: { email: key, verified: false } });
                return NextResponse.json(
                    {
                        success: false,
                        message: "Too many incorrect attempts. Please request a new OTP.",
                    },
                    { status: 429 }
                );
            }
            failedAttempts.set(key, failures);
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid or expired OTP",
                },
                { status: 400 }
            );
        }

        failedAttempts.delete(String(email).toLowerCase());

        // mark otp as verified
        await prisma.otp.update({
            where: { id: otpRecord.id },
            data: { verified: true },
        });

        // Generate reset token (valid for 15 minutes)
        const resetToken = jwt.sign({
            email: email.toLowerCase(),
            otpId: otpRecord.id,
            type: "password_reset",
        },
            process.env.JWT_SECRET!,
            { expiresIn: "15m" }
        )

        // Set reset token in HTTP-only cookie
        const response = NextResponse.json({
            success: true,
            message: "OTP verified successfully",
        });

        response.cookies.set("resetToken", resetToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 15, // 15 minutes
            path: "/",
        });


        console.log(`OTP verified for: ${email}`);
        return response;

    } catch (error: any) {
        console.error("Verify OTP error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
