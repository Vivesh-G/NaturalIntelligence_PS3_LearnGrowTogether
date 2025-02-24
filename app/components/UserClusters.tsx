import { useEffect, useState } from 'react';

interface ImageMetadata {
    user: string;
    path: string;
    description: string;
    timestamp?: string;
    themes?: string[];
}

interface Cluster {
    clusterId: number;
    users: string[];
    commonThemes: string[];
    similarityScore: number;
    descriptions: string[];
}

export default function UserClusters() {
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
    const [clusterSummary, setClusterSummary] = useState<string>('');
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const createClusters = async () => {
            try {
                // Fetch metadata
                const response = await fetch('/api/clustering');
                if (!response.ok) {
                    throw new Error('Failed to fetch clusters');
                }

                const data = await response.json();

                // Transform the data into clusters
                const formattedClusters = data.map((cluster: any, index: number) => ({
                    clusterId: index + 1,
                    users: cluster.users || [],
                    commonThemes: cluster.themes || [],
                    similarityScore: cluster.similarity || 0.8,
                    descriptions: cluster.descriptions || [],
                }));

                setClusters(formattedClusters);
            } catch (error) {
                console.error('Error creating clusters:', error);
                // Fallback to local clustering if API fails
                await fallbackClustering();
            } finally {
                setLoading(false);
            }
        };

        const fallbackClustering = async () => {
            try {
                const response = await fetch('/metadata.json');
                const metadata: ImageMetadata[] = await response.json();

                // Group by user
                const userGroups = metadata.reduce(
                    (acc: { [key: string]: ImageMetadata[] }, item) => {
                        if (!acc[item.user]) {
                            acc[item.user] = [];
                        }
                        acc[item.user].push(item);
                        return acc;
                    },
                    {},
                );

                // Create basic clusters based on common themes
                const basicClusters: Cluster[] = [];
                const processedUsers = new Set();

                Object.entries(userGroups).forEach(([user, items]) => {
                    if (processedUsers.has(user)) return;

                    const userThemes = new Set(items.flatMap((item) => item.themes || []));
                    const similarUsers = Object.entries(userGroups)
                        .filter(([otherUser, otherItems]) => {
                            if (otherUser === user || processedUsers.has(otherUser)) return false;
                            const otherThemes = new Set(
                                otherItems.flatMap((item) => item.themes || []),
                            );
                            const commonThemes = [...userThemes].filter((theme) =>
                                otherThemes.has(theme),
                            );
                            return commonThemes.length > 0;
                        })
                        .map(([otherUser]) => otherUser);

                    const clusterUsers = [user, ...similarUsers];
                    clusterUsers.forEach((u) => processedUsers.add(u));

                    if (clusterUsers.length > 0) {
                        const clusterItems = clusterUsers.flatMap((u) => userGroups[u]);
                        const commonThemes = [
                            ...new Set(clusterItems.flatMap((item) => item.themes || [])),
                        ];

                        basicClusters.push({
                            clusterId: basicClusters.length + 1,
                            users: clusterUsers,
                            commonThemes,
                            similarityScore: similarUsers.length > 0 ? 0.8 : 1.0,
                            descriptions: clusterItems.map((item) => item.description),
                        });
                    }
                });

                setClusters(basicClusters);
            } catch (error) {
                console.error('Error in fallback clustering:', error);
                setClusters([]);
            }
        };

        createClusters();
    }, []);

    const fetchClusterSummary = async (clusterId: number) => {
        try {
            setSummaryLoading(true);
            setSelectedCluster(clusterId);

            const cluster = clusters.find((c) => c.clusterId === clusterId);
            if (!cluster) return;

            const response = await fetch('/api/cluster-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clusterUsers: cluster.users,
                    descriptions: cluster.descriptions,
                    themes: cluster.commonThemes,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setClusterSummary(data.summary);
            } else {
                throw new Error('Failed to fetch summary');
            }
        } catch (error) {
            console.error('Error fetching cluster summary:', error);
            setClusterSummary('Failed to generate summary. Please try again.');
        } finally {
            setSummaryLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12" data-oid="nwgm86w">
                <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"
                    data-oid="igs1sxb"
                ></div>
                <span className="ml-3 text-gray-600" data-oid="4mtq1x4">
                    Analyzing learning paths...
                </span>
            </div>
        );
    }

    if (clusters.length === 0) {
        return (
            <div className="text-center py-8 text-gray-600" data-oid="as3l1.j">
                No learning paths found. Start by uploading some learning content!
            </div>
        );
    }

    return (
        <div className="space-y-6" data-oid="h5xvpol">
            <h2 className="text-2xl font-bold text-gray-900" data-oid="_0r.xv5">
                Learning Paths
            </h2>
            <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                data-oid="wcbf6dq"
            >
                {clusters.map((cluster) => (
                    <div
                        key={cluster.clusterId}
                        className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => fetchClusterSummary(cluster.clusterId)}
                        data-oid="36c:.ln"
                    >
                        <div className="flex items-center justify-between mb-4" data-oid="k0w4376">
                            <h3 className="text-lg font-semibold text-gray-900" data-oid="llmh1nt">
                                Learning Path {cluster.clusterId}
                            </h3>
                            <span className="text-sm text-gray-500" data-oid="sh9f_.s">
                                Similarity: {(cluster.similarityScore * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="mb-4" data-oid="o-:6h84">
                            <h4
                                className="text-sm font-medium text-gray-700 mb-2"
                                data-oid="ai1wrhy"
                            >
                                Users
                            </h4>
                            <div className="flex flex-wrap gap-2" data-oid="_ur.xy.">
                                {cluster.users.map((user) => (
                                    <span
                                        key={user}
                                        className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                                        data-oid="vsa:unc"
                                    >
                                        {user}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div data-oid="8r0tsui">
                            <h4
                                className="text-sm font-medium text-gray-700 mb-2"
                                data-oid="bl9cq8s"
                            >
                                Common Themes
                            </h4>
                            <div className="flex flex-wrap gap-2" data-oid="s7aml.y">
                                {cluster.commonThemes.map((theme) => (
                                    <span
                                        key={theme}
                                        className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                                        data-oid="ruq3ra:"
                                    >
                                        {theme}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cluster Summary Modal */}
            {selectedCluster && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    data-oid="51hrdbn"
                >
                    <div
                        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                        data-oid="e14gecw"
                    >
                        <div className="flex justify-between items-center mb-4" data-oid="0e09ehx">
                            <h3 className="text-xl font-semibold text-gray-900" data-oid="oswtqk_">
                                Learning Path {selectedCluster} Summary
                            </h3>
                            <button
                                onClick={() => {
                                    setSelectedCluster(null);
                                    setClusterSummary('');
                                }}
                                className="text-gray-500 hover:text-gray-700"
                                data-oid="tzguo7h"
                            >
                                <span className="sr-only" data-oid="f38_8_k">
                                    Close
                                </span>
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    data-oid=".1:7xb-"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                        data-oid="igx60-y"
                                    />
                                </svg>
                            </button>
                        </div>
                        {summaryLoading ? (
                            <div className="text-center py-8" data-oid="gjjti-u">
                                Generating learning path summary...
                            </div>
                        ) : (
                            <div className="prose max-w-none" data-oid="ug2dwtv">
                                {clusterSummary.split('\n').map((paragraph, index) => (
                                    <p
                                        key={index}
                                        className="mb-4 text-gray-700"
                                        data-oid="zvbtnkh"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
