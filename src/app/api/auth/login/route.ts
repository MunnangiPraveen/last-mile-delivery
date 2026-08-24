import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return Response.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return Response.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Create session
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name;
    session.role = user.role as 'CUSTOMER' | 'AGENT' | 'ADMIN';
    session.isLoggedIn = true;
    await session.save();

    // Return redirect URL based on role
    const redirectMap: Record<string, string> = {
      CUSTOMER: '/customer',
      AGENT: '/agent',
      ADMIN: '/admin',
    };

    return Response.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        redirect: redirectMap[user.role] || '/',
      },
    });
  } catch {
    return Response.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
