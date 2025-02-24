import { NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import Together from "together-ai";

// Initialize Together AI client
const together = new Together(process.env.TOGETHER_API_KEY);

const getDescriptionPrompt = `Analyze this image and provide a detailed description focusing on:
1. Main subject or content
IF the image is a notebook or contains text do OCR then give all contents.

Please be specific and concise in your description. Max 100 words`;

async function getImageDescription(filepath: string) {
    try {
        // Read the image file and convert to base64
        const imageBuffer = await readFile(filepath);
        const base64Image = imageBuffer.toString('base64');

        const response = await together.chat.completions.create({
            model: "meta-llama/Llama-Vision-Free",
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: getDescriptionPrompt },
                    { 
                        type: "image_url", 
                        image_url: { 
                            url: `data:image/jpeg;base64,${base64Image}`
                        }
                    },
                ],
            }]
        });

        // Return the generated description
        return response.choices[0]?.message?.content || 'No description generated';
    } catch (error) {
        console.error('Error getting image description:', error);
        return 'Failed to generate description';
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;
        const user = formData.get('user') as string;

        if (!image || !user) {
            return NextResponse.json(
                { error: 'Image and user are required' },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `image_${timestamp}${path.extname(image.name)}`;
        const filepath = path.join(uploadsDir, filename);

        // Convert File to Buffer and save
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Get image description using the local file
        const description = await getImageDescription(filepath);

        // Save metadata to single JSON file
        const metadataPath = path.join(process.cwd(), 'public', 'metadata.json');
        const publicPath = `/uploads/${filename}`;
        
        const newEntry = {
            user: user,
            imagePath: publicPath,
            description: description,
            timestamp: timestamp,
        };

        let allMetadata = [];
        try {
            const existing = await readFile(metadataPath, 'utf-8');
            allMetadata = JSON.parse(existing);
        } catch (e) {
            // No existing metadata file
        }

        allMetadata.push(newEntry);
        await writeFile(metadataPath, JSON.stringify(allMetadata, null, 2));

        return NextResponse.json({ 
            success: true, 
            path: publicPath,
            description: description
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        );
    }
} 