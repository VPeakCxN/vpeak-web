// lib/actions/create-post.ts
export type CreatePostPayload = {
  author_uid: string;
  title: string;
  target_id: string | null;
  description: string;
  type: "post";
  everyone: boolean;
  clubs: string[];
  classes: string[];
  privacy_lists: string[];
  exception: string[];
};

export async function createPost(payload: CreatePostPayload) {
  try {
    console.log("Creating post with payload:", payload);

    const res = await fetch("/api/db/posts", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    console.log("Response status:", res.status);
    
    if (!res.ok) {
      let errorMessage;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || `HTTP ${res.status}`;
        console.error("API Error:", errorData);
      } catch (parseErr) {
        const errorText = await res.text();
        errorMessage = `HTTP ${res.status}: ${errorText}`;
        console.error("Failed to parse error response:", errorText);
      }
      return { error: errorMessage };
    }
    
    const data = await res.json();
    console.log("Post created successfully:", data);
    return { data };
  } catch (error) {
    console.error("Network/fetch error:", error);
    return { error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
