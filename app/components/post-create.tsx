// app/components/post-create.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Upload, X, Loader2 } from "lucide-react";
import { createPost } from "@/lib/actions/create-post";

// Form schema
const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().min(1, { message: "Content is required" }),
  everyone: z.boolean(),
  allClubs: z.boolean(),
  allClasses: z.boolean(),
  selectedClubs: z.array(z.string()),
  selectedClasses: z.array(z.string()),
  selectedPrivacyLists: z.array(z.string()),
  exception: z.array(z.string()),
});

interface PrivacyOption { 
  uid: string; 
  name: string; 
}

interface PrivacyOptions {
  classes: PrivacyOption[];
  clubs: PrivacyOption[];
  privacy_lists: PrivacyOption[];
  students: PrivacyOption[];
}

interface FilePreview {
  file: File;
  preview: string;
  id: number;
  uploading?: boolean;
  progress?: number;
}

let fileIdCounter = 1;

export default function PostCreate({ user }: { user: { uid: string } | null }) {
  const [isPending, startTransition] = useTransition();
  const [privacyOptions, setPrivacyOptions] = useState<PrivacyOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filesPreviews, setFilesPreviews] = useState<FilePreview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      everyone: true,
      allClubs: false,
      allClasses: false,
      selectedClubs: [],
      selectedClasses: [],
      selectedPrivacyLists: [],
      exception: [],
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch privacy options and users
  useEffect(() => {
    if (!user?.uid || !mounted) return;
    
    const fetchData = async () => {
      try {
        const [classesRes, clubsRes, studentsRes] = await Promise.all([
          fetch(`/api/db/classes`),
          fetch(`/api/db/clubs`),
          fetch(`/api/db/students`),
        ]);

        if (!classesRes.ok || !clubsRes.ok || !studentsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [classesData, clubsData, studentsData] = await Promise.all([
          classesRes.json(),
          clubsRes.json(),
          studentsRes.json(),
        ]);

        const transformedData = {
          classes: Array.isArray(classesData) ? classesData.map((item: any) => ({ 
            uid: item.uid || item.id, 
            name: item.name || item.title || 'Unnamed Class'
          })) : [],
          clubs: Array.isArray(clubsData) ? clubsData.map((item: any) => ({ 
            uid: item.uid || item.id, 
            name: item.name || item.title || 'Unnamed Club'
          })) : [],
          privacy_lists: [],
          students: Array.isArray(studentsData) ? studentsData.map((item: any) => ({ 
            uid: item.uid || item.id, 
            name: item.name || item.full_name || item.email || 'Unnamed User'
          })) : [],
        };

        setPrivacyOptions(transformedData);
      } catch (err) {
        console.error("Failed to fetch privacy options", err);
        setError("Failed to load privacy options");
      }
    };

    fetchData();
  }, [user?.uid, mounted]);

  // Reset privacy settings when everyone is enabled
  const everyone = form.watch("everyone");
  useEffect(() => {
    if (everyone) {
      form.setValue("allClubs", false);
      form.setValue("allClasses", false);
      form.setValue("selectedClubs", []);
      form.setValue("selectedClasses", []);
      form.setValue("selectedPrivacyLists", []);
      form.setValue("exception", []);
    }
  }, [everyone, form]);

  // Handle main club toggle
  const allClubs = form.watch("allClubs");
  useEffect(() => {
    if (allClubs && privacyOptions?.clubs) {
      form.setValue("selectedClubs", privacyOptions.clubs.map(club => club.uid));
    } else if (!allClubs) {
      form.setValue("selectedClubs", []);
    }
  }, [allClubs, privacyOptions?.clubs, form]);

  // Handle main class toggle
  const allClasses = form.watch("allClasses");
  useEffect(() => {
    if (allClasses && privacyOptions?.classes) {
      form.setValue("selectedClasses", privacyOptions.classes.map(cls => cls.uid));
    } else if (!allClasses) {
      form.setValue("selectedClasses", []);
    }
  }, [allClasses, privacyOptions?.classes, form]);

  const getFileExtension = (filename: string) => {
    return filename.slice(filename.lastIndexOf('.')).toLowerCase();
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        setError("Each file must be under 10MB");
        return false;
      }
      if (!file.type.startsWith('image/')) {
        setError("Only image files are allowed");
        return false;
      }
      return true;
    });

    const newPreviews: FilePreview[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: fileIdCounter++,
      uploading: false,
      progress: 0,
    }));

    setFilesPreviews((prev) => [...prev, ...newPreviews]);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (id: number) => {
    setFilesPreviews((prev) => {
      const updated = prev.filter((fp) => fp.id !== id);
      const removed = prev.find((fp) => fp.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const uploadFilesToStorage = async (postUid: string, files: FilePreview[]) => {
    const uploadedFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const filePreview = files[i];
      const fileExtension = getFileExtension(filePreview.file.name);
      const fileName = `${i + 1}${fileExtension}`;
      
      // Update preview to show uploading
      setFilesPreviews(prev => 
        prev.map(fp => 
          fp.id === filePreview.id 
            ? { ...fp, uploading: true, progress: 0 }
            : fp
        )
      );

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', filePreview.file);
        formData.append('fileName', fileName);
        formData.append('postUid', postUid);

        // Upload to storage via API
        const uploadRes = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed for ${fileName}`);
        }

        const uploadResult = await uploadRes.json();
        
        uploadedFiles.push({
          file_name: fileName,
          file_url: uploadResult.publicUrl,
          contentType: filePreview.file.type,
        });

        // Update progress
        setFilesPreviews(prev => 
          prev.map(fp => 
            fp.id === filePreview.id 
              ? { ...fp, uploading: false, progress: 100 }
              : fp
          )
        );

        // Update overall progress
        setUploadProgress((i + 1) / files.length * 100);
      } catch (error) {
        console.error(`Failed to upload ${fileName}:`, error);
        setFilesPreviews(prev => 
          prev.map(fp => 
            fp.id === filePreview.id 
              ? { ...fp, uploading: false, progress: 0 }
              : fp
          )
        );
        throw error;
      }
    }

    return uploadedFiles;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.uid) {
      setError("Not authenticated");
      return;
    }

    startTransition(async () => {
      setError(null);
      setUploadProgress(0);

      try {
        // First create the post to get the UID
        const postPayload = {
          author_uid: user.uid,
          title: values.title,
          target_id: null as string | null,
          description: values.content,
          type: "post" as const,
          everyone: values.everyone,
          clubs: values.selectedClubs,
          classes: values.selectedClasses,
          privacy_lists: values.selectedPrivacyLists,
          exception: values.exception,
        };

        console.log('Creating post with payload:', postPayload);
        const result = await createPost(postPayload);
        
        if (result.error) {
          setError(result.error);
          return;
        }

        const postUid = result.data.uid;
        console.log('Post created with UID:', postUid);

        // Upload files if any
        if (filesPreviews.length > 0) {
          try {
            const uploadedFiles = await uploadFilesToStorage(postUid, filesPreviews);
            
            // Add files to post_files table
            if (uploadedFiles.length > 0) {
              const fileRows = uploadedFiles.map(file => ({
                post_id: postUid,
                ...file
              }));

              const filesRes = await fetch('/api/db/post_files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fileRows),
              });

              if (!filesRes.ok) {
                throw new Error('Failed to save file records');
              }
            }
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
            setError('Post created but file upload failed');
            return;
          }
        }

        // Success - cleanup
        filesPreviews.forEach(fp => URL.revokeObjectURL(fp.preview));
        form.reset();
        setFilesPreviews([]);
        setSearchQuery("");
        setError(null);
        setUploadProgress(0);
        console.log('Post created successfully with files');

      } catch (err) {
        console.error('Submit error:', err);
        setError("Failed to create post");
        setUploadProgress(0);
      }
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-6 bg-background rounded-lg shadow-md border border-border max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter post title..."
                    className="text-foreground bg-background border-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What's on your mind?"
                    className="resize-none border border-input rounded-md p-3 text-foreground bg-background focus:ring-primary min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormLabel className="text-foreground">Images</FormLabel>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary hover:bg-accent/50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop images here, or click to select files
              </p>
              <p className="text-xs text-muted-foreground">
                Support for multiple images, up to 10MB each
              </p>
            </div>

            {/* Upload Progress */}
            {isPending && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading files...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Image Previews */}
            {filesPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filesPreviews.map((filePreview) => (
                  <Card key={filePreview.id} className="relative group">
                    <CardContent className="p-2">
                      <div className="relative">
                        <img
                          src={filePreview.preview}
                          alt={filePreview.file.name}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        
                        {/* Upload overlay */}
                        {filePreview.uploading && (
                          <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          </div>
                        )}

                        {/* Remove button */}
                        {!filePreview.uploading && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFile(filePreview.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        {filePreview.file.name}
                      </p>
                      {filePreview.progress === 100 && (
                        <p className="text-xs text-green-600">✓ Uploaded</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="everyone"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormLabel className="text-foreground">Visible to Everyone</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!everyone && (
            <div className="space-y-6 border-t pt-4">
              <h3 className="text-lg font-medium text-foreground">Privacy Settings</h3>

              {privacyOptions?.clubs && privacyOptions.clubs.length > 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="allClubs"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </FormControl>
                        <FormLabel className="text-foreground font-medium">All Clubs</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!allClubs && (
                    <div className="ml-6 space-y-2">
                      <FormLabel className="text-sm text-muted-foreground">Select individual clubs:</FormLabel>
                      <div className="grid grid-cols-1 gap-2">
                        {privacyOptions.clubs.map((club) => (
                          <FormField
                            key={club.uid}
                            control={form.control}
                            name="selectedClubs"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={(field.value || []).includes(club.uid)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      const updated = checked
                                        ? [...current, club.uid]
                                        : current.filter((id) => id !== club.uid);
                                      field.onChange(updated);
                                    }}
                                    className="data-[state=checked]:bg-primary"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm text-foreground">{club.name}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {privacyOptions?.classes && privacyOptions.classes.length > 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="allClasses"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </FormControl>
                        <FormLabel className="text-foreground font-medium">All Classes</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!allClasses && (
                    <div className="ml-6 space-y-2">
                      <FormLabel className="text-sm text-muted-foreground">Select individual classes:</FormLabel>
                      <div className="grid grid-cols-1 gap-2">
                        {privacyOptions.classes.map((cls) => (
                          <FormField
                            key={cls.uid}
                            control={form.control}
                            name="selectedClasses"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={(field.value || []).includes(cls.uid)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      const updated = checked
                                        ? [...current, cls.uid]
                                        : current.filter((id) => id !== cls.uid);
                                      field.onChange(updated);
                                    }}
                                    className="data-[state=checked]:bg-primary"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm text-foreground">{cls.name}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="exception"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Exclude Users</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between text-foreground bg-background border-input hover:bg-accent"
                          >
                            {(field.value || []).length > 0
                              ? `${(field.value || []).length} user${(field.value || []).length > 1 ? "s" : ""} excluded`
                              : "Search users to exclude"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-background border border-input">
                        <Command>
                          <CommandInput
                            placeholder="Search users (min 3 characters)"
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandEmpty>No users found.</CommandEmpty>
                          <CommandGroup>
                            {privacyOptions?.students
                              ?.filter((u) => searchQuery.length >= 3 && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((u) => (
                                <CommandItem
                                  key={u.uid}
                                  onSelect={() => {
                                    const current = field.value || [];
                                    const updated = current.includes(u.uid)
                                      ? current.filter((id) => id !== u.uid)
                                      : [...current, u.uid];
                                    field.onChange(updated);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      (field.value || []).includes(u.uid) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {u.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {(field.value || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(field.value || []).map((uid) => {
                          const u = privacyOptions?.students.find((x) => x.uid === uid);
                          return (
                            <Button
                              key={uid}
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                const updated = (field.value || []).filter((id) => id !== uid);
                                field.onChange(updated);
                              }}
                            >
                              {u?.name ?? "Unknown"} ✕
                            </Button>
                          );
                        })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadProgress > 0 ? `Uploading... ${Math.round(uploadProgress)}%` : "Creating Post..."}
              </>
            ) : (
              "Post"
            )}
          </Button>
          {error && <p className="text-destructive text-center mt-2">{error}</p>}
        </form>
      </Form>
    </div>
  );
}
