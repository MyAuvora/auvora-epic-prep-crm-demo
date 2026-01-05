import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Calendar, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface PhotoAlbum {
  album_id: string;
  title: string;
  description: string;
  created_by_staff_id: string;
  created_date: string;
  status: string;
  photo_urls: string[];
  visible_to_grades: string[];
}

interface PhotoGalleryProps {
  role: 'admin' | 'teacher' | 'parent';
  studentGrade?: string;
  userId?: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ role, studentGrade, userId }) => {
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newAlbum, setNewAlbum] = useState({
    title: '',
    description: '',
    visible_to_grades: ['All'],
    photo_count: 5
  });

  useEffect(() => {
    fetchAlbums();
  }, [studentGrade]);

  const fetchAlbums = async () => {
    try {
      const url = studentGrade 
        ? `${API_URL}/api/photo-albums?grade=${studentGrade}`
        : `${API_URL}/api/photo-albums`;
      const response = await fetch(url);
      const data = await response.json();
      setAlbums(data.sort((a: PhotoAlbum, b: PhotoAlbum) => 
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      ));
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!userId) return;
    
    try {
      const photoUrls = Array.from({ length: newAlbum.photo_count }, (_, i) => `photo_${Date.now()}_${i}.jpg`);
      
      await fetch(`${API_URL}/api/photo-albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          album_id: `album_${Date.now()}`,
          created_by_staff_id: userId,
          created_date: new Date().toISOString().split('T')[0],
          status: 'Published',
          photo_urls: photoUrls,
          ...newAlbum
        })
      });
      
      setShowUploadModal(false);
      setNewAlbum({
        title: '',
        description: '',
        visible_to_grades: ['All'],
        photo_count: 5
      });
      fetchAlbums();
    } catch (error) {
      console.error('Error creating album:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getGradeBadgeColor = (grades: string[]) => {
    if (grades.includes('All')) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return <div className="text-center py-8">Loading photo gallery...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Photo Gallery</h2>
        {(role === 'admin' || role === 'teacher') && (
          <Button onClick={() => setShowUploadModal(true)} className="bg-red-600 hover:bg-red-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
        )}
      </div>

      {albums.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No photo albums available</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Card 
              key={album.album_id} 
              className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              onClick={() => setSelectedAlbum(album)}
            >
              <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                {album.photo_urls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1 w-full h-full p-2">
                    {album.photo_urls.slice(0, 4).map((_, index) => (
                      <div key={index} className="bg-gray-200 rounded flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Camera className="w-16 h-16 text-gray-300" />
                )}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-white text-gray-800">
                    {album.photo_urls.length} photos
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{album.title}</CardTitle>
                  <Badge className={getGradeBadgeColor(album.visible_to_grades)}>
                    {album.visible_to_grades.includes('All') ? 'All Grades' : album.visible_to_grades.join(', ')}
                  </Badge>
                </div>
                <CardDescription>{album.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(album.created_date)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedAlbum} onOpenChange={() => setSelectedAlbum(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto p-4">
          {selectedAlbum && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start mb-2">
                  <DialogTitle className="text-2xl">{selectedAlbum.title}</DialogTitle>
                  <Badge className={getGradeBadgeColor(selectedAlbum.visible_to_grades)}>
                    {selectedAlbum.visible_to_grades.includes('All') ? 'All Grades' : selectedAlbum.visible_to_grades.join(', ')}
                  </Badge>
                </div>
                <p className="text-gray-600">{selectedAlbum.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedAlbum.created_date)}</span>
                  <span className="mx-2">•</span>
                  <span>{selectedAlbum.photo_urls.length} photos</span>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {selectedAlbum.photo_urls.map((url, index) => (
                  <div 
                    key={index}
                    className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => setSelectedPhoto(url)}
                  >
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                    <span className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Photo {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] overflow-y-auto p-4">
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-24 h-24 text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Photos Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Photo Album</DialogTitle>
            <DialogDescription>
              Upload photos to share with parents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Album Title</Label>
              <Input
                id="title"
                value={newAlbum.title}
                onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                placeholder="Field Trip to Science Museum"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newAlbum.description}
                onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                placeholder="Photos from our field trip..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="photo_count">Number of Photos</Label>
              <Input
                id="photo_count"
                type="number"
                min="1"
                max="50"
                value={newAlbum.photo_count}
                onChange={(e) => setNewAlbum({ ...newAlbum, photo_count: parseInt(e.target.value) || 5 })}
              />
              <p className="text-xs text-gray-500 mt-1">Demo: Simulates uploading this many photos</p>
            </div>

            <div>
              <Label>Visible to Grades</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={newAlbum.visible_to_grades.includes('All') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewAlbum({ ...newAlbum, visible_to_grades: ['All'] })}
                >
                  All Grades
                </Button>
                <Button
                  type="button"
                  variant={!newAlbum.visible_to_grades.includes('All') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewAlbum({ ...newAlbum, visible_to_grades: ['K', '1', '2'] })}
                >
                  Specific Grades
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAlbum}
              className="bg-red-600 hover:bg-red-700"
              disabled={!newAlbum.title || !newAlbum.description}
            >
              Create Album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
