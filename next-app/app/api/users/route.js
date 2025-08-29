import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET() {
    try {
        console.log('API: Getting all users');
        const users = await convex.query(api.users.getAllUsers);
        return Response.json({ users: users || [] });
    } catch (error) {
        console.error('Error fetching users:', error);
        return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}