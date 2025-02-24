import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import natural from 'natural';

const tokenizer = new natural.WordTokenizer();

// Define project categories and their keywords
const projectCategories = {
    'web-development': ['website', 'web', 'interface', 'browser', 'application', 'layout', 'design', 'ui', 'ux'],
    'mobile-app': ['mobile', 'app', 'phone', 'touch', 'android', 'ios', 'smartphone'],
    'data-science': ['graph', 'chart', 'data', 'analysis', 'visualization', 'statistics'],
    'ai-ml': ['artificial', 'intelligence', 'machine', 'learning', 'neural', 'model'],
    'game-development': ['game', 'gaming', '3d', 'unity', 'character', 'animation'],
    'cybersecurity': ['security', 'protection', 'encryption', 'cyber', 'authentication'],
};

const projects = {
    'web-development': [
        {
            id: 'web-1',
            name: 'Portfolio Website Builder',
            description: 'Create a personal portfolio website using React and Next.js',
            difficulty: 'Intermediate',
            skills: ['React', 'Next.js', 'Tailwind CSS']
        },
        {
            id: 'web-2',
            name: 'E-commerce Platform',
            description: 'Build an online store with shopping cart functionality',
            difficulty: 'Advanced',
            skills: ['Node.js', 'Express', 'MongoDB']
        }
    ],
    'mobile-app': [
        {
            id: 'mobile-1',
            name: 'Fitness Tracking App',
            description: 'Develop a mobile app for tracking workouts and health metrics',
            difficulty: 'Intermediate',
            skills: ['React Native', 'Firebase']
        }
    ],
    'data-science': [
        {
            id: 'data-1',
            name: 'Data Visualization Dashboard',
            description: 'Create interactive data visualizations using D3.js',
            difficulty: 'Advanced',
            skills: ['D3.js', 'Python', 'pandas']
        }
    ],
    // Add more projects for other categories...
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const user = searchParams.get('user');

        if (!user) {
            return NextResponse.json({ error: 'User parameter is required' }, { status: 400 });
        }

        // Read metadata to get user's images and descriptions
        const metadataPath = path.join(process.cwd(), 'public', 'metadata.json');
        const data = await readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(data);

        // Get all descriptions for the user
        const userDescriptions = metadata
            .filter((item: any) => item.user === user)
            .map((item: any) => item.description)
            .join(' ')
            .toLowerCase();

        // Tokenize the descriptions
        const tokens = tokenizer.tokenize(userDescriptions) || [];

        // Calculate category scores based on keyword matches
        const categoryScores = Object.entries(projectCategories).map(([category, keywords]) => {
            const score = keywords.reduce((acc, keyword) => {
                return acc + tokens.filter(token => token.includes(keyword)).length;
            }, 0);
            return { category, score };
        });

        // Sort categories by score and get top matches
        const topCategories = categoryScores
            .sort((a, b) => b.score - a.score)
            .filter(cat => cat.score > 0)
            .slice(0, 3);

        // Get recommended projects from top categories
        const recommendedProjects = topCategories.flatMap(({ category }) => 
            projects[category as keyof typeof projects].map(project => ({
                ...project,
                category
            }))
        );

        return NextResponse.json({
            categories: topCategories,
            projects: recommendedProjects
        });

    } catch (error) {
        console.error('Error getting project recommendations:', error);
        return NextResponse.json(
            { error: 'Failed to get project recommendations' },
            { status: 500 }
        );
    }
} 