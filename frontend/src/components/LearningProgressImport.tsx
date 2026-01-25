import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ImportResult {
  success: boolean;
  records_processed: number;
  records_updated: number;
  records_failed: number;
  errors: string[];
  updated_students: string[];
}

export function LearningProgressImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'ixl' | 'acellus'>('ixl');
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!csvContent) return;

    setIsUploading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/import/${selectedPlatform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csv_content: csvContent,
          platform: selectedPlatform,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        records_processed: 0,
        records_updated: 0,
        records_failed: 0,
        errors: ['Failed to connect to server. Please try again.'],
        updated_students: [],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = (platform: 'ixl' | 'acellus') => {
    window.open(`${API_URL}/api/import/template/${platform}`, '_blank');
  };

  const resetForm = () => {
    setCsvContent('');
    setFileName('');
    setResult(null);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-[#0A2463] hover:bg-[#163B9A]"
      >
        <Upload className="h-4 w-4 mr-2" />
        Import Progress Data
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#0A2463]" />
              Import Learning Progress Data
            </DialogTitle>
            <DialogDescription>
              Upload CSV exports from IXL or Acellus to update student progress in the CRM.
            </DialogDescription>
          </DialogHeader>

          {!result ? (
            <div className="space-y-4">
              <Tabs value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as 'ixl' | 'acellus')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ixl" className="data-[state=active]:bg-[#0A2463] data-[state=active]:text-white">
                    IXL (K-8)
                  </TabsTrigger>
                  <TabsTrigger value="acellus" className="data-[state=active]:bg-[#0A2463] data-[state=active]:text-white">
                    Acellus (9-12)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ixl" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">IXL Import Format</CardTitle>
                      <CardDescription>
                        Export student progress from IXL and upload the CSV file here.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Required columns:</strong></p>
                        <ul className="list-disc list-inside ml-2">
                          <li>First Name, Last Name (or Student Name)</li>
                          <li>Skills Mastered</li>
                          <li>Time Spent (hours)</li>
                          <li>Math Score (% or status)</li>
                          <li>ELA Score (% or status)</li>
                        </ul>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => handleDownloadTemplate('ixl')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="acellus" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Acellus Import Format</CardTitle>
                      <CardDescription>
                        Export student progress from Acellus and upload the CSV file here.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Required columns:</strong></p>
                        <ul className="list-disc list-inside ml-2">
                          <li>First Name, Last Name (or Student Name)</li>
                          <li>Course Name</li>
                          <li>Progress %</li>
                          <li>Grade %</li>
                          <li>Time Spent (hours)</li>
                        </ul>
                        <p className="mt-2 text-xs text-gray-500">
                          Note: Each row represents one course. Students with multiple courses will have multiple rows.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => handleDownloadTemplate('acellus')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {fileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-[#0A2463]" />
                    <div className="text-left">
                      <p className="font-medium">{fileName}</p>
                      <p className="text-sm text-gray-500">
                        {csvContent.split('\n').length - 1} rows detected
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      className="ml-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="space-y-2">
                      <Upload className="h-10 w-10 mx-auto text-gray-400" />
                      <p className="text-gray-600">
                        Click to select a CSV file or drag and drop
                      </p>
                      <p className="text-sm text-gray-400">
                        Supports .csv files exported from {selectedPlatform === 'ixl' ? 'IXL' : 'Acellus'}
                      </p>
                    </div>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!csvContent || isUploading}
                  className="bg-[#0A2463] hover:bg-[#163B9A]"
                >
                  {isUploading ? 'Importing...' : 'Import Data'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  )}
                  <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? 'Import Successful' : 'Import Completed with Errors'}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-[#0A2463]">{result.records_processed}</p>
                    <p className="text-sm text-gray-600">Records Processed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{result.records_updated}</p>
                    <p className="text-sm text-gray-600">Successfully Updated</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{result.records_failed}</p>
                    <p className="text-sm text-gray-600">Failed</p>
                  </CardContent>
                </Card>
              </div>

              {result.updated_students.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Updated Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.updated_students.map((name, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.errors.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-600">Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Import Another File
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="bg-[#0A2463] hover:bg-[#163B9A]"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
