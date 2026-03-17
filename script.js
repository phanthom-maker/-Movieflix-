// TMDB API Configuration
const API_KEY = 'abd1898a9e40cdf0414797825e97bc45'; // Your API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const BACKDROP_SIZE = 'original';
const POSTER_SIZE = 'w500';

// Video source URLs (free streaming sources)
const VIDEO_SOURCES = {
    vidsrc: 'https://vidsrc.xyz/embed/movie/{id}',
    embed: 'https://embed.su/embed/movie/{id}',
    '2embed': 'https://www.2embed.cc/embed/{id}',
    smashy: 'https://player.smashy.stream/movie/{id}',
    auto: 'https://vidsrc.xyz/embed/movie/{id}' // Default to vidsrc
};

// DOM Elements
const navbar = document.querySelector('.navbar');
const heroSection = document.getElementById('hero-section');
const trendingGrid = document.getElementById('trending');
const popularGrid = document.getElementById('popular');
const topRatedGrid = document.getElementById('top-rated');
const upcomingGrid = document.getElementById('upcoming');
const movieModal = document.getElementById('movie-modal');
const videoModal = document.getElementById('video-modal');
const closeModal = document.querySelector('.close-modal');
const closeVideo = document.querySelector('.close-video');
const videoContainer = document.getElementById('video-container');
const videoTitle = document.getElementById('video-title');
const serverButtons = document.querySelectorAll('.server-btn');

// Current movie data
let currentMovie = null;
let currentMovieId = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    fetchMovies();
    setupEventListeners();
});

// Fetch all movie categories
async function fetchMovies() {
    try {
        showLoadingState();
        
        // Fetch different categories with your API key
        const [trending, popular, topRated, upcoming] = await Promise.all([
            fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`),
            fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`),
            fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}`),
            fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}`)
        ]);

        // Check if responses are OK
        if (!trending.ok || !popular.ok || !topRated.ok || !upcoming.ok) {
            throw new Error('Failed to fetch movies');
        }

        // Parse responses
        const trendingData = await trending.json();
        const popularData = await popular.json();
        const topRatedData = await topRated.json();
        const upcomingData = await upcoming.json();

        // Display movies
        displayMovies('trending', trendingData.results);
        displayMovies('popular', popularData.results);
        displayMovies('top-rated', topRatedData.results);
        displayMovies('upcoming', upcomingData.results);
        
        // Set hero section with first trending movie
        if (trendingData.results.length > 0) {
            setHeroMovie(trendingData.results[0]);
        }

        hideLoadingState();
    } catch (error) {
        console.error('Error fetching movies:', error);
        showError();
    }
}

// Display movies in grid
function displayMovies(category, movies) {
    const grid = document.getElementById(category);
    if (!grid) return;

    grid.innerHTML = movies.map(movie => {
        const title = movie.title || movie.name;
        const posterPath = movie.poster_path ? IMAGE_BASE_URL + 'w500' + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        
        // Escape movie data for onclick
        const movieData = JSON.stringify(movie).replace(/'/g, "&apos;");
        
        return `
            <div class="movie-card" onclick='openMovieModal(${movieData})'>
                <img src="${posterPath}" alt="${title}" loading="lazy">
                <div class="movie-card-overlay">
                    <div class="movie-card-title">${title}</div>
                    <div class="movie-card-rating">
                        <i class="fas fa-star"></i> ${rating}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Set hero section movie
function setHeroMovie(movie) {
    const title = movie.title || movie.name;
    const overview = movie.overview || 'No description available.';
    const backdropPath = movie.backdrop_path ? IMAGE_BASE_URL + BACKDROP_SIZE + movie.backdrop_path : '';
    
    if (backdropPath) {
        heroSection.style.backgroundImage = `url('${backdropPath}')`;
    } else {
        heroSection.style.backgroundImage = 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("https://via.placeholder.com/1920x1080?text=MovieFlix")';
    }
    
    document.getElementById('hero-title').textContent = title;
    document.getElementById('hero-description').textContent = overview.substring(0, 200) + (overview.length > 200 ? '...' : '');
    
    // Store hero movie data
    currentMovie = movie;
}

// Open movie info modal
window.openMovieModal = function(movie) {
    currentMovie = movie;
    currentMovieId = movie.id;
    
    const title = movie.title || movie.name;
    const overview = movie.overview || 'No description available.';
    const releaseDate = movie.release_date || movie.first_air_date || 'N/A';
    const voteAverage = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    
    // Set backdrop image
    const backdropPath = movie.backdrop_path ? IMAGE_BASE_URL + BACKDROP_SIZE + movie.backdrop_path : '';
    document.getElementById('modal-backdrop').src = backdropPath || 'https://via.placeholder.com/1280x720?text=No+Image';
    
    // Set movie info
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-rating').innerHTML = `<i class="fas fa-star"></i> ${voteAverage}`;
    document.getElementById('modal-year').textContent = releaseDate !== 'N/A' ? releaseDate.split('-')[0] : 'N/A';
    
    // Calculate mock duration
    const randomDuration = Math.floor(Math.random() * (150 - 90 + 1) + 90);
    const hours = Math.floor(randomDuration / 60);
    const minutes = randomDuration % 60;
    document.getElementById('modal-duration').innerHTML = `<i class="far fa-clock"></i> ${hours}h ${minutes}m`;
    
    document.getElementById('modal-overview').textContent = overview;
    
    movieModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Open video player
function openVideoPlayer(movie) {
    if (!movie) return;
    
    const title = movie.title || movie.name;
    videoTitle.textContent = `Now Playing: ${title}`;
    
    // Load video with default server (vidsrc)
    loadVideo(movie.id, 'vidsrc');
    
    // Close movie modal if open
    movieModal.style.display = 'none';
    
    // Open video modal
    videoModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Load video from selected server
function loadVideo(movieId, server) {
    if (!movieId) return;
    
    const videoUrl = VIDEO_SOURCES[server].replace('{id}', movieId);
    
    videoContainer.innerHTML = `
        <iframe src="${videoUrl}" 
                allowfullscreen 
                allow="autoplay; fullscreen; picture-in-picture">
        </iframe>
    `;
    
    // Update active server button
    serverButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.server === server) {
            btn.classList.add('active');
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Slider buttons
    document.querySelectorAll('.movie-row').forEach(row => {
        const slider = row.querySelector('.movies-grid');
        const prevBtn = row.querySelector('.prev');
        const nextBtn = row.querySelector('.next');

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                slider.scrollLeft -= 500;
            });

            nextBtn.addEventListener('click', () => {
                slider.scrollLeft += 500;
            });
        }
    });

    // Hero play button
    document.getElementById('hero-play-btn').addEventListener('click', () => {
        if (currentMovie) {
            openVideoPlayer(currentMovie);
        }
    });

    // Hero info button
    document.getElementById('hero-info-btn').addEventListener('click', () => {
        if (currentMovie) {
            openMovieModal(currentMovie);
        }
    });

    // Modal play button
    document.getElementById('modal-play-btn').addEventListener('click', () => {
        if (currentMovie) {
            openVideoPlayer(currentMovie);
        }
    });

    // Close movie modal
    closeModal.addEventListener('click', () => {
        movieModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Close video modal
    closeVideo.addEventListener('click', () => {
        videoModal.style.display = 'none';
        videoContainer.innerHTML = ''; // Stop video
        document.body.style.overflow = 'auto';
    });

    // Server buttons
    serverButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const server = btn.dataset.server;
            if (currentMovieId) {
                loadVideo(currentMovieId, server);
            }
        });
    });

    // Search functionality
    document.querySelector('.fa-search').addEventListener('click', () => {
        const searchTerm = prompt('Search for a movie:');
        if (searchTerm) {
            searchMovies(searchTerm);
        }
    });

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === movieModal) {
            movieModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (event.target === videoModal) {
            videoModal.style.display = 'none';
            videoContainer.innerHTML = '';
            document.body.style.overflow = 'auto';
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (videoModal.style.display === 'block') {
                videoModal.style.display = 'none';
                videoContainer.innerHTML = '';
                document.body.style.overflow = 'auto';
            } else if (movieModal.style.display === 'block') {
                movieModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
    });
}

// Search movies function
async function searchMovies(query) {
    try {
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.results.length > 0) {
            // Clear existing grids and show search results
            const searchGrid = document.createElement('div');
            searchGrid.className = 'movies-grid';
            searchGrid.id = 'search-results';
            
            displayMovies('search-results', data.results);
            
            // Scroll to results
            document.querySelector('.movie-rows').scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('No movies found!');
        }
    } catch (error) {
        console.error('Search error:', error);
        alert('Error searching movies');
    }
}

// Loading state
function showLoadingState() {
    const grids = ['trending', 'popular', 'top-rated', 'upcoming'];
    grids.forEach(gridId => {
        const grid = document.getElementById(gridId);
        if (grid) {
            grid.innerHTML = '<div class="loading">Loading movies...</div>';
        }
    });
}

function hideLoadingState() {
    // Loading states are removed when movies are displayed
}

function showError() {
    const grids = ['trending', 'popular', 'top-rated', 'upcoming'];
    grids.forEach(gridId => {
        const grid = document.getElementById(gridId);
        if (grid) {
            grid.innerHTML = '<div class="error-message">Error loading movies. Please refresh.</div>';
        }
    });
}

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add some additional styling
const style = document.createElement('style');
style.textContent = `
    .error-message {
        text-align: center;
        padding: 50px;
        color: #e50914;
        font-size: 18px;
        width: 100%;
    }
    
    .movie-card {
        cursor: pointer;
    }
    
    .rating i, .duration i {
        margin-right: 5px;
        color: #e50914;
    }
    
    .server-btn {
        transition: all 0.3s;
    }
    
    .server-btn:hover:not(.active) {
        background-color: #444;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);
