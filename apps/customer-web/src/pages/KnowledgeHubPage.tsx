import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Clock, User, Tag, BookOpen } from 'lucide-react';
import { KnowledgeArticle } from '@buildora/types';
import { api } from '../services/api';

export const KnowledgeHubPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getArticles()
      .then((list) => {
        if (active) setArticles(list || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  // If viewing specific article
  const article = slug ? articles.find((a) => a.slug === slug) : null;

  if (slug && loading && !article) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-xs text-slate-500">Loading guide...</div>;
  }

  if (article) {
    const related = articles.filter((a) => a.id !== article.id);

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-brand-blue-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/knowledge-hub" className="hover:text-brand-blue-900">Knowledge Hub</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800 truncate">{article.title}</span>
        </nav>

        {/* Article Header */}
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange-600 bg-brand-orange-50 px-3 py-1 rounded-full border border-brand-orange-200">
            {article.category}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <User className="w-3.5 h-3.5" /> {article.author}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {article.readTimeMinutes} min read
            </span>
            <span>&bull;</span>
            <span>{article.publishedAt}</span>
          </div>
        </div>

        {/* Featured Image */}
        <div className="aspect-video rounded-3xl overflow-hidden bg-slate-100 shadow-md">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-card">
          <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {article.content}
          </div>

          {/* Tags */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Tags:
            </span>
            {article.tags.map((t: string, idx: number) => (
              <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold text-slate-900">More Construction Guides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/knowledge-hub/${rel.slug}`}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-brand-blue-300 shadow-card flex gap-4 transition-colors"
                >
                  <img src={rel.image} alt={rel.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-bold text-brand-orange-600 uppercase">{rel.category}</span>
                    <h4 className="text-xs font-bold text-slate-900 hover:text-brand-blue-800 line-clamp-2">
                      {rel.title}
                    </h4>
                    <span className="text-[11px] text-slate-400">{rel.readTimeMinutes} min read</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Articles Directory
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-brand-blue-100 text-brand-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-brand-orange-500" /> Technical Education
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          Knowledge Hub &amp; Construction Guides
        </h1>
        <p className="text-xs text-slate-500">
          Standards, material comparison reports, and structural best practices authored by certified civil and electrical engineers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((art) => (
          <Link
            key={art.id}
            to={`/knowledge-hub/${art.slug}`}
            className="group flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-card hover:shadow-card-hover transition-all overflow-hidden"
          >
            <div className="aspect-video bg-slate-100 overflow-hidden">
              <img
                src={art.image}
                alt={art.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange-600">
                  {art.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-blue-800 mt-1 line-clamp-2">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {art.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{art.readTimeMinutes} min read</span>
                <span className="font-semibold text-brand-blue-800 group-hover:underline">Read Guide &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
