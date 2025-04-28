'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TestLinks() {
  const [year, setYear] = useState('2025');
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Testing Links</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Direct Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input 
                type="text" 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                className="border rounded px-3 py-2 w-24"
                placeholder="Year"
              />
              <Button 
                onClick={() => window.open(`/api/workhistory/summary/year/${year}`, '_blank')}
              >
                Open Year API
              </Button>
            </div>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/api/workhistory/summary/yearly', '_blank')}
              >
                Open Yearly Summary API
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/api/debug', '_blank')}
              >
                Open Debug API
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Page Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input 
                type="text" 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                className="border rounded px-3 py-2 w-24"
                placeholder="Year"
              />
              <Link href={`/workhistory/year/${year}`}>
                <Button>
                  Open Year View
                </Button>
              </Link>
            </div>
            
            <div className="space-y-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              
              <Link href="/debug">
                <Button variant="outline" size="sm">
                  Debug Page
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Clear browser cache</strong> - Try hard refreshing the page (Ctrl+F5)
              </li>
              <li>
                <strong>Check API responses</strong> - Use the API Direct Access links to see raw data
              </li>
              <li>
                <strong>Verify data structure</strong> - Check if the API is returning the expected format
              </li>
              <li>
                <strong>Console logs</strong> - Open browser developer tools to see console messages
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 