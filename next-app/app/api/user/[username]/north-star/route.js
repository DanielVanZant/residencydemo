import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(request, { params }) {
    try {
        const { username } = await params;
        console.log(`API: Getting north star for user: ${username}`);
        
        const northStar = await convex.query(api.users.getUserNorthStar, { username });
        console.log('Convex getUserNorthStar response:', northStar);
        
        return Response.json({
            northStarMetric: northStar?.northStarMetric || '',
            northStarDescription: northStar?.northStarDescription || '',
            mostRecentValue: northStar?.mostRecentValue,
            mostRecentDate: northStar?.mostRecentDate
        });
    } catch (error) {
        const { username } = await params;
        console.error(`Error fetching north star for ${username}:`, error);
        return Response.json({ 
            error: 'Failed to fetch north star data',
            details: error.message 
        }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { username } = await params;
        const { northStarMetric, northStarDescription } = await request.json();
        console.log(`API: Updating north star for user: ${username}`);
        
        await convex.mutation(api.users.updateUserNorthStar, {
            username,
            metric: northStarMetric,
            description: northStarDescription
        });
        
        return Response.json({ success: true });
    } catch (error) {
        const { username } = await params;
        console.error(`Error updating north star for ${username}:`, error);
        return Response.json({ 
            error: 'Failed to update north star data',
            details: error.message 
        }, { status: 500 });
    }
}