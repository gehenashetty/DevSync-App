import React from "react";
import Card from "../../ui/Card";
import { User, Clock, FileText } from "lucide-react";

const PageList = ({ pages, loading, error, search }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-accent-blue animate-pulse">
        <FileText size={40} className="mb-2" />
        <span className="text-base font-medium">Loading pages...</span>
      </div>
    );
  }
  if (error) {
    return <div className="bg-red-500/10 text-red-400 rounded-lg p-4 text-center mt-4">{error}</div>;
  }
  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(search.toLowerCase())
  );
  if (filteredPages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-text-secondary">
        <FileText size={48} className="mb-2" />
        <div className="text-lg font-semibold">No pages found</div>
        <div className="text-sm">Try a different search or select another space.</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
      {filteredPages.map(page => (
        <a
          key={page.id}
          href={`https://gehenah1101.atlassian.net/wiki${page._links?.webui}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <Card className="flex flex-col gap-2 cursor-pointer group hover:shadow-xl transition-all duration-200 bg-background border border-white/10 p-5 rounded-2xl min-h-[140px]">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={20} className="text-text-secondary" />
              <span className="font-semibold text-text-primary truncate max-w-[180px] group-hover:underline text-base" title={page.title}>{page.title}</span>
            </div>
            <div className="text-xs text-text-secondary mb-1 truncate max-w-full" title={page.body?.storage?.value?.replace(/<[^>]+>/g, '').slice(0, 120)}>
              {page.body?.storage?.value?.replace(/<[^>]+>/g, '').slice(0, 120) || 'No preview'}
            </div>
            <div className="flex gap-4 text-xs text-text-secondary mt-auto">
              <span><User size={12} className="inline mr-1" />{page.version?.by?.displayName || 'Unknown'}</span>
              <span><Clock size={12} className="inline mr-1" />{page.version?.when ? new Date(page.version.when).toLocaleDateString() : 'N/A'}</span>
            </div>
          </Card>
        </a>
      ))}
    </div>
  );
};

export default PageList; 