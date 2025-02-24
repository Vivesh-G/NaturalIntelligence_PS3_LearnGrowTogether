import { useEffect, useState } from 'react';

interface Project {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    skills: string[];
    category: string;
}

interface Category {
    category: string;
    score: number;
}

interface ProjectRecommendationsProps {
    selectedUser: string;
}

export default function ProjectRecommendations({ selectedUser }: ProjectRecommendationsProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/projects?user=${selectedUser}`);
                if (response.ok) {
                    const data = await response.json();
                    setProjects(data.projects);
                    setCategories(data.categories);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        if (selectedUser) {
            fetchProjects();
        }
    }, [selectedUser]);

    if (loading) {
        return (
            <div className="text-center py-8" data-oid="jaarxw4">
                Loading recommendations...
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500" data-oid="5xv7-i2">
                No project recommendations available yet. Upload more images to get personalized
                suggestions!
            </div>
        );
    }

    return (
        <div className="space-y-6" data-oid="qj-zg3c">
            <h2 className="text-2xl font-bold text-gray-900" data-oid="54ke13v">
                Project Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-oid="hj6d2l1">
                <div className="bg-white rounded-lg shadow-md p-6" data-oid="xg8turd">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4" data-oid=".:o9hme">
                        Based on your interests
                    </h3>
                    <ul className="space-y-4" data-oid="4slea_h">
                        <li className="flex items-start" data-oid="spq71td">
                            <div className="flex-shrink-0" data-oid="l:lck:o">
                                <span
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-500"
                                    data-oid="86smp46"
                                >
                                    1
                                </span>
                            </div>
                            <div className="ml-4" data-oid="3fhs3i:">
                                <h4
                                    className="text-base font-medium text-gray-900"
                                    data-oid="mnjm64o"
                                >
                                    Web Development Project
                                </h4>
                                <p className="mt-1 text-sm text-gray-500" data-oid="irks.-g">
                                    Build a personal portfolio website using React and Next.js
                                </p>
                            </div>
                        </li>
                        <li className="flex items-start" data-oid="ab2ksng">
                            <div className="flex-shrink-0" data-oid="..p97fx">
                                <span
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-500"
                                    data-oid="bvrvt.d"
                                >
                                    2
                                </span>
                            </div>
                            <div className="ml-4" data-oid="v2ra:74">
                                <h4
                                    className="text-base font-medium text-gray-900"
                                    data-oid="z08r801"
                                >
                                    Machine Learning Project
                                </h4>
                                <p className="mt-1 text-sm text-gray-500" data-oid="mll89ob">
                                    Create an image classification model using TensorFlow
                                </p>
                            </div>
                        </li>
                    </ul>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6" data-oid="6kkwp1t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4" data-oid="-c3f01m">
                        Recommended Skills
                    </h3>
                    <div className="space-y-4" data-oid="yhltit9">
                        <div data-oid="2f68pj7">
                            <h4 className="text-base font-medium text-gray-900" data-oid="aw3s08v">
                                Technical Skills
                            </h4>
                            <div className="mt-2 flex flex-wrap gap-2" data-oid="q2x8yei">
                                <span
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                    data-oid="1pf7px7"
                                >
                                    React.js
                                </span>
                                <span
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                    data-oid="70b9x_-"
                                >
                                    Python
                                </span>
                                <span
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                    data-oid="7nm8..m"
                                >
                                    TensorFlow
                                </span>
                            </div>
                        </div>
                        <div data-oid="yjlb28q">
                            <h4 className="text-base font-medium text-gray-900" data-oid=".c4ixa1">
                                Soft Skills
                            </h4>
                            <div className="mt-2 flex flex-wrap gap-2" data-oid="bizj3zd">
                                <span
                                    className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                                    data-oid="vnpze2x"
                                >
                                    Problem Solving
                                </span>
                                <span
                                    className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                                    data-oid="zcd82k2"
                                >
                                    Project Management
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
