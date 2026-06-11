import React from 'react';

export default function Collection({ onSelectMedia }) {
  // Mock collections data
  const featuredCollection = {
    title: "Sci-Fi modern collection",
    bg: "https://image.tmdb.org/t/p/original/o73wR1ZzT4525jTtw4aD1mE54b8.jpg", // Mandalorian backdrop
    videos: 27,
    views: "4.3k",
    likes: "7.5k",
    featuredItem: {
      id: "s-2",
      title: "The Mandalorian",
      type: "tv",
      year: "2019",
      imdbRating: "8.7",
      poster: "https://image.tmdb.org/t/p/w500/e1T2Jb54oMvVEe286G4J6t4aD12.jpg",
      backdrop: "https://image.tmdb.org/t/p/original/o73wR1ZzT4525jTtw4aD1mE54b8.jpg",
      description: "Le avventure di un cacciatore di taglie solitario nei confini della galassia, lontano dall'autorità della Nuova Repubblica.",
      genres: ["Sci-Fi & Fantasy", "Azione & Avventura"],
      cast: [
        { name: "Pedro Pascal", character: "Il Mandaloriano", avatar: "https://image.tmdb.org/t/p/w185/g7G2t2KVgzU702tZV.jpg" }
      ]
    }
  };

  const collectionPacks = [
    {
      id: "pack-1",
      title: "Love Death + Robots",
      meta: "3 Stagioni • 36 Episodi",
      cover: "https://image.tmdb.org/t/p/w500/as715m5bLB74xbR5qG05tOBmQcv.jpg",
      mediaItem: {
        id: "s-love-death-robots",
        title: "Love, Death & Robots",
        type: "tv",
        year: "2019",
        imdbRating: "8.7",
        poster: "https://image.tmdb.org/t/p/w500/as715m5bLB74xbR5qG05tOBmQcv.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/as715m5bLB74xbR5qG05tOBmQcv.jpg",
        description: "Creature terrificanti, malvagie sorprese e commedia nera si fondono in questa antologia animata di storie fantasy, sci-fi e horror presentata da Tim Miller e David Fincher.",
        genres: ["Sci-Fi & Fantasy", "Animazione"]
      }
    },
    {
      id: "pack-2",
      title: "Westworld",
      meta: "4 Stagioni • 36 Episodi",
      cover: "https://image.tmdb.org/t/p/w500/x5588SbIEQvqmQM4444QM444.jpg", // fallback
      mediaItem: {
        id: "s-westworld",
        title: "Westworld - Dove tutto è concesso",
        type: "tv",
        year: "2016",
        imdbRating: "8.5",
        poster: "https://image.tmdb.org/t/p/w500/8y5uZ23B9ag03tdIHzmQ.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/8y5uZ23B9ag03tdIHzmQ.jpg",
        description: "Westworld è un parco a tema futuristico e tecnologicamente avanzato, popolato da androidi sintetici senzienti detti 'ospiti' programmati per soddisfare i desideri dei ricchi visitatori.",
        genres: ["Fantascienza", "Dramma"]
      }
    },
    {
      id: "pack-3",
      title: "The Mandalorian",
      meta: "3 Stagioni • 24 Episodi",
      cover: "https://image.tmdb.org/t/p/w500/e1T2Jb54oMvVEe286G4J6t4aD12.jpg",
      mediaItem: featuredCollection.featuredItem
    }
  ];

  return (
    <div>
      {/* Featured Collection Hero Card */}
      <div 
        className="collection-hero-card"
        onClick={() => onSelectMedia(featuredCollection.featuredItem)}
      >
        <div 
          className="collection-hero-bg" 
          style={{ backgroundImage: `url(${featuredCollection.bg})` }}
        />
        <div className="collection-hero-overlay">
          <span className="collection-hero-tag">Sci-Fi modern collection</span>
          <h2 className="collection-hero-title">{featuredCollection.title}</h2>
          
          <div className="collection-hero-stats">
            <span className="collection-stat-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
              </svg>
              {featuredCollection.videos} Video
            </span>
            <span className="collection-stat-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              {featuredCollection.views} Visualizzazioni
            </span>
            <span className="collection-stat-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              {featuredCollection.likes} Likes
            </span>
          </div>
        </div>
      </div>

      {/* Collection List Section */}
      <div>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>Collection List</h2>
        <div className="collection-grid">
          {collectionPacks.map(pack => (
            <div 
              key={pack.id} 
              className="collection-pack-card"
              onClick={() => onSelectMedia(pack.mediaItem)}
            >
              <div 
                className="collection-pack-cover"
                style={{ backgroundImage: `url(${pack.cover})` }}
              />
              <div className="collection-pack-info">
                <div className="collection-pack-title">{pack.title}</div>
                <div className="collection-pack-meta">{pack.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
