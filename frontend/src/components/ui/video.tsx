import "video-react/dist/video-react.css";

interface VideoProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  aspectRatio?: string | "auto" | "16:9" | "4:3";
}

export default function Video({
  className,
  src,
  poster,
  autoPlay = false,
  muted = false,
  controls = true,
  aspectRatio = "auto",
}: VideoProps) {
  const resolvedAspectRatio = aspectRatio === "auto" ? undefined : aspectRatio.replace(":", " / ");

  return (
    <div className={className} custom-component="video">
      <video
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
        playsInline
        className="w-full overflow-hidden rounded-2xl bg-black"
        style={{ aspectRatio: resolvedAspectRatio }}
      />
    </div>
  );
}
