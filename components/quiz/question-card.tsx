import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

export function QuestionCard({
  body,
  imageUrl,
  eyebrow,
}: {
  body: string;
  imageUrl?: string | null;
  eyebrow?: string;
}) {
  return (
    <Card className="border-primary/20">
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <h2 className="text-balance text-xl font-bold leading-snug sm:text-2xl">{body}</h2>
        {imageUrl && (
          <div className="relative mt-2 aspect-video w-full max-w-md overflow-hidden rounded-lg border">
            <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
