'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Add this import
import { useSession, type SessionData } from '@/hooks/useSession';
import { createPost, type CreatePostPayload } from '@/lib/actions/posts/create';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import {
  Upload,
  Loader2,
  X,
  Video,
  FileText,
  Save,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

interface FilePreview {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video' | 'other';
  progress: number;
  uploaded: boolean;
  error?: string;
}

export default function CreatePostPage() {
  const { session, loading: sessionLoading, isAuthenticated, user } = useSession();
  const router = useRouter(); // Add this
  const [formData, setFormData] = useState<CreatePostPayload>({
    title: '',
    content: '',
    author_id: '',
  });
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual auth check + redirect (since no middleware)
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push('/login'); // Or window.location.href if preferred
    }
  }, [sessionLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && formData.author_id === '') {
      setFormData(prev => ({ ...prev, author_id: user.uid }));
    }
  }, [user, formData.author_id]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FilePreview[] = selectedFiles.map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : 'other',
      progress: 0,
      uploaded: false,
    }));
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  }, []);

  const removeFile = useCallback(
    (fileId: string) => {
      const fileToRemove = files.find(f => f.id === fileId);
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      setFiles(prev => prev.filter(f => f.id !== fileId));
    },
    [files]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setSubmitStatus({ type: 'error', message: 'Title is required' });
      return;
    }

    if (!formData.content.trim()) {
      setSubmitStatus({ type: 'error', message: 'Content is required' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const fileObjects = files.filter(f => !f.uploaded && !f.error).map(f => f.file);

      const result = await createPost({
        ...formData,
        files: fileObjects.length > 0 ? fileObjects : undefined,
      });

      if (result.success) {
        setSubmitStatus({ type: 'success', message: 'Post created successfully!' });

        setFormData({
          title: '',
          content: '',
          author_id: user?.uid || '',
        });
        setFiles([]);

        setTimeout(() => {
          window.location.href = '/posts';
        }, 2000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.errors?.[0] || 'Failed to create post',
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mb-4 -ml-1 h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Create New Post</h1>
          <p className="text-muted-foreground mt-2">Share your thoughts with the community</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0 pt-6">
            <form onSubmit={handleSubmit}>
              {/* User Info */}
              <Card className="mx-6 -mt-6 border-0 bg-muted/50">
                <CardContent className="p-6 pb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{user?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user?.regno}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Title */}
              <div className="p-6 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="h-12 text-lg"
                    placeholder="What's this post about?"
                    maxLength={200}
                    disabled={isSubmitting}
                    required
                  />
                  <p className="text-xs text-muted-foreground">{formData.title.length}/200 characters</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-foreground">
                    Content <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[120px] text-base"
                    placeholder="Share your thoughts, experiences, or questions..."
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="p-6 pb-4">
                <Label className="text-foreground font-medium mb-4 block">Add Media</Label>

                <div className="group">
                  <label
                    htmlFor="file-upload"
                    className={`
                    flex flex-col items-center justify-center 
                    p-8 border-2 border-dashed border-input rounded-lg 
                    text-muted-foreground hover:border-ring 
                    hover:bg-accent hover:text-accent-foreground 
                    hover:cursor-pointer transition-all duration-200
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  >
                    <input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <Upload className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {files.length === 0
                          ? 'Click to upload images or videos'
                          : `Add more files (${files.length} selected)`}
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, MP4 up to 20MB each</p>
                    </div>
                  </label>
                </div>

                {/* File Previews */}
                {files.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-foreground mb-3">Selected Files ({files.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {files.map(filePreview => (
                        <div key={filePreview.id} className="group relative">
                          <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted">
                            {filePreview.type === 'image' && (
                              <img
                                src={filePreview.url}
                                alt={filePreview.file.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                            {filePreview.type === 'video' && (
                              <div className="w-full h-full flex items-center justify-center bg-muted-foreground/20">
                                <Video className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            {filePreview.type === 'other' && (
                              <div className="w-full h-full flex items-center justify-center bg-muted-foreground/20">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}

                            {filePreview.progress > 0 && !filePreview.uploaded && (
                              <div className="absolute bottom-0 left-0 right-0 bg-foreground/20">
                                <div
                                  className="h-1 bg-primary transition-all"
                                  style={{ width: `${filePreview.progress}%` }}
                                />
                              </div>
                            )}

                            {filePreview.uploaded && (
                              <Badge variant="default" className="absolute top-2 right-2 bg-green-500 text-white">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready
                              </Badge>
                            )}
                            {filePreview.error && (
                              <Badge variant="destructive" className="absolute top-2 right-2">
                                Error
                              </Badge>
                            )}
                          </div>

                          <div className="mt-2 text-xs">
                            <p className="font-medium text-foreground truncate" title={filePreview.file.name}>
                              {filePreview.file.name}
                            </p>
                            <p className="text-muted-foreground">{(filePreview.file.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>

                          {!isSubmitting && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(filePreview.id)}
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-background rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-4 border-t border-border">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                    className="flex-1 gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Create Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Submit Status */}
        {submitStatus && (
          <div className="mt-6">
            <Alert
              className={
                submitStatus.type === 'success' ? 'border-green-200 bg-green-50' : 'border-destructive/20 bg-destructive/5'
              }
            >
              <div className="flex items-center gap-2">
                {submitStatus.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <AlertTitle className={`text-${submitStatus.type === 'success' ? 'green-800' : 'destructive'}`}>
                  {submitStatus.type === 'success' ? 'Success!' : 'Error'}
                </AlertTitle>
                <AlertDescription className={`text-${submitStatus.type === 'success' ? 'green-700' : 'destructive'}`}>
                  {submitStatus.message}
                </AlertDescription>
              </div>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}