// app/api/user/profile/route.ts
// Customer profile update endpoint.
// Allows authenticated users to update their profile settings (e.g. name).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { z } from "zod";

const ProfileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
});

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

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { name: result.data.name },
      select: {
        id: true,
        name: true,
        email: true,
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
