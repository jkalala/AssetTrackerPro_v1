'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/external/docs')
      .then(res => res.json())
      .then(setSpec);
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">API Documentation</h1>
      {spec ? (
        <SwaggerUI spec={spec} />
      ) : (
        <p>Loading API documentation...</p>
      )}
    </div>
  );
} 