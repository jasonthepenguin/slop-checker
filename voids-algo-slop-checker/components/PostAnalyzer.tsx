'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

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
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score < 30) return 'bg-green-100';
    if (score < 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Voids Algo Slop Checker
        </h1>
        <p className="text-gray-600 mb-8">
          Check if your X post will get deboosted by the algorithm
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="post" className="block text-sm font-medium text-gray-700 mb-2">
              Your Post
            </label>
            <textarea
              id="post"
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter your post here..."
              value={post}
              onChange={(e) => setPost(e.target.value)}
              maxLength={280}
            />
            <div className="text-sm text-gray-500 mt-1 text-right">
              {post.length}/280 characters
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          <button
            onClick={analyzePost}
            disabled={loading || !post.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Post'
            )}
          </button>
        </div>

        {result && (
          <div className="mt-8 space-y-6">
            <div className={`p-6 rounded-lg ${getScoreBackground(result.slopScore)}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Algo Slop Score</h2>
                <div className={`text-4xl font-bold ${getScoreColor(result.slopScore)}`}>
                  {result.slopScore}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    result.slopScore < 30
                      ? 'bg-green-500'
                      : result.slopScore < 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${result.slopScore}%` }}
                />
              </div>
              <p className="mt-4 text-gray-700">{result.summary}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Factors Detected</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.factors.allCaps && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span>All caps shouting</span>
                  </div>
                )}
                {result.factors.spam && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span>Spam or low quality</span>
                  </div>
                )}
                {result.factors.offensive && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span>Offensive content</span>
                  </div>
                )}
                {result.factors.hasLinks && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span>Contains links</span>
                  </div>
                )}
                {result.factors.nsfw && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span>NSFW content</span>
                  </div>
                )}
                {result.factors.promotional && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span>Overly promotional</span>
                  </div>
                )}
                {result.factors.informative && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Informative content</span>
                  </div>
                )}
              </div>
            </div>

            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}