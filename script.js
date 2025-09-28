// Progress tracking system using localStorage for persistence
const ProgressTracker = {
    data: {
        videosWatched: 0,
        coursesCompleted: 0,
        lessonsStarted: 0,
        htmlStatus: 'not-started',
        cssStatus: 'not-started',
        jsStatus: 'not-started'
    },

    init() {
        const saved = localStorage.getItem('educode-progress');
        if (saved) {
            this.data = JSON.parse(saved);
        }
        this.updateDisplay();
    },

    save() {
        localStorage.setItem('educode-progress', JSON.stringify(this.data));
    },

    updateProgress(action) {
        switch(action) {
            case 'video':
                this.data.videosWatched++;
                break;
            case 'course':
                this.data.coursesCompleted++;
                break;
            case 'lesson':
                this.data.lessonsStarted++;
                break;
        }
        this.calculateProgress();
        this.save();
        this.updateDisplay();
    },

    setCourseStatus(course, status) {
        this.data[course + 'Status'] = status;
        this.calculateProgress();
        this.save();
        this.updateDisplay();
    },

    calculateProgress() {
        const total = this.data.videosWatched + this.data.coursesCompleted + this.data.lessonsStarted;
        const courseStatuses = [this.data.htmlStatus, this.data.cssStatus, this.data.jsStatus];
        const startedCourses = courseStatuses.filter(status => status === 'in-progress' || status === 'complete').length;
        
        const possiblePoints = 23;
        const actualPoints = Math.min(total + (startedCourses * 3), possiblePoints);
        
        return Math.round((actualPoints / possiblePoints) * 100);
    },

    updateDisplay() {
        const progress = this.calculateProgress();
        
        const progressBar = document.getElementById('overall-progress');
        const progressText = document.getElementById('progress-percentage');
        if (progressBar && progressText) {
            progressBar.style.width = progress + '%';
            progressText.textContent = progress;
        }

        const videosCount = document.getElementById('videos-count');
        const coursesCompleted = document.getElementById('courses-completed');
        const lessonsStarted = document.getElementById('lessons-started');
        
        if (videosCount) videosCount.textContent = this.data.videosWatched;
        if (coursesCompleted) coursesCompleted.textContent = this.data.coursesCompleted;
        if (lessonsStarted) lessonsStarted.textContent = this.data.lessonsStarted;

        this.updateStatusIndicator('html', this.data.htmlStatus);
        this.updateStatusIndicator('css', this.data.cssStatus);
        this.updateStatusIndicator('js', this.data.jsStatus);
    },

    updateStatusIndicator(course, status) {
        const element = document.getElementById(course + '-status');
        if (element) {
            element.className = '';
            switch(status) {
                case 'complete':
                    element.className = 'complete';
                    element.textContent = '✓';
                    break;
                case 'in-progress':
                    element.className = 'in-progress';
                    element.textContent = '✓';
                    break;
                default:
                    element.className = 'not-started';
                    element.textContent = '○';
            }
        }
    },

    reset() {
        this.data = {
            videosWatched: 0,
            coursesCompleted: 0,
            lessonsStarted: 0,
            htmlStatus: 'not-started',
            cssStatus: 'not-started',
            jsStatus: 'not-started'
        };
        this.save();
        this.updateDisplay();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    function showPage(pageName) {

        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            const articles = document.querySelectorAll('article');
            articles.forEach(article => {
                article.style.display = 'none';
            });
            const targetPage = document.querySelector('.' + pageName + '-content');
            if (targetPage) {
                targetPage.style.display = 'block';
            }
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const initialPage = urlParams.get('page') || 'home';

    function highlightActiveLink() {
        let activePage = initialPage;
        // If we are on a course page (e.g., html.html), set activePage to 'courses'
        if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
            activePage = 'courses'; // Assuming all other HTML files are course pages
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === activePage) {
                link.classList.add('active');
            }
        });
    }

    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        showPage(initialPage);
    } else {
        const coursePageArticle = document.querySelector('article.course-page-content');
        if (coursePageArticle) {
            coursePageArticle.style.display = 'block';
        }
    }

    // Initial highlighting
    highlightActiveLink();

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Check if the link is navigating to index.html with a page parameter
            if (this.href.includes('index.html') && this.getAttribute('data-page')) {
                // Allow default navigation to index.html with the page parameter
                // The receiving index.html will handle showing the correct page
            } else if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                e.preventDefault();
                const page = this.getAttribute('data-page');
                showPage(page);

                history.pushState(null, '', `index.html?page=${page}`);

                if (page === 'progress') {
                    ProgressTracker.updateDisplay();
                }

                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    ProgressTracker.init();

    document.querySelectorAll('.video-card').forEach(card => {
        const watchButton = card.querySelector('.watch-video-btn');
        const closeButton = card.querySelector('.close-video-btn');
        const videoCardBack = card.querySelector('.video-card-back');
        const videoElement = card.querySelector('video');
        const videoSource = videoElement ? videoElement.querySelector('source') : null; // This line is technically no longer needed but harmless

        if (watchButton) {
            watchButton.addEventListener('click', function(e) {
                e.stopPropagation();
                card.classList.add('flipped');
                if (videoElement && videoCardBack) {
                    const videoSrc = videoCardBack.getAttribute('data-video-src');
                    if (videoSrc) {
                        videoElement.src = videoSrc;
                        videoElement.load();
                        videoElement.play();
                    }
                }
                if (typeof ProgressTracker !== 'undefined') {
                    ProgressTracker.updateProgress('video');
                }
            });
        } else {
            console.warn('Watch Now button not found for card:', card.dataset.videoId);
        }

        if (closeButton) {
            closeButton.addEventListener('click', function(e) {
                e.stopPropagation();
                card.classList.remove('flipped');
                if (videoElement) {
                    videoElement.pause();
                    videoElement.currentTime = 0;
                    videoElement.src = '';
                    videoElement.load();
                }
            });
        } else {
            console.warn('Close Video button not found for card:', card.dataset.videoId);
        }

        card.addEventListener('click', function(e) {
            if (card.classList.contains('flipped') && !e.target.closest('.video-card-back')) {
                card.classList.remove('flipped');
                if (videoElement) {
                    videoElement.pause();
                    videoElement.currentTime = 0;
                    videoElement.src = '';
                    videoElement.load();
                }
            }
        });
    });
});

function updateProgress(action) {
    ProgressTracker.updateProgress(action);

    const progress = ProgressTracker.calculateProgress();
    if (progress > 20 && ProgressTracker.data.htmlStatus === 'not-started') {
        ProgressTracker.setCourseStatus('html', 'in-progress');
    }
    if (progress > 40 && ProgressTracker.data.cssStatus === 'not-started') {
        ProgressTracker.setCourseStatus('css', 'in-progress');
    }
    if (progress > 70 && ProgressTracker.data.jsStatus === 'not-started') {
        ProgressTracker.setCourseStatus('js', 'in-progress');
    }
}

function resetProgress() {
    ProgressTracker.reset();
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('start-course-btn') && e.target.tagName === 'BUTTON') {
        const courseCard = e.target.closest('.course-card');
        if (courseCard) {
            const courseTitle = courseCard.querySelector('h3').textContent;

            updateProgress('lesson');
            alert(`Starting "${courseTitle}"!\nIn a real application, this would open video lessons.`);
        }
    }
});
