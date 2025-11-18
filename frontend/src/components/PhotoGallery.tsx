import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ role, studentGrade }) => {
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        {role === 'teacher' && (
          <Badge className="bg-green-100 text-green-800">
            <Camera className="w-4 h-4 mr-1" />
            Upload photos in admin panel
          </Badge>
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
                    {album.photo_urls.slice(0, 4).map((url, index) => (
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="max-w-3xl">
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-24 h-24 text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
