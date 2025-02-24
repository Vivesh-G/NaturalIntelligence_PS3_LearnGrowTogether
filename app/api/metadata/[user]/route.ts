import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';

export async function GET(
    request: Request,
    { params }: { params: { user: string } }
) {
    try {
        const user = params.user;
        const metadataPath = path.join(process.cwd(), 'public', 'metadata.json');
        
        try {
            const data = await readFile(metadataPath, 'utf-8');
            const allMetadata = JSON.parse(data);
            
            // Filter metadata for specific user
            const userMetadata = allMetadata.filter(
                (item: any) => item.user === user
            );
            
            return NextResponse.json(userMetadata);
        } catch (e) {
            // Return empty array if file doesn't exist
            return NextResponse.json([]);
        }
    } catch (error) {
        console.error('Error reading metadata:', error);
        return NextResponse.json(
            { error: 'Failed to read metadata' },
            { status: 500 }
        );
    }
} 