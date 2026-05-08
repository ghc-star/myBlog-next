import Image from "next/image";
import avatarUrl from "../../assets/images/1.png";

function AuthorCard() {
  return (
    <div className="flex items-center gap-4 sm:flex-col sm:items-start">
      <Image
        src={avatarUrl}
        alt="作者头像"
        className="h-16 w-16 rounded-full object-cover ring-2 ring-white/40 sm:h-32 sm:w-32"
      />
      <div className="sm:mt-4">
        <div className="text-lg font-semibold text-[var(--text-title)]">ghc</div>
        <p className="mt-1 text-sm text-[var(--text-sub)]">
          记录前端、算法和项目实践
        </p>
      </div>
    </div>
  );
}

export default AuthorCard;
