import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import natural from 'natural';
import stopwords from 'stopwords-en';
import { euclidean } from 'ml-distance-euclidean';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

interface Theme {
    category: string;
    keywords: string[];
    domain: string;
}

interface ThemeData {
    themes: Theme[];
}

async function getThemes(): Promise<ThemeData> {
    try {
        const themesPath = path.join(process.cwd(), 'public', 'themes.json');
        const data = await readFile(themesPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading themes:', error);
        return { themes: [] };
    }
}

function findRelevantThemes(description: string, themes: Theme[]): string[] {
    const text = description.toLowerCase();
    const relevantThemes = new Set<string>();

    themes.forEach((theme) => {
        // Check if any keyword from the theme is present in the description
        if (theme.keywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
            relevantThemes.add(theme.category);
        }
    });

    return Array.from(relevantThemes);
}

function extractKeyPhrases(text: string): string[] {
    const tfidf = new TfIdf();
    tfidf.addDocument(preprocessText(text));

    return tfidf
        .listTerms(0)
        .slice(0, 5)
        .map((item) => item.term)
        .filter((term) => term.length > 3); // Filter out short terms
}

function preprocessText(text: string): string[] {
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
    return tokens.filter(
        (token) => !stopwords.includes(token) && token.length > 2 && /^[a-zA-Z]+$/.test(token),
    );
}

interface Vector {
    dimensions: number[];
    user: string;
    themes: string[];
    keyPhrases: string[];
    domain: string;
}

class KMeansClustering {
    private k: number;
    private maxIterations: number;
    private vectors: Vector[];

    constructor(k: number, maxIterations: number = 100) {
        this.k = k;
        this.maxIterations = maxIterations;
        this.vectors = [];
    }

    private calculateCentroid(cluster: Vector[]): number[] {
        if (cluster.length === 0) return new Array(this.vectors[0].dimensions.length).fill(0);

        const dimensions = cluster[0].dimensions.length;
        const centroid = new Array(dimensions).fill(0);

        for (let vector of cluster) {
            for (let i = 0; i < dimensions; i++) {
                centroid[i] += vector.dimensions[i];
            }
        }

        for (let i = 0; i < dimensions; i++) {
            centroid[i] /= cluster.length;
        }

        return centroid;
    }

    private findClosestCentroid(vector: Vector, centroids: number[][]): number {
        let minDistance = Infinity;
        let closestCentroidIndex = 0;

        centroids.forEach((centroid, index) => {
            const distance = 1 - cosine(vector.dimensions, centroid); // Convert similarity to distance
            if (distance < minDistance) {
                minDistance = distance;
                closestCentroidIndex = index;
            }
        });

        return closestCentroidIndex;
    }

    public cluster(vectors: Vector[]): Vector[][] {
        this.vectors = vectors;
        if (vectors.length === 0) return [];
        if (vectors.length <= this.k) return vectors.map((v) => [v]);

        // Initialize centroids randomly
        let centroids = vectors
            .sort(() => Math.random() - 0.5)
            .slice(0, this.k)
            .map((v) => [...v.dimensions]);

        let clusters: Vector[][] = new Array(this.k).fill(null).map(() => []);
        let iterations = 0;
        let hasChanged = true;

        while (hasChanged && iterations < this.maxIterations) {
            hasChanged = false;
            clusters = new Array(this.k).fill(null).map(() => []);

            // Assign vectors to nearest centroid
            for (let vector of vectors) {
                const clusterIndex = this.findClosestCentroid(vector, centroids);
                clusters[clusterIndex].push(vector);
            }

            // Update centroids
            const newCentroids = clusters.map((cluster) => this.calculateCentroid(cluster));

            // Check if centroids have changed
            for (let i = 0; i < this.k; i++) {
                if (!centroids[i].every((val, j) => Math.abs(val - newCentroids[i][j]) < 0.0001)) {
                    hasChanged = true;
                    break;
                }
            }

            centroids = newCentroids;
            iterations++;
        }

        return clusters;
    }
}

export async function GET() {
    try {
        const metadataPath = path.join(process.cwd(), 'public', 'metadata.json');
        const data = await readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(data);

        // Get dynamically inferred themes
        const themeData = await getThemes();

        // Create TF-IDF vectors for all descriptions
        const tfidf = new TfIdf();
        const userDescriptions = metadata.reduce((acc: any, item: any) => {
            if (!acc[item.user]) {
                acc[item.user] = [];
            }
            acc[item.user].push(item.description);
            return acc;
        }, {});

        // Add all documents to TF-IDF
        Object.values(userDescriptions).forEach((descriptions: any) => {
            const text = descriptions.join(' ');
            tfidf.addDocument(preprocessText(text));
        });

        // Create vectors for each user
        const vectors: Vector[] = Object.entries(userDescriptions).map(([user, descriptions]) => {
            const text = (descriptions as string[]).join(' ');
            const dimensions = Array.from({ length: tfidf.documents.length }, (_, i) => {
                return tfidf.tfidf(preprocessText(text), i);
            });

            const themes = findRelevantThemes(text, themeData.themes);

            return {
                dimensions,
                user,
                themes,
                domain:
                    themeData.themes.find((t) => themes.includes(t.category))?.domain || 'General',
            };
        });

        // Determine optimal K (number of clusters)
        const k = Math.min(Math.max(2, Math.floor(vectors.length / 3)), 5);

        // Perform K-means clustering
        const kMeans = new KMeansClustering(k);
        const clusters = kMeans.cluster(vectors);

        // Format clusters for response
        const formattedClusters = clusters.map((cluster, index) => {
            const clusterThemes = Array.from(new Set(cluster.flatMap((v) => v.themes)));
            const domains = Array.from(new Set(cluster.map((v) => v.domain)));

            return {
                clusterId: index + 1,
                users: cluster.map((v) => v.user),
                commonThemes: clusterThemes,
                domains: domains,
                similarityScore: cluster.length > 1 ? calculateClusterCohesion(cluster) : 1,
            };
        });

        return NextResponse.json(formattedClusters);
    } catch (error) {
        console.error('Clustering error:', error);
        return NextResponse.json({ error: 'Failed to generate clusters' }, { status: 500 });
    }
}

function calculateClusterCohesion(cluster: Vector[]): number {
    if (cluster.length <= 1) return 1;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
            totalSimilarity += cosine(cluster[i].dimensions, cluster[j].dimensions);
            comparisons++;
        }
    }

    return totalSimilarity / comparisons;
}
