'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface AnalysisResult {
  slopScore: number;
  factors: {
    allCaps: boolean;
    spam: boolean;
    offensive: boolean;
    hasLinks: boolean;
    nsfw: boolean;
    promotional: boolean;
    informative: boolean;
  };
  summary: string;
  recommendations: string[];
}

export default function PostAnalyzer() {
  const [post, setPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const analyzePost = async () => {
    if (!post.trim()) {
      setError('Please enter a post to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data);
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
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '35%', left: '65%', animationDelay: '2.8s', opacity: 0.6 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '65%', left: '15%', animationDelay: '3.3s', opacity: 0.9 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '8%', left: '35%', animationDelay: '3.8s', opacity: 0.7 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '75%', left: '95%', animationDelay: '4.3s', opacity: 0.5 }} />
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '50%', left: '55%', animationDelay: '4.8s', opacity: 0.8 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '12%', left: '70%', animationDelay: '0.2s', opacity: 0.4 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '88%', left: '30%', animationDelay: '0.7s', opacity: 0.5 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '22%', left: '92%', animationDelay: '1.2s', opacity: 0.6 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '68%', left: '8%', animationDelay: '1.7s', opacity: 0.4 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '42%', left: '48%', animationDelay: '2.2s', opacity: 0.5 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '78%', left: '62%', animationDelay: '2.7s', opacity: 0.6 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '18%', left: '22%', animationDelay: '3.2s', opacity: 0.4 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '92%', left: '78%', animationDelay: '3.7s', opacity: 0.5 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '38%', left: '88%', animationDelay: '4.2s', opacity: 0.6 }} />
        <div className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ top: '58%', left: '38%', animationDelay: '4.7s', opacity: 0.4 }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto p-6 pt-12">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
                <span className="text-5xl">🌀</span>
                Voids Algo Slop Checker
              </h1>
              <p className="text-gray-400 mt-2">
                Check if your post will get deboosted by the algorithm
              </p>
            </div>
            <svg className="w-12 h-12 text-white/90" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="post" className="block text-sm font-medium text-purple-300 mb-2">
                Your Post
              </label>
              <textarea
                id="post"
                rows={6}
                className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-100 placeholder-gray-500"
                placeholder="Enter your post here..."
                value={post}
                onChange={(e) => setPost(e.target.value)}
                maxLength={280}
              />
              <div className="text-sm text-purple-400 mt-1 text-right">
                {post.length}/280 characters
              </div>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            <button
              onClick={analyzePost}
              disabled={loading || !post.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Analyze Post
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="mt-8 space-y-6">
              <div className={`p-6 rounded-lg border ${getScoreBackground(result.slopScore)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-100">Algo Slop Score</h2>
                  <div className={`text-5xl font-bold ${getScoreColor(result.slopScore)}`}>
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
                <p className="mt-4 text-gray-300">{result.summary}</p>
              </div>

              <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-purple-300">Factors Detected</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.factors.allCaps && (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="h-5 w-5" />
                      <span>All caps shouting</span>
                    </div>
                  )}
                  {result.factors.spam && (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="h-5 w-5" />
                      <span>Spam or low quality</span>
                    </div>
                  )}
                  {result.factors.offensive && (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="h-5 w-5" />
                      <span>Offensive content</span>
                    </div>
                  )}
                  {result.factors.hasLinks && (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="h-5 w-5" />
                      <span>Contains links</span>
                    </div>
                  )}
                  {result.factors.nsfw && (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="h-5 w-5" />
                      <span>NSFW content</span>
                    </div>
                  )}
                  {result.factors.promotional && (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="h-5 w-5" />
                      <span>Overly promotional</span>
                    </div>
                  )}
                  {result.factors.informative && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span>Informative content</span>
                    </div>
                  )}
                </div>
              </div>

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-300">
                    <TrendingUp className="h-5 w-5" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span className="text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Credits */}
        <div className="mt-8 text-center">
          <p className="text-purple-400 mb-4">Created by</p>
          <div className="flex justify-center items-center gap-8">
            <a
              href="https://x.com/JasonBotterill3"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-purple-500/50 group-hover:ring-purple-400 transition-all">
                <Image
                  src="/jb.jpg"
                  alt="Jason Botterill"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-gray-400 group-hover:text-purple-400 transition-colors">@JasonBotterill3</span>
            </a>
            <a
              href="https://x.com/VoidStateKate"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-purple-500/50 group-hover:ring-purple-400 transition-all">
                <Image
                  src="/void.jpg"
                  alt="VoidStateKate"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-gray-400 group-hover:text-purple-400 transition-colors">@VoidStateKate</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}