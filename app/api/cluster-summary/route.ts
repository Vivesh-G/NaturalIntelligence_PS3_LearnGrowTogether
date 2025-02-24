import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from 'path';
import { readFile } from 'fs/promises';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const getSummaryPrompt = `As a learning path advisor, analyze these image descriptions and create a comprehensive summary of the learning interests and potential career path. Include:

1. Main areas of interest
2. Suggested learning path
3. Potential career opportunities
4. Key skills to develop

Keep the summary concise but informative.

Image Descriptions:
`;

export async function POST(request: Request) {
    try {
        const { clusterUsers } = await request.json();

        if (!clusterUsers || !Array.isArray(clusterUsers)) {
            return NextResponse.json(
                { error: 'Cluster users array is required' },
                { status: 400 }
            );
        }

        // Read the metadata file
        const metadataPath = path.join(process.cwd(), 'public', 'metadata.json');
        const metadataContent = await readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataContent);

        // Filter descriptions for the users in this cluster
        const clusterDescriptions = metadata
            .filter((item: any) => clusterUsers.includes(item.user))
            .map((item: any) => `User ${item.user}:\n${item.description}`);

        if (clusterDescriptions.length === 0) {
            return NextResponse.json(
                { error: 'No descriptions found for cluster users' },
                { status: 400 }
            );
        }

        const fullPrompt = getSummaryPrompt + clusterDescriptions.join('\n\n');
        
        // Get Gemini model instance
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Generate content
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const summary = response.text();

        return NextResponse.json({ summary });

    } catch (error) {
        console.error('Error generating cluster summary:', error);
        return NextResponse.json(
            { error: 'Failed to generate summary' },
            { status: 500 }
        );
    }
} 