// src/pages/GalleryPage.tsx
import bathRobeImg from '../assets/Momo/MomoBathRobe.jpg'
import kimonoImg  from '../assets/Momo/EE4F7F01-10C1-4027-B48A-908627DD9AC0.jpeg'

interface Photo {
  src: string
  alt: string
  date: string   // YYYY-MM-DD
  caption: string
}

const photos: Photo[] = [
  {
    src: bathRobeImg,
    alt: 'Momo in bathrobe',
    date: '2025-04-01',
    caption: 'Momo in a bathrobe 🛁🐶',
  },
  {
    src: kimonoImg,
    alt: 'Momo in Kimono',
    date: '2025-05-17',
    caption: 'Momo in a Kimono ✨🐶',
  },
  // …later add cloud URLs here
]

export default function GalleryPage() {
  return (
    <div className="p-4 bg-pink-50 min-h-screen">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {photos.map(({ src, alt, date, caption }) => (
          <figure
            key={date + caption}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <figcaption className="px-6 pt-6 text-gray-600 text-lg md:text-4xl font-medium">
              {new Date(date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </figcaption>

            <img
              src={src}
              alt={alt}
              className="w-full h-auto object-cover"
            />

            <p className="p-6 text-center text-xl md:text-4xl text-gray-800">
              {caption}
            </p>
          </figure>
        ))}
      </div>

      <p className="mt-12 text-center text-xl text-blue-600">
        Soon: Upload directly from your phone! 💌
      </p>
    </div>
  )
}
