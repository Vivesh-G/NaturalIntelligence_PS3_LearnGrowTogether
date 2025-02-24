'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import UserClusters from './components/UserClusters';
import ProjectRecommendations from './components/ProjectRecommendations';
import ThemeToggle from './components/ThemeToggle';

export default function Page() {
    const [image, setImage] = useState<File | null>(null);
    const [selectedUser, setSelectedUser] = useState('user1');
    const [description, setDescription] = useState('');
    const [showQuiz, setShowQuiz] = useState(false);
    const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'gallery' | 'learning'>(
        'upload',
    );
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [userMetadata, setUserMetadata] = useState<
        Array<{
            imagePath: string;
            description: string;
            timestamp: number;
        }>
    >([]);
    const [showCapturePopup, setShowCapturePopup] = useState(false);
    const [capturedImageUrl, setCapturedImageUrl] = useState<string>('');
    const [latestUpload, setLatestUpload] = useState<{
        path: string;
        description: string;
    } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImage(e.target.files[0]);
        }
    };

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().catch((e) => {
                    console.error('Error playing video:', e);
                });
            };
        }
    }, [stream]);

    const handleCameraAccess = async () => {
        try {
            console.log('Requesting camera access...');
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });
            console.log('Camera access granted, setting stream...');
            setStream(mediaStream);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please make sure you have granted camera permissions.');
        }
    };

    useEffect(() => {
        if (activeTab !== 'camera' && stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    }, [activeTab, stream]);

    const handleImageUpload = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('user', selectedUser);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            setLatestUpload({
                path: data.path,
                description: data.description,
            });

            setImage(file);
            setShowSuccess(true);
            fetchUserMetadata();

            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
        }
    };

    const fetchUserMetadata = async () => {
        try {
            const response = await fetch(`/api/metadata/${selectedUser}`);
            if (response.ok) {
                const data = await response.json();
                setUserMetadata(data);
            }
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    };

    useEffect(() => {
        fetchUserMetadata();
    }, [selectedUser]);

    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current || !stream) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (!context) return;

            if (video.style.transform.includes('scaleX(-1)')) {
                context.scale(-1, 1);
                context.translate(-canvas.width, 0);
            }

            context.drawImage(video, 0, 0);

            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Failed to create blob'));
                    },
                    'image/jpeg',
                    0.8,
                );
            });

            console.log('Blob created:', blob.size, 'bytes');

            const imageUrl = URL.createObjectURL(blob);
            setCapturedImageUrl(imageUrl);

            const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
            console.log('File created:', file.name, file.size, 'bytes');

            setImage(file);

            stream.getTracks().forEach((track) => track.stop());
            setStream(null);

            setShowCapturePopup(true);
        } catch (error) {
            console.error('Error capturing image:', error);
            alert('Failed to capture image');
        }
    };

    const handleSaveCapture = async () => {
        if (!image) return;

        try {
            const formData = new FormData();
            formData.append('image', image);
            formData.append('user', selectedUser);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            setLatestUpload({
                path: data.path,
                description: data.description,
            });

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);

            setShowCapturePopup(false);
            setCapturedImageUrl('');
            setImage(null);

            await fetchUserMetadata();
            setActiveTab('gallery');
        } catch (error) {
            console.error('Error saving captured photo:', error);
            alert('Failed to save photo');
        }
    };

    useEffect(() => {
        return () => {
            if (capturedImageUrl) {
                URL.revokeObjectURL(capturedImageUrl);
            }
        };
    }, [capturedImageUrl]);

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100"
            data-oid="nb6vvmf"
        >
            {/* Title Section - Updated to be more compact and transparent */}
            <div className="bg-transparent" data-oid="zqpcqor">
                <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8" data-oid="jhcmip2">
                    <div className="text-center" data-oid="jy18bpc">
                        <h1
                            className="text-3xl font-bold text-gray-900 sm:text-4xl"
                            data-oid=".86e9jx"
                        >
                            Learn Together, Grow Together
                        </h1>
                        <p
                            className="max-w-xl mt-3 mx-auto text-lg text-gray-600"
                            data-oid="ch55qws"
                        >
                            Join our community of learners, share your journey, and discover new
                            paths to growth.
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation - Updated to be more subtle */}
            <nav className="bg-white/50 backdrop-blur-sm shadow-sm" data-oid="wjl8jqg">
                <div className="max-w-7xl mx-auto px-4" data-oid="uk2a1t4">
                    <div className="flex justify-between h-12" data-oid="uk6mvyv">
                        <div className="flex space-x-8" data-oid="fj7dckt">
                            {['upload', 'camera', 'gallery', 'learning'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium capitalize ${
                                        activeTab === tab
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                    data-oid="xsi:0wd"
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8" data-oid="4w.4-ye">
                {/* User Selection */}
                <div className="mb-6" data-oid="da3nob2">
                    <label
                        htmlFor="user-select"
                        className="block text-sm font-medium text-gray-700 mb-2"
                        data-oid="l7.8jnc"
                    >
                        Select User
                    </label>
                    <select
                        id="user-select"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="block w-full max-w-xs rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        data-oid="rb:.xa5"
                    >
                        <option value="user1" data-oid="n-c9u9u">
                            User 1
                        </option>
                        <option value="user2" data-oid="lhlgn::">
                            User 2
                        </option>
                        <option value="user3" data-oid="s42hcl-">
                            User 3
                        </option>
                    </select>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'learning' ? (
                    <div className="space-y-12" data-oid="73w3f5x">
                        <div className="bg-white rounded-lg shadow-md p-6" data-oid="0l9x_81">
                            <h2
                                className="text-2xl font-bold text-gray-900 mb-8"
                                data-oid="p4ubjk5"
                            >
                                Learning Dashboard
                            </h2>
                            <div className="space-y-12" data-oid="rlflq_e">
                                <UserClusters data-oid=".dtw6:i" />
                                <div className="border-t pt-8" data-oid="shf6p9i">
                                    <ProjectRecommendations
                                        selectedUser={selectedUser}
                                        data-oid="x_wqla3"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'gallery' ? (
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        data-oid="4p_i34t"
                    >
                        {userMetadata.map((item, index) => (
                            <div
                                key={item.timestamp}
                                className="bg-white rounded-lg shadow-md overflow-hidden"
                                data-oid="uvwzc-k"
                            >
                                <img
                                    src={item.imagePath}
                                    alt={`Upload ${index + 1}`}
                                    className="w-full h-48 object-cover"
                                    data-oid="j8kc.8q"
                                />

                                <div className="p-4" data-oid="nggqqmt">
                                    <p
                                        className="text-sm text-gray-600 line-clamp-3"
                                        data-oid="6l4gstp"
                                    >
                                        {item.description}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2" data-oid="y0cr0w9">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {userMetadata.length === 0 && (
                            <div
                                className="col-span-full text-center py-12 text-gray-500"
                                data-oid="ig:q2fy"
                            >
                                No photos uploaded yet
                            </div>
                        )}
                    </div>
                ) : activeTab === 'camera' ? (
                    <div className="text-center" data-oid="4w5taet">
                        {!stream ? (
                            <>
                                <div
                                    className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto"
                                    data-oid="k5umkfn"
                                >
                                    <svg
                                        className="w-8 h-8 text-indigo-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        data-oid="uc1d-yc"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                            data-oid="yk4.z-q"
                                        />

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                            data-oid="e13vu0f"
                                        />
                                    </svg>
                                </div>
                                <button
                                    onClick={handleCameraAccess}
                                    className="bg-indigo-500 text-white px-6 py-3 rounded-full hover:bg-indigo-600 transition-colors"
                                    data-oid="zxcidsp"
                                >
                                    Open Camera
                                </button>
                            </>
                        ) : (
                            <div className="relative w-full h-[400px]" data-oid="-4cnsfo">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover rounded-lg"
                                    style={{ transform: 'scaleX(-1)' }}
                                    data-oid="ujl65xt"
                                />

                                <canvas ref={canvasRef} className="hidden" data-oid="gb-fmg7" />

                                <div className="mt-4 flex justify-center gap-4" data-oid="d:qse__">
                                    <button
                                        onClick={captureImage}
                                        className="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition-colors"
                                        data-oid="dnp8.8y"
                                    >
                                        Capture Photo
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (stream) {
                                                stream.getTracks().forEach((track) => track.stop());
                                                setStream(null);
                                            }
                                        }}
                                        className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transition-colors"
                                        data-oid="t8hlx6h"
                                    >
                                        Stop Camera
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm p-8"
                        data-oid="zdmrwi:"
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                            data-oid="gmirvy2"
                        />

                        <label
                            htmlFor="file-upload"
                            className="flex flex-col items-center justify-center w-full max-w-md h-64 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-indigo-500"
                            data-oid="qp338.6"
                        >
                            <div
                                className="flex flex-col items-center justify-center pt-5 pb-6"
                                data-oid="461mybl"
                            >
                                <svg
                                    className="w-12 h-12 mb-4 text-gray-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    data-oid="3v04xfd"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        data-oid="pkq1e4u"
                                    />
                                </svg>
                                <p
                                    className="mb-2 text-lg font-semibold text-gray-700"
                                    data-oid="m_eliqz"
                                >
                                    Click to upload
                                </p>
                                <p className="text-sm text-gray-500" data-oid="rrmb8cw">
                                    or drag and drop your image here
                                </p>
                            </div>
                            {image && (
                                <div className="mt-4 text-sm text-gray-500" data-oid="7o1t280">
                                    Selected: {image.name}
                                </div>
                            )}
                        </label>
                        {image && (
                            <button
                                onClick={() => handleImageUpload(image)}
                                className="mt-6 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                data-oid="7iz4exy"
                            >
                                Upload Image
                            </button>
                        )}
                    </div>
                )}

                {/* Success notification */}
                {showSuccess && (
                    <div
                        className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out"
                        data-oid="u.:-d.:"
                    >
                        Photo saved successfully!
                    </div>
                )}

                {/* Latest Upload Preview */}
                {latestUpload && (
                    <div
                        className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-md animate-slide-up"
                        data-oid="..4nb:d"
                    >
                        <div className="flex items-start space-x-4" data-oid="q76sd_w">
                            <div className="flex-shrink-0" data-oid="85s6.d7">
                                <img
                                    src={latestUpload.path}
                                    alt="Latest upload"
                                    className="w-32 h-32 object-cover rounded-lg"
                                    data-oid="726hcnl"
                                />
                            </div>
                            <div className="flex-1" data-oid="77g:0ba">
                                <div
                                    className="flex justify-between items-start"
                                    data-oid="g-6d4c0"
                                >
                                    <h3 className="font-semibold text-gray-900" data-oid="klv1:np">
                                        Latest Upload
                                    </h3>
                                    <button
                                        onClick={() => setLatestUpload(null)}
                                        className="text-gray-400 hover:text-gray-500"
                                        data-oid="2a49lu-"
                                    >
                                        <span className="sr-only" data-oid="wr4l7m3">
                                            Close
                                        </span>
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            data-oid="v504ynh"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                                data-oid="ikzclzy"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                <p className="mt-1 text-sm text-gray-600" data-oid="af1rrob">
                                    {latestUpload.description}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Capture Preview Popup */}
                {showCapturePopup && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        data-oid="zwoap8k"
                    >
                        <div
                            className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
                            data-oid="-pxs0no"
                        >
                            <h3 className="text-lg font-semibold mb-4" data-oid="lqtxsj0">
                                Preview Captured Photo
                            </h3>
                            <div className="relative" data-oid="dtmunx6">
                                <img
                                    src={capturedImageUrl}
                                    alt="Captured photo"
                                    className="w-full rounded-lg shadow-md"
                                    data-oid=".cvnmxy"
                                />
                            </div>
                            <div className="mt-6 flex justify-end space-x-4" data-oid="89d6aai">
                                <button
                                    onClick={() => {
                                        setShowCapturePopup(false);
                                        setCapturedImageUrl('');
                                        setStream(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                    data-oid="zd.3g4i"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSaveCapture}
                                    className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                                    data-oid="edgcxtp"
                                >
                                    Save Photo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Features Section */}
                <div className="mt-20 mb-12" data-oid="nkckzdi">
                    <h2
                        className="text-3xl font-bold text-center text-gray-900 mb-12"
                        data-oid="4_my8qf"
                    >
                        Features to Enhance Your Learning
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-oid="n0l7pii">
                        {/* AI Flashcards */}
                        <div
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                            data-oid="e153z7k"
                        >
                            <div
                                className="p-1 bg-gradient-to-r from-blue-500 to-indigo-500"
                                data-oid=".ddms_l"
                            />

                            <div className="p-6" data-oid="w.hd.ea">
                                <div
                                    className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4"
                                    data-oid="0epkonl"
                                >
                                    <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        data-oid=".stsmsa"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                            data-oid="bezseqy"
                                        />
                                    </svg>
                                </div>
                                <h3
                                    className="text-xl font-semibold text-gray-900 mb-2"
                                    data-oid="w_phq0m"
                                >
                                    AI-Powered Flashcards
                                </h3>
                                <p className="text-gray-600" data-oid="skzyb3y">
                                    Smart flashcards that adapt to your learning style. Our AI
                                    analyzes your progress and creates personalized study sets to
                                    maximize retention.
                                </p>
                            </div>
                        </div>

                        {/* Interactive Quizzes */}
                        <div
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                            data-oid="abpzhn9"
                        >
                            <div
                                className="p-1 bg-gradient-to-r from-green-500 to-emerald-500"
                                data-oid="ydis7ip"
                            />

                            <div className="p-6" data-oid="6r4a-w1">
                                <div
                                    className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4"
                                    data-oid="q305q9s"
                                >
                                    <svg
                                        className="w-6 h-6 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        data-oid="4pr6zqz"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            data-oid="47xjzda"
                                        />
                                    </svg>
                                </div>
                                <h3
                                    className="text-xl font-semibold text-gray-900 mb-2"
                                    data-oid="ceeh16a"
                                >
                                    Interactive AI Quizzes
                                </h3>
                                <p className="text-gray-600" data-oid="1p5jw8a">
                                    Dynamic quizzes generated from your learning materials. Get
                                    instant feedback and detailed explanations to reinforce your
                                    understanding.
                                </p>
                            </div>
                        </div>

                        {/* Study Chatroom */}
                        <div
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                            data-oid="fiub8-c"
                        >
                            <div
                                className="p-1 bg-gradient-to-r from-purple-500 to-pink-500"
                                data-oid="xmhi5qx"
                            />

                            <div className="p-6" data-oid="l98bln-">
                                <div
                                    className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4"
                                    data-oid="8u515bc"
                                >
                                    <svg
                                        className="w-6 h-6 text-purple-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        data-oid="2bpi:hb"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                                            data-oid="g2bspuk"
                                        />
                                    </svg>
                                </div>
                                <h3
                                    className="text-xl font-semibold text-gray-900 mb-2"
                                    data-oid="09mq35l"
                                >
                                    Study Chatrooms
                                </h3>
                                <p className="text-gray-600" data-oid="ezsdtws">
                                    Connect with fellow learners in real-time. Share insights, ask
                                    questions, and participate in group discussions to enhance your
                                    learning experience.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
