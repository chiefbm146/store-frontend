/**
 * Moon Tide Podcasts Player
 *
 * Professional, self-contained audio player with smart episode management
 *
 * Features:
 * - Smart episode switching with auto-play continuation
 * - Auto-advance to next episode when current finishes
 * - Single Audio element (no recreation on episode change)
 * - Per-episode progress saving in localStorage
 * - Playback speed and volume persistence
 * - Keyboard shortcuts (Space, ←, →, ↑, ↓)
 * - Touch-friendly mobile controls
 *
 * Fixed Issues:
 * - Episodes now auto-play when switching if audio was playing
 * - Auto-advance to next episode on completion
 * - No HTML re-rendering on episode change
 * - Smooth state transitions between episodes
 */

export class PodcastPlayer {
    constructor(containerId, podcastsData) {
        this.container = document.getElementById(containerId);

        // Handle both single podcast (legacy) and array of podcasts
        this.podcasts = Array.isArray(podcastsData) ? podcastsData : [podcastsData];
        this.currentIndex = 0;
        this.podcast = this.podcasts[this.currentIndex];
        this.audio = new Audio(this.podcast.audioUrl);

        // State
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = this.loadVolume();
        this.playbackRate = this.loadPlaybackRate();
        this.isSeeking = false;

        // Storage keys
        this.storageKey = `podcast_${this.podcast.id}_progress`;

        // Initialize
        this.audio.volume = this.volume;
        this.audio.playbackRate = this.playbackRate;
        this.loadProgress();

        this.render();
        this.attachEventListeners();
        this.setupKeyboardShortcuts();
    }

    render() {
        const episodeSelectorHTML = this.podcasts.length > 1 ? `
            <!-- Episode Selector -->
            <div class="episode-selector">
                <div class="episodes-list">
                    ${this.podcasts.map((podcast, index) => `
                        <button class="episode-option ${index === this.currentIndex ? 'active' : ''}"
                                data-index="${index}"
                                title="${podcast.title}">
                            <span class="episode-label">Episode ${index + 1}</span>
                            <span class="episode-short-title">${podcast.title}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        ` : '';

        this.container.innerHTML = `
            <div class="podcast-player" id="podcastPlayer">
                ${episodeSelectorHTML}

                <!-- Podcast Info -->
                <div class="podcast-info">
                    <div class="podcast-artwork">
                        <i class="fas fa-podcast"></i>
                    </div>
                    <div class="podcast-meta">
                        <h3 class="podcast-player-title">${this.podcast.title}</h3>
                        <p class="podcast-player-host">${this.podcast.host}</p>
                        <p class="podcast-player-date">${this.podcast.date}</p>
                    </div>
                </div>

                <!-- Description -->
                <div class="podcast-description">
                    <p>${this.podcast.description}</p>
                </div>

                <!-- Main Controls -->
                <div class="player-controls">
                    <!-- Episode Back Button -->
                    ${this.podcasts.length > 1 ? `
                        <button class="nav-btn" id="prevEpisode"
                                title="Previous episode"
                                ${this.currentIndex === 0 ? 'disabled' : ''}>
                            <i class="fas fa-step-backward"></i>
                        </button>
                    ` : ''}

                    <!-- Skip Backward -->
                    <button class="control-btn skip-btn" id="skipBackward" title="Skip back 15s (←)">
                        <i class="fas fa-undo"></i>
                        <span class="skip-amount">15</span>
                    </button>

                    <!-- Play/Pause -->
                    <button class="control-btn play-btn" id="playPauseBtn" title="Play/Pause (Space)">
                        <i class="fas fa-play"></i>
                    </button>

                    <!-- Skip Forward -->
                    <button class="control-btn skip-btn" id="skipForward" title="Skip forward 15s (→)">
                        <i class="fas fa-redo"></i>
                        <span class="skip-amount">15</span>
                    </button>

                    <!-- Episode Next Button -->
                    ${this.podcasts.length > 1 ? `
                        <button class="nav-btn" id="nextEpisode"
                                title="Next episode"
                                ${this.currentIndex === this.podcasts.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-step-forward"></i>
                        </button>
                    ` : ''}
                </div>

                <!-- Progress Bar -->
                <div class="progress-section">
                    <span class="time-display" id="currentTime">0:00</span>
                    <div class="progress-bar-container" id="progressContainer">
                        <div class="progress-bar" id="progressBar"></div>
                        <div class="progress-handle" id="progressHandle"></div>
                    </div>
                    <span class="time-display" id="duration">0:00</span>
                </div>

                <!-- Secondary Controls -->
                <div class="secondary-controls">
                    <!-- Speed Control -->
                    <div class="speed-control">
                        <button class="control-btn-small" id="speedBtn" title="Playback speed">
                            <i class="fas fa-tachometer-alt"></i>
                            <span class="speed-value">${this.playbackRate}x</span>
                        </button>
                        <div class="speed-menu" id="speedMenu">
                            <button class="speed-option" data-speed="0.5">0.5x</button>
                            <button class="speed-option" data-speed="0.75">0.75x</button>
                            <button class="speed-option active" data-speed="1">1x</button>
                            <button class="speed-option" data-speed="1.25">1.25x</button>
                            <button class="speed-option" data-speed="1.5">1.5x</button>
                            <button class="speed-option" data-speed="2">2x</button>
                        </div>
                    </div>

                    <!-- Volume Control -->
                    <div class="volume-control">
                        <button class="control-btn-small" id="volumeBtn" title="Volume">
                            <i class="fas fa-volume-up"></i>
                        </button>
                        <div class="volume-slider-container" id="volumeSliderContainer">
                            <input
                                type="range"
                                id="volumeSlider"
                                class="volume-slider"
                                min="0"
                                max="100"
                                value="${this.volume * 100}"
                            >
                        </div>
                    </div>

                    <!-- Download -->
                    <a
                        href="${this.podcast.audioUrl}"
                        download="${this.podcast.title}.m4a"
                        class="control-btn-small"
                        title="Download podcast"
                    >
                        <i class="fas fa-download"></i>
                    </a>
                </div>

                <!-- Loading Indicator -->
                <div class="loading-indicator" id="loadingIndicator">
                    <div class="spinner"></div>
                    <span>Loading...</span>
                </div>

                <!-- Keyboard Shortcuts Help -->
                <div class="shortcuts-hint">
                    <i class="fas fa-keyboard"></i>
                    <span>Shortcuts: Space (play/pause), ← (back 15s), → (forward 15s), ↑ (volume up), ↓ (volume down)</span>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Episode selector buttons
        if (this.podcasts.length > 1) {
            document.querySelectorAll('.episode-option').forEach(btn => {
                btn.addEventListener('click', () => this.selectEpisode(parseInt(btn.dataset.index)));
            });

            // Previous/Next buttons
            const prevBtn = document.getElementById('prevEpisode');
            const nextBtn = document.getElementById('nextEpisode');
            if (prevBtn) prevBtn.addEventListener('click', () => this.previousEpisode());
            if (nextBtn) nextBtn.addEventListener('click', () => this.nextEpisode());
        }

        // Play/Pause
        const playPauseBtn = document.getElementById('playPauseBtn');
        playPauseBtn.addEventListener('click', () => this.togglePlayPause());

        // Skip buttons
        document.getElementById('skipBackward').addEventListener('click', () => this.skip(-15));
        document.getElementById('skipForward').addEventListener('click', () => this.skip(15));

        // Progress bar
        const progressContainer = document.getElementById('progressContainer');
        const progressHandle = document.getElementById('progressHandle');

        progressContainer.addEventListener('click', (e) => this.handleProgressClick(e));
        progressHandle.addEventListener('mousedown', (e) => this.startSeeking(e));
        progressHandle.addEventListener('touchstart', (e) => this.startSeeking(e));

        // Speed control
        const speedBtn = document.getElementById('speedBtn');
        const speedMenu = document.getElementById('speedMenu');

        speedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            speedMenu.classList.toggle('show');
        });

        document.querySelectorAll('.speed-option').forEach(btn => {
            btn.addEventListener('click', () => this.setPlaybackRate(parseFloat(btn.dataset.speed)));
        });

        // Volume control
        const volumeBtn = document.getElementById('volumeBtn');
        const volumeSliderContainer = document.getElementById('volumeSliderContainer');
        const volumeSlider = document.getElementById('volumeSlider');

        volumeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            volumeSliderContainer.classList.toggle('show');
        });

        volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.handleMetadataLoaded());
        this.audio.addEventListener('timeupdate', () => this.handleTimeUpdate());
        this.audio.addEventListener('ended', () => this.handleEnded());
        this.audio.addEventListener('waiting', () => this.showLoading());
        this.audio.addEventListener('canplay', () => this.hideLoading());
        this.audio.addEventListener('error', (e) => this.handleError(e));

        // Close menus when clicking outside
        document.addEventListener('click', () => {
            speedMenu.classList.remove('show');
            volumeSliderContainer.classList.remove('show');
        });

        // Document-level mouse/touch events for seeking
        document.addEventListener('mousemove', (e) => this.handleSeekMove(e));
        document.addEventListener('mouseup', () => this.stopSeeking());
        document.addEventListener('touchmove', (e) => this.handleSeekMove(e));
        document.addEventListener('touchend', () => this.stopSeeking());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.skip(-15);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.skip(15);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.setVolume(Math.min(1, this.volume + 0.1));
                    document.getElementById('volumeSlider').value = this.volume * 100;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.setVolume(Math.max(0, this.volume - 0.1));
                    document.getElementById('volumeSlider').value = this.volume * 100;
                    break;
            }
        });
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    async play() {
        try {
            await this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
        this.saveProgress();
    }

    skip(seconds) {
        this.audio.currentTime = Math.max(0, Math.min(this.duration, this.audio.currentTime + seconds));
    }

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        this.audio.playbackRate = rate;
        this.savePlaybackRate();

        // Update UI
        document.querySelector('.speed-value').textContent = `${rate}x`;
        document.querySelectorAll('.speed-option').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.speed) === rate);
        });
        document.getElementById('speedMenu').classList.remove('show');
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.volume;
        this.saveVolume();
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const icon = document.querySelector('#volumeBtn i');
        if (this.volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (this.volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    updatePlayButton() {
        const icon = document.querySelector('#playPauseBtn i');
        icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }

    handleProgressClick(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.duration;
    }

    startSeeking(e) {
        this.isSeeking = true;
        e.preventDefault();
    }

    handleSeekMove(e) {
        if (!this.isSeeking) return;

        const progressContainer = document.getElementById('progressContainer');
        const rect = progressContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

        this.audio.currentTime = percent * this.duration;
    }

    stopSeeking() {
        if (this.isSeeking) {
            this.isSeeking = false;
            this.saveProgress();
        }
    }

    handleMetadataLoaded() {
        this.duration = this.audio.duration;
        document.getElementById('duration').textContent = this.formatTime(this.duration);
    }

    handleTimeUpdate() {
        if (!this.isSeeking) {
            this.currentTime = this.audio.currentTime;
            this.updateProgress();

            // Auto-save progress every 10 seconds
            if (Math.floor(this.currentTime) % 10 === 0) {
                this.saveProgress();
            }
        }
    }

    handleEnded() {
        this.isPlaying = false;
        this.updatePlayButton();
        this.saveProgress();

        // Auto-advance to next episode if available
        if (this.podcasts.length > 1 && this.currentIndex < this.podcasts.length - 1) {
            console.log('[Podcast Player] Episode ended, auto-advancing to next episode...');
            // Small delay for better UX
            setTimeout(() => {
                this.nextEpisode();
            }, 1000);
        } else {
            // Last episode or single episode - reset to beginning
            this.audio.currentTime = 0;
        }
    }

    handleError(e) {
        console.error('Audio error:', e);
        this.hideLoading();
        alert('Error loading podcast. Please try again later.');
    }

    updateProgress() {
        const percent = (this.currentTime / this.duration) * 100;
        document.getElementById('progressBar').style.width = `${percent}%`;
        document.getElementById('progressHandle').style.left = `${percent}%`;
        document.getElementById('currentTime').textContent = this.formatTime(this.currentTime);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';

        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showLoading() {
        document.getElementById('loadingIndicator').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
    }

    // Local Storage Methods
    saveProgress() {
        localStorage.setItem(this.storageKey, this.currentTime.toString());
    }

    loadProgress() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            this.audio.currentTime = parseFloat(saved);
        }
    }

    saveVolume() {
        localStorage.setItem('podcast_volume', this.volume.toString());
    }

    loadVolume() {
        const saved = localStorage.getItem('podcast_volume');
        return saved ? parseFloat(saved) : 0.8;
    }

    savePlaybackRate() {
        localStorage.setItem('podcast_playbackRate', this.playbackRate.toString());
    }

    loadPlaybackRate() {
        const saved = localStorage.getItem('podcast_playbackRate');
        return saved ? parseFloat(saved) : 1;
    }

    // Episode Navigation
    async selectEpisode(index) {
        if (index < 0 || index >= this.podcasts.length || index === this.currentIndex) return;

        console.log(`[Podcast Player] Switching from episode ${this.currentIndex + 1} to ${index + 1}`);

        // Remember if we were playing before switching
        const wasPlaying = this.isPlaying;
        console.log(`[Podcast Player] Was playing: ${wasPlaying}`);

        // Pause current playback
        if (this.isPlaying) {
            this.pause();
        }

        // Update current index and podcast
        this.currentIndex = index;
        this.podcast = this.podcasts[this.currentIndex];

        // Update storage key BEFORE loading new source
        this.storageKey = `podcast_${this.podcast.id}_progress`;

        // Change audio source - this will trigger loading
        this.audio.src = this.podcast.audioUrl;

        // Reset playback state
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;

        // Update UI - title, description, episode buttons
        document.querySelector('.podcast-player-title').textContent = this.podcast.title;
        document.querySelector('.podcast-player-host').textContent = this.podcast.host;
        document.querySelector('.podcast-player-date').textContent = this.podcast.date;
        document.querySelector('.podcast-description p').textContent = this.podcast.description;

        // Update download link
        const downloadLink = document.querySelector('.secondary-controls a[download]');
        if (downloadLink) {
            downloadLink.href = this.podcast.audioUrl;
            downloadLink.download = `${this.podcast.title}.m4a`;
        }

        // Update episode selector buttons
        document.querySelectorAll('.episode-option').forEach((btn, idx) => {
            btn.classList.toggle('active', idx === this.currentIndex);
        });

        // Update nav buttons disabled state
        const prevBtn = document.getElementById('prevEpisode');
        const nextBtn = document.getElementById('nextEpisode');
        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentIndex === this.podcasts.length - 1;

        // Reset progress bar
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressHandle').style.left = '0%';
        document.getElementById('currentTime').textContent = '0:00';
        document.getElementById('duration').textContent = '0:00';

        // Wait for metadata to load, then restore position or auto-play
        const handleNewEpisodeReady = async () => {
            // Load saved progress for this episode
            const savedProgress = localStorage.getItem(this.storageKey);
            if (savedProgress) {
                this.audio.currentTime = parseFloat(savedProgress);
            }

            // If was playing before, auto-play the new episode
            if (wasPlaying) {
                try {
                    await this.audio.play();
                    this.isPlaying = true;
                    this.updatePlayButton();
                } catch (error) {
                    console.error('Error auto-playing new episode:', error);
                }
            }

            // Remove this one-time listener
            this.audio.removeEventListener('loadedmetadata', handleNewEpisodeReady);
        };

        // Attach one-time listener for when new audio is ready
        this.audio.addEventListener('loadedmetadata', handleNewEpisodeReady);

        // Scroll to player if multiple episodes
        const player = document.getElementById('podcastPlayer');
        if (player) {
            player.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    previousEpisode() {
        if (this.currentIndex > 0) {
            this.selectEpisode(this.currentIndex - 1);
        }
    }

    nextEpisode() {
        if (this.currentIndex < this.podcasts.length - 1) {
            this.selectEpisode(this.currentIndex + 1);
        }
    }

    // Public API
    destroy() {
        this.pause();
        this.audio = null;
    }
}

// Export default
export default PodcastPlayer;
