import { randomInt } from "crypto";
import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import { sendOTP } from "@/app/lib/config/email";
import { errorFields } from "@/app/lib/utils/errorFields";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        // validation
        if (!email) {
            return NextResponse.json({
                success: false,
                message: "Email is required"
            }, { status: 400 })
        }

        // email fomrat validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please provide a valid email address",
                },
                { status: 400 }
            );
        }

        // checking if user exists
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true },
        });

        // security: not revealing user exits or not
        if (!user) {
            return NextResponse.json({
                success: true,
                message: "If the email exists, an OTP has been sent."
            })
        }

        // Server-side resend cooldown. The UI waits 60s, but without this an
        // attacker could call the API directly to get a fresh code (and a fresh
        // set of verify attempts) as often as they like. Respond with the same
        // generic message so the cooldown doesn't reveal that the email exists.
        const RESEND_COOLDOWN_MS = 60 * 1000;
        const recentOtp = await prisma.otp.findFirst({
            where: {
                email: email.toLowerCase(),
                verified: false,
                createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
            },
            select: { id: true },
        });
        if (recentOtp) {
            return NextResponse.json({
                success: true,
                message: "If the email exists, an OTP has been sent."
            })
        }

        // Generate 6-digit OTP
        const otpCode = randomInt(100000, 1000000).toString(); // CSPRNG, not Math.random

        // Opportunistic cleanup of expired OTPs (replaces MongoDB TTL index)
        await prisma.otp.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });

        // Delete any existing unverified OTPs for this email
        await prisma.otp.deleteMany({
            where: {
                email: email.toLowerCase(),
                verified: false,
            },
        });

        // create new OTP (expires in 10 minutes);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        await prisma.otp.create({
            data: {
                email: email.toLowerCase(),
                otp: otpCode,
                expiresAt,
                verified: false,
            },
        })

        // sending OTP to email
        try {
            await sendOTP(email, otpCode);
        } catch (error) {
            console.error("Error sending email:", error);

            // Delete the OTP record if email fails
            await prisma.otp.deleteMany({
                where: {
                    email: email.toLowerCase(),
                    otp: otpCode,
                },
            });

            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to send OTP email. Please try again later.",
                    error: process.env.NODE_ENV === "development" ? errorFields(error).message : undefined,
                },
                { status: 500 }
            );
        }


        return NextResponse.json({
            success: true,
            message: "OTP sent to your email",
        });
    } catch (error) {
        console.error("Request OTP error:", error);
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
