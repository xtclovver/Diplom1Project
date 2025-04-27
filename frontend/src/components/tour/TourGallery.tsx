import React, { useState } from 'react';
import './TourGallery.css';

interface TourImage {
  url: string;
  alt?: string;
}

interface TourGalleryProps {
  images: TourImage[];
}

const TourGallery: React.FC<TourGalleryProps> = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Если изображений нет, показываем заглушку
  if (!images || images.length === 0) {
    return (
      <div className="tour-gallery">
        <div className="tour-gallery-main">
          <img src="/images/tour-placeholder.jpg" alt="Нет изображения" />
        </div>
      </div>
    );
  }
  
  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index);
  };
  
  const handlePrevClick = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNextClick = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <div className="tour-gallery">
      <div className="tour-gallery-main">
        <img 
          src={images[activeIndex].url} 
          alt={images[activeIndex].alt || 'Изображение тура'} 
        />
        
        {images.length > 1 && (
          <>
            <button 
              className="gallery-nav prev" 
              onClick={handlePrevClick}
              aria-label="Предыдущее изображение"
            >
              &lsaquo;
            </button>
            <button 
              className="gallery-nav next" 
              onClick={handleNextClick}
              aria-label="Следующее изображение"
            >
              &rsaquo;
            </button>
          </>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="tour-gallery-thumbnails">
          {images.map((image, index) => (
            <div 
              key={index}
              className={`thumbnail ${index === activeIndex ? 'active' : ''}`}
              onClick={() => handleThumbnailClick(index)}
            >
              <img src={image.url} alt={image.alt || `Миниатюра ${index + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TourGallery; 