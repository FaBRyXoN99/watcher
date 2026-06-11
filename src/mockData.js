export const MOCK_PROVIDERS = {
  netflix: { name: 'Netflix', logo: 'https://image.tmdb.org/t/p/original/p1NFstEU41Ujgy4R28t4D827C5T.jpg' },
  prime: { name: 'Prime Video', logo: 'https://image.tmdb.org/t/p/original/dQe2551m65wq54U7n9cu14cxczq.jpg' },
  disney: { name: 'Disney+', logo: 'https://image.tmdb.org/t/p/original/9A1w26475n7jrrw2nB16n43K.jpg' },
  apple: { name: 'Apple TV+', logo: 'https://image.tmdb.org/t/p/original/2e1a4GxU0gU7n9cu14cxczq.jpg' },
  crunchyroll: { name: 'Crunchyroll', logo: 'https://image.tmdb.org/t/p/original/m9a475n7jrrw2nB16n43K.jpg' },
  hmax: { name: 'Max', logo: 'https://image.tmdb.org/t/p/original/hmaxLogoUrl.jpg' }, // fallback
  cinema: { name: 'Cinema', logo: '🎥' },
  unofficial: { name: 'Servizi Non Ufficiali', logo: '🏴‍☠️' },
  other: { name: 'Altro / Fisico', logo: '💿' }
};

export const MOCK_MEDIA = [
  {
    id: "m-1",
    title: "Soul",
    type: "movie",
    year: "2020",
    duration: "1h 40m",
    imdbRating: "8.0",
    description: "Un musicista jazz che ha perso la passione per la musica viene trasportato fuori dal suo corpo e deve trovare la strada di ritorno con l'aiuto di un'anima infantile che impara a conoscere se stessa.",
    genres: ["Animazione", "Avventura", "Commedia", "Famiglia"],
    poster: "https://image.tmdb.org/t/p/w500/hm58PHo18663gV2NyO95ZgY5g2y.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/kf456ZqeC45jznmrzw2nB16n43K.jpg",
    cast: [
      { name: "Jamie Foxx", character: "Joe Gardner (voce)", avatar: "https://image.tmdb.org/t/p/w185/o86BNp53S529TR46JpA62wQPH1n.jpg" },
      { name: "Tina Fey", character: "22 (voce)", avatar: "https://image.tmdb.org/t/p/w185/1e5ty6g2zZ76uiTT2O2.jpg" },
      { name: "Graham Norton", character: "Moonwind (voce)", avatar: "https://image.tmdb.org/t/p/w185/8y5uZ23B9ag03tdIHzmQ.jpg" }
    ],
    providers: {
      flatrate: [MOCK_PROVIDERS.disney],
      rent: [MOCK_PROVIDERS.prime, MOCK_PROVIDERS.apple],
      buy: [MOCK_PROVIDERS.prime, MOCK_PROVIDERS.apple]
    }
  },
  {
    id: "s-1",
    title: "Stranger Things",
    type: "tv",
    year: "2016",
    duration: "4 Stagioni",
    imdbRating: "8.7",
    description: "Quando un ragazzo scompare, una piccola città scopre un mistero che coinvolge esperimenti segreti, forze soprannaturali terrificanti e una strana ragazzina.",
    genres: ["Sci-Fi & Fantasy", "Dramma", "Mistero"],
    poster: "https://image.tmdb.org/t/p/w500/49WJ21rrlUp7JU35iL67M87wZ7u.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/56v2AfA62e5ty6g2zZ76uiTT2O2.jpg",
    cast: [
      { name: "Millie Bobby Brown", character: "Undici", avatar: "https://image.tmdb.org/t/p/w185/5P8WfEqRerVqb5v846H9V47nuvV.jpg" },
      { name: "Finn Wolfhard", character: "Mike Wheeler", avatar: "https://image.tmdb.org/t/p/w185/3j9d6P4w6CqW6qZk8F0.jpg" },
      { name: "Winona Ryder", character: "Joyce Byers", avatar: "https://image.tmdb.org/t/p/w185/t6HI23TTV5wZ7mC025ZO6GZ.jpg" }
    ],
    providers: {
      flatrate: [MOCK_PROVIDERS.netflix],
      rent: [],
      buy: []
    }
  },
  {
    id: "m-2",
    title: "Dune",
    type: "movie",
    year: "2021",
    duration: "2h 35m",
    imdbRating: "8.0",
    description: "Paul Atreides, un giovane brillante e talentuoso nato con un grande destino che va oltre la sua comprensione, deve viaggiare verso il pianeta più pericoloso dell'universo per assicurare il futuro della sua famiglia e del suo popolo.",
    genres: ["Fantascienza", "Avventura"],
    poster: "https://image.tmdb.org/t/p/w500/d5N051zLi7tT57W0W2ZCX6mE1Vz.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/jyeUNS6t3j9d6P4w6CqW6qZk8F0.jpg",
    cast: [
      { name: "Timothée Chalamet", character: "Paul Atreides", avatar: "https://image.tmdb.org/t/p/w185/w2nB16n43K.jpg" },
      { name: "Rebecca Ferguson", character: "Lady Jessica Atreides", avatar: "https://image.tmdb.org/t/p/w185/8r3w2cVKczIL35dOnN.jpg" },
      { name: "Oscar Isaac", character: "Duca Leto Atreides", avatar: "https://image.tmdb.org/t/p/w185/sjx6zjQI5oRMP7fhC.jpg" }
    ],
    providers: {
      flatrate: [MOCK_PROVIDERS.netflix, MOCK_PROVIDERS.prime],
      rent: [MOCK_PROVIDERS.prime, MOCK_PROVIDERS.apple],
      buy: [MOCK_PROVIDERS.prime, MOCK_PROVIDERS.apple]
    }
  },
  {
    id: "m-3",
    title: "Avatar: La Via dell'Acqua",
    type: "movie",
    year: "2022",
    duration: "3h 12m",
    imdbRating: "7.6",
    description: "Jake Sully vive con la sua nuova famiglia sul pianeta Pandora. Ma quando una vecchia minaccia ritorna per finire ciò che era iniziato, Jake deve lavorare con Neytiri e l'esercito dei Na'vi per proteggere il loro pianeta.",
    genres: ["Fantascienza", "Azione", "Avventura"],
    poster: "https://image.tmdb.org/t/p/w500/t6HI23TTV5wZ7mC025ZO6GZJEZg.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/s16XfvZ3H8r3w2cVKczIL35dOnN.jpg",
    cast: [
      { name: "Sam Worthington", character: "Jake Sully", avatar: "https://image.tmdb.org/t/p/w185/jTsw4L2PMJy74phsiZ.jpg" },
      { name: "Zoe Saldaña", character: "Neytiri", avatar: "https://image.tmdb.org/t/p/w185/6200HJZsw457ILDOj.jpg" },
      { name: "Sigourney Weaver", character: "Kiri", avatar: "https://image.tmdb.org/t/p/w185/e1T2Jb54oMvVEe.jpg" }
    ],
    providers: {
      flatrate: [MOCK_PROVIDERS.disney],
      rent: [MOCK_PROVIDERS.prime, MOCK_PROVIDERS.apple],
      buy: [MOCK_PROVIDERS.prime, MOCK_PROVIDERS.apple]
    }
  },
  {
    id: "m-4",
    title: "Luca",
    type: "movie",
    year: "2021",
    duration: "1h 35m",
    imdbRating: "7.5",
    description: "Sul lungomare della Riviera Italiana, un'amicizia improbabile ma forte si sviluppa tra un essere umano e un mostro marino travestito da umano.",
    genres: ["Animazione", "Commedia", "Famiglia", "Fantasy"],
    poster: "https://image.tmdb.org/t/p/w500/jTsw4L2PMJy74phsiZv91k94mFn.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/6200HJZsw457ILDOjA26R1EVq4W.jpg",
    cast: [
      { name: "Jacob Tremblay", character: "Luca Paguro (voce)", avatar: "https://image.tmdb.org/t/p/w185/hm58PHo18663gV2NyO95ZgY5g.jpg" },
      { name: "Jack Dylan Grazer", character: "Alberto Scorfano (voce)", avatar: "https://image.tmdb.org/t/p/w185/kf456ZqeC45jznmr.jpg" },
      { name: "Emma Berman", character: "Giulia Marcovaldo (voce)", avatar: "https://image.tmdb.org/t/p/w185/49WJ21rrlUp7JU35iL67.jpg" }
    ],
    providers: {
      flatrate: [MOCK_PROVIDERS.disney],
      rent: [],
      buy: []
    }
  },
  {
    id: "s-2",
    title: "The Mandalorian",
    type: "tv",
    year: "2019",
    duration: "3 Stagioni",
    imdbRating: "8.7",
    description: "Le avventure di un cacciatore di taglie solitario nei confini della galassia, lontano dall'autorità della Nuova Repubblica.",
    genres: ["Sci-Fi & Fantasy", "Azione & Avventura"],
    poster: "https://image.tmdb.org/t/p/w500/e1T2Jb54oMvVEe286G4J6t4aD12.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/o73wR1ZzT4525jTtw4aD1mE54b8.jpg",
    cast: [
      { name: "Pedro Pascal", character: "Il Mandaloriano / Din Djarin", avatar: "https://image.tmdb.org/t/p/w185/g7G2t2KVgzU702tZV.jpg" },
      { name: "Katee Sackhoff", character: "Bo-Katan Kryze", avatar: "https://image.tmdb.org/t/p/w185/sjx6zjQI5oRMP7f.jpg" }
    ],
    providers: {
      flatrate: [MOCK_PROVIDERS.disney],
      rent: [],
      buy: []
    }
  }
];
