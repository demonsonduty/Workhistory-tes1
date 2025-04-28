import { DatabaseViewer } from '@/components/DatabaseViewer';

export default function DatabasePage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Database Viewer</h1>
      <p className="text-gray-600 mb-6">
        View and explore the data in your database tables.
      </p>
      
      <DatabaseViewer />
    </div>
  );
} 