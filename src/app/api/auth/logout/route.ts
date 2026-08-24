import { getSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();

    return Response.json({ success: true, message: 'Logged out successfully.' });
  } catch {
    return Response.json(
      { success: false, error: 'Failed to logout.' },
      { status: 500 }
    );
  }
}
