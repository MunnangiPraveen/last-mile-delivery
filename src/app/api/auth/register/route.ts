import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return Response.json(
        { success: false, error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return Response.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return Response.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Hash password and create user — role is ALWAYS CUSTOMER
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'CUSTOMER', // Never allow role selection from registration
      },
    });

    // Auto-login after registration
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name;
    session.role = 'CUSTOMER';
    session.isLoggedIn = true;
    await session.save();

    return Response.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        redirect: '/customer',
      },
    });
  } catch {
    return Response.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
