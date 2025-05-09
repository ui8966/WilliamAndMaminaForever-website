// src/pages/GalleryPage.tsx

// 👇 adjust this to your actual file path:
import bathRobeImg from '../assets/Momo/MomoBathRobe.jpg'
import KimonoImg from '../assets/Momo/EE4F7F01-10C1-4027-B48A-908627DD9AC0.jpeg'

export default function GalleryPage() {
  return (
    <div className="flex flex-col items-center p-4 text-gray-700 space-y-4">
      <h2 className="text-2xl md:text-6xl font-heading">Gallery</h2>

      {/* Big centered local image */}
      <div className="w-full max-w-md">
        <img
          src={bathRobeImg}
          alt="Momo in bathrobe"
          className="w-full h-auto rounded-2xl shadow-lg"
        />
        <p className="mt-2 text-center text-2xl text-gray-500">
          “Momo in a bathrobe 🛁🐶” 📸
        </p>
      </div>

      <div className="w-full max-w-md">
        <img
          src={KimonoImg }
          alt="Momo in Kimono"
          className="w-full h-auto rounded-2xl shadow-lg"
        />
        <p className="mt-2 text-center text-2xl text-gray-500">
          “Momo in a Kimono ✨🐶” 📸
        </p>
      </div>

      <p className="text-2xl text-blue-600">
        We can uppload photos here soon! 💌
      </p>
    </div>
  )
}
