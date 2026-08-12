import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InstagramPost {
  id: string;
  instagram_url: string;
  image_url: string;
  caption: string | null;
  posted_at: string;
}

const InstagramSection = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("instagram_posts")
        .select("*")
        .order("posted_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching Instagram posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="section-container">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary mb-4">
              <Instagram className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Instagram</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Følg oss på Instagram
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-muted/30">
      <div className="section-container">
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Instagram className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Instagram</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Følg oss på Instagram
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Se de siste oppdateringene fra EMIL Invest
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
            >
              <img
                src={post.image_url}
                alt={post.caption || "Instagram post"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {post.caption && (
                    <p className="text-white text-sm line-clamp-2 mb-2">{post.caption}</p>
                  )}
                  <div className="flex items-center gap-1 text-white/80 text-xs">
                    <ExternalLink className="w-3 h-3" />
                    <span>Se på Instagram</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                  <Instagram className="w-4 h-4 text-primary" />
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <a
            href="https://instagram.com/emilinvest"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <Instagram className="w-5 h-5" />
            @emilinvest
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default InstagramSection;
