"use client";

export default function LoadingPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinning circle */}
        <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>

        {/* Optional text */}
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  );
}
