import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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
        if (!/^\d{6}$/.test(otp)) {
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
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid or expired OTP",
                },
                { status: 400 }
            );
        }

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
