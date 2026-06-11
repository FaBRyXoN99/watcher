import React from 'react';

export default function HomeOnboarding({ onGetStarted }) {
  const column1 = [
    { id: 1, title: 'Love Death + Robots', poster: 'https://image.tmdb.org/t/p/w500/as715m5bLB74xbR5qG05tOBmQcv.jpg' },
    { id: 2, title: 'Dune', poster: 'https://image.tmdb.org/t/p/w500/d5N051zLi7tT57W0W2ZCX6mE1Vz.jpg' }
  ];

  const column2 = [
    { id: 3, title: 'Turning Red', poster: 'https://image.tmdb.org/t/p/w500/qsdzhjej7c5f8t6Skdxt4J7gT4K.jpg' },
    { id: 4, title: 'Luca', poster: 'https://image.tmdb.org/t/p/w500/jTsw4L2PMJy74phsiZv91k94mFn.jpg' }
  ];

  const column3 = [
    { id: 5, title: 'The Book of Boba Fett', poster: 'https://image.tmdb.org/t/p/w500/g4ssfs2jGv6txu5p1zL2d4qG.jpg' },
    { id: 6, title: 'Stranger Things', poster: 'https://image.tmdb.org/t/p/w500/49WJ21rrlUp7JU35iL67M87wZ7u.jpg' }
  ];

  return (
    <div className="onboarding-screen">
      {/* Visual Side (Tilted Posters Grid) */}
      <div className="onboarding-visual-side">
        <div className="tilted-posters-grid">
          {/* Column 1 */}
          <div className="tilted-col-1" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {column1.map(movie => (
              <div key={movie.id} className="tilted-poster-card">
                <img src={movie.poster} alt={movie.title} />
              </div>
            ))}
          </div>
          
          {/* Column 2 */}
          <div className="tilted-col-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {column2.map(movie => (
              <div key={movie.id} className="tilted-poster-card">
                <img src={movie.poster} alt={movie.title} />
              </div>
            ))}
          </div>
          
          {/* Column 3 */}
          <div className="tilted-col-3" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {column3.map(movie => (
              <div key={movie.id} className="tilted-poster-card">
                <img src={movie.poster} alt={movie.title} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Text/CTA Side */}
      <div className="onboarding-text-side">
        <h1 className="onboarding-title">
          Unlimited offer for movies & TV series
        </h1>
        <p className="onboarding-desc">
          Watch movies anytime, anywhere.<br />
          Enjoy using app for free.
        </p>
        <button className="btn-get-started" onClick={onGetStarted}>
          Get Started
        </button>
      </div>
    </div>
  );
}
