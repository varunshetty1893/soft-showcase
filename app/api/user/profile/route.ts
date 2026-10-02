// app/api/user/profile/route.ts
// Customer profile update endpoint.
// Allows authenticated users to update their profile settings (name, whatsapp, contactEmail).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { isValidPhone, normalizeToE164 } from "@/lib/utils/phone";
import { z } from "zod";

const ProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  whatsapp: z.string().trim().optional().nullable().or(z.literal("")),
  contactEmail: z
    .string()
    .trim()
    .email("Please enter a valid contact email address")
    .max(255)
    .optional()
    .nullable()
    .or(z.literal("")),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        contactEmail: true,
        image: true,
        isAdmin: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error("[API] Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = ProfileUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const updateData: {
      name?: string;
      whatsapp?: string | null;
      contactEmail?: string | null;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.whatsapp !== undefined) {
      if (data.whatsapp && data.whatsapp.trim()) {
        if (!isValidPhone(data.whatsapp)) {
          return NextResponse.json(
            {
              error: "Please enter a valid phone number with country code (e.g. +91 98765 43210)",
            },
            { status: 400 }
          );
        }
        updateData.whatsapp = normalizeToE164(data.whatsapp);
      } else {
        updateData.whatsapp = null;
      }
    }

    if (data.contactEmail !== undefined) {
      if (data.contactEmail && data.contactEmail.trim()) {
        updateData.contactEmail = data.contactEmail.trim().toLowerCase();
      } else {
        updateData.contactEmail = null;
      }
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        contactEmail: true,
        image: true,
        isAdmin: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[API] Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile. Please try again later." },
      { status: 500 }
    );
  }
}
