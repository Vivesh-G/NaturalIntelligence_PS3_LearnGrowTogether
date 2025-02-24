import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from 'path';
import { readFile, writeFile } from 'fs/promises';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const themeInferencePrompt = `Analyze these image descriptions and identify the main technical themes and categories present. 
For each theme:
1. Provide a category name
2. List related keywords and concepts
3. Identify the skill domain it belongs to

Format the response as a JSON object with the following structure:
{
  "themes": [
    {
      "category": "theme name",
      "keywords": ["keyword1", "keyword2", ...],
      "domain": "skill domain"
    }
  ]
}

Image Descriptions:
`;

export async function POST(request: Request) {
    try {
        // Read all metadata to get descriptions
        const metadataPath = path.join(process.cwd(), 'public', 'metadata.json');
        const data = await readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(data);

        // Combine all descriptions
        const descriptions = metadata.map((item: any) => item.description).join('\n\n');

        // Get Gemini model instance
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Generate theme categories
        const result = await model.generateContent(themeInferencePrompt + descriptions);
        const response = await result.response;
        const themeData = JSON.parse(response.text());

        // Save themes to a JSON file
        const themesPath = path.join(process.cwd(), 'public', 'themes.json');
        await writeFile(themesPath, JSON.stringify(themeData, null, 2));

        return NextResponse.json(themeData);

    } catch (error) {
        console.error('Theme inference error:', error);
        return NextResponse.json(
            { error: 'Failed to infer themes' },
            { status: 500 }
        );
    }
} 