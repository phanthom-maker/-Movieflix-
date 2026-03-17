// TMDB API Configuration
const API_KEY = 'abd1898a9e40cdf0414797825e97bc45';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const BACKDROP_SIZE = 'original';
const POSTER_SIZE = 'w500';

// Multiple Video Sources - FIXED with correct formats
const VIDEO_SOURCES = {
    vidsrc: 'https://vidsrc.xyz/embed/movie/{id}',
    embed: 'https://embed.su/embed/movie/{id}',
    '2embed': 'https://www.2embed.cc/embed/{id}',
    smashy: 'https://player.smashy.stream/movie/{id}',
    auto: 'https://vidsrc.xyz/embed/movie/{id}',
    moviesapi: 'https://moviesapi.club/movie/{id}',
    superembed: 'https://multiembed.mov/directstream.php?video_id={id}&tmdb=1'
};

// DOM Elements
const navbar = document.querySelector('.navbar');
const heroSection = document.getElementById('hero-section');
const movieModal = document.getElementById('movie-modal');
const videoModal = document.getElementById('video-modal');
const closeModal = document.querySelector('.close-modal');
const closeVideo = document.querySelector('.close-video');
const videoContainer = document.getElementById('video-container');
const videoTitle = document.getElementById('video-title');
const serverButtons = document.querySelectorAll('.server-btn');
const searchInput = document.querySelector('.search-input');
const searchIcon = document.querySelector('.search-icon');
const navLinks = document.querySelectorAll('.nav-link');
const genreBtns = document.querySelectorAll('.genre-btn');
const movieRows = document.getElementById('movie-rows');
const moviesPage = document.getElementById('movies-page');
const tvshowsPage = document.getElementById('tvshows-page');
const newPopularPage = document.getElementById('new-popular-page');
const myListPage = document.getElementById('my-list-page');
const searchPage = document.getElementById('search-page');

// State
let currentMovie = null;
let currentMovieId = null;
let currentPage = 'home';
let currentGenre = 'all';
let myList = JSON.parse(localStorage.getItem('myList')) || [];
let searchTimeout = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('App starting with API Key:', API_KEY);
    fetchAllMovies();
    setupEventListeners();
    updateMyListCount();
});

// Fetch all movie categories
async function fetchAllMovies() {
    try {
        showLoadingState();
        
        console.log('Fetching movies from TMDB...');
        
        // Fetch different categories
        const [trending, popular, topRated, upcoming] = await Promise.all([
            fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`),
            fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`),
            fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}`),
            fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}`)
        ]);

        // Check if responses are OK
        if (!trending.ok || !popular.ok || !topRated.ok || !upcoming.ok) {
            throw new Error('Failed to fetch movies from TMDB');
        }

        // Parse responses
        const trendingData = await trending.json();
        const popularData = await popular.json();
        const topRatedData = await topRated.json();
        const upcomingData = await upcoming.json();

        console.log('Movies loaded:', {
            trending: trendingData.results.length,
            popular: popularData.results.length,
            topRated: topRatedData.results.length,
            upcoming: upcomingData.results.length
        });

        // Display movies in their respective grids
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

// Display movies in grid - FIXED version
function displayMovies(containerId, movies, isPageGrid = false) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    if (!movies || movies.length === 0) {
        container.innerHTML = '<div class="empty-message">No movies found</div>';
        return;
    }

    console.log(`Displaying ${movies.length} movies in ${containerId}`);

    let html = '';
    
    movies.forEach(movie => {
        const title = movie.title || movie.name || 'Untitled';
        const posterPath = movie.poster_path 
            ? `${IMAGE_BASE_URL}w500${movie.poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Poster';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const isInList = myList.some(m => m.id === movie.id);
        
        // Safe movie data stringification
        const movieData = encodeURIComponent(JSON.stringify(movie));
        
        html += `
            <div class="movie-card" onclick='openMovieModal(${JSON.stringify(movie).replace(/'/g, "\\'")})'>
                <img src="${posterPath}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750?text=Error+Loading'">
                <div class="movie-card-overlay">
                    <div class="movie-card-title">${title}</div>
                    <div class="movie-card-rating">
                        <i class="fas fa-star"></i> ${rating}
                    </div>
                </div>
                <div class="add-to-list" onclick="event.stopPropagation(); toggleMyList(${JSON.stringify(movie).replace(/'/g, "\\'")})">
                    <i class="fas ${isInList ? 'fa-check' : 'fa-plus'}"></i>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Set hero movie
function setHeroMovie(movie) {
    if (!movie) return;
    
    currentMovie = movie;
    const title = movie.title || movie.name || 'Unknown';
    const overview = movie.overview || 'No description available.';
    const backdropPath = movie.backdrop_path 
        ? `${IMAGE_BASE_URL}${BACKDROP_SIZE}${movie.backdrop_path}`
        : '';
    
    if (backdropPath) {
        heroSection.style.backgroundImage = `url('${backdropPath}')`;
    } else {
        heroSection.style.backgroundImage = 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("https://via.placeholder.com/1920x1080?text=MovieFlix")';
    }
    
    document.getElementById('hero-title').textContent = title;
    document.getElementById('hero-description').textContent = overview.substring(0, 200) + (overview.length > 200 ? '...' : '');
}

// Open movie modal - FIXED
function openMovieModal(movie) {
    if (!movie) return;
    
    currentMovie = movie;
    currentMovieId = movie.id;
    
    const title = movie.title || movie.name || 'Unknown';
    const overview = movie.overview || 'No description available.';
    const releaseDate = movie.release_date || movie.first_air_date || 'N/A';
    const voteAverage = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const isInList = myList.some(m => m.id === movie.id);
    
    const backdropPath = movie.backdrop_path 
        ? `${IMAGE_BASE_URL}${BACKDROP_SIZE}${movie.backdrop_path}`
        : 'https://via.placeholder.com/1280x720?text=No+Backdrop';
    
    document.getElementById('modal-backdrop').src = backdropPath;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-rating').innerHTML = `<i class="fas fa-star"></i> ${voteAverage}`;
    document.getElementById('modal-year').textContent = releaseDate !== 'N/A' ? releaseDate.split('-')[0] : 'N/A';
    
    // Get genres
    if (movie.genre_ids) {
        const genreNames = getGenreNames(movie.genre_ids);
        document.getElementById('modal-genre').innerHTML = `<i class="fas fa-tag"></i> ${genreNames}`;
    } else {
        document.getElementById('modal-genre').innerHTML = '';
    }
    
    // Calculate duration
    const runtime = movie.runtime || Math.floor(Math.random() * (150 - 90 + 1) + 90);
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    document.getElementById('modal-duration').innerHTML = `<i class="far fa-clock"></i> ${hours}h ${minutes}m`;
    
    document.getElementById('modal-overview').textContent = overview;
    
    // Update add button text
    const addBtn = document.getElementById('modal-add-btn');
    addBtn.innerHTML = isInList 
        ? '<i class="fas fa-check"></i> In My List' 
        : '<i class="fas fa-plus"></i> Add to My List';
    
    movieModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Toggle my list
function toggleMyList(movie) {
    if (!movie) return;
    
    const index = myList.findIndex(m => m.id === movie.id);
    
    if (index === -1) {
        myList.push(movie);
        showNotification('✓ Added to My List');
    } else {
        myList.splice(index, 1);
        showNotification('✗ Removed from My List');
    }
    
    localStorage.setItem('myList', JSON.stringify(myList));
    updateMyListCount();
    
    // Refresh current view if needed
    if (currentPage === 'my-list') {
        displayMyList();
    }
    
    // Update add button in modal if open
    const addBtn = document.getElementById('modal-add-btn');
    if (addBtn && currentMovie && currentMovie.id === movie.id) {
        const isInList = myList.some(m => m.id === movie.id);
        addBtn.innerHTML = isInList 
            ? '<i class="fas fa-check"></i> In My List' 
            : '<i class="fas fa-plus"></i> Add to My List';
    }
}

// Make functions global
window.openMovieModal = openMovieModal;
window.toggleMyList = toggleMyList;

// Display my list
function displayMyList() {
    const grid = document.getElementById('my-list-grid');
    if (!grid) return;
    
    if (myList.length === 0) {
        grid.innerHTML = '<div class="empty-message">Your list is empty. Add some movies!</div>';
        return;
    }
    
    displayMovies('my-list-grid', myList, true);
}

// Update my list count
function updateMyListCount() {
    const myListLink = document.querySelector('[data-page="my-list"]');
    if (myListLink) {
        const count = myList.length;
        myListLink.textContent = count > 0 ? `My List (${count})` : 'My List';
    }
}

// Open video player
function openVideoPlayer(movie) {
    if (!movie) return;
    
    const title = movie.title || movie.name || 'Unknown';
    videoTitle.textContent = `Now Playing: ${title}`;
    
    // Store current movie ID
    currentMovieId = movie.id;
    
    // Load video with default server
    loadVideo(movie.id, 'vidsrc');
    
    // Close movie modal and open video modal
    movieModal.style.display = 'none';
    videoModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Load video from selected server - FIXED with better error handling
function loadVideo(movieId, server) {
    if (!movieId) {
        console.error('No movie ID provided');
        return;
    }
    
    let videoUrl = VIDEO_SOURCES[server];
    if (!videoUrl) {
        console.error('Invalid server:', server);
        videoUrl = VIDEO_SOURCES.vidsrc;
        server = 'vidsrc';
    }
    
    // Replace the ID placeholder
    videoUrl = videoUrl.replace('{id}', movieId);
    
    console.log(`Loading video from ${server}:`, videoUrl);
    
    videoContainer.innerHTML = `
        <iframe 
            src="${videoUrl}" 
            frameborder="0" 
            allowfullscreen
            allow="autoplay; encrypted-media; picture-in-picture"
            scrolling="no"
        ></iframe>
    `;
    
    // Update active server button
    serverButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.server === server) {
            btn.classList.add('active');
        }
    });
}

// Make load video global
window.loadVideo = loadVideo;

// Search movies
async function searchMovies(query) {
    if (!query.trim()) {
        hideSearchResults();
        return;
    }
    
    try {
        showLoadingState();
        
        const response = await fetch(
            `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
        );
        
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        
        if (data.results.length > 0) {
            // Filter to only movies and TV shows
            const filteredResults = data.results.filter(item => 
                item.media_type === 'movie' || item.media_type === 'tv'
            );
            
            showSearchResults(filteredResults);
        } else {
            document.getElementById('search-grid').innerHTML = 
                '<div class="empty-message">No movies found</div>';
            showSearchResults([]);
        }
        
        hideLoadingState();
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Search failed. Please try again.');
    }
}

// Show search results
function showSearchResults(results) {
    hideAllPages();
    searchPage.style.display = 'block';
    currentPage = 'search';
    
    if (results.length > 0) {
        displayMovies('search-grid', results, true);
    }
}

// Hide search results
function hideSearchResults() {
    if (currentPage === 'search') {
        showPage('home');
    }
}

// Get genre names from IDs
function getGenreNames(genreIds) {
    if (!genreIds || !Array.isArray(genreIds)) return 'Unknown';
    
    const genreMap = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
        80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
        14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
        9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
        53: 'Thriller', 10752: 'War', 37: 'Western'
    };
    
    return genreIds.slice(0, 2).map(id => genreMap[id] || 'Unknown').join(', ');
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Page navigation
function showPage(page) {
    hideAllPages();
    
    // Hide/show hero section based on page
    if (page === 'home') {
        heroSection.style.display = 'block';
        movieRows.style.display = 'block';
    } else {
        heroSection.style.display = 'none';
        movieRows.style.display = 'none';
    }
    
    switch(page) {
        case 'home':
            movieRows.style.display = 'block';
            break;
        case 'movies':
            moviesPage.style.display = 'block';
            fetchMoviesPage();
            break;
        case 'tvshows':
            tvshowsPage.style.display = 'block';
            fetchTVShows();
            break;
        case 'new-popular':
            newPopularPage.style.display = 'block';
            fetchNewPopular();
            break;
        case 'my-list':
            myListPage.style.display = 'block';
            displayMyList();
            break;
    }
    
    // Update active nav link
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    
    currentPage = page;
}

// Hide all pages
function hideAllPages() {
    movieRows.style.display = 'none';
    moviesPage.style.display = 'none';
    tvshowsPage.style.display = 'none';
    newPopularPage.style.display = 'none';
    myListPage.style.display = 'none';
    searchPage.style.display = 'none';
}

// Fetch movies page
async function fetchMoviesPage(page = 1) {
    try {
        const response = await fetch(
            `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`
        );
        const data = await response.json();
        displayMovies('movies-grid', data.results, true);
        createPagination('movies-pagination', data.total_pages, page, 'fetchMoviesPage');
    } catch (error) {
        console.error('Error fetching movies page:', error);
    }
}

// Fetch TV shows
async function fetchTVShows(page = 1) {
    try {
        const response = await fetch(
            `${BASE_URL}/tv/popular?api_key=${API_KEY}&page=${page}`
        );
        const data = await response.json();
        displayMovies('tvshows-grid', data.results, true);
        createPagination('tvshows-pagination', data.total_pages, page, 'fetchTVShows');
    } catch (error) {
        console.error('Error fetching TV shows:', error);
    }
}

// Fetch new & popular
async function fetchNewPopular(page = 1) {
    try {
        const response = await fetch(
            `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=${page}`
        );
        const data = await response.json();
        displayMovies('new-popular-grid', data.results, true);
        createPagination('new-popular-pagination', data.total_pages, page, 'fetchNewPopular');
    } catch (error) {
        console.error('Error fetching new & popular:', error);
    }
}

// Create pagination
function createPagination(containerId, totalPages, currentPage, functionName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '';
    const maxPages = Math.min(totalPages, 500);
    
    // Previous button
    html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage('${functionName}', ${currentPage - 1})">Prev</button>`;
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(maxPages, currentPage + 2); i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage('${functionName}', ${i})">${i}</button>`;
    }
    
    // Next button
    html += `<button class="page-btn" ${currentPage === maxPages ? 'disabled' : ''} onclick="changePage('${functionName}', ${currentPage + 1})">Next</button>`;
    
    container.innerHTML = html;
}

// Change page
window.changePage = function(functionName, page) {
    window[functionName](page);
};

// Filter by genre
async function filterByGenre(genreId) {
    try {
        if (genreId === 'all') {
            if (currentPage === 'home') {
                fetchAllMovies();
            } else if (currentPage === 'movies') {
                fetchMoviesPage();
            }
            return;
        }
        
        const response = await fetch(
            `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`
        );
        const data = await response.json();
        
        if (currentPage === 'home') {
            displayMovies('trending', data.results);
        } else if (currentPage === 'movies') {
            displayMovies('movies-grid', data.results, true);
        }
    } catch (error) {
        console.error('Genre filter error:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 100);
    });

    // Slider buttons
    document.querySelectorAll('.movie-row').forEach(row => {
        const slider = row.querySelector('.movies-grid');
        const prevBtn = row.querySelector('.prev');
        const nextBtn = row.querySelector('.next');

        if (prevBtn && nextBtn && slider) {
            prevBtn.addEventListener('click', () => {
                slider.scrollBy({ left: -500, behavior: 'smooth' });
            });
            
            nextBtn.addEventListener('click', () => {
                slider.scrollBy({ left: 500, behavior: 'smooth' });
            });
        }
    });

    // Hero buttons
    document.getElementById('hero-play-btn').addEventListener('click', () => {
        if (currentMovie) openVideoPlayer(currentMovie);
    });

    document.getElementById('hero-info-btn').addEventListener('click', () => {
        if (currentMovie) openMovieModal(currentMovie);
    });

    // Modal buttons
    document.getElementById('modal-play-btn').addEventListener('click', () => {
        if (currentMovie) openVideoPlayer(currentMovie);
    });

    document.getElementById('modal-add-btn').addEventListener('click', () => {
        if (currentMovie) toggleMyList(currentMovie);
    });

    // Close modals
    closeModal.addEventListener('click', () => {
        movieModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    closeVideo.addEventListener('click', () => {
        videoModal.style.display = 'none';
        videoContainer.innerHTML = '';
        document.body.style.overflow = 'auto';
    });

    // Server buttons
    serverButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentMovieId) {
                loadVideo(currentMovieId, btn.dataset.server);
            }
        });
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value;
        
        searchTimeout = setTimeout(() => {
            if (query.length > 2) {
                searchMovies(query);
            } else if (query.length === 0) {
                hideSearchResults();
            }
        }, 500);
    });

    searchIcon.addEventListener('click', () => {
        if (searchInput.value) searchMovies(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMovies(searchInput.value);
    });

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(link.dataset.page);
        });
    });

    // Genre filtering
    genreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genreBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGenre = btn.dataset.genre;
            filterByGenre(currentGenre);
        });
    });

    // Clear my list
    const clearBtn = document.getElementById('clear-list-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear your entire list?')) {
                myList = [];
                localStorage.setItem('myList', JSON.stringify(myList));
                displayMyList();
                updateMyListCount();
                showNotification('List cleared');
            }
        });
    }

    // Close modals on outside click
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

// Loading state
function showLoadingState() {
    const grids = ['trending', 'popular', 'top-rated', 'upcoming'];
    grids.forEach(id => {
        const grid = document.getElementById(id);
        if (grid) {
            grid.innerHTML = '<div class="loading">🎬 Loading movies...</div>';
        }
    });
}

function hideLoadingState() {
    // Loading states are removed when movies are displayed
}

function showError() {
    const grids = ['trending', 'popular', 'top-rated', 'upcoming'];
    grids.forEach(id => {
        const grid = document.getElementById(id);
        if (grid) {
            grid.innerHTML = '<div class="error-message">⚠️ Error loading movies. Please refresh.</div>';
        }
    });
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: #e50914;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    .empty-message {
        text-align: center;
        padding: 50px;
        color: #888;
        font-size: 18px;
        width: 100%;
    }
    
    .loading {
        text-align: center;
        padding: 50px;
        color: #e50914;
        font-size: 18px;
        width: 100%;
    }
    
    .error-message {
        text-align: center;
        padding: 50px;
        color: #e50914;
        font-size: 18px;
        width: 100%;
    }
    
    .movie-card .add-to-list {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 32px;
        height: 32px;
        background: rgba(0,0,0,0.7);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        opacity: 0;
        transition: all 0.3s;
        border: 2px solid white;
        z-index: 20;
    }
    
    .movie-card:hover .add-to-list {
        opacity: 1;
    }
    
    .add-to-list:hover {
        background: #e50914 !important;
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);
