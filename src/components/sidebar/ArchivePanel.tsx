import blueImage from "@/assets/images/blue.jpg";
import redImage from "@/assets/images/1.png";

function ArchivePanel() {
  return (
    <section className="my-10 flex justify-center">
      <div className="group relative h-40 w-full max-w-[400px] overflow-hidden rounded-xl shadow-xl sm:h-[200px]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-100 transition-opacity duration-500 group-hover:opacity-0"
          style={{ backgroundImage: `url(${blueImage.src})` }}
        />

        <div
          className="absolute inset-0 bg-cover bg-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ backgroundImage: `url(${redImage.src})` }}
        />

        <div className="relative z-10 flex h-full items-center justify-center text-xl font-bold text-white">
          Archive Panel
        </div>
      </div>
    </section>
  );
}

export default ArchivePanel;
