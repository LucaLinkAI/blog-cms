import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Post } from "@/lib/data/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { title, slug, excerpt, coverImageUrl, author, category, publishedAt, readingTime } = post;

  const publishedDate = publishedAt
    ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(
        new Date(publishedAt)
      )
    : null;

  const authorInitials = author
    ? author.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <Card className="flex flex-col overflow-hidden h-full">
      {coverImageUrl && (
        <Link href={`/blog/${slug}`} tabIndex={-1} aria-hidden="true">
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={coverImageUrl}
              alt={`Cover image for ${title}`}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </Link>
      )}

      <CardContent className="flex flex-col flex-1 p-5">
        {category && (
          <Badge
            className="mb-2 self-start text-xs"
            style={{ backgroundColor: category.color ?? undefined }}
          >
            {category.name}
          </Badge>
        )}

        <Link href={`/blog/${slug}`} className="group">
          <h2 className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h2>
        </Link>

        {excerpt && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
        )}
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={author?.avatarUrl ?? undefined} alt={`${author?.displayName ?? "Author"}'s avatar`} />
            <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
          </Avatar>
          {author ? (
            <Link
              href={`/author/${author.slug}`}
              className="text-sm font-medium hover:underline"
            >
              {author.displayName}
            </Link>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {publishedDate && <span>{publishedDate}</span>}
          {readingTime && (
            <>
              <span aria-hidden="true">·</span>
              <span>{readingTime} min read</span>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
