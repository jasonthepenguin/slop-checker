'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface AnalysisResult {
  slopScore: number;
  factors: {
    allCaps: boolean;
    spam: boolean;
    tooManyHashtags: boolean;
    tooManyMentions: boolean;
    offensive: boolean;
    offensiveDisplayName: boolean;
    hasLinks: boolean;
    nsfw: boolean;
    graphicViolence: boolean;
    promotional: boolean;
    privateInfo: boolean;
    excessiveWhitespace: boolean;
    veryShortLowEffort: boolean;
    lengthExtremes: boolean;
    readabilityIssues: boolean;
    lowTokenEntropy: boolean;
    slopAnnotation: boolean;
    mediaOrCardHeavy: boolean;
    informative: boolean;
    encouragesEngagement: boolean;
  };
  summary: string;
  recommendations: string[];
}

type FactorKey = keyof AnalysisResult['factors'];

const DEFAULT_FACTORS: AnalysisResult['factors'] = {
  allCaps: false,
  spam: false,
  tooManyHashtags: false,
  tooManyMentions: false,
  offensive: false,
  offensiveDisplayName: false,
  hasLinks: false,
  nsfw: false,
  graphicViolence: false,
  promotional: false,
  privateInfo: false,
  excessiveWhitespace: false,
  veryShortLowEffort: false,
  lengthExtremes: false,
  readabilityIssues: false,
  lowTokenEntropy: false,
  slopAnnotation: false,
  mediaOrCardHeavy: false,
  informative: false,
  encouragesEngagement: false,
};

const normalizeResult = (raw: any): AnalysisResult => {
  const safeFactors =
    raw && typeof raw === 'object' && 'factors' in raw && raw.factors && typeof raw.factors === 'object'
      ? raw.factors
      : {};

  return {
    slopScore: typeof raw?.slopScore === 'number' ? raw.slopScore : 0,
    summary: typeof raw?.summary === 'string' ? raw.summary : '',
    recommendations: Array.isArray(raw?.recommendations)
      ? raw.recommendations.filter((item: unknown) => typeof item === 'string')
      : [],
    factors: {
      ...DEFAULT_FACTORS,
      ...safeFactors,
    },
  };
};

export default function PostAnalyzer() {
  const [displayName, setDisplayName] = useState('');
  const [post, setPost] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError('');

    const file = event.target.files?.[0];

    if (!file) {
      setImageData(null);
      setImageName('');
      return;
    }

    const maxSize = 200 * 1024; // 200KB limit keeps payload manageable for analysis
    if (file.size > maxSize) {
      setError('Image must be 200KB or smaller.');
      setImageData(null);
      setImageName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setImageData(result);
      setImageName(file.name);
    };

    reader.onerror = () => {
      setError('Failed to read the selected image. Please try another file.');
      setImageData(null);
      setImageName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageData(null);
    setImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzePost = async () => {
    if (!displayName.trim() || !post.trim()) {
      setError('Please enter both a display name and a post to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    const imagePayload = imageData ? { name: imageName, dataUrl: imageData } : null;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post, displayName, image: imagePayload }),
      });

      const raw = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = raw.retryAfter || 30;
          setError(`Too many requests. Please wait ${retryAfter} seconds before trying again.`);
          setResult(null);
        } else {
          throw new Error(raw.error || 'Analysis failed');
        }
      } else {
        setResult(normalizeResult(raw));
      }
    } catch (err) {
      setError('Failed to analyze post. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-green-400';
    if (score < 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score < 30) return 'bg-green-900/30 border-green-500/30';
    if (score < 60) return 'bg-yellow-900/30 border-yellow-500/30';
    return 'bg-red-900/30 border-red-500/30';
  };

  const factorDetails: Array<{ key: FactorKey; label: string; sentiment: 'negative' | 'positive' }> = [
    { key: 'allCaps', label: 'All caps shouting', sentiment: 'negative' },
    { key: 'lengthExtremes', label: 'Length far outside optimal range', sentiment: 'negative' },
    { key: 'readabilityIssues', label: 'Readability concerns', sentiment: 'negative' },
    { key: 'lowTokenEntropy', label: 'Low vocabulary variety', sentiment: 'negative' },
    { key: 'excessiveWhitespace', label: 'Excessive whitespace or odd formatting', sentiment: 'negative' },
    { key: 'spam', label: 'Likely spam pattern', sentiment: 'negative' },
    { key: 'slopAnnotation', label: 'High “slop” annotation', sentiment: 'negative' },
    { key: 'tooManyHashtags', label: 'Too many hashtags or trends', sentiment: 'negative' },
    { key: 'tooManyMentions', label: 'Too many @mentions', sentiment: 'negative' },
    { key: 'hasLinks', label: 'Contains external link', sentiment: 'negative' },
    { key: 'mediaOrCardHeavy', label: 'Heavy media/card footprint', sentiment: 'negative' },
    { key: 'promotional', label: 'Overly promotional content', sentiment: 'negative' },
    { key: 'veryShortLowEffort', label: 'Very short or low-effort post', sentiment: 'negative' },
    { key: 'offensive', label: 'Offensive or aggressive language', sentiment: 'negative' },
    { key: 'offensiveDisplayName', label: 'Offensive display name', sentiment: 'negative' },
    { key: 'privateInfo', label: 'Private information exposure', sentiment: 'negative' },
    { key: 'nsfw', label: 'NSFW or sexual content', sentiment: 'negative' },
    { key: 'graphicViolence', label: 'Graphic gore or violence', sentiment: 'negative' },
    { key: 'informative', label: 'Informative or educational content', sentiment: 'positive' },
    { key: 'encouragesEngagement', label: 'Encourages meaningful engagement', sentiment: 'positive' },
  ];

  const activeFactors = result
    ? factorDetails.filter(({ key }) => Boolean(result.factors?.[key]))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Cosmic background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-600/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Stars - using fixed positions to avoid hydration mismatch */}
      <div className="absolute inset-0">
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '10%', left: '15%', animationDelay: '0s', opacity: 0.8 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '20%', left: '80%', animationDelay: '0.5s', opacity: 0.6 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '15%', left: '45%', animationDelay: '1s', opacity: 0.9 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '80%', left: '20%', animationDelay: '1.5s', opacity: 0.7 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '60%', left: '90%', animationDelay: '2s', opacity: 0.5 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '30%', left: '10%', animationDelay: '2.5s', opacity: 0.8 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '90%', left: '70%', animationDelay: '3s', opacity: 0.6 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '5%', left: '60%', animationDelay: '3.5s', opacity: 0.9 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '45%', left: '30%', animationDelay: '4s', opacity: 0.7 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '70%', left: '50%', animationDelay: '4.5s', opacity: 0.8 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '25%', left: '25%', animationDelay: '0.3s', opacity: 0.6 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '85%', left: '85%', animationDelay: '0.8s', opacity: 0.9 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '40%', left: '5%', animationDelay: '1.3s', opacity: 0.5 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '55%', left: '75%', animationDelay: '1.8s', opacity: 0.7 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '95%', left: '40%', animationDelay: '2.3s', opacity: 0.8 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '35%', left: '65%', animationDelay: '2.8s', opacity: 0.6 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '65%', left: '15%', animationDelay: '3.3s', opacity: 0.9 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '8%', left: '35%', animationDelay: '3.8s', opacity: 0.7 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '75%', left: '95%', animationDelay: '4.3s', opacity: 0.5 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '50%', left: '55%', animationDelay: '4.8s', opacity: 0.8 }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 pt-8 sm:pt-12">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 p-4 sm:p-8">
          {/* Header with title and X logo */}
          <div className="mb-6 sm:mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent inline-flex items-center gap-2 sm:gap-3">
                  <span className="text-4xl sm:text-5xl lg:text-6xl animate-spin-slow">🌀</span>
                  <span className="leading-tight">Voids Slop<br className="sm:hidden" /> Checker</span>
                </h1>
                {/* X Logo next to title */}
                <div className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur-md group-hover:blur-lg transition-all opacity-75"></div>
                  <div className="relative bg-black/50 backdrop-blur-sm rounded-lg p-2 sm:p-2.5 border border-purple-500/30 group-hover:border-purple-400/50 transition-all">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm sm:text-base">
                Check if your post will get deboosted by the algorithm
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-purple-300 mb-2">
                Your X Display Name
              </label>
              <input
                id="displayName"
                type="text"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-100 placeholder-gray-500 text-sm sm:text-base"
                placeholder="Enter your display name..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-purple-300 mb-2">
                Optional Image
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="text-sm text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600/80 file:text-white hover:file:bg-purple-600"
                />
                {imageData && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-xs sm:text-sm text-red-300 hover:text-red-200"
                  >
                    Remove image
                  </button>
                )}
              </div>
              {imageData && (
                <div className="mt-3 bg-slate-800/50 border border-purple-500/20 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-gray-300 mb-2 break-words">{imageName || 'Selected image'}</p>
                  <div className="relative w-full max-w-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageData}
                      alt="Selected preview"
                      className="w-full h-auto rounded-md border border-purple-500/20"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="post" className="block text-sm font-medium text-purple-300 mb-2">
                Your Post
              </label>
              <textarea
                id="post"
                rows={6}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-100 placeholder-gray-500 text-sm sm:text-base"
                placeholder="Enter your post here..."
                value={post}
                onChange={(e) => setPost(e.target.value)}
                maxLength={280}
              />
              <div className="text-xs sm:text-sm text-purple-400 mt-1 text-right">
                {post.length}/280 characters
              </div>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 text-sm sm:text-base">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={analyzePost}
              disabled={loading || !displayName.trim() || !post.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  Analyze Post
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
              <div className={`p-4 sm:p-6 rounded-lg border ${getScoreBackground(result.slopScore)}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-100">Algo Slop Score</h2>
                  <div className={`text-4xl sm:text-5xl font-bold ${getScoreColor(result.slopScore)}`}>
                    {result.slopScore}
                  </div>
                </div>
                <div className="w-full bg-slate-800/50 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      result.slopScore < 30
                        ? 'bg-gradient-to-r from-green-500 to-green-400'
                        : result.slopScore < 60
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{ width: `${result.slopScore}%` }}
                  />
                </div>
                <p className="mt-3 sm:mt-4 text-gray-300 text-sm sm:text-base">{result.summary}</p>
              </div>

              <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-purple-300">Factors Detected</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {activeFactors.length === 0 && (
                    <div className="flex items-center gap-2 text-slate-300 text-sm sm:text-base">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span>No notable signals flagged.</span>
                    </div>
                  )}
                  {activeFactors.map(({ key, label, sentiment }) => {
                    const IconComponent = sentiment === 'positive' ? CheckCircle : XCircle;
                    const colorClass = sentiment === 'positive' ? 'text-green-400' : 'text-red-400';

                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 text-sm sm:text-base ${colorClass}`}
                      >
                        <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-blue-300">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm sm:text-base">
                        <span className="text-blue-400 mt-0.5 sm:mt-1">•</span>
                        <span className="text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Credits Section */}
        <div className="mt-8 sm:mt-12">
          <div className="relative">
            {/* Decorative line */}
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/20"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 px-4 text-purple-400 text-sm">
                Created by
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-center items-center gap-8 sm:gap-16">
            {/* Jason's Angelic Design */}
            <a
              href="https://x.com/JasonBotterill3"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative"
            >
              {/* Angelic Container */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                {/* Holy glow effect */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-yellow-400/10 rounded-full blur-3xl group-hover:bg-yellow-400/20 transition-all duration-700"></div>
                  <div className="absolute inset-2 bg-cyan-400/20 rounded-full blur-2xl group-hover:bg-cyan-300/30 transition-all duration-700"></div>
                </div>

                {/* Halo and Wings SVG */}
                <svg
                  className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:rotate-12"
                  viewBox="0 0 200 200"
                >
                  {/* Halo */}
                  <ellipse
                    cx="100"
                    cy="30"
                    rx="40"
                    ry="12"
                    fill="none"
                    stroke="url(#angelicGradient)"
                    strokeWidth="2"
                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                  <ellipse
                    cx="100"
                    cy="30"
                    rx="40"
                    ry="12"
                    fill="url(#angelicGradient)"
                    className="opacity-20 group-hover:opacity-30 transition-opacity"
                  />

                  {/* Left Wing */}
                  <path
                    d="M 40,80 Q 10,70 5,100 Q 10,120 30,110 Q 20,130 40,140 Q 50,120 60,100"
                    fill="url(#wingsGradient)"
                    className="opacity-40 group-hover:opacity-60 transition-all duration-500"
                  />

                  {/* Right Wing */}
                  <path
                    d="M 160,80 Q 190,70 195,100 Q 190,120 170,110 Q 180,130 160,140 Q 150,120 140,100"
                    fill="url(#wingsGradient)"
                    className="opacity-40 group-hover:opacity-60 transition-all duration-500"
                  />

                  {/* Radiating light rays */}
                  <g className="opacity-30 group-hover:opacity-50 transition-opacity">
                    <line x1="100" y1="100" x2="100" y2="20" stroke="url(#angelicGradient)" strokeWidth="1" />
                    <line x1="100" y1="100" x2="150" y2="50" stroke="url(#angelicGradient)" strokeWidth="1" />
                    <line x1="100" y1="100" x2="150" y2="150" stroke="url(#angelicGradient)" strokeWidth="1" />
                    <line x1="100" y1="100" x2="50" y2="150" stroke="url(#angelicGradient)" strokeWidth="1" />
                    <line x1="100" y1="100" x2="50" y2="50" stroke="url(#angelicGradient)" strokeWidth="1" />
                  </g>

                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="angelicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                    <radialGradient id="wingsGradient">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.3" />
                    </radialGradient>
                  </defs>

                  {/* Floating stars */}
                  <g className="animate-pulse">
                    <circle cx="70" cy="60" r="2" fill="#fbbf24" opacity="0.6">
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="130" cy="60" r="2" fill="#60a5fa" opacity="0.6">
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" begin="1s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="160" cy="100" r="2" fill="#fbbf24" opacity="0.6">
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" begin="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="40" cy="100" r="2" fill="#60a5fa" opacity="0.6">
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" begin="0.5s" repeatCount="indefinite" />
                    </circle>
                  </g>
                </svg>

                {/* Profile image in center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ring-yellow-400/50 group-hover:ring-yellow-400 transition-all group-hover:scale-110 duration-300 group-hover:shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/30 to-cyan-200/30 mix-blend-screen z-10"></div>
                  <Image
                    src="/jb.jpg"
                    alt="Jason Botterill"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Floating angelic symbols */}
                <div className="absolute -top-2 -left-2 text-yellow-400/60 text-sm animate-pulse">✧</div>
                <div className="absolute -top-2 -right-2 text-cyan-400/60 text-sm animate-pulse" style={{ animationDelay: '0.5s' }}>✦</div>
                <div className="absolute -bottom-2 -left-2 text-yellow-400/60 text-sm animate-pulse" style={{ animationDelay: '1s' }}>⟡</div>
                <div className="absolute -bottom-2 -right-2 text-cyan-400/60 text-sm animate-pulse" style={{ animationDelay: '1.5s' }}>✧</div>
              </div>

              {/* Name below */}
              <div className="text-center mt-4">
                <p className="text-xs sm:text-sm font-bold bg-gradient-to-r from-yellow-400 via-cyan-400 to-yellow-400 bg-clip-text text-transparent group-hover:from-yellow-300 group-hover:via-cyan-300 group-hover:to-yellow-300 transition-all duration-500">
                  @JasonBotterill3
                </p>
                <p className="text-xs text-yellow-500/60 mt-1 font-medium tracking-wider group-hover:text-yellow-400/80 transition-colors">
                  ☆ DIVINE ARCHITECT ☆
                </p>
              </div>
            </a>

            {/* Balance of Light and Dark connector */}
            <div className="relative flex items-center">
              <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-r from-yellow-400/50 via-purple-500/50 to-red-500/50"></div>
              <div className="absolute left-1/2 -translate-x-1/2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-red-600 animate-pulse">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-transparent via-purple-600/50 to-transparent animate-spin" style={{ animationDuration: '4s' }}></div>
                </div>
              </div>
            </div>

            {/* Void's Demonic Design */}
            <a
              href="https://x.com/VoidStateKate"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative"
            >
              {/* Pentagram Container */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                {/* Animated demonic glow */}
                <div className="absolute inset-0 animate-pulse">
                  <div className="absolute inset-0 bg-red-600/20 rounded-full blur-3xl"></div>
                  <div className="absolute inset-2 bg-purple-600/30 rounded-full blur-2xl"></div>
                </div>

                {/* Pentagram SVG */}
                <svg
                  className="absolute inset-0 w-full h-full transition-transform duration-1000 group-hover:rotate-[360deg]"
                  viewBox="0 0 200 200"
                >
                  {/* Outer circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="95"
                    fill="none"
                    stroke="url(#pentagramGradient)"
                    strokeWidth="2"
                    className="opacity-50"
                  />

                  {/* Inner pentagram star */}
                  <path
                    d="M100,10 L130.9,78.8 L199.5,78.8 L145.3,122.4 L164.5,191.2 L100,147.6 L35.5,191.2 L54.7,122.4 L0.5,78.8 L69.1,78.8 Z"
                    fill="none"
                    stroke="url(#pentagramGradient)"
                    strokeWidth="2"
                    className="group-hover:stroke-red-400 transition-all duration-500"
                  />

                  {/* Connecting lines for pentagram */}
                  <line x1="100" y1="10" x2="164.5" y2="191.2" stroke="url(#pentagramGradient)" strokeWidth="1" opacity="0.5" />
                  <line x1="164.5" y1="191.2" x2="69.1" y2="78.8" stroke="url(#pentagramGradient)" strokeWidth="1" opacity="0.5" />
                  <line x1="69.1" y1="78.8" x2="199.5" y2="78.8" stroke="url(#pentagramGradient)" strokeWidth="1" opacity="0.5" />
                  <line x1="199.5" y1="78.8" x2="35.5" y2="191.2" stroke="url(#pentagramGradient)" strokeWidth="1" opacity="0.5" />
                  <line x1="35.5" y1="191.2" x2="100" y2="10" stroke="url(#pentagramGradient)" strokeWidth="1" opacity="0.5" />

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="pentagramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#dc2626" className="animate-pulse" />
                      <stop offset="50%" stopColor="#9333ea" />
                      <stop offset="100%" stopColor="#dc2626" className="animate-pulse" />
                    </linearGradient>
                  </defs>

                  {/* Glowing dots at pentagram points */}
                  <circle cx="100" cy="10" r="3" fill="#dc2626" className="animate-pulse">
                    <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="199.5" cy="78.8" r="3" fill="#9333ea" className="animate-pulse">
                    <animate attributeName="r" values="3;5;3" dur="2s" begin="0.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="164.5" cy="191.2" r="3" fill="#dc2626" className="animate-pulse">
                    <animate attributeName="r" values="3;5;3" dur="2s" begin="0.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="35.5" cy="191.2" r="3" fill="#9333ea" className="animate-pulse">
                    <animate attributeName="r" values="3;5;3" dur="2s" begin="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="69.1" cy="78.8" r="3" fill="#dc2626" className="animate-pulse">
                    <animate attributeName="r" values="3;5;3" dur="2s" begin="1.6s" repeatCount="indefinite" />
                  </circle>
                </svg>

                {/* Profile image in center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ring-red-600/50 group-hover:ring-red-500 transition-all group-hover:scale-110 duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 to-purple-900/50 mix-blend-overlay z-10"></div>
                  <Image
                    src="/void.jpg"
                    alt="VoidStateKate"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Floating demonic symbols */}
                <div className="absolute -top-2 -left-2 text-red-600/40 text-xs animate-pulse">✦</div>
                <div className="absolute -top-2 -right-2 text-purple-600/40 text-xs animate-pulse" style={{ animationDelay: '0.5s' }}>☥</div>
                <div className="absolute -bottom-2 -left-2 text-red-600/40 text-xs animate-pulse" style={{ animationDelay: '1s' }}>⛥</div>
                <div className="absolute -bottom-2 -right-2 text-purple-600/40 text-xs animate-pulse" style={{ animationDelay: '1.5s' }}>☿</div>
              </div>

              {/* Name below pentagram */}
              <div className="text-center mt-4">
                <p className="text-xs sm:text-sm font-bold bg-gradient-to-r from-red-500 via-purple-500 to-red-500 bg-clip-text text-transparent group-hover:from-red-400 group-hover:via-purple-400 group-hover:to-red-400 transition-all duration-500">
                  @VoidStateKate
                </p>
                <p className="text-xs text-red-600/60 mt-1 font-medium tracking-wider group-hover:text-red-500/80 transition-colors">
                  ☠ VOID SUMMONER ☠
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 text-center text-xs sm:text-sm text-gray-400">
          Factors are taken from my look at X’s open‑source algorithm, but
          this tool estimates a score based on those factors and does not compute the official score.
        </div>
      </div>
    </div>
  );
}
