/***************************************************************
 * GLOBAL VARIABLES & HELPERS
 ***************************************************************/
let totalEasy = 0;       // total # of easy problems
let totalMedium = 0;     // total # of medium
let totalHard = 0;       // total # of hard
let problemData = [];    // store fetched data
let uniqueProblems = new Set(); // store unique problem labels
let uniqueEasy = new Set();
let uniqueMedium = new Set();
let uniqueHard = new Set();
let sectionsClickHandler = null;
window.dsaDataCache = null;
let celebrationTimer = null;
let celebrationInProgress = false;
// Add favorites storage
let favorites = {};

// Add confetti script dynamically
const confettiScript = document.createElement('script');
confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
document.head.appendChild(confettiScript);

// Track current section
let currentSection = 'dsa';

// Track banner calls for debugging
let bannerCallCount = 0;

// Add throttle helper function here
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

/***************************************************************
 * GO TO TOP BUTTON
 ***************************************************************/

var btn = document.getElementById('go-to-top-button');

window.addEventListener('scroll', throttle(function () {
  if (window.scrollY > 300) {
    btn.classList.add('show');
  } else {
    btn.classList.remove('show');
  }
}, 100)); // Throttle to execute at most once every 100ms

btn.addEventListener('click', function (e) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/***************************************************************
 * FAVORITE/BOOKMARK FUNCTIONS
 ***************************************************************/
function toggleFavorite(star, problemId, event) {
  // Prevent the click from triggering the link
  event.preventDefault();
  event.stopPropagation();
  
  const isFavorited = star.getAttribute('data-favorited') === 'true';
  
  // Add animation class
  star.classList.add('animating');
  
  // Toggle the favorite state
  star.setAttribute('data-favorited', !isFavorited);
  star.textContent = !isFavorited ? 'star' : 'star_border';

  // Update favorites object
  if (!isFavorited) {
    favorites[problemId] = true;
  } else {
    delete favorites[problemId];
  }

  // Save to localStorage
  saveFavorites();

  // Remove animation class after animation completes
  setTimeout(() => {
    star.classList.remove('animating');
  }, 400);

  // Show toast notification
  M.toast({
    html: `<span class="success-toast">${!isFavorited ? 'Added to favorites!' : 'Removed from favorites'}</span>`,
    classes: 'rounded',
    displayLength: 1500
  });
}

function saveFavorites() {
  localStorage.setItem(`${currentSection}Favorites`, JSON.stringify(favorites));
}

/***************************************************************
 * NAVBAR TOOLTIPS - NOW USING PURE CSS
 * No JavaScript needed - tooltips handled by CSS ::after pseudo-elements
 ***************************************************************/

/***************************************************************
 * MODERN MOBILE NAVIGATION
 ***************************************************************/
function initializeMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenuDropdown = document.getElementById('mobileMenuDropdown');

  if (mobileMenuToggle && mobileMenuDropdown) {
    // Toggle dropdown on hamburger click
    mobileMenuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('active');
      mobileMenuDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.navbar')) {
        mobileMenuToggle.classList.remove('active');
        mobileMenuDropdown.classList.remove('active');
      }
    });

    // Close dropdown when clicking on a menu item
    const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');
    mobileMenuItems.forEach(item => {
      item.addEventListener('click', function () {
        mobileMenuToggle.classList.remove('active');
        mobileMenuDropdown.classList.remove('active');
      });
    });

    // Close on escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenuDropdown.classList.contains('active')) {
        mobileMenuToggle.classList.remove('active');
        mobileMenuDropdown.classList.remove('active');
      }
    });
  }
}

// Function to update mobile menu active state
function updateMobileMenuActive(activeId) {
  // Remove active class from all mobile menu items
  document.querySelectorAll('.mobile-menu-item').forEach(item => {
    item.classList.remove('active');
  });

  // Add active class to the clicked mobile menu item
  const activeItem = document.getElementById(activeId);
  if (activeItem) {
    activeItem.classList.add('active');
  }
}



// Function to update desktop navigation active state
function updateDesktopNavActive(activeId) {
  // Remove active class from all desktop nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Add active class to the clicked nav item
  const activeItem = document.getElementById(activeId);
  if (activeItem) {
    activeItem.classList.add('active');
  }
}


/***************************************************************
 * CELEBRATION FUNCTIONS
 ***************************************************************/
function triggerCelebration() {
  if (celebrationInProgress) {
    return;
  }
  if (typeof confetti === 'undefined') {
    console.warn('Confetti library not loaded yet');
    return;
  }

  const colors = [
    '#4F46E5', // Primary
    '#10B981', // Accent
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#22C55E', // Success
    '#F59E0B', // Warning
    '#EF4444'  // Error
  ];

  // Create a custom canvas that spans the entire viewport
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';

  // Account for zoom by scaling the canvas
  const zoomLevel = 0.8; // Your body zoom is 80%
  canvas.width = window.innerWidth / zoomLevel;
  canvas.height = window.innerHeight / zoomLevel;
  canvas.style.transform = `scale(${1 / zoomLevel})`;
  canvas.style.transformOrigin = 'top left';

  // Add canvas to body
  document.body.appendChild(canvas);

  // Create confetti instance with our custom canvas
  const myConfetti = confetti.create(canvas, {
    resize: true,
    useWorker: false, // Changed to false for better control
    disableForReducedMotion: true
  });

  // Center burst - full screen coverage
  myConfetti({
    particleCount: 50,
    spread: 360,
    origin: { x: 0.5, y: 0.5 },
    colors: colors,
    scalar: 1.2,
    gravity: 1.2
  });

  // Side bursts
  setTimeout(() => {
    myConfetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 0, y: 0.5 },
      colors: colors
    });
    myConfetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 1, y: 0.5 },
      colors: colors
    });
  }, 200);

  // Top corner bursts
  setTimeout(() => {
    myConfetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 0, y: 0 },
      colors: colors,
      scalar: 1.2,
      gravity: 1.2
    });
    myConfetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 1, y: 0 },
      colors: colors,
      scalar: 1.2,
      gravity: 1.2
    });
  }, 200);

  // Bottom corner bursts
  setTimeout(() => {
    myConfetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 0, y: 1 },
      colors: colors,
      scalar: 1.2,
      gravity: 1.2
    });
    myConfetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 1, y: 1 },
      colors: colors,
      scalar: 1.2,
      gravity: 1.2
    });
  }, 200);

  // Final big burst
  setTimeout(() => {
    myConfetti({
      particleCount: 30,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
      ticks: 300,
      scalar: 1.2,
      gravity: 1.2
    });
    celebrationInProgress = false;
  }, 200);
}

/***************************************************************
 * GET GLOBAL SOLVED
 ***************************************************************/
function getGlobalSolved() {
  const icons = document.querySelectorAll('.done-icon');
  let solved = { easy: 0, medium: 0, hard: 0 };

  icons.forEach(icon => {
    // Skip if we're not in DSA section
    if (currentSection !== 'dsa') {
      if (icon.getAttribute('data-solved') === 'true') {
        const difficulty = icon.getAttribute('data-difficulty');
        if (difficulty && solved[difficulty] !== undefined) {
          solved[difficulty]++;
        }
      }
      return;
    }

    // For DSA section, check if this is in Puzzles section
    // Need to find the main section, not just any collapsible
    let section = icon.closest('.collapsible.z-depth-1');

    // If not found, try to find it through the subsection
    if (!section) {
      const subsection = icon.closest('.subsection-collapsible');
      if (subsection) {
        section = subsection.closest('.collapsible.z-depth-1');
      }
    }

    if (section) {
      const sectionId = section.getAttribute('id');

      // Check if this is the Puzzles section by ID
      // The ID is "Puzzles(NotcountedInDSA)" based on the title
      if (sectionId && (sectionId.toLowerCase() === 'puzzles' ||
        sectionId.toLowerCase().includes('puzzles') ||
        sectionId === 'Puzzles(NotcountedInDSA)')) {
        return; // Skip Puzzle section problems
      }
    }

    // Count the problem if it's solved and not in Puzzle section
    if (icon.getAttribute('data-solved') === 'true') {
      const difficulty = icon.getAttribute('data-difficulty');
      if (difficulty && solved[difficulty] !== undefined) {
        solved[difficulty]++;
      }
    }
  });
  return solved;
}

/***************************************************************
 * TOGGLE SOLVED
 ***************************************************************/
function toggleSolved(icon) {
  // Check if this problem is in the Puzzle section FIRST
  let section = icon.closest('.collapsible.z-depth-1');

  // If not found, try to find it through the subsection
  if (!section) {
    const subsection = icon.closest('.subsection-collapsible');
    if (subsection) {
      section = subsection.closest('.collapsible.z-depth-1');
    }
  }

  if (section && currentSection === 'dsa') {
    const sectionId = section.getAttribute('id');
    if (sectionId && (sectionId.toLowerCase() === 'puzzles' ||
      sectionId.toLowerCase().includes('puzzles') ||
      sectionId === 'Puzzles(NotcountedInDSA)')) {
      console.log('This is a Puzzle problem - skipping global update');

      // Get current state
      const wasSolved = icon.getAttribute('data-solved') === 'true';

      // Toggle the visual state
      icon.setAttribute('data-solved', !wasSolved);
      icon.textContent = !wasSolved ? 'check_box' : 'check_box_outline_blank';
      icon.parentElement.parentElement.classList.toggle('solved', !wasSolved);

      // For Puzzle section, only save progress and trigger celebration
      if (!wasSolved) {
        clearTimeout(celebrationTimer);
        celebrationTimer = setTimeout(() => {
          triggerCelebration();
        }, 300);
      }
      // IMPORTANT: Still update section progress for mini-bars!
      updateSectionProgress();
      saveProgress();
      // Check for section completion/incompletion after updating progress
      setTimeout(() => {
        checkSectionCompletion(icon);
      }, 100);

      // IMPORTANT: Exit here to prevent global updates
      return; // This should prevent the rest of the function from executing
    }
  }

  // For non-puzzle sections, proceed normally
  const wasSolved = icon.getAttribute('data-solved') === 'true';

  // Toggle the solved state
  icon.setAttribute('data-solved', !wasSolved);
  icon.textContent = !wasSolved ? 'check_box' : 'check_box_outline_blank';
  icon.parentElement.parentElement.classList.toggle('solved', !wasSolved);

  // If marking as solved, trigger celebration
  if (!wasSolved) {
    clearTimeout(celebrationTimer);
    celebrationTimer = setTimeout(() => {
      triggerCelebration();
    }, 400);
  }

  saveProgress();
  updateGlobalRectBar();
  updateSectionProgress();

  // Check for section completion/incompletion after updating progress
  setTimeout(() => {
    checkSectionCompletion(icon);
  }, 100);
}

/***************************************************************
 * SAVE & LOAD PROGRESS (SOLVED STATES)
 ***************************************************************/
function saveProgress() {
  const solvedProblems = {};
  document.querySelectorAll('.done-icon[data-solved="true"]').forEach(icon => {
    const problemId = icon.getAttribute('data-problem-id'); // We'll set this when rendering
    if (problemId) {
      solvedProblems[problemId] = true;
    }
  });

  try {
    localStorage.setItem(`${currentSection}SolvedProblems`, JSON.stringify(solvedProblems));
  } catch (e) {
    console.error('Failed to save progress:', e);
    // Handle quota exceeded error
  }
}

function loadProgress() {
  // Load from section-specific storage
  const saved = localStorage.getItem(`${currentSection}SolvedProblems`);
  if (saved) {
    const solvedProblems = JSON.parse(saved);
    document.querySelectorAll('.done-icon').forEach(icon => {
      const problemId = icon.getAttribute('data-problem-id');
      if (problemId && solvedProblems[problemId]) {
        icon.setAttribute('data-solved', 'true');
        icon.textContent = 'check_box';
        icon.parentElement.parentElement.classList.add('solved');
      }
    });
  }

  // Load favorites after DOM is fully loaded
  setTimeout(() => {
    loadFavorites();
  }, 500);
}

/***************************************************************
 * MULTI-SELECT FILTER FUNCTIONS
 ***************************************************************/
function getSelectedFilters() {
  const activeToggles = document.querySelectorAll('#filterDropdown .filter-toggle.active');
  const filters = {
    difficulties: [],
    statuses: [],
    specials: []  // ADD THIS LINE
  };

  activeToggles.forEach(toggle => {
    const value = toggle.getAttribute('data-value');
    if (['easy', 'medium', 'hard'].includes(value)) {
      filters.difficulties.push(value);
    } else if (['completed', 'incomplete'].includes(value)) {
      filters.statuses.push(value);
    } else if (value === 'favourite') {  // ADD THIS CONDITION
      filters.specials.push(value);
    } else if (value === 'mustdo') {  // ADD THIS CONDITION
      filters.specials.push(value);
    }
  });

  return filters;
}

function updateFilterDisplay() {
  const selectedFilters = getSelectedFilters();
  const totalSelected = selectedFilters.difficulties.length + selectedFilters.statuses.length + selectedFilters.specials.length;
  const countElement = document.getElementById('selectedCount');

  if (totalSelected > 0) {
    countElement.textContent = `${totalSelected} selected`;
    countElement.style.display = 'inline-block';
  } else {
    countElement.style.display = 'none';
  }
}

function clearAllFilters() {
  // Clear all active filter toggles
  const toggleButtons = document.querySelectorAll('#filterDropdown .filter-toggle');
  toggleButtons.forEach(toggle => {
    toggle.classList.remove('active');
  });

  // Update the display
  updateFilterDisplay();

  // Clear search box
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.value = '';
  }

  // Apply the cleared filters
  filterProblems();
}

// Save current section's filter state
function saveFilterState() {
  if (!currentSection) return;

  const selectedFilters = getSelectedFilters();
  const searchBox = document.getElementById('searchBox');
  const searchTerm = '';

  const filterState = {
    difficulties: selectedFilters.difficulties,
    statuses: selectedFilters.statuses,
    searchTerm: searchTerm
  };

  localStorage.setItem(`filterState_${currentSection}`, JSON.stringify(filterState));
}

// Restore filter state for current section
function restoreFilterState() {
  if (!currentSection) return;

  const savedState = localStorage.getItem(`filterState_${currentSection}`);
  if (!savedState) return;

  try {
    const filterState = JSON.parse(savedState);

    // Clear all current filters first
    const toggleButtons = document.querySelectorAll('#filterDropdown .filter-toggle');
    toggleButtons.forEach(toggle => {
      toggle.classList.remove('active');
    });

    // Restore difficulty filters
    filterState.difficulties.forEach(difficulty => {
      const toggle = document.querySelector(`#filterDropdown .filter-toggle[data-value="${difficulty}"]`);
      if (toggle) {
        toggle.classList.add('active');
      }
    });

    // Restore status filters
    filterState.statuses.forEach(status => {
      const toggle = document.querySelector(`#filterDropdown .filter-toggle[data-value="${status}"]`);
      if (toggle) {
        toggle.classList.add('active');
      }
    });

    // Don't restore search term - keep it empty
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
      searchBox.value = '';
    }
    // Update display and apply filters
    updateFilterDisplay();
    filterProblems();

  } catch (error) {
    console.error('Error restoring filter state:', error);
  }
}

function setupMultiSelectFilter() {
  const filterDisplay = document.getElementById('filterDisplay');
  const filterDropdown = document.getElementById('filterDropdown');
  const clearButton = document.getElementById('clearFilters');

  // Toggle dropdown on click
  if (filterDisplay) {
    filterDisplay.addEventListener('click', function (e) {
      e.stopPropagation();
      filterDropdown.classList.toggle('active');
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.multi-select-container')) {
      filterDropdown.classList.remove('active');
    }
  });

  // Handle toggle button clicks
  const toggleButtons = document.querySelectorAll('#filterDropdown .filter-toggle');
  toggleButtons.forEach(toggle => {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      this.classList.toggle('active');
      updateFilterDisplay();
      filterProblems(e); // Pass the event parameter!
      saveFilterState(); // Save filter state when changed
    });
  });

  // Handle clear all button
  if (clearButton) {
    clearButton.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleButtons.forEach(toggle => {
        toggle.classList.remove('active');
      });
      updateFilterDisplay();
      filterProblems(e); // Pass the event parameter!
    });
  }

  // Initialize display
  updateFilterDisplay();
}

function setupRandomButton() {
  const randomButton = document.getElementById('randomButton');
  if (!randomButton) {
    console.error('Random button not found!');
    return;
  }

  // console.log('Setting up random button:', randomButton);
  // console.log('Random button position:', randomButton.getBoundingClientRect());

  randomButton.addEventListener('click', function () {
    openRandomUnsolvedProblem();
  });

  // Ensure tooltip is set up for the random button
  setupTooltipForElement(randomButton);
}

function openRandomUnsolvedProblem() {
  // Get all unsolved problems
  const unsolvedProblems = [];

  // Find all problem rows that are not solved
  const allRows = document.querySelectorAll('tbody tr');
  allRows.forEach(row => {
    const doneIcon = row.querySelector('.done-icon');
    const isCompleted = doneIcon ? doneIcon.getAttribute('data-solved') === 'true' : false;

    if (!isCompleted) {
      const questionLink = row.querySelector('td a[href]');
      if (questionLink && questionLink.href) {
        unsolvedProblems.push({
          element: row,
          link: questionLink.href,
          title: questionLink.textContent,
          section: row.closest('.collapsible')
        });
      }
    }
  });

  if (unsolvedProblems.length === 0) {
    // Show a celebration message if all problems are solved
    showRandomMessage('🎉 Congratulations! All problems are solved!');
    return;
  }

  // Pick a random unsolved problem
  const randomIndex = Math.floor(Math.random() * unsolvedProblems.length);
  const randomProblem = unsolvedProblems[randomIndex];

  // Show message with problem info immediately
  showRandomMessage(`🎯 Random Problem: ${randomProblem.title}`);

  // Open the problem link after 2 seconds of banner being shown
  setTimeout(() => {
    window.open(randomProblem.link, '_blank');
  }, 2000);
}

function showRandomMessage(message) {
  // Create or update a temporary message element
  let messageElement = document.getElementById('randomMessage');
  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.id = 'randomMessage';
    messageElement.style.cssText = `
      position: fixed;
      top: 120px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: linear-gradient(135deg, #8B5CF6, #7C3AED);
      color: white;
      padding: 16px 32px;
      border-radius: 30px;
      font-weight: 700;
      font-size: 16px;
      z-index: 10000;
      box-shadow: 0 12px 30px rgba(139, 92, 246, 0.4);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    document.body.appendChild(messageElement);
  }

  messageElement.textContent = message;

  // Show animation
  setTimeout(() => {
    messageElement.style.opacity = '1';
    messageElement.style.transform = 'translateX(-50%) translateY(0)';
  }, 50);

  // Hide after exactly 3 seconds
  setTimeout(() => {
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateX(-50%) translateY(-20px)';

    // Remove element after animation completes
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 400);
  }, 3000);
}

/***************************************************************
 * FILTER PROBLEMS
 ***************************************************************/
function filterProblems(event) {
  const searchBox = document.getElementById('searchBox');
  if (!searchBox) return;

  const searchTerm = searchBox.value.toLowerCase();

  // Get selected filters from multi-select
  const selectedFilters = getSelectedFilters();
  // console.log('Filtering with search term:', searchTerm, 'filters:', selectedFilters);

  const sections = document.querySelectorAll('.collapsible');
  const clickedSection = event?.target?.closest('.collapsible-header')?.parentElement?.querySelector('.collapsible-body');

  sections.forEach(section => {
    const sectionBody = section.querySelector('.collapsible-body');
    const subsections = sectionBody.querySelectorAll('.subsection-collapsible li');
    let hasMatchInSection = false;

    // Handle sections with subsections
    if (subsections.length > 0) {
      // First, get the parent section's collapsible instance
      const parentInstance = M.Collapsible.getInstance(section);

      subsections.forEach((subsection, subIndex) => {
        const subsectionBody = subsection.querySelector('.collapsible-body');
        const tableRows = subsectionBody.querySelectorAll('tbody tr'); // Only filter tbody rows
        let hasMatchInSubsection = false;

        // Get difficulty filters for this subsection
        const subsectionId = subsection.querySelector('.mini-bars')?.dataset.id;
        if (!subsectionId) return;

        const easyChecked = subsection.querySelector(`.square-check.easy[data-section="${subsectionId}"]`)?.checked ?? true;
        const mediumChecked = subsection.querySelector(`.square-check.medium[data-section="${subsectionId}"]`)?.checked ?? true;
        const hardChecked = subsection.querySelector(`.square-check.hard[data-section="${subsectionId}"]`)?.checked ?? true;

        // Show all difficulties if none are checked
        const showAllDifficulties = !easyChecked && !mediumChecked && !hardChecked;

        tableRows.forEach(row => {
          const text = row.textContent.toLowerCase();
          const difficulty = row.classList.contains('easy') ? 'easy' :
            row.classList.contains('medium') ? 'medium' :
              row.classList.contains('hard') ? 'hard' : '';

          const difficultyEnabled = showAllDifficulties ||
            (difficulty === 'easy' && easyChecked) ||
            (difficulty === 'medium' && mediumChecked) ||
            (difficulty === 'hard' && hardChecked);

          // Apply difficulty filter
          const difficultyMatch = selectedFilters.difficulties.length === 0 ||
            selectedFilters.difficulties.includes(difficulty);

          // Apply status filter
          const doneIcon = row.querySelector('.done-icon');
          const isCompleted = doneIcon ? doneIcon.getAttribute('data-solved') === 'true' : false;
          const statusMatch = selectedFilters.statuses.length === 0 ||
            (selectedFilters.statuses.includes('completed') && isCompleted) ||
            (selectedFilters.statuses.includes('incomplete') && !isCompleted);

          const questionLink = row.querySelector('.question-cell a');
          const problemName = questionLink ? questionLink.textContent.toLowerCase() : '';
          const matchesSearch = searchTerm === '' || problemName.includes(searchTerm);

          // ADD THIS: Check if the problem is favorited
          const favoriteIcon = row.querySelector('.inline-favorite-star');
          const isFavorited = favoriteIcon && favoriteIcon.getAttribute('data-favorited') === 'true';

          // Check if the problem is must-do (important)
          const importantStar = row.querySelector('.important-star');
          const isMustDo = importantStar !== null;
          // ADD THIS: Apply special filters (favourite)
          const specialMatch = selectedFilters.specials.length === 0 ||
            (selectedFilters.specials.includes('favourite') && isFavorited) ||
            (selectedFilters.specials.includes('mustdo') && isMustDo);

          // Only show if all conditions are met
          if (difficultyEnabled && difficultyMatch && statusMatch && specialMatch && matchesSearch) {
            row.style.display = '';
            hasMatchInSubsection = true;
            hasMatchInSection = true;
          } else {
            row.style.display = 'none';
          }
        });

        // Handle subsection visibility and expansion
        if (hasMatchInSubsection) {
          subsection.style.display = '';
          if (searchTerm) {
            // First ensure parent section is open
            if (parentInstance) {
              parentInstance.open(0);
            }

            // Then open the subsection after a small delay
            setTimeout(() => {
              const subsectionInstance = M.Collapsible.getInstance(subsection.closest('.subsection-collapsible'));
              if (subsectionInstance) {
                subsectionInstance.open(subIndex);
              }
            }, 100);
          }
        } else {
          subsection.style.display = 'none';
        }
      });
    } else {
      // Handle sections without subsections
      const tableRows = sectionBody.querySelectorAll('tbody tr'); // Only filter tbody rows
      const sectionId = section.getAttribute('id');
      if (!sectionId) return;

      const easyChecked = section.querySelector(`.square-check.easy[data-section="${sectionId}"]`)?.checked ?? true;
      const mediumChecked = section.querySelector(`.square-check.medium[data-section="${sectionId}"]`)?.checked ?? true;
      const hardChecked = section.querySelector(`.square-check.hard[data-section="${sectionId}"]`)?.checked ?? true;

      const showAllDifficulties = !easyChecked && !mediumChecked && !hardChecked;

      tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const difficulty = row.classList.contains('easy') ? 'easy' :
          row.classList.contains('medium') ? 'medium' :
            row.classList.contains('hard') ? 'hard' : '';

        const difficultyEnabled = showAllDifficulties ||
          (difficulty === 'easy' && easyChecked) ||
          (difficulty === 'medium' && mediumChecked) ||
          (difficulty === 'hard' && hardChecked);

        // Apply difficulty filter
        const difficultyMatch = selectedFilters.difficulties.length === 0 ||
          selectedFilters.difficulties.includes(difficulty);

        // Apply status filter
        const doneIcon = row.querySelector('.done-icon');
        const isCompleted = doneIcon ? doneIcon.getAttribute('data-solved') === 'true' : false;
        const statusMatch = selectedFilters.statuses.length === 0 ||
          (selectedFilters.statuses.includes('completed') && isCompleted) ||
          (selectedFilters.statuses.includes('incomplete') && !isCompleted);

        const questionLink = row.querySelector('.question-cell a');
        const problemName = questionLink ? questionLink.textContent.toLowerCase() : '';
        const matchesSearch = searchTerm === '' || problemName.includes(searchTerm);

        const favoriteIcon = row.querySelector('.inline-favorite-star');
        const isFavorited = favoriteIcon && favoriteIcon.getAttribute('data-favorited') === 'true';

        // ADD THIS: Check if the problem is must-do (important)
        const importantStar = row.querySelector('.important-star');
        const isMustDo = importantStar !== null;

        const specialMatch = selectedFilters.specials.length === 0 ||
          (selectedFilters.specials.includes('favourite') && isFavorited) ||
          (selectedFilters.specials.includes('mustdo') && isMustDo);

        // UPDATE the condition to include specialMatch
        if (difficultyEnabled && difficultyMatch && statusMatch && specialMatch && matchesSearch) {
          row.style.display = '';
          hasMatchInSection = true;
        } else {
          row.style.display = 'none';
        }
      });
    }

    // Handle section visibility and expansion
    if (hasMatchInSection) {
      section.style.display = '';
      if (searchTerm) {
        const instance = M.Collapsible.getInstance(section);
        if (instance) {
          instance.open(0);
        }
      }
    } else {
      section.style.display = 'none';
    }
  });

  // If there's no search term and it's not a checkbox click, collapse all sections
  if (!searchTerm && !event?.target?.classList.contains('square-check')) {
    sections.forEach(section => {
      const instance = M.Collapsible.getInstance(section);
      if (instance) {
        instance.close(0);
      }

      // Also collapse all subsections
      const subsectionCollapsible = section.querySelector('.subsection-collapsible');
      if (subsectionCollapsible) {
        const subsectionInstance = M.Collapsible.getInstance(subsectionCollapsible);
        if (subsectionInstance) {
          for (let i = 0; i < subsectionInstance.$el[0].children.length; i++) {
            subsectionInstance.close(i);
          }
        }
      }
    });
  }

  // console.log('Filtering complete');
}

/***************************************************************
 * BUILD & UPDATE GLOBAL RECTANGULAR PROGRESS BAR
 ***************************************************************/
function buildRectBar() {
  const container = document.getElementById('rectChartContainer');
  if (!container) return;

  // Capitalize the first letter of current section name and format special cases
  let sectionTitle = '';
  if (currentSection === 'dsa') {
    sectionTitle = 'DSA';
  } else if (currentSection === 'blind75') {
    sectionTitle = 'Blind 75';
  } else if (currentSection === 'leetcode150') {
    sectionTitle = 'LeetCode 150';
  } else if (currentSection === 'sql') {
    sectionTitle = 'SQL';
  } else if (currentSection === 'lld') {
    sectionTitle = 'LLD';
  } else if (currentSection === 'hld') {
    sectionTitle = 'HLD';
  } else {
    // Default formatting for other sections
    sectionTitle = currentSection.charAt(0).toUpperCase() + currentSection.slice(1);
  }

  container.innerHTML = `
    <div class="progress-card">
      <h2>${sectionTitle} Progress</h2>
      <div class="stacked-bar">
        <div class="bar-segment easy-segment" id="easySegment"></div>
        <div class="bar-segment medium-segment" id="mediumSegment"></div>
        <div class="bar-segment hard-segment" id="hardSegment"></div>
        <div class="bar-segment unsolved-segment" id="unsolvedSegment"></div>
      </div>
      <div class="progress-stats">
        <div class="progress-stats-container">
          <div class="progress-stat-item">
            <span id="percentSolved" class="percent-text">0% solved</span>
          </div>
          <div class="progress-stat-item">
            <span id="sectionsSolvedText" class="sections-text">0/0 Sections Completed</span>
          </div>
          <div class="progress-stat-item">
            <span id="overallSolvedText" class="overall-text">0/0 Solved</span>
          </div>
        </div>
      </div>
      <div class="difficulty-breakdown">
        <div class="difficulty-stats-container">
          <div class="difficulty-stat-item">
            <div id="easyStats" class="diff-easy">Easy: 0/0</div>
            <div class="unique-count easy-unique">(0 unique)</div>
          </div>
          <div class="difficulty-stat-item">
            <div id="mediumStats" class="diff-medium">Medium: 0/0</div>
            <div class="unique-count medium-unique">(0 unique)</div>
          </div>
          <div class="difficulty-stat-item">
            <div id="hardStats" class="diff-hard">Hard: 0/0</div>
            <div class="unique-count hard-unique">(0 unique)</div>
          </div>
        </div>
      </div>
    </div>
  `;
  updateGlobalRectBar();
}

function updateGlobalRectBar() {
  const solved = getGlobalSolved();
  const overallTotal = totalEasy + totalMedium + totalHard;
  const overallSolved = solved.easy + solved.medium + solved.hard;

  // Calculate percentages
  const easyFrac = overallTotal > 0 ? solved.easy / overallTotal : 0;
  const medFrac = overallTotal > 0 ? solved.medium / overallTotal : 0;
  const hardFrac = overallTotal > 0 ? solved.hard / overallTotal : 0;
  const solvedFrac = easyFrac + medFrac + hardFrac;
  const unsolvedFrac = 1 - solvedFrac;

  // Update bar segments
  const easySeg = document.getElementById('easySegment');
  const medSeg = document.getElementById('mediumSegment');
  const hardSeg = document.getElementById('hardSegment');
  const unsolvedSeg = document.getElementById('unsolvedSegment');

  if (easySeg && medSeg && hardSeg && unsolvedSeg) {
    easySeg.style.width = `${(easyFrac * 100).toFixed(2)}%`;
    medSeg.style.width = `${(medFrac * 100).toFixed(2)}%`;
    hardSeg.style.width = `${(hardFrac * 100).toFixed(2)}%`;
    unsolvedSeg.style.width = `${(unsolvedFrac * 100).toFixed(2)}%`;
  }

  // Update text stats
  const progressOverall = overallTotal > 0 ? Math.round((overallSolved / overallTotal) * 100) : 0;

  const percentElem = document.getElementById('percentSolved');
  if (percentElem) {
    percentElem.textContent = `${progressOverall}% solved`;
  }

  const overallElem = document.getElementById('overallSolvedText');
  if (overallElem) {
    overallElem.textContent = `${overallSolved}/${overallTotal} Solved`;
  }

  // Update difficulty stats with both total and unique counts
  const easyStatsElem = document.getElementById('easyStats');
  const mediumStatsElem = document.getElementById('mediumStats');
  const hardStatsElem = document.getElementById('hardStats');

  if (easyStatsElem) {
    easyStatsElem.textContent = `Easy: ${solved.easy}/${totalEasy}`;
    document.querySelector('.easy-unique').textContent = `(${uniqueEasy.size} unique)`;
  }
  if (mediumStatsElem) {
    mediumStatsElem.textContent = `Medium: ${solved.medium}/${totalMedium}`;
    document.querySelector('.medium-unique').textContent = `(${uniqueMedium.size} unique)`;
  }
  if (hardStatsElem) {
    hardStatsElem.textContent = `Hard: ${solved.hard}/${totalHard}`;
    document.querySelector('.hard-unique').textContent = `(${uniqueHard.size} unique)`;
  }

  // Update unique problems stats
  const uniqueStatsElem = document.querySelector('.unique-stats');
  if (uniqueStatsElem) {
    const totalUnique = document.querySelector('.total-unique');
    const uniqueBreakdown = document.querySelector('.unique-breakdown');
    if (totalUnique && uniqueBreakdown) {
      totalUnique.textContent = `Unique Problems: ${uniqueProblems.size}`;
      uniqueBreakdown.textContent = `(E: ${uniqueEasy.size}, M: ${uniqueMedium.size}, H: ${uniqueHard.size})`;
    }
  }

  // Update sections solved count
  updateSectionsSolvedCount();
}

/***************************************************************
 * UPDATE SECTIONS SOLVED COUNT
 ***************************************************************/
function updateSectionsSolvedCount() {
  const collapsibles = document.querySelectorAll('.collapsible');
  let totalSections = 0;
  let completedSections = 0;

  collapsibles.forEach(sectionElem => {
    const sectionId = sectionElem.getAttribute('id');
    if (!sectionId) return;

    // Check if this is a main section (not a subsection)
    if (!sectionElem.classList.contains('subsection-collapsible')) {
      // Skip Puzzle section from section count in DSA
      if (currentSection === 'dsa' &&
        (sectionId.toLowerCase() === 'puzzles' ||
          sectionId.toLowerCase().includes('puzzles') ||
          sectionId === 'Puzzles(NotcountedInDSA)')) {
        return;
      }

      totalSections++;

      // Count total problems and solved problems in this section
      const rows = sectionElem.querySelectorAll('tbody tr');
      let totalProblems = 0;
      let solvedProblems = 0;

      rows.forEach(row => {
        totalProblems++;
        const doneIcon = row.querySelector('.done-icon');
        if (doneIcon && doneIcon.getAttribute('data-solved') === 'true') {
          solvedProblems++;
        }
      });

      // Consider section completed if all problems are solved
      if (totalProblems > 0 && solvedProblems === totalProblems) {
        completedSections++;
      }
    }
  });

  // Update the sections solved text
  const sectionsSolvedElem = document.getElementById('sectionsSolvedText');
  if (sectionsSolvedElem) {
    sectionsSolvedElem.textContent = `${completedSections}/${totalSections} Sections Completed`;
  }
}


function updateMiniBar(miniBarsElem, diff, solved, total) {
  const countElem = miniBarsElem.querySelector(`.mini-count[data-diff="${diff}"]`);
  const fillElem = miniBarsElem.querySelector(`.${diff}-fill`);
  if (!countElem || !fillElem) return;
  countElem.textContent = `(${solved}/${total})`;
  const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
  fillElem.style.width = percent + '%';
}

/***************************************************************
 * RENDER SECTIONS (Collapsible for each topic)
 ***************************************************************/
function renderSections(data) {
  const sectionsDiv = document.getElementById('sections');

  // Log all section and subsection names
  // console.log("=== ALL SECTIONS AND SUBSECTIONS ===");
  // data.sections.forEach(section => {
  //   console.log(`SECTION: ${section.title}`);

  //   if (section.subsections && section.subsections.length > 0) {
  //     section.subsections.forEach(subsection => {
  //       console.log(`  SUBSECTION: ${subsection.title}`);
  //     });
  //   }
  // });

  data.sections.forEach(section => {
    sectionsDiv.innerHTML += generateAccordion(section);
  });
}
/***************************************************************
 * GENERATE COLLAPSIBLE
 * If a section has subsections, create a top-level collapsible
 * with aggregated mini bars. Inside, create another collapsible
 * for each subsection. If no subsections, just one collapsible.
 ***************************************************************/
function generateAccordion(section) {
  if (section.subsections && Array.isArray(section.subsections) && section.subsections.length > 0) {
    const parentId = section.title.replace(/\s+/g, '');
    // Aggregated counts across all subsections
    let aggEasy = 0, aggMed = 0, aggHard = 0;
    section.subsections.forEach(subsec => {
      aggEasy += subsec.problems.filter(p => p.difficulty === 'easy').length;
      aggMed += subsec.problems.filter(p => p.difficulty === 'medium').length;
      aggHard += subsec.problems.filter(p => p.difficulty === 'hard').length;
    });

    return `
        <ul class="collapsible z-depth-1" id="${parentId}">
          <li>
            <div class="collapsible-header main-collapsible-header">
              <div style="display:flex; align-items:center; gap:8px;">
                <i class="material-icons">folder</i>
                <span class="topic-title">${section.title}</span>
              </div>
              <!-- Aggregated mini progress bars for the entire parent section -->
              <div class="mini-bars" data-id="${parentId}">
                <div class="mini-bar-line">
                  <label class="difficulty-filter-square" title="Filter Easy Problems" style="display:inline-flex; width:24px; height:24px; margin-right:0.25rem;">
                    <input type="checkbox" class="square-check easy" data-section="${parentId}" data-difficulty="easy" checked
                      style="opacity:1; position:static; pointer-events:auto; width:22px; height:22px; border-radius:50%; border:3px solid var(--easy-color); display:block;">
                  </label>
                  <span class="mini-label" style="margin-right:0.25rem;">Easy</span>
                  <div class="mini-progress" style="margin:0 0.25rem;"><div class="mini-fill easy-fill" style="width:0%"></div></div>
                  <span class="mini-count" data-diff="easy" style="margin-left:0.25rem;">(0/${aggEasy})</span>
                </div>
                <div class="mini-bar-line">
                  <label class="difficulty-filter-square" title="Filter Medium Problems" style="display:inline-flex; width:24px; height:24px; margin-right:0.25rem;">
                    <input type="checkbox" class="square-check medium" data-section="${parentId}" data-difficulty="medium" checked
                      style="opacity:1; position:static; pointer-events:auto; width:22px; height:22px; border-radius:50%; border:3px solid var(--medium-color); display:block;">
                  </label>
                  <span class="mini-label" style="margin-right:0.25rem;">Medium</span>
                  <div class="mini-progress" style="margin:0 0.25rem;"><div class="mini-fill medium-fill" style="width:0%"></div></div>
                  <span class="mini-count" data-diff="medium" style="margin-left:0.25rem;">(0/${aggMed})</span>
                </div>
                <div class="mini-bar-line">
                  <label class="difficulty-filter-square" title="Filter Hard Problems" style="display:inline-flex; width:24px; height:24px; margin-right:0.25rem;">
                    <input type="checkbox" class="square-check hard" data-section="${parentId}" data-difficulty="hard" checked
                      style="opacity:1; position:static; pointer-events:auto; width:22px; height:22px; border-radius:50%; border:3px solid var(--hard-color); display:block;">
                  </label>
                  <span class="mini-label" style="margin-right:0.25rem;">Hard</span>
                  <div class="mini-progress" style="margin:0 0.25rem;"><div class="mini-fill hard-fill" style="width:0%"></div></div>
                  <span class="mini-count" data-diff="hard" style="margin-left:0.25rem;">(0/${aggHard})</span>
                </div>
              </div>
            </div>
            <div class="collapsible-body">
              <!-- Subsections as a second collapsible -->
              <ul class="collapsible subsection-collapsible">
                ${section.subsections.map(subsec => generateSubsectionCollapsible(subsec)).join('')}
              </ul>
            </div>
          </li>
        </ul>
      `;
  } else {
    return generateAccordionForSection(section);
  }
}

/***************************************************************
 * Single-Level Accordion for a Plain Section
 ***************************************************************/
function generateAccordionForSection(sec) {
  const sectionId = sec.title.replace(/\s+/g, '');
  const easyCount = sec.problems.filter(p => p.difficulty === 'easy').length;
  const mediumCount = sec.problems.filter(p => p.difficulty === 'medium').length;
  const hardCount = sec.problems.filter(p => p.difficulty === 'hard').length;

  return `
      <ul class="collapsible z-depth-1" id="${sectionId}">
        <li>
          <div class="collapsible-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <i class="material-icons">folder</i>
              <span class="topic-title">${sec.title}</span>
            </div>
            <div class="mini-bars" data-id="${sectionId}">
              <div class="mini-bar-line">
                <label class="difficulty-filter-square" title="Filter Easy Problems" style="display:inline-flex; width:24px; height:24px; margin-right:0.25rem;">
                  <input type="checkbox" class="square-check easy" data-section="${sectionId}" data-difficulty="easy" checked
                    style="opacity:1; position:static; pointer-events:auto; width:22px; height:22px; border-radius:50%; border:3px solid var(--easy-color); display:block;">
                </label>
                <span class="mini-label" style="margin-right:0.25rem;">Easy</span>
                <div class="mini-progress" style="margin:0 0.25rem;"><div class="mini-fill easy-fill" style="width:0%"></div></div>
                <span class="mini-count" data-diff="easy" style="margin-left:0.25rem;">(0/${easyCount})</span>
              </div>
              <div class="mini-bar-line">
                <label class="difficulty-filter-square" title="Filter Medium Problems" style="display:inline-flex; width:24px; height:24px; margin-right:0.25rem;">
                  <input type="checkbox" class="square-check medium" data-section="${sectionId}" data-difficulty="medium" checked
                    style="opacity:1; position:static; pointer-events:auto; width:22px; height:22px; border-radius:50%; border:3px solid var(--medium-color); display:block;">
                </label>
                <span class="mini-label" style="margin-right:0.25rem;">Medium</span>
                <div class="mini-progress" style="margin:0 0.25rem;"><div class="mini-fill medium-fill" style="width:0%"></div></div>
                <span class="mini-count" data-diff="medium" style="margin-left:0.25rem;">(0/${mediumCount})</span>
              </div>
              <div class="mini-bar-line">
                <label class="difficulty-filter-square" title="Filter Hard Problems" style="display:inline-flex; width:24px; height:24px; margin-right:0.25rem;">
                  <input type="checkbox" class="square-check hard" data-section="${sectionId}" data-difficulty="hard" checked
                    style="opacity:1; position:static; pointer-events:auto; width:22px; height:22px; border-radius:50%; border:3px solid var(--hard-color); display:block;">
                </label>
                <span class="mini-label" style="margin-right:0.25rem;">Hard</span>
                <div class="mini-progress" style="margin:0 0.25rem;"><div class="mini-fill hard-fill" style="width:0%"></div></div>
                <span class="mini-count" data-diff="hard" style="margin-left:0.25rem;">(0/${hardCount})</span>
              </div>
            </div>
          </div>
          <div class="collapsible-body">
            ${currentSection === 'lld' ? generateProblemsTableLLD(sec.problems, sectionId, sec.problems.length > 5) : generateProblemsTable(sec.problems, sectionId, sec.problems.length > 5)}
          </div>
        </li>
      </ul>
    `;
}

/***************************************************************
 * Subsection Collapsible
 ***************************************************************/
function generateSubsectionCollapsible(subsection) {
  const subsecTitle = subsection.title.replace(/\s+/g, '');
  // Count total problems in the subsection
  const totalEasy = subsection.problems.filter(p => p.difficulty === 'easy').length;
  const totalMedium = subsection.problems.filter(p => p.difficulty === 'medium').length;
  const totalHard = subsection.problems.filter(p => p.difficulty === 'hard').length;
  const totalProblems = totalEasy + totalMedium + totalHard;

  return `
    <li>
      <div class="collapsible-header subsection-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <i class="material-icons subsection-icon">subdirectory_arrow_right</i>
          <span class="subsection-title">${subsection.title} <span class="subsec-count">[0/${totalProblems}]</span></span>
        </div>
        <!-- Mini progress bars for this individual subsection -->
        <div class="mini-bars small" data-id="${subsecTitle}">
          <div class="mini-bar-line small">
            <label class="difficulty-filter-square small" title="Filter Easy Problems" style="display:inline-flex; width:18px; height:18px; margin-right:0.25rem;">
              <input type="checkbox" class="square-check easy" data-section="${subsecTitle}" data-difficulty="easy" checked
                style="opacity:1; position:static; pointer-events:auto; width:16px; height:16px; border-radius:50%; border:2px solid var(--easy-color); display:block;">
            </label>
            <span class="mini-label small">Easy</span>
            <div class="mini-progress small"><div class="mini-fill easy-fill" style="width:0%"></div></div>
            <span class="mini-count small" data-diff="easy">(0/${totalEasy})</span>
          </div>
          <div class="mini-bar-line small">
            <label class="difficulty-filter-square small" title="Filter Medium Problems" style="display:inline-flex; width:18px; height:18px; margin-right:0.25rem;">
              <input type="checkbox" class="square-check medium" data-section="${subsecTitle}" data-difficulty="medium" checked
                style="opacity:1; position:static; pointer-events:auto; width:16px; height:16px; border-radius:50%; border:2px solid var(--medium-color); display:block;">
            </label>
            <span class="mini-label small">Medium</span>
            <div class="mini-progress small"><div class="mini-fill medium-fill" style="width:0%"></div></div>
            <span class="mini-count small" data-diff="medium">(0/${totalMedium})</span>
          </div>
          <div class="mini-bar-line small">
            <label class="difficulty-filter-square small" title="Filter Hard Problems" style="display:inline-flex; width:18px; height:18px; margin-right:0.25rem;">
              <input type="checkbox" class="square-check hard" data-section="${subsecTitle}" data-difficulty="hard" checked
                style="opacity:1; position:static; pointer-events:auto; width:16px; height:16px; border-radius:50%; border:2px solid var(--hard-color); display:block;">
            </label>
            <span class="mini-label small">Hard</span>
            <div class="mini-progress small"><div class="mini-fill hard-fill" style="width:0%"></div></div>
            <span class="mini-count small" data-diff="hard">(0/${totalHard})</span>
          </div>
        </div>
      </div>
      <div class="collapsible-body subsection-body">
        ${currentSection === 'lld' ? generateProblemsTableLLD(subsection.problems, subsecTitle, totalProblems > 5) : generateProblemsTable(subsection.problems, subsecTitle, totalProblems > 5)}
      </div>
    </li>
  `;
}

/***************************************************************
 * Problem Table Helper
 ***************************************************************/
function generateProblemsTable(problemArray, baseId, showCollapseBtn = false) {
  return `
      <table class="striped highlight problem-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Solution</th>
            <th>YouTube</th>
            <th>Done</th>
          </tr>
        </thead>
        <tbody>
          ${problemArray.map((problem, index) => {
    const problemId = `${baseId}-${index}`.replace(/'/g, "$");
    const escapedLabel = problem.label.replace(/'/g, "$");
    const isLastRow = index === problemArray.length - 1;

    return `
            <tr class="${problem.difficulty}">
              <td data-label="Question">
                <div class="question-cell">
                  ${problem.important ? `
                    <span class="important-star" title="Must Do Question">🎯</span>
                  ` : ''}
                  <a href="${problem.question}" target="_blank">${problem.label}</a>
                  <i class="material-icons inline-favorite-star" 
                     data-problem-id="${problem.id || problemId}"
                     data-favorited="false"
                     onclick="toggleFavorite(this, '${problem.id || problemId}', event)">
                     star_border
                  </i>
                </div>
              </td>
              <td data-label="Solution">
                ${problem.solution && problem.solution !== "-"
        ? `<div class="solution-container"><a href="${problem.solution}" target="_blank" class="solution-link"><i class="fa-brands fa-github github-icon"></i></a></div>`
        : "-"
      }
              </td>
              <td data-label="YouTube">
                ${problem.youtube && problem.youtube !== "-"
        ? `<div class="solution-container"><a href="${problem.youtube}" target="_blank" class="youtube-link"><span style="display:inline-block;">WATCH</span></a></div>`
        : "-"
      }
              </td>
              <td data-label="Status" style="position: relative;">
              <i class="material-icons done-icon"
                data-difficulty="${problem.difficulty}"
                data-id="${problemId}"
                data-problem-id="${problem.id || problemId}"  
                data-solved="false">check_box_outline_blank</i>
                ${isLastRow && showCollapseBtn ? `
                  <button class="subsection-collapse-btn" onclick="smartCollapse(this)" title="Collapse">
                    <i class="material-icons">keyboard_arrow_up</i>
                  </button>
                ` : ''}
              </td>
            </tr>
          `;
  }).join('')}
        </tbody>
      </table>
    `;
}

// Modified generateProblemsTableLLD function for LLD problems
function generateProblemsTableLLD(problemArray, baseId, showCollapseBtn = false) {
  return `
      <table class="striped highlight problem-table lld-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Solutions</th>
            <th>Videos</th>
            <th>Done</th>
          </tr>
        </thead>
        <tbody>
          ${problemArray.map((problem, index) => {
    const problemId = `${baseId}-${index}`.replace(/'/g, "$");
    // Escape any single quotes in the label to prevent breaking the onclick attribute
    const escapedLabel = problem.label.replace(/'/g, "$");
    const isLastRow = index === problemArray.length - 1;

    // Handle multiple solutions with icon + numbered labels
    let solutionsHtml = "-";
    if (problem.solutions && Array.isArray(problem.solutions) && problem.solutions.length > 0) {
      solutionsHtml = `
        <div class="lld-links-grid">
          ${problem.solutions.map((solution, idx) => `
            <a href="${solution.url}" target="_blank" class="lld-resource-btn solution-btn" title="${solution.title}">
              <i class="material-icons">article</i>
              <span class="btn-label">Sol${idx + 1}</span>
            </a>
          `).join('')}
        </div>
      `;
    } else if (problem.solution && problem.solution !== "-") {
      // Consistent fallback for old format
      solutionsHtml = `
        <div class="lld-links-grid">
          <a href="${problem.solution}" target="_blank" class="lld-resource-btn solution-btn" title="Solution">
            <i class="material-icons">article</i>
            <span class="btn-label">Sol1</span>
          </a>
        </div>
      `;
    }

    // Handle multiple YouTube videos with icon + numbered labels
    let youtubeHtml = "-";
    if (problem.youtube && Array.isArray(problem.youtube) && problem.youtube.length > 0) {
      youtubeHtml = `
        <div class="lld-links-grid">
          ${problem.youtube.map((video, idx) => `
            <a href="${video.url}" target="_blank" class="lld-resource-btn video-btn" title="${video.title}">
              <i class="material-icons">smart_display</i>
              <span class="btn-label">Vid${idx + 1}</span>
            </a>
          `).join('')}
        </div>
      `;
    } else if (problem.youtube && typeof problem.youtube === 'string' && problem.youtube !== "-") {
      // Consistent fallback for old format
      youtubeHtml = `
        <div class="lld-links-grid">
          <a href="${problem.youtube}" target="_blank" class="lld-resource-btn video-btn" title="Video Tutorial">
            <i class="material-icons">smart_display</i>
            <span class="btn-label">Vid1</span>
          </a>
        </div>
      `;
    }

    return `
              <tr class="${problem.difficulty}">
              <td data-label="Question">
                <div class="question-cell">
                ${problem.important ? `
                  <span class="important-star" title="Must Do Question">🎯</span>
                ` : ''}
                  <a href="${problem.question}" target="_blank" class="question-link">${problem.label}</a>
                  <i class="material-icons inline-favorite-star" 
                     data-problem-id="${problem.id || problemId}"
                     data-favorited="false"
                     onclick="toggleFavorite(this, '${problem.id || problemId}', event)">
                     star_border
                  </i>
                </div>
              </td>
                <td data-label="Solutions">
                  ${solutionsHtml}
                </td>
                <td data-label="Videos">
                  ${youtubeHtml}
                </td>
                <td data-label="Status" style="position: relative;">
                <i class="material-icons done-icon"
                  data-difficulty="${problem.difficulty}"
                  data-id="${problemId}"
                  data-problem-id="${problem.id || problemId}"  
                  data-solved="false">check_box_outline_blank</i>
                  ${isLastRow && showCollapseBtn ? `
                    <button class="subsection-collapse-btn" onclick="smartCollapse(this)" title="Collapse">
                      <i class="material-icons">keyboard_arrow_up</i>
                    </button>
                  ` : ''}
                </td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    `;
}

function loadFavorites() {
  const stored = localStorage.getItem(`${currentSection}Favorites`);
  if (stored) {
    favorites = JSON.parse(stored);
  } else {
    favorites = {};
  }

  // Update favorite icons
  updateFavoriteIcons();
}

function updateFavoriteIcons() {
  document.querySelectorAll('.inline-favorite-star').forEach(star => {
    const problemId = star.getAttribute('data-problem-id');

    if (problemId && favorites[problemId]) {
      star.setAttribute('data-favorited', 'true');
      star.textContent = 'star';
    } else {
      star.setAttribute('data-favorited', 'false');
      star.textContent = 'star_border';
    }
  });
}

/***************************************************************
 * UPDATE SECTION PROGRESS
 * Now we must also update *subsection* progress bars
 ***************************************************************/
let updateProgressTimer = null;
function updateSectionProgress() {
  // Debounce updates
  clearTimeout(updateProgressTimer);
  updateProgressTimer = setTimeout(() => {
    actualUpdateSectionProgress();
  }, 100);
}

function actualUpdateSectionProgress() {
  // 1) Update top-level sections
  const collapsibles = document.querySelectorAll('.collapsible');
  collapsibles.forEach(sectionElem => {
    const sectionId = sectionElem.getAttribute('id');
    if (!sectionId) return;
    // Collect the rows for that section's table (if it's a single-level)
    const rows = sectionElem.querySelectorAll('tbody tr');
    let solved = { easy: 0, medium: 0, hard: 0 };
    let total = { easy: 0, medium: 0, hard: 0 };

    rows.forEach(row => {
      if (row.classList.contains('easy')) {
        total.easy++;
        const icon = row.querySelector('.done-icon');
        if (icon && icon.getAttribute('data-solved') === 'true') solved.easy++;
      }
      if (row.classList.contains('medium')) {
        total.medium++;
        const icon = row.querySelector('.done-icon');
        if (icon && icon.getAttribute('data-solved') === 'true') solved.medium++;
      }
      if (row.classList.contains('hard')) {
        total.hard++;
        const icon = row.querySelector('.done-icon');
        if (icon && icon.getAttribute('data-solved') === 'true') solved.hard++;
      }
    });

    // Update the mini bars for the top-level (no subsections) case
    const miniBars = sectionElem.querySelector(`.mini-bars[data-id="${sectionId}"]`);
    if (miniBars) {
      updateMiniBar(miniBars, 'easy', solved.easy, total.easy);
      updateMiniBar(miniBars, 'medium', solved.medium, total.medium);
      updateMiniBar(miniBars, 'hard', solved.hard, total.hard);

      // Update topic title with solved/total count for sections without subsections
      const topicTitle = sectionElem.querySelector('.topic-title');
      if (topicTitle && !sectionElem.querySelector('.subsection-collapsible')) {
        const totalProblems = total.easy + total.medium + total.hard;
        const solvedProblems = solved.easy + solved.medium + solved.hard;
        const topicCount = topicTitle.querySelector('.topic-count');
        if (topicCount) {
          topicCount.textContent = `[${solvedProblems}/${totalProblems}]`;
        } else {
          topicTitle.innerHTML = `${topicTitle.textContent.split('[')[0]} <span class="topic-count" data-section="${sectionId}">[${solvedProblems}/${totalProblems}]</span>`;
        }
      }
    }
  });

  // 2) Update subsections
  // For each subsection we have data-id="someSubsecId"
  document.querySelectorAll('.mini-bars.small').forEach(subMini => {
    const subsecId = subMini.getAttribute('data-id');
    if (!subsecId) return;
    // Collect the rows that belong to that 
    const subsectionLi = subMini.closest('li');
    const subRows = subsectionLi ? subsectionLi.querySelectorAll('tbody tr') : [];
    // But we only want the rows that match that subsection ID prefix
    let solved = { easy: 0, medium: 0, hard: 0 };
    let total = { easy: 0, medium: 0, hard: 0 };
    subRows.forEach(row => {
      // We can parse the row's problem ID
      const icon = row.querySelector('.done-icon');
      if (!icon) return;
      const rowProblemId = icon.getAttribute('data-id') || '';
      // If rowProblemId starts with subsecId + '-'
      if (rowProblemId.startsWith(subsecId + '-')) {
        // Then this row belongs to the current subsection
        if (row.classList.contains('easy')) {
          total.easy++;
          if (icon.getAttribute('data-solved') === 'true') solved.easy++;
        }
        if (row.classList.contains('medium')) {
          total.medium++;
          if (icon.getAttribute('data-solved') === 'true') solved.medium++;
        }
        if (row.classList.contains('hard')) {
          total.hard++;
          if (icon.getAttribute('data-solved') === 'true') solved.hard++;
        }
      }
    });
    // Now update the mini bars for this subsection
    updateMiniBar(subMini, 'easy', solved.easy, total.easy);
    updateMiniBar(subMini, 'medium', solved.medium, total.medium);
    updateMiniBar(subMini, 'hard', solved.hard, total.hard);

    // Update subsection title with solved/total count
    const subsectionHeader = subMini.closest('.collapsible-header.subsection-header');
    if (subsectionHeader) {
      const subsectionTitle = subsectionHeader.querySelector('.subsection-title');
      if (subsectionTitle) {
        const totalProblems = total.easy + total.medium + total.hard;
        const solvedProblems = solved.easy + solved.medium + solved.hard;
        const subsecCount = subsectionTitle.querySelector('.subsec-count');
        if (subsecCount) {
          subsecCount.textContent = `[${solvedProblems}/${totalProblems}]`;
        } else {
          subsectionTitle.innerHTML = `${subsectionTitle.textContent.split('[')[0]} <span class="subsec-count">[${solvedProblems}/${totalProblems}]</span>`;
        }
      }
    }
  });

  // 3) Update aggregated parent sections that have subsections
  document.querySelectorAll('.collapsible-header.main-collapsible-header .mini-bars').forEach(parentBars => {
    const parentId = parentBars.getAttribute('data-id');
    if (!parentId) return;
    // We sum up the data from each subsection
    // We'll find all subsections that belong to this parent
    const parentElem = document.getElementById(parentId);
    if (!parentElem) return;
    let solved = { easy: 0, medium: 0, hard: 0 };
    let total = { easy: 0, medium: 0, hard: 0 };
    // For each subsection-collapsible in this parent's body
    const subAccordions = parentElem.querySelectorAll('.subsection-collapsible li');
    subAccordions.forEach(li => {
      // Each li might have data for one subsection
      const subHeader = li.querySelector('.collapsible-header.subsection-header .mini-bars.small');
      if (!subHeader) return;
      const subId = subHeader.getAttribute('data-id');
      // We'll gather the final counts from the .mini-bars data-diff
      // But simpler to recalc from the table rows
      const subRows = li.querySelectorAll('tbody tr');
      subRows.forEach(row => {
        const icon = row.querySelector('.done-icon');
        if (!icon) return;
        if (row.classList.contains('easy')) {
          total.easy++;
          if (icon.getAttribute('data-solved') === 'true') solved.easy++;
        }
        if (row.classList.contains('medium')) {
          total.medium++;
          if (icon.getAttribute('data-solved') === 'true') solved.medium++;
        }
        if (row.classList.contains('hard')) {
          total.hard++;
          if (icon.getAttribute('data-solved') === 'true') solved.hard++;
        }
      });
    });
    // Now update the parent's aggregated mini bars
    updateMiniBar(parentBars, 'easy', solved.easy, total.easy);
    updateMiniBar(parentBars, 'medium', solved.medium, total.medium);
    updateMiniBar(parentBars, 'hard', solved.hard, total.hard);

    // Update parent section title with solved/total count
    const topicTitleContainer = parentElem.querySelector('.topic-title');
    if (topicTitleContainer) {
      const totalProblems = total.easy + total.medium + total.hard;
      const solvedProblems = solved.easy + solved.medium + solved.hard;
      const topicCount = topicTitleContainer.querySelector('.topic-count');
      if (topicCount) {
        topicCount.textContent = `[${solvedProblems}/${totalProblems}]`;
      } else {
        topicTitleContainer.innerHTML = `${topicTitleContainer.textContent.split('[')[0]} <span class="topic-count" data-section="${parentId}">[${solvedProblems}/${totalProblems}]</span>`;
      }
    }
  });
}

/***************************************************************
 * TABLE SORTING FUNCTIONALITY
 ***************************************************************/
// Store original order of rows for each table
const tableOriginalOrders = new WeakMap();
function initializeTableSorting() {
  // Add click handlers to all table headers
  document.querySelectorAll('.problem-table thead tr').forEach(headerRow => {
    // Skip if already initialized
    if (headerRow.hasAttribute('data-sort-initialized')) return;

    headerRow.setAttribute('data-sort-initialized', 'true');
    headerRow.style.cursor = 'pointer';
    headerRow.title = 'Click to sort by completion status';

    // Add sort indicator to the FIRST th (Question column)
    const firstTh = headerRow.querySelector('th:first-child');
    if (firstTh && !firstTh.querySelector('.sort-indicator')) {
      const sortIndicator = document.createElement('div');
      sortIndicator.className = 'sort-indicator';
      sortIndicator.innerHTML = `
        <span class="sort-icon" style="
          font-family: Arial, sans-serif !important;
          font-size: 22px;
          opacity: 0.6;
          color: var(--text-secondary);
        ">⇅</span>
      `;
      firstTh.style.position = 'relative';
      firstTh.prepend(sortIndicator); // Use prepend to add at the beginning
    }

    headerRow.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleTableSort(this);
    });
  });
}

// Replace the toggleTableSort function (around line 1737)
function toggleTableSort(headerRow) {
  const table = headerRow.closest('.problem-table');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  // Check if this table should have a collapse button (more than 5 rows)
  const shouldHaveCollapseBtn = rows.length > 5;
  // Store original order if not already stored
  if (!tableOriginalOrders.has(table)) {
    // Store the initial order as indices
    const originalOrder = rows.map((row, index) => ({
      row: row,
      originalIndex: index
    }));
    tableOriginalOrders.set(table, originalOrder);
  }

  // Get current sort state
  const currentSort = headerRow.getAttribute('data-sort-state') || 'default';

  if (currentSort === 'default') {
      const sortIcon = headerRow.querySelector('.sort-icon');
      if (sortIcon) {
        sortIcon.textContent = '↓';
        sortIcon.style.opacity = '1';
        sortIcon.style.color = 'var(--primary)';
      }
    // Sort by unsolved first
    headerRow.setAttribute('data-sort-state', 'unsolved-first');
    headerRow.classList.remove('sorted-default');
    headerRow.classList.add('sorted-unsolved');

    sortRowsByCompletion(tbody, rows, 'unsolved-first');

    // Show toast notification
    M.toast({
      html: '<span>Sorted: Unsolved problems first</span>',
      classes: 'rounded',
      displayLength: 2000
    });
  } else {
      const sortIcon = headerRow.querySelector('.sort-icon');
      if (sortIcon) {
        sortIcon.textContent = '↑';
        sortIcon.style.opacity = '1';
        sortIcon.style.color = 'var(--primary)';
      }
    // Restore default order
    headerRow.setAttribute('data-sort-state', 'default');
    headerRow.classList.remove('sorted-unsolved');
    headerRow.classList.add('sorted-default');

    // First, remove any existing collapse buttons
    rows.forEach(row => {
      const existingBtn = row.querySelector('.subsection-collapse-btn');
      if (existingBtn) {
        existingBtn.remove();
      }
    });
    
    // Get the original order mapping
    const originalOrder = tableOriginalOrders.get(table);
    
    // Create a map of current rows by their problem ID or unique identifier
    const currentRowsMap = new Map();
    rows.forEach(row => {
      const doneIcon = row.querySelector('.done-icon');
      if (doneIcon) {
        const problemId = doneIcon.getAttribute('data-problem-id') || 
                         doneIcon.getAttribute('data-id');
        if (problemId) {
          currentRowsMap.set(problemId, row);
        }
      }
    });
    
    // Clear tbody
    tbody.innerHTML = '';
    
// Restore rows in original order but with current state
    let lastRow = null;
    originalOrder.forEach(({row: originalRow}) => {
      const doneIcon = originalRow.querySelector('.done-icon');
      if (doneIcon) {
        const problemId = doneIcon.getAttribute('data-problem-id') || 
                         doneIcon.getAttribute('data-id');
        if (problemId && currentRowsMap.has(problemId)) {
          // Append the current row (with current state) instead of cloned original
          const currentRow = currentRowsMap.get(problemId);
          tbody.appendChild(currentRow);
          lastRow = currentRow;
        } else {
          // Fallback: append the original row if we can't find the current one
          tbody.appendChild(originalRow);
          lastRow = originalRow;
        }
      }
    });
    
    // Add collapse button to the last row if needed
    if (shouldHaveCollapseBtn && lastRow) {
      addCollapseButtonToLastRow(lastRow);
    }
    
    // Show toast notification
    M.toast({
      html: '<span>Sorted: Default order restored</span>',
      classes: 'rounded',
      displayLength: 2000
    });
  }
}

function sortRowsByCompletion(tbody, rows, sortType) {
  // First, remove any existing collapse buttons from all rows
  rows.forEach(row => {
    const existingBtn = row.querySelector('.subsection-collapse-btn');
    if (existingBtn) {
      existingBtn.remove();
    }
  });
  if (sortType === 'unsolved-first') {
    // Separate rows into solved and unsolved
    const unsolvedRows = [];
    const solvedRows = [];

    rows.forEach(row => {
      const doneIcon = row.querySelector('.done-icon');
      const isSolved = doneIcon && doneIcon.getAttribute('data-solved') === 'true';

      if (isSolved) {
        solvedRows.push(row);
      } else {
        unsolvedRows.push(row);
      }
    });

    // Sort each group by difficulty (Easy -> Medium -> Hard)
    const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };

    const sortByDifficulty = (a, b) => {
      const aDiff = a.classList.contains('easy') ? 'easy' :
        a.classList.contains('medium') ? 'medium' : 'hard';
      const bDiff = b.classList.contains('easy') ? 'easy' :
        b.classList.contains('medium') ? 'medium' : 'hard';
      return difficultyOrder[aDiff] - difficultyOrder[bDiff];
    };

    unsolvedRows.sort(sortByDifficulty);
    solvedRows.sort(sortByDifficulty);

    // Clear tbody and append sorted rows
    tbody.innerHTML = '';

    // Add unsolved rows first
    unsolvedRows.forEach(row => tbody.appendChild(row));

    // Then add solved rows
    solvedRows.forEach(row => tbody.appendChild(row));

    // Now add the collapse button to the NEW last row
    const allRows = [...unsolvedRows, ...solvedRows];
    if (allRows.length > 0) {
      addCollapseButtonToLastRow(allRows[allRows.length - 1]);
    }
  }
}

function addCollapseButtonToLastRow(row) {
  // Only add if not already present
  if (row && !row.querySelector('.subsection-collapse-btn')) {
    const lastTd = row.querySelector('td:last-child');
    if (lastTd) {
      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'subsection-collapse-btn';
      collapseBtn.setAttribute('onclick', 'smartCollapse(this)');
      collapseBtn.setAttribute('title', 'Collapse');
      collapseBtn.innerHTML = '<i class="material-icons">keyboard_arrow_up</i>';
      lastTd.appendChild(collapseBtn);
    }
  }
}


// Helper function to load progress for a specific table
function loadProgressForTable(table) {
  const saved = localStorage.getItem(`${currentSection}SolvedProblems`);
  if (saved) {
    const solvedProblems = JSON.parse(saved);
    table.querySelectorAll('.done-icon').forEach(icon => {
      const problemId = icon.getAttribute('data-problem-id');
      if (problemId && solvedProblems[problemId]) {
        icon.setAttribute('data-solved', 'true');
        icon.textContent = 'check_box';
        icon.parentElement.parentElement.classList.add('solved');
      }
    });
  }
}



/***************************************************************
 * SECTION COMPLETION FUNCTIONS
 ***************************************************************/
function checkSectionCompletion(icon) {
  // Get the section this problem belongs to
  const problemRow = icon.parentElement.parentElement;
  let sectionElement = problemRow.closest('.collapsible');

  if (!sectionElement) return;

  // Check if this is a subsection
  const isSubsection = sectionElement.classList.contains('subsection-collapsible');

  if (isSubsection) {
    checkSubsectionCompletion(problemRow);
    sectionElement = sectionElement.closest('.collapsible.z-depth-1');
  }

  if (!sectionElement) return;

  const sectionTitle = sectionElement.querySelector('.topic-title')?.textContent;
  if (!sectionTitle) return;

  const allProblems = sectionElement.querySelectorAll('.done-icon');
  const solvedProblems = sectionElement.querySelectorAll('.done-icon[data-solved="true"]');

  const isCurrentlyCompleted = sectionElement.classList.contains('section-completed');
  const shouldBeCompleted = allProblems.length > 0 && allProblems.length === solvedProblems.length;

  if (shouldBeCompleted && !isCurrentlyCompleted) {
    markSectionAsCompleted(sectionElement, sectionTitle);

    // Show celebration banner for ALL sections including Puzzles
    // Don't skip Puzzle section here - we want the visual feedback
    showCongratulationsBanner(sectionTitle);
  } else if (!shouldBeCompleted && isCurrentlyCompleted) {
    markSectionAsIncomplete(sectionElement, sectionTitle);
  }
}

function checkSubsectionCompletion(problemRow) {
  const subsectionLi = problemRow.closest('.subsection-collapsible li');
  if (!subsectionLi) return;

  const subsectionHeader = subsectionLi.querySelector('.collapsible-header.subsection-header');
  if (!subsectionHeader) return;

  const subsectionTitle = subsectionHeader.querySelector('.subsection-title')?.textContent?.split('[')[0]?.trim();
  if (!subsectionTitle) return;

  const allProblems = subsectionLi.querySelectorAll('.done-icon');
  const solvedProblems = subsectionLi.querySelectorAll('.done-icon[data-solved="true"]');

  const isCurrentlyCompleted = subsectionHeader.classList.contains('subsection-completed');
  const shouldBeCompleted = allProblems.length > 0 && allProblems.length === solvedProblems.length;

  if (shouldBeCompleted && !isCurrentlyCompleted) {
    markSubsectionAsCompleted(subsectionHeader, subsectionTitle);
    showSubsectionCompletionToast(subsectionTitle);
  } else if (!shouldBeCompleted && isCurrentlyCompleted) {
    markSubsectionAsIncomplete(subsectionHeader, subsectionTitle);
  }
}

function markSectionAsCompleted(sectionElement, sectionTitle) {
  // Add completed class to section
  sectionElement.classList.add('section-completed');

  // Change folder icon to indicate completion
  const folderIcon = sectionElement.querySelector('.material-icons');
  if (folderIcon && folderIcon.textContent === 'folder') {
    folderIcon.textContent = 'folder';
    // The CSS will handle the green color via the .section-completed class
  }

  // console.log(`Section "${sectionTitle}" marked as completed!`);
}

function markSectionAsIncomplete(sectionElement, sectionTitle) {
  // Remove completed class from section
  sectionElement.classList.remove('section-completed');

  // The folder icon will automatically return to normal color via CSS
  // console.log(`Section "${sectionTitle}" marked as incomplete.`);
}

function markSubsectionAsCompleted(subsectionHeader, subsectionTitle) {
  // Add completed class to subsection header
  subsectionHeader.classList.add('subsection-completed');

  // console.log(`Subsection "${subsectionTitle}" marked as completed!`);
}

function markSubsectionAsIncomplete(subsectionHeader, subsectionTitle) {
  // Remove completed class from subsection header
  subsectionHeader.classList.remove('subsection-completed');

  // console.log(`Subsection "${subsectionTitle}" marked as incomplete.`);
}

function showSubsectionCompletionToast(subsectionTitle) {
  // Show a toast notification for subsection completion
  M.toast({
    html: `<i class="material-icons">check_circle</i><span>Subsection: ${subsectionTitle} completed!</span>`,
    classes: 'subsection-completion-toast',
    displayLength: 3000
  });
}

/***************************************************************
 * WELCOME MODAL FUNCTIONS
 ***************************************************************/
function checkFirstVisit() {
  const userProfile = getUserProfile();
  if (!userProfile.hasSeenWelcome) {
    showWelcomeModal();
  }
}

function showWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  const nameInput = document.getElementById('userName');

  if (modal) {
    modal.classList.add('active');
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Start binary rain animation
    startBinaryRain();

    // Focus on the input field after animation
    setTimeout(() => {
      if (nameInput) {
        nameInput.focus();
      }
    }, 600);

    // Add enter key listener for the input (only once)
    if (nameInput && !nameInput.hasEventListener) {
      nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          saveUserName();
        }
      });
      nameInput.hasEventListener = true;
    }

    // Add click outside to close (but encourage name entry)
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        // Don't close immediately, show a gentle reminder
        const nameInput = document.getElementById('userName');
        if (nameInput) {
          nameInput.style.borderBottomColor = 'rgba(255, 255, 255, 0.8)';
          nameInput.placeholder = 'Please enter your name or just click Start My Journey for "Coder"';
          nameInput.focus();

          setTimeout(() => {
            nameInput.style.borderBottomColor = 'rgba(255, 255, 255, 0.3)';
            nameInput.placeholder = 'Enter your name or leave empty for \'Coder\'';
          }, 3000);
        }
      }
    });
  }
}

function hideWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  if (modal) {
    modal.classList.remove('active');
    // Restore body scroll
    document.body.style.overflow = '';
    // Stop binary rain animation
    stopBinaryRain();
  }
}

function saveUserName() {
  const nameInput = document.getElementById('userName');
  let name = nameInput ? nameInput.value.trim() : '';

  // If no name provided, use default "Coder"
  if (name === '') {
    name = 'Coder';
  }

  // Sanitize the name (remove any potentially harmful characters)
  const sanitizedName = name.replace(/[<>]/g, '').substring(0, 50);

  // Save user profile
  const userProfile = {
    name: sanitizedName,
    hasSeenWelcome: true,
    firstVisit: new Date().toISOString()
  };

  localStorage.setItem('userProfile', JSON.stringify(userProfile));

  // Update profile name in navbar
  updateProfileDisplay();

  // Hide the modal
  hideWelcomeModal();

  // Show a welcome toast
  if (typeof M !== 'undefined' && M.toast) {
    M.toast({
      html: `<span class="success-toast">Welcome to Algo Tracker, ${sanitizedName}! 🎉</span>`,
      classes: 'rounded green',
      displayLength: 4000
    });
  }

  // Now that the welcome modal is dismissed, show the checkbox tooltip after a short delay
  setTimeout(() => {
    showFirstCheckboxTooltip();
  }, 2000); // Wait 2 seconds after welcome modal is dismissed
}

function getUserProfile() {
  try {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }

  // Return default profile for new users
  return {
    name: '',
    hasSeenWelcome: false,
    firstVisit: null
  };
}

function getUserName() {
  const userProfile = getUserProfile();
  return userProfile.name || '';
}

/***************************************************************
 * PROFILE MODAL FUNCTIONS
 ***************************************************************/
function showProfileModal() {
  const modal = document.getElementById('profileModal');
  const nameInput = document.getElementById('profileUserName');
  const memberSince = document.getElementById('memberSince');
  const profilePictureLarge = document.getElementById('profilePictureLarge');
  const profileIconLargeDefault = document.getElementById('profileIconLargeDefault');
  const removePictureBtn = document.getElementById('removePictureBtn');

  if (modal && nameInput) {
    // Load current user profile
    const userProfile = getUserProfile();
    nameInput.value = userProfile.name || '';

    // Load profile picture
    if (userProfile.profilePicture) {
      profilePictureLarge.src = userProfile.profilePicture;
      profilePictureLarge.style.display = 'block';
      profileIconLargeDefault.style.display = 'none';
      removePictureBtn.style.display = 'flex';
    } else {
      profilePictureLarge.style.display = 'none';
      profileIconLargeDefault.style.display = 'block';
      removePictureBtn.style.display = 'none';
    }

    // Set member since date
    if (memberSince && userProfile.firstVisit) {
      const date = new Date(userProfile.firstVisit);
      memberSince.textContent = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (memberSince) {
      memberSince.textContent = 'Today';
    }

    // Show modal
    modal.classList.add('active');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus on input
    setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 300);
  }
}

function hideProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) {
    modal.classList.remove('active');
    // Restore body scroll
    document.body.style.overflow = '';
  }
}

function updateUserProfile() {
  const nameInput = document.getElementById('profileUserName');
  let name = nameInput ? nameInput.value.trim() : '';

  // If no name provided, use default "Coder"
  if (name === '') {
    name = 'Coder';
  }

  // Sanitize the name (remove any potentially harmful characters)
  const sanitizedName = name.replace(/[<>]/g, '').substring(0, 50);

  // Get existing profile
  const existingProfile = getUserProfile();

  // Update user profile (preserve profile picture)
  const userProfile = {
    name: sanitizedName,
    hasSeenWelcome: existingProfile.hasSeenWelcome || true,
    firstVisit: existingProfile.firstVisit || new Date().toISOString(),
    profilePicture: existingProfile.profilePicture || null
  };

  localStorage.setItem('userProfile', JSON.stringify(userProfile));

  // Update profile display in navbar
  updateProfileDisplay();

  // Hide the modal
  hideProfileModal();

  // Show a success toast
  if (typeof M !== 'undefined' && M.toast) {
    M.toast({
      html: `<span class="success-toast">Profile updated successfully! 👤</span>`,
      classes: 'rounded green',
      displayLength: 3000
    });
  }
}

function updateProfileDisplay() {
  const profilePicture = document.getElementById('profilePicture');
  const profileIconDefault = document.getElementById('profileIconDefault');
  const profileBtn = document.getElementById('profileBtn');

  if (profilePicture && profileIconDefault && profileBtn) {
    const userProfile = getUserProfile();
    const displayName = userProfile.name || 'Coder';

    // Update tooltip with funny name display
    const funnyNames = [
      `Hey there, ${displayName}! 👋`,
      `Look who's here - ${displayName}! 🎉`,
      `${displayName} in the house! 🏠`,
      `The amazing ${displayName}! ⭐`,
      `${displayName} is coding! 💻`,
      `Master ${displayName}! 🧙‍♂️`,
      `${displayName} the Great! 👑`,
      `Captain ${displayName}! 🚀`
    ];
    const randomFunnyName = funnyNames[Math.floor(Math.random() * funnyNames.length)];
    profileBtn.setAttribute('title', randomFunnyName);

    // Update profile picture
    if (userProfile.profilePicture) {
      profilePicture.src = userProfile.profilePicture;
      profilePicture.style.display = 'block';
      profileIconDefault.style.display = 'none';
    } else {
      profilePicture.style.display = 'none';
      profileIconDefault.style.display = 'block';
    }
  }
}

function handleProfilePictureUpload() {
  const fileInput = document.getElementById('profilePictureInput');
  const file = fileInput.files[0];

  if (file) {
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      if (typeof M !== 'undefined' && M.toast) {
        M.toast({
          html: `<span class="error-toast">File size must be less than 2MB</span>`,
          classes: 'rounded red',
          displayLength: 3000
        });
      }
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      if (typeof M !== 'undefined' && M.toast) {
        M.toast({
          html: `<span class="error-toast">Please select an image file</span>`,
          classes: 'rounded red',
          displayLength: 3000
        });
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const imageData = e.target.result;

      // Update profile in localStorage
      const userProfile = getUserProfile();
      userProfile.profilePicture = imageData;
      localStorage.setItem('userProfile', JSON.stringify(userProfile));

      // Update modal display
      const profilePictureLarge = document.getElementById('profilePictureLarge');
      const profileIconLargeDefault = document.getElementById('profileIconLargeDefault');
      const removePictureBtn = document.getElementById('removePictureBtn');

      if (profilePictureLarge && profileIconLargeDefault && removePictureBtn) {
        profilePictureLarge.src = imageData;
        profilePictureLarge.style.display = 'block';
        profileIconLargeDefault.style.display = 'none';
        removePictureBtn.style.display = 'flex';
      }

      // Update navbar display
      updateProfileDisplay();

      // Show success message
      if (typeof M !== 'undefined' && M.toast) {
        M.toast({
          html: `<span class="success-toast">Profile picture updated! 📸</span>`,
          classes: 'rounded green',
          displayLength: 3000
        });
      }
    };

    reader.readAsDataURL(file);
  }
}

function removeProfilePicture() {
  // Update profile in localStorage
  const userProfile = getUserProfile();
  userProfile.profilePicture = null;
  localStorage.setItem('userProfile', JSON.stringify(userProfile));

  // Update modal display
  const profilePictureLarge = document.getElementById('profilePictureLarge');
  const profileIconLargeDefault = document.getElementById('profileIconLargeDefault');
  const removePictureBtn = document.getElementById('removePictureBtn');
  const fileInput = document.getElementById('profilePictureInput');

  if (profilePictureLarge && profileIconLargeDefault && removePictureBtn && fileInput) {
    profilePictureLarge.style.display = 'none';
    profileIconLargeDefault.style.display = 'block';
    removePictureBtn.style.display = 'none';
    fileInput.value = ''; // Clear file input
  }

  // Update navbar display
  updateProfileDisplay();

  // Show success message
  if (typeof M !== 'undefined' && M.toast) {
    M.toast({
      html: `<span class="success-toast">Profile picture removed! 🗑️</span>`,
      classes: 'rounded green',
      displayLength: 3000
    });
  }
}



function showCongratulationsBanner(sectionTitle) {
  bannerCallCount++;
  const timestamp = Date.now();
  // console.log(`🎊 [Call #${bannerCallCount}] [${timestamp}] showCongratulationsBanner called for: ${sectionTitle}`);

  // FORCE REMOVE ANY EXISTING BANNER FIRST
  const existingBanner = document.getElementById('congratulationsBanner');
  if (existingBanner) {
    existingBanner.remove();
    // console.log(`🎊 [Call #${bannerCallCount}] Removed existing banner`);
  }

  // CREATE A COMPLETELY NEW BANNER ELEMENT
  const userName = getUserName();
  const congratsTitle = userName ? `Congratulations, ${userName}!` : 'Congratulations!';
  const congratsMessage = userName
    ? `Great job! You completed <strong>${sectionTitle}</strong>. Keep up the excellent work! 🎉`
    : `You completed <strong>${sectionTitle}</strong>. Great going!`;

  const bannerHTML = `
    <div id="congratulationsBanner" class="congratulations-banner active">
      <div class="banner-content celebration-content">
        <div class="banner-icon celebration-icon">
          <i class="material-icons folder-icon">folder</i>
          <i class="material-icons check-icon">check_circle</i>
        </div>
        <div class="banner-text">
          <h3 id="congratsTitle">${congratsTitle}</h3>
          <p id="congratsMessage">${congratsMessage}</p>
        </div>
        <div class="banner-actions">
          <button onclick="hideCongratulationsBanner()" class="btn-continue">Continue</button>
        </div>
      </div>
    </div>
  `;

  // Add the new banner to the body
  document.body.insertAdjacentHTML('beforeend', bannerHTML);
  document.body.style.overflow = 'hidden';

  // console.log(`🎊 [Call #${bannerCallCount}] NEW banner created and shown for: ${sectionTitle}`);

  // Trigger confetti celebration immediately
  // console.log(`🎊 [Call #${bannerCallCount}] Triggering confetti for: ${sectionTitle}`);
  triggerCelebration();
}

function hideCongratulationsBanner() {
  const banner = document.getElementById('congratulationsBanner');
  if (banner) {
    banner.remove();
    // Restore body scroll
    document.body.style.overflow = '';
    console.log(`🎊 Banner hidden and removed from DOM`);
  }
}
/*
function saveSectionCompletion(sectionId, sectionTitle) {
  try {
    const completedSections = JSON.parse(localStorage.getItem(`${currentSection}CompletedSections`) || '{}');
    completedSections[sectionId] = {
      title: sectionTitle,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(`${currentSection}CompletedSections`, JSON.stringify(completedSections));
  } catch (error) {
    console.error('Error saving section completion:', error);
  }
}

function removeSectionCompletion(sectionId) {
  try {
    const completedSections = JSON.parse(localStorage.getItem(`${currentSection}CompletedSections`) || '{}');
    delete completedSections[sectionId];
    localStorage.setItem(`${currentSection}CompletedSections`, JSON.stringify(completedSections));
    console.log(`Section completion removed for: ${sectionId}`);
  } catch (error) {
    console.error('Error removing section completion:', error);
  }
}

function saveSubsectionCompletion(subsectionId, subsectionTitle) {
  try {
    const completedSubsections = JSON.parse(localStorage.getItem(`${currentSection}CompletedSubsections`) || '{}');
    completedSubsections[subsectionId] = {
      title: subsectionTitle,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(`${currentSection}CompletedSubsections`, JSON.stringify(completedSubsections));
  } catch (error) {
    console.error('Error saving subsection completion:', error);
  }
}

function removeSubsectionCompletion(subsectionId) {
  try {
    const completedSubsections = JSON.parse(localStorage.getItem(`${currentSection}CompletedSubsections`) || '{}');
    delete completedSubsections[subsectionId];
    localStorage.setItem(`${currentSection}CompletedSubsections`, JSON.stringify(completedSubsections));
    console.log(`Subsection completion removed for: ${subsectionId}`);
  } catch (error) {
    console.error('Error removing subsection completion:', error);
  }
}
*/
// Replace loadSectionCompletions() with this simpler version
function loadSectionCompletions() {
  // Don't load from localStorage - just compute based on current state
  const collapsibles = document.querySelectorAll('.collapsible');

  collapsibles.forEach(sectionElem => {
    const sectionId = sectionElem.getAttribute('id');
    if (!sectionId || sectionElem.classList.contains('subsection-collapsible')) return;

    // Count problems
    const allProblems = sectionElem.querySelectorAll('.done-icon');
    const solvedProblems = sectionElem.querySelectorAll('.done-icon[data-solved="true"]');

    // If all problems are solved, mark as completed
    // Don't skip Puzzle section here - we want visual feedback
    if (allProblems.length > 0 && allProblems.length === solvedProblems.length) {
      const sectionTitle = sectionElem.querySelector('.topic-title')?.textContent;
      markSectionAsCompleted(sectionElem, sectionTitle);
    }
  });
}


// Replace loadSubsectionCompletions() with this simpler version
function loadSubsectionCompletions() {
  // Don't load from localStorage - just compute based on current state
  const subsections = document.querySelectorAll('.subsection-collapsible li');

  subsections.forEach(subsectionLi => {
    const subsectionHeader = subsectionLi.querySelector('.collapsible-header.subsection-header');
    if (!subsectionHeader) return;

    // Count problems in this subsection
    const allProblems = subsectionLi.querySelectorAll('.done-icon');
    const solvedProblems = subsectionLi.querySelectorAll('.done-icon[data-solved="true"]');

    // If all problems are solved, mark as completed
    if (allProblems.length > 0 && allProblems.length === solvedProblems.length) {
      const subsectionTitle = subsectionHeader.querySelector('.subsection-title')?.textContent?.split('[')[0]?.trim();
      markSubsectionAsCompleted(subsectionHeader, subsectionTitle);
    }
  });
}

/***************************************************************
 * SMART COLLAPSE FUNCTIONALITY
 ***************************************************************/
function smartCollapse(button) {
  // Check if this is a subsection or regular section
  const subsectionLi = button.closest('.subsection-collapsible li');

  if (subsectionLi) {
    // This is a subsection - collapse the subsection and scroll to main section
    collapseSubsection(button);
  } else {
    // This is a regular section - collapse the section and scroll to section header
    collapseRegularSection(button);
  }
}

function collapseSubsection(button) {
  // Find the subsection li element that contains this button
  const subsectionLi = button.closest('.subsection-collapsible li');
  if (!subsectionLi) return;

  // Find the parent section header for scrolling
  const parentSection = subsectionLi.closest('.collapsible.z-depth-1');
  const sectionHeader = parentSection?.querySelector('.collapsible-header.main-collapsible-header');
  if (!sectionHeader) return;

  // Find the parent subsection collapsible
  const subsectionCollapsible = subsectionLi.closest('.subsection-collapsible');
  if (!subsectionCollapsible) return;

  // Get the index of this subsection
  const subsectionIndex = Array.from(subsectionCollapsible.children).indexOf(subsectionLi);

  // Get the Materialize collapsible instance and close this specific subsection
  const instance = M.Collapsible.getInstance(subsectionCollapsible);
  if (instance) {
    instance.close(subsectionIndex);

    // Scroll to the main section header after a short delay to allow collapse animation
    setTimeout(() => {
      sectionHeader.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 300);
  }
}

function collapseRegularSection(button) {
  // Find the regular section that contains this button
  const sectionElement = button.closest('.collapsible.z-depth-1');
  if (!sectionElement) return;

  // Find the section header for scrolling
  const sectionHeader = sectionElement.querySelector('.collapsible-header');
  if (!sectionHeader) return;

  // Get the Materialize collapsible instance and close this section
  const instance = M.Collapsible.getInstance(sectionElement);
  if (instance) {
    instance.close(0);

    // Scroll to the section header after a short delay to allow collapse animation
    setTimeout(() => {
      sectionHeader.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 300);
  }
}

/***************************************************************
 * RESET PROGRESS FUNCTIONS
 ***************************************************************/
function showResetConfirmation() {
  const banner = document.getElementById('resetConfirmationBanner');
  if (banner) {
    banner.classList.add('active');
    // Prevent body scroll when banner is open
    document.body.style.overflow = 'hidden';
  }
}

function hideResetConfirmation() {
  const banner = document.getElementById('resetConfirmationBanner');
  if (banner) {
    banner.classList.remove('active');
    // Restore body scroll
    document.body.style.overflow = '';
  }
}

// Close banner when clicking outside the content or pressing ESC
function initResetBannerClickOutside() {
  const resetBanner = document.getElementById('resetConfirmationBanner');
  const congratsBanner = document.getElementById('congratulationsBanner');

  if (resetBanner) {
    resetBanner.addEventListener('click', function(e) {
      if (e.target === resetBanner) {
        hideResetConfirmation();
      }
    });
  }

  if (congratsBanner) {
    congratsBanner.addEventListener('click', function(e) {
      if (e.target === congratsBanner) {
        hideCongratulationsBanner();
      }
    });
  }

  // Add ESC key support for both banners
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (resetBanner && resetBanner.classList.contains('active')) {
        hideResetConfirmation();
      }
      if (congratsBanner && congratsBanner.classList.contains('active')) {
        hideCongratulationsBanner();
      }
    }
  });
}

function resetAllProgress() {
  try {
    // Get all localStorage keys that contain progress 
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('SolvedProblems') ||
        key.includes('Favorites') ||
        key === 'dsaSolvedProblems' || // Legacy key
        key === 'sqlSolvedProblems'
      )) {
        keysToRemove.push(key);
      }
    }

    // Remove all progress-related keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Reset all solved states in the UI
    document.querySelectorAll('.done-icon').forEach(icon => {
      icon.setAttribute('data-solved', 'false');
      icon.textContent = 'check_box_outline_blank';
      icon.parentElement.parentElement.classList.remove('solved');
    });

    // Reset all completed sections
    document.querySelectorAll('.section-completed').forEach(section => {
      section.classList.remove('section-completed');
    });

    // Reset all completed subsections
    document.querySelectorAll('.subsection-completed').forEach(subsection => {
      subsection.classList.remove('subsection-completed');
    });

    // Reset all favorite stars
    document.querySelectorAll('.inline-favorite-star').forEach(star => {
      star.setAttribute('data-favorited', 'false');
      star.textContent = 'star_border';
    });
    // Clear the favorites object
    if (typeof favorites !== 'undefined') {
      favorites = {};
    }

    // Update all progress displays
    updateGlobalRectBar();
    updateSectionProgress();

    // Hide the confirmation banner
    hideResetConfirmation();

    // Show success message
    M.toast({
      html: '<span class="success-toast">All progress and user data have been reset successfully! Welcome modal will appear on next visit.</span>',
      classes: 'rounded green',
      displayLength: 4000
    });

    console.log('Progress reset completed. Removed keys:', keysToRemove);

  } catch (error) {
    console.error('Error resetting progress:', error);

    // Hide the confirmation banner
    hideResetConfirmation();

    // Show error message
    M.toast({
      html: '<span class="error-toast">Error resetting progress. Please try again.</span>',
      classes: 'rounded red',
      displayLength: 3000
    });
  }
}

/***************************************************************
 * DARK MODE FUNCTIONS
 ***************************************************************/
function initializeDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (!darkModeToggle) return;

  // Load saved preference
  const isDarkMode = localStorage.getItem('dsaDarkMode') !== 'false';
  document.body.classList.toggle('dark-mode', isDarkMode);
  updateDarkModeIcon(isDarkMode);

  // Add click handler
  darkModeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('dsaDarkMode', isDark);
    updateDarkModeIcon(isDark);
  });
}

function updateDarkModeIcon(isDark) {
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.innerHTML = `<span class="material-icons">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
  }
}
// Initialize UI
function initializeCollapsibles() {
  // Initialize parent collapsibles first
  const topLevelCollapsibles = document.querySelectorAll('.collapsible:not(.subsection-collapsible)');
  M.Collapsible.init(topLevelCollapsibles, {
    accordion: false,
    onOpenStart: function (el) {
      // When opening a parent section, collapse all its subsections
      const subsectionCollapsible = el.querySelector('.subsection-collapsible');
      if (subsectionCollapsible) {
        const subsectionInstance = M.Collapsible.getInstance(subsectionCollapsible);
        if (subsectionInstance) {
          // Close all subsections when parent is opened
          for (let i = 0; i < subsectionInstance.$el[0].children.length; i++) {
            subsectionInstance.close(i);
          }
        }
      }
      el.dataset.manuallyOpened = 'true';
    },
    onOpenEnd: function(el) {
      // Initialize table sorting when section is opened
      setTimeout(() => {
        initializeTableSorting();
      }, 100);
    }
  });

  // Initialize subsection collapsibles
  const subsectionCollapsibles = document.querySelectorAll('.subsection-collapsible');
  M.Collapsible.init(subsectionCollapsibles, {
    accordion: false,
    onOpenStart: function (el) {
      el.dataset.manuallyOpened = 'true';
    },
    onOpenEnd: function(el) {
      // Initialize table sorting when subsection is opened
      setTimeout(() => {
        initializeTableSorting();
      }, 100);
    }
  });
}

/***************************************************************
 * Custom Tooltip Implementation
 ***************************************************************/
function setupCustomTooltips() {
  // console.log("Setting up custom tooltips...");

  // Create a single tooltip element that we'll reuse
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.id = 'custom-tooltip';
  document.body.appendChild(tooltip);

  // Get all tooltip elements
  const tooltippedElements = document.querySelectorAll('.tooltipped');
  // console.log(`Found ${tooltippedElements.length} tooltipped elements`);

  tooltippedElements.forEach(element => {
    setupTooltipForElement(element);
  });
}

// Helper function to set up tooltip for a single element
function setupTooltipForElement(element) {
  // Get tooltip content from data-tooltip attribute
  const tooltipContent = element.getAttribute('data-tooltip');
  if (!tooltipContent) return;

  // console.log(`Setting up tooltip for element: ${element.id}, content: ${tooltipContent}`);

  // Destroy any existing Materialize tooltip instance
  const existingTooltip = M.Tooltip.getInstance(element);
  if (existingTooltip) {
    existingTooltip.destroy();
  }

  // Remove existing event listeners to avoid duplicates
  if (element._tooltipMouseEnter) {
    element.removeEventListener('mouseenter', element._tooltipMouseEnter);
  }
  if (element._tooltipMouseLeave) {
    element.removeEventListener('mouseleave', element._tooltipMouseLeave);
  }

  // Create new event handlers
  element._tooltipMouseEnter = function() {
    // console.log(`Mouse entered ${element.id}`);

    // Remove any existing tooltips first
    const existingTooltips = document.querySelectorAll('.custom-tooltip');
    existingTooltips.forEach(t => t.remove());

    // Double-check we have the right element
    if (element.id !== 'randomButton') {
      console.warn('Wrong element! Expected randomButton, got:', element.id);
      return;
    }

    // Create a simple tooltip using CSS transform for positioning
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = tooltipContent;

    // Set the parent element to relative positioning if not already
    const buttonContainer = element.closest('.control-item') || element.parentElement;
    if (buttonContainer) {
      buttonContainer.style.position = 'relative';
    }

    // Detect current theme mode
    const isDarkMode = document.body.classList.contains('dark-mode') ||
      document.documentElement.classList.contains('dark-mode') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Subtle, elegant tooltip design for both modes
    const tooltipColors = isDarkMode ? {
      background: '#374151',
      color: '#f9fafb',
      border: '#4b5563',
      shadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      arrowColor: '#374151'
    } : {
      background: '#374151',
      color: '#f9fafb',
      border: '#4b5563',
      shadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      arrowColor: '#374151'
    };

    // Style the tooltip with clean, simple design
    tooltip.style.cssText = `
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 14px;
      background: ${tooltipColors.background};
      color: ${tooltipColors.color};
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: ${tooltipColors.shadow};
      z-index: 99999;
      max-width: 280px;
      min-width: 200px;
      width: max-content;
      line-height: 1.4;
      pointer-events: none;
      border: 1px solid ${tooltipColors.border};
      text-align: center;
      white-space: normal;
      word-wrap: break-word;
      opacity: 0;
      transition: all 0.2s ease;
      letter-spacing: 0.2px;
    `;

    // Add a clean arrow pointing to the button
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid ${tooltipColors.arrowColor};
    `;
    tooltip.appendChild(arrow);

    // Append tooltip directly to the button's container
    if (buttonContainer) {
      buttonContainer.appendChild(tooltip);
    } else {
      element.appendChild(tooltip);
    }

    // Show tooltip with smooth animation
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateX(-50%) translateY(0) scale(1)';
    });

    // Initial state for animation
    tooltip.style.transform = 'translateX(-50%) translateY(4px) scale(0.95)';

    // Store reference for cleanup
    element._currentTooltip = tooltip;
  };

  element._tooltipMouseLeave = function () {
    // console.log(`Mouse left ${element.id}`);

    // Remove the tooltip
    if (element._currentTooltip) {
      element._currentTooltip.style.opacity = '0';
      setTimeout(() => {
        if (element._currentTooltip && element._currentTooltip.parentNode) {
          element._currentTooltip.remove();
        }
        element._currentTooltip = null;
      }, 200);
    }

    // Also remove any stray tooltips
    const existingTooltips = document.querySelectorAll('.custom-tooltip');
    existingTooltips.forEach(t => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 200);
    });
  };

  // Add mouse events
  element.addEventListener('mouseenter', element._tooltipMouseEnter);
  element.addEventListener('mouseleave', element._tooltipMouseLeave);
}

// Clean up any stray tooltips (utility function)
function cleanupTooltips() {
  const existingTooltips = document.querySelectorAll('.custom-tooltip');
  existingTooltips.forEach(tooltip => {
    tooltip.style.opacity = '0';
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.remove();
      }
    }, 200);
  });
}

/***************************************************************
 * FILTER CHECKBOX TUTORIAL TOOLTIP
 ***************************************************************/
// Helper function to set up tooltip for a single element
// Add this function after the setupTooltipForElement function

function showFirstCheckboxTooltip() {
  // Get refresh count from localStorage (default to 0)
  let refreshCount = parseInt(localStorage.getItem('refreshCount')) || 0;

  // Increment refresh count
  refreshCount++;
  localStorage.setItem('refreshCount', refreshCount);

  // Show tooltip only every 30th refresh
  if (refreshCount > 1 && refreshCount % 30 !== 0) {
    return;
  }

  // Find the first collapsible section (this will be the first problem section)
  const firstCollapsible = document.querySelector('.collapsible');
  if (!firstCollapsible) {
    // console.log('No collapsible sections found yet, will retry');
    setTimeout(showFirstCheckboxTooltip, 1000);
    return;
  }

  // Open the first section
  const instance = M.Collapsible.getInstance(firstCollapsible);
  if (instance) {
    instance.open(0);
  }

  setTimeout(() => {
    // Target the Easy checkbox in the first section's header mini-bars
    const firstEasyCheckbox = firstCollapsible.querySelector('.collapsible-header .mini-bars .square-check.easy');
    if (!firstEasyCheckbox) {
      // console.log('No Easy checkbox found in first section header');
      return;
    }

    console.log('Found Easy checkbox:', firstEasyCheckbox);

    // Simulate checkbox unchecking and checking
    setTimeout(() => {
      firstEasyCheckbox.click();
      setTimeout(() => {
        firstEasyCheckbox.click();
      }, 1500);
    }, 500);

    // Create tooltip
    const specialTooltip = document.createElement('div');
    specialTooltip.className = 'filter-tooltip visible';
    specialTooltip.id = 'filter-tutorial-tooltip';
    specialTooltip.textContent = 'Click to filter problems by difficulty!';

    document.body.appendChild(specialTooltip);

    // Position the tooltip
    const positionTooltipForCheckbox = () => {
      const checkboxRect = firstEasyCheckbox.getBoundingClientRect();

      // Make sure the checkbox is in view
      if (checkboxRect.top <= 0 || checkboxRect.bottom >= window.innerHeight) {
        firstEasyCheckbox.scrollIntoView({behavior: 'smooth', block: 'center'});
        // Wait for scrolling to complete before positioning
        setTimeout(() => positionTooltipForCheckbox(), 300);
        return;
      }

      // Position tooltip above the checkbox
      specialTooltip.style.left = `${checkboxRect.left}px`;
      specialTooltip.style.top = `${checkboxRect.top - specialTooltip.offsetHeight - 10}px`;
      specialTooltip.style.opacity = '1';
      specialTooltip.style.transform = 'translateY(0)';

      // Remove any existing arrows before adding a new one
      const existingArrow = specialTooltip.querySelector('.filter-tooltip-arrow');
      if (existingArrow) {
        existingArrow.remove();
      }

      // Add tooltip arrow
      const arrow = document.createElement('div');
      arrow.className = 'filter-tooltip-arrow';
      specialTooltip.appendChild(arrow);
    };

    positionTooltipForCheckbox();

    const keepTooltipFixed = () => {
      if (!document.body.contains(specialTooltip)) {
        window.removeEventListener('scroll', keepTooltipFixed);
        window.removeEventListener('resize', keepTooltipFixed);
        return;
      }

      const newCheckboxRect = firstEasyCheckbox.getBoundingClientRect();

      // Check if checkbox is visible in viewport
      if (newCheckboxRect.top < 0 || newCheckboxRect.bottom > window.innerHeight) {
        specialTooltip.style.opacity = '0';
        return;
      }

      // Position tooltip and make it visible
      specialTooltip.style.left = `${newCheckboxRect.left}px`;
      specialTooltip.style.top = `${newCheckboxRect.top - specialTooltip.offsetHeight - 10}px`;
      specialTooltip.style.opacity = '1';
    };

    window.addEventListener('scroll', keepTooltipFixed);
    window.addEventListener('resize', keepTooltipFixed);

    // Hide tooltip after 3 seconds
    setTimeout(() => {
      specialTooltip.style.opacity = '0';
      specialTooltip.style.transform = 'translateY(-5px)';
      setTimeout(() => {
        if (document.body.contains(specialTooltip)) {
          document.body.removeChild(specialTooltip);
        }
        window.removeEventListener('scroll', keepTooltipFixed);
        window.removeEventListener('resize', keepTooltipFixed);
        if (instance) {
          instance.close(0);
        }
      }, 300);
    }, 3000);

    // Reset refresh count if it gets too high (optional)
    if (refreshCount > 400) {
      localStorage.setItem('refreshCount', '0');
    }
  }, 500);
}



/***************************************************************
 * MOBILE ALIGNMENT FIX
 ***************************************************************/
function fixMobileAlignment() {
  // Only apply on mobile screens
  if (window.innerWidth <= 768) {
    // Remove problematic inline styles from mini-bar elements
    document.querySelectorAll('.mini-bars .mini-bar-line').forEach(line => {
      // Remove inline styles from all child elements
      const elements = line.querySelectorAll('*');
      elements.forEach(el => {
        if (el.classList.contains('difficulty-filter-square') ||
          el.classList.contains('mini-label') ||
          el.classList.contains('mini-progress') ||
          el.classList.contains('mini-count')) {
          // Remove margin and width styles that interfere with grid
          el.style.marginLeft = '';
          el.style.marginRight = '';
          el.style.margin = '';
          el.style.width = '';
          el.style.minWidth = '';
        }
      });
    });
  }
}

/***************************************************************
 * BINARY RAIN ANIMATION FUNCTIONS
 ***************************************************************/
let binaryRainInterval;
let binaryRainActive = false;

function startBinaryRain() {
  const binaryRainContainer = document.getElementById('binaryRain');
  if (!binaryRainContainer) return;

  binaryRainActive = true;

  // Clear any existing rain
  binaryRainContainer.innerHTML = '';

  // Create fewer columns for better performance (every 60px instead of 20px)
  const numberOfColumns = Math.floor(window.innerWidth / 60);

  for (let i = 0; i < numberOfColumns; i++) {
    createBinaryColumn(binaryRainContainer, i);
  }
}

function createBinaryColumn(container, columnIndex) {
  const column = document.createElement('div');
  column.className = 'binary-column';

  // Generate shorter rain of 0s and 1s for better performance
  const binaryLength = Math.floor(Math.random() * 15) + 10; // Reduced from 40+30 to 15+10
  let binaryString = '';
  for (let i = 0; i < binaryLength; i++) {
    binaryString += Math.random() > 0.5 ? '1' : '0';
    if (i % 1 === 0 && i > 0) binaryString += '<br>'; // Each digit on new line
  }

  column.innerHTML = binaryString;
  column.style.left = `${columnIndex * 60}px`; // Increased spacing from 20px to 60px
  column.style.animationDuration = `${Math.random() * 3 + 6}s`; // Reduced from 8-12s to 6-9s
  column.style.animationDelay = `${Math.random() * 3}s`;

  container.appendChild(column);

  // Remove column after animation completes (shorter timeout for better performance)
  setTimeout(() => {
    if (column.parentNode) {
      column.parentNode.removeChild(column);
    }
  }, 12000); // Reduced from 15000 to 12000

  // Create new column to replace this one (longer interval to reduce load)
  setTimeout(() => {
    if (binaryRainActive && container.parentNode && container.parentNode.classList.contains('active')) {
      createBinaryColumn(container, columnIndex);
    }
  }, Math.random() * 3000 + 5000); // Increased from 2000+3000 to 3000+5000
}

function stopBinaryRain() {
  binaryRainActive = false;
  const binaryRainContainer = document.getElementById('binaryRain');
  if (binaryRainContainer) {
    binaryRainContainer.innerHTML = '';
  }
  if (binaryRainInterval) {
    clearInterval(binaryRainInterval);
    binaryRainInterval = null;
  }
}

/***************************************************************
 * INITIALIZATION
 ***************************************************************/
document.addEventListener('DOMContentLoaded', function () {
  const rectContainer = document.getElementById('rectChartContainer');
  if (rectContainer) {
    rectContainer.innerHTML = `
      <div class="progress-card skeleton-loading">
        <h2>Loading DSA Progress...</h2>
        <div class="skeleton-bar"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>
    `;
  }
  // Initialize Materialize components (excluding tooltips to avoid conflicts)
  setTimeout(() => {
    M.Collapsible.init(document.querySelectorAll('.collapsible'));
    M.Sidenav.init(document.querySelectorAll('.sidenav'));
    M.Modal.init(document.querySelectorAll('.modal'));
    M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'));

    // Clean up any existing tooltips first
    cleanupTooltips();

    // Custom tooltip implementation
    setupCustomTooltips();

    // Global cleanup for tooltips when mouse leaves window
    document.addEventListener('mouseleave', cleanupTooltips);
    window.addEventListener('blur', cleanupTooltips);

    // Filter tooltip removed per user request

    // Initialize dark mode
    initializeDarkMode();

    // Initialize mobile menu
    initializeMobileMenu();

    // Navbar tooltips now handled by pure CSS





    // Initialize profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', showProfileModal);
    }

    // Initialize profile picture upload
    const profilePictureInput = document.getElementById('profilePictureInput');
    if (profilePictureInput) {
      profilePictureInput.addEventListener('change', handleProfilePictureUpload);
    }

    // Update profile display on page load
    updateProfileDisplay();
    // Initialize reset progress button
    const resetBtn = document.getElementById('resetProgressBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', showResetConfirmation);
    }

    // Initialize random button
    setupRandomButton();

    // Initialize reset banner click outside functionality
    initResetBannerClickOutside();

    loadProgress();
    updateGlobalRectBar();
    updateSectionProgress();

    // Add footer text with hyperlink
    const footer = document.createElement('a');
    footer.href = 'https://www.youtube.com/@BhajanMarg';
    footer.target = '_blank';
    footer.rel = 'noopener noreferrer';
    footer.className = 'shree-radhe-footer'; // Add class for CSS targeting
    footer.style.cssText = `
          position: fixed;
          bottom: 10px;
          left: 20px;
          font-size: 24px;
          opacity: 0.9;
          color: var(--text-primary);
          font-family: 'Noto Sans Devanagari', sans-serif;
          text-decoration: none;
          z-index: 1;
          user-select: none;
          text-shadow: 0 0 1px rgba(0,0,0,0.1);
          // transition: opacity 0.3s ease;
      `;
    footer.textContent = 'श्री राधे';
    footer.addEventListener('mouseover', () => footer.style.opacity = '0.8');
    footer.addEventListener('mouseout', () => footer.style.opacity = '0.7');
    document.body.appendChild(footer);

    // Set up search with debouncing
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
      let searchTimeout;
      searchBox.addEventListener('input', function (e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          // console.log('Search triggered with:', e.target.value);
          filterProblems(e);
        }, 300); // Debounce for 300ms
      });
      // console.log('Search listener attached to:', searchBox);
    } else {
      console.warn('Search box not found!');
    }

    // Set up multi-select filter
    setupMultiSelectFilter();



    // Load problems data
    fetch('dsaWithId-problems.json')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        problemData = data;
        window.dsaDataCache = data; // <-- Cache it immediately!

        // Count unique problems
        countUniqueProblems(data);

        renderSections(data);

        initializeCollapsibles();

        // document.getElementById('sections').addEventListener('click', function (e) {
        //   if (e.target.classList.contains('done-icon')) {
        //     e.stopPropagation(); // Prevent event bubbling
        //     toggleSolved(e.target);
        //   }
        // });
        // Remove old listener if exists
        const sectionsElement = document.getElementById('sections');
        if (sectionsClickHandler) {
          sectionsElement.removeEventListener('click', sectionsClickHandler);
        }

        // Create and store new handler
        sectionsClickHandler = function (e) {
          if (e.target.classList.contains('done-icon')) {
            e.stopPropagation();
            toggleSolved(e.target);
          }
        };

        // Add the new listener
        sectionsElement.addEventListener('click', sectionsClickHandler);

        buildRectBar();
        loadProgress();
        loadSectionCompletions();
        loadSubsectionCompletions();
        updateGlobalRectBar();
        updateSectionProgress();

        // Check if this is the user's first visit and show welcome modal - reduced timeout for faster loading
        setTimeout(() => {
          checkFirstVisit();
        }, 500);

        // Only show filter checkbox tutorial tooltip if user is not a first-time visitor
        setTimeout(() => {
          const userProfile = getUserProfile();
          if (userProfile.hasSeenWelcome) {
            showFirstCheckboxTooltip();
          }
        }, 1500);
      })
      .catch(err => {
        console.error('Error loading problems:', err);
        document.getElementById('sections').innerHTML = `
                  <div class="card-panel red lighten-4">
                      <span class="red-text text-darken-4">
                          <i class="material-icons left">error</i>
                          Failed to load problems data. Please check your connection and try again.
                      </span>
                  </div>
              `;
      });

    // Add event listeners for expand/collapse buttons
    const expandAllBtn = document.querySelector('.expand-all');
    const collapseAllBtn = document.querySelector('.collapse-all');

    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', function () {
        const sections = document.querySelectorAll('.collapsible');
        sections.forEach(section => {
          const instance = M.Collapsible.getInstance(section);
          if (instance) {
            instance.open();
          }
          // Also expand subsections if they exist
          const subsections = section.querySelectorAll('.subsection-collapsible li');
          subsections.forEach((subsection, index) => {
            const subsectionInstance = M.Collapsible.getInstance(subsection.closest('.subsection-collapsible'));
            if (subsectionInstance) {
              subsectionInstance.open(index);
            }
          });
        });
      });
    }

    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', function () {
        const sections = document.querySelectorAll('.collapsible');
        sections.forEach(section => {
          const instance = M.Collapsible.getInstance(section);
          if (instance) {
            instance.close();
          }
          // Also collapse subsections if they exist
          const subsections = section.querySelectorAll('.subsection-collapsible li');
          subsections.forEach((subsection, index) => {
            const subsectionInstance = M.Collapsible.getInstance(subsection.closest('.subsection-collapsible'));
            if (subsectionInstance) {
              subsectionInstance.close(index);
            }
          });
        });
      });
    }

    // Add click handlers for navigation (desktop)
    document.getElementById('dsaLink').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('dsa');
      updateDesktopNavActive('dsaLink');
    });

    document.getElementById('blind75Link').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('blind75');
      updateDesktopNavActive('blind75Link');
    });

    document.getElementById('leetcode150Link').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('leetcode150');
      updateDesktopNavActive('leetcode150Link');
    });

    document.getElementById('sqlLink').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('sql');
      updateDesktopNavActive('sqlLink');
    });

    document.getElementById('lldLink').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('lld');
      updateDesktopNavActive('lldLink');
    });

    document.getElementById('hldLink').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('hld');
      updateDesktopNavActive('hldLink');
    });

    // Add click handlers for mobile navigation
    document.getElementById('dsaLinkMobile').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('dsa');
      updateMobileMenuActive('dsaLinkMobile');
    });

    document.getElementById('blind75LinkMobile').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('blind75');
      updateMobileMenuActive('blind75LinkMobile');
    });

    document.getElementById('leetcode150LinkMobile').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('leetcode150');
      updateMobileMenuActive('leetcode150LinkMobile');
    });

    document.getElementById('sqlLinkMobile').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('sql');
      updateMobileMenuActive('sqlLinkMobile');
    });

    document.getElementById('lldLinkMobile').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('lld');
      updateMobileMenuActive('lldLinkMobile');
    });

    document.getElementById('hldLinkMobile').addEventListener('click', (e) => {
      e.preventDefault();
      switchSection('hld');
      updateMobileMenuActive('hldLinkMobile');
    });



    /* do not remove this yet, we will need it later
    document.getElementById('interviewsLink').addEventListener('click', (e) => {
      e.preventDefault();
      switchSectionInterview('interviews');
    });
    */
  },0);
});

// Function to initialize checkboxes (copied from working.js)
// function initializeCheckboxes() {
//   // Wait a short time to ensure DOM is fully rendered
//   setTimeout(() => {
//     // console.log('Initializing checkboxes...');

//     // Get all checkboxes and remove existing event listeners by cloning
//     const checkboxes = document.querySelectorAll('.square-check');
//     // console.log('Found checkboxes:', checkboxes.length);
//     checkboxes.forEach(checkbox => {
//       const newCheckbox = checkbox.cloneNode(true);
//       checkbox.parentNode.replaceChild(newCheckbox, checkbox);
//     });

//     // Add event listeners to the new checkboxes
//     document.querySelectorAll('.square-check').forEach(checkbox => {
//       // Ensure checkbox is visible and checked by default
//       checkbox.checked = true;

//       // Add click event listener
//       checkbox.addEventListener('click', function (e) {
//         // Stop event propagation to prevent collapsible from toggling
//         e.stopPropagation();
//         // console.log('Checkbox clicked:', this.dataset.section, this.dataset.difficulty, this.checked);

//         // If this checkbox is a parent (i.e. not inside a subsection container)
//         if (!this.closest('.mini-bars.small')) {
//           // Get the parent section (collapsible) that contains both parent and child checkboxes
//           const parentSection = this.closest('.collapsible');
//           if (parentSection) {
//             const difficulty = this.dataset.difficulty; // e.g., "easy", "medium", or "hard"
//             // Find all child checkboxes in subsections with the same difficulty
//             const childCheckboxes = parentSection.querySelectorAll(`.mini-bars.small .square-check.${difficulty}`);
//             childCheckboxes.forEach(child => {
//               child.checked = this.checked;
//             });
//           }
//         }

//         // Filter problems based on the updated state
//         filterProblems(e);
//       });
//     });

//     // Add event listeners to the labels to prevent event propagation
//     document.querySelectorAll('.difficulty-filter-square').forEach(label => {
//       label.addEventListener('click', function (e) {
//         e.stopPropagation();
//       });
//     });
//   }, 500);
// }

function toggleSections(expand) {
  document.querySelectorAll('.collapsible').forEach(section => {
    const instance = M.Collapsible.getInstance(section);
    if (instance) {
      instance[expand ? 'open' : 'close'](); // Open or Close in one step
    }
  });
}

/***************************************************************
 * COUNT UNIQUE PROBLEMS
 * Counts total and unique problems from the data
 ***************************************************************/
let uniqueCountsCache = {}; // Cache for unique problem counts
function countUniqueProblems(data) {
  totalEasy = 0;
  totalMedium = 0;
  totalHard = 0;
  uniqueProblems.clear();
  uniqueEasy.clear();
  uniqueMedium.clear();
  uniqueHard.clear();
  // Check if we have cached counts for this section
  if (uniqueCountsCache[currentSection]) {
    // Use cached values
    const cached = uniqueCountsCache[currentSection];
    totalEasy = cached.totalEasy;
    totalMedium = cached.totalMedium;
    totalHard = cached.totalHard;
    uniqueProblems = new Set(cached.uniqueProblems);
    uniqueEasy = new Set(cached.uniqueEasy);
    uniqueMedium = new Set(cached.uniqueMedium);
    uniqueHard = new Set(cached.uniqueHard);
    return;
  }

  // // If not cached, calculate as normal
  // console.log(`Calculating unique counts for ${currentSection}`);

  // Reset counters and sets
  totalEasy = 0;
  totalMedium = 0;
  totalHard = 0;
  uniqueProblems.clear();
  uniqueEasy.clear();
  uniqueMedium.clear();
  uniqueHard.clear();

  // Count totals and track unique problems
  data.sections.forEach(section => {
    // Skip Puzzle section from counting - check multiple ways
    if (currentSection === 'dsa') {
      // Check by title
      if (section.title && section.title.toLowerCase().includes('puzzle')) {
        // console.log('Skipping Puzzle section from total count:', section.title);
        return;
      }
      // Check if title is exactly "Puzzles"
      if (section.title && section.title.trim() === 'Puzzles') {
        // console.log('Skipping Puzzles section from total count');
        return;
      }
    }

    if (section.problems) {
      section.problems.forEach(problem => {
        // Use question URL as the unique identifier
        const questionUrl = problem.question;

        // Skip problems without a valid URL
        if (!questionUrl || questionUrl === '-') return;

        // Extract the base URL without query parameters
        const baseUrl = questionUrl.split('?')[0];

        uniqueProblems.add(baseUrl);
        if (problem.difficulty === 'easy') {
          totalEasy++;
          uniqueEasy.add(baseUrl);
        }
        if (problem.difficulty === 'medium') {
          totalMedium++;
          uniqueMedium.add(baseUrl);
        }
        if (problem.difficulty === 'hard') {
          totalHard++;
          uniqueHard.add(baseUrl);
        }
      });
    }
    if (section.subsections) {
      section.subsections.forEach(subsec => {
        subsec.problems.forEach(problem => {
          // Use question URL as the unique identifier
          const questionUrl = problem.question;

          // Skip problems without a valid URL
          if (!questionUrl || questionUrl === '-') return;

          // Extract the base URL without query parameters
          const baseUrl = questionUrl.split('?')[0];

          uniqueProblems.add(baseUrl);
          if (problem.difficulty === 'easy') {
            totalEasy++;
            uniqueEasy.add(baseUrl);
          }
          if (problem.difficulty === 'medium') {
            totalMedium++;
            uniqueMedium.add(baseUrl);
          }
          if (problem.difficulty === 'hard') {
            totalHard++;
            uniqueHard.add(baseUrl);
          }
        });
      });
    }
  });

  // Cache the results for this section
  uniqueCountsCache[currentSection] = {
    totalEasy: totalEasy,
    totalMedium: totalMedium,
    totalHard: totalHard,
    uniqueProblems: Array.from(uniqueProblems),
    uniqueEasy: Array.from(uniqueEasy),
    uniqueMedium: Array.from(uniqueMedium),
    uniqueHard: Array.from(uniqueHard)
  };
  // Optional: Log counts for debugging
  // console.log('Problem counts:', {
  //   totalProblems: totalEasy + totalMedium + totalHard,
  //   totalUnique: uniqueProblems.size,
  //   uniqueEasy: uniqueEasy.size,
  //   uniqueMedium: uniqueMedium.size,
  //   uniqueHard: uniqueHard.size
  // });
}

// Function to switch between sections
function switchSection(section) {
  if (section === currentSection) {
    return; // Don't reload if already on the same section
  }
  // Save current section's filter state before switching
  saveFilterState();
  // Clear the search box when switching sections
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.value = '';
  }

  // Update active nav link (desktop)
  document.querySelectorAll('.nav-item').forEach(link => {
    link.classList.remove('active');
  });
  document.getElementById(`${section}Link`).classList.add('active');

  // Update active mobile menu item
  document.querySelectorAll('.mobile-menu-item').forEach(link => {
    link.classList.remove('active');
  });
  document.getElementById(`${section}LinkMobile`).classList.add('active');



  // Update current section
  currentSection = section;

  // Show the progress bar and controls for DSA and SQL sections
  const rectChartContainer = document.getElementById('rectChartContainer');
  const unifiedControlBarWrapper = document.querySelector('.unified-control-bar-wrapper');

  if (rectChartContainer) rectChartContainer.style.display = 'block';
  if (unifiedControlBarWrapper) unifiedControlBarWrapper.style.display = 'block';

  // Clear existing content
  document.getElementById('sections').innerHTML = '';

  // Load appropriate data - use the correct filename
  const dataFile = section === 'dsa' ? 'dsaWithId-problems.json' : `${section}-problems.json`;

  // ...existing code above...

  // Load and display new content with caching for DSA
  if (section === 'dsa' && window.dsaDataCache) {
    problemData = window.dsaDataCache;
    // console.log('[DSA] Using cached data');

    // Count unique problems
    countUniqueProblems(problemData);

    // Build and update UI
    buildRectBar();
    renderSections(problemData);

    requestAnimationFrame(() => {
      initializeCollapsibles();
      // initializeCheckboxes();
      // Remove old listener if exists
      const sectionsElement = document.getElementById('sections');
      if (sectionsClickHandler) {
        sectionsElement.removeEventListener('click', sectionsClickHandler);
      }

      // Create and store new handler
      sectionsClickHandler = function (e) {
        if (e.target.classList.contains('done-icon')) {
          e.stopPropagation();
          toggleSolved(e.target);
        }
      };

      // Add the new listener
      sectionsElement.addEventListener('click', sectionsClickHandler);
      loadProgress();
      loadSectionCompletions();
      loadSubsectionCompletions();

      requestAnimationFrame(() => {
        updateGlobalRectBar();
        updateSectionProgress();
        initializeTableSorting();
      });
    });

    restoreFilterState();
  } else {
    // console.log(`[${section.toUpperCase()}] Loading data from file: ${dataFile}`);
    fetch(dataFile)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        problemData = data;

        // Count unique problems
        countUniqueProblems(data);

        // Build and update UI - optimized order for better performance
        buildRectBar();
        renderSections(data);

        // Batch DOM operations for better performance
        requestAnimationFrame(() => {
          initializeCollapsibles();
          // initializeCheckboxes();
          const sectionsElement = document.getElementById('sections');
          if (sectionsClickHandler) {
            sectionsElement.removeEventListener('click', sectionsClickHandler);
          }

          sectionsClickHandler = function (e) {
            if (e.target.classList.contains('done-icon')) {
              e.stopPropagation();
              toggleSolved(e.target);
            }
          };

          sectionsElement.addEventListener('click', sectionsClickHandler);
          loadProgress();
          loadSectionCompletions();
          loadSubsectionCompletions();

          // Update progress in next frame to avoid layout thrashing
          requestAnimationFrame(() => {
            updateGlobalRectBar();
            updateSectionProgress();

            // Initialize table sorting after everything is loaded
            initializeTableSorting();
          });
        });

        // Restore filter state for this section
        restoreFilterState();
      })
      .catch(error => {
        console.error('Error loading data:', error);
        document.getElementById('sections').innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--error);">
          <h2>Error Loading Data</h2>
          <p>Unable to load ${section.toUpperCase()} problems. Please try again later.</p>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Error details: ${error.message}</p>
        </div>
      `;
      });
  }
}

/*
function switchSectionInterview(section) {
  // Update active nav link
  document.querySelectorAll('.nav-card').forEach(link => {
    link.classList.remove('active');
  });
  document.getElementById('interviewsLink').classList.add('active');

  // Update current section
  currentSection = section;

  // Hide the progress bar and controls for interview section
  const rectChartContainer = document.getElementById('rectChartContainer');
  const unifiedControlBarWrapper = document.querySelector('.unified-control-bar-wrapper');

  if (rectChartContainer) rectChartContainer.style.display = 'none';
  if (unifiedControlBarWrapper) unifiedControlBarWrapper.style.display = 'none';

  // Clear existing content
  const sectionsDiv = document.getElementById('sections');
  sectionsDiv.innerHTML = '';

  // Load interviews data
  fetch('interviews.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      const container = document.createElement('div');
      container.className = 'interview-container';

      const content = document.createElement('div');
      content.className = 'interview-content';

      // Main Interview Section with outer card
      const mainSection = document.createElement('div');
      mainSection.className = 'interview-main-section';

      // Companies List Section
      const companiesList = document.createElement('div');
      companiesList.className = 'companies-list';

      // Add Interview Experiences Header
      const interviewHeader = document.createElement('div');
      interviewHeader.className = 'section-header';
      interviewHeader.innerHTML = `
        <i class="material-icons">record_voice_over</i>
        <h2 class="section-title">Interview Experiences & Compensation</h2>
      `;
      companiesList.appendChild(interviewHeader);

      // Add company sections
      data.companies.forEach(company => {
        const companySection = document.createElement('div');
        companySection.className = 'company-section';

        const companyHeader = document.createElement('div');
        companyHeader.className = 'company-header';
        companyHeader.innerHTML = `
          <div class="company-icon">
            <i class="material-icons">business</i>
          </div>
          <h2 class="company-name">${company.companyName}</h2>
        `;

        const companyContent = document.createElement('div');
        companyContent.className = 'company-content';
        companyContent.style.display = 'none';

        const tabs = document.createElement('div');
        tabs.className = 'content-tabs';
        tabs.innerHTML = `
          <button class="tab-button active" data-type="interview">
            <i class="material-icons">description</i>
            <span>Interview Experiences</span>
          </button>
          <button class="tab-button" data-type="compensation">
            <i class="material-icons">payments</i>
            <span>Compensation</span>
          </button>
        `;

        const experienceList = document.createElement('div');
        experienceList.className = 'experience-list interview-experiences';
        experienceList.innerHTML = company.interview_experience.map(exp => `
          <div class="experience-item">
            <a href="${exp.link}" target="_blank" class="experience-link">
              <div class="experience-icon">
                <i class="material-icons">description</i>
              </div>
              <div class="experience-details">
                <div class="experience-title">${exp.name}</div>
                <div class="experience-meta">
                  <i class="material-icons">schedule</i>
                  Latest
                </div>
              </div>
            </a>
          </div>
        `).join('');

        const compensationList = document.createElement('div');
        compensationList.className = 'experience-list compensation-experiences';
        compensationList.style.display = 'none';
        compensationList.innerHTML = company.compensation.map(comp => `
          <div class="experience-item">
            <a href="${comp.link}" target="_blank" class="experience-link">
              <div class="experience-icon">
                <i class="material-icons">payments</i>
              </div>
              <div class="experience-details">
                <div class="experience-title">${comp.name}</div>
                <div class="experience-meta">
                  <i class="material-icons">schedule</i>
                  Latest
                </div>
              </div>
            </a>
          </div>
        `).join('');

        // Add click handlers for tabs
        tabs.querySelectorAll('.tab-button').forEach(tab => {
          tab.addEventListener('click', (e) => {
            e.stopPropagation();
            tabs.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.dataset.type;
            experienceList.style.display = type === 'interview' ? 'grid' : 'none';
            compensationList.style.display = type === 'compensation' ? 'grid' : 'none';
          });
        });

        // Add click handler for company header
        companyHeader.addEventListener('click', () => {
          // Close all other sections first
          document.querySelectorAll('.company-section').forEach(section => {
            if (section !== companySection) {
              section.classList.remove('expanded');
              const content = section.querySelector('.company-content');
              if (content) content.style.display = 'none';
            }
          });

          // Toggle current section
          companySection.classList.toggle('expanded');
          companyContent.style.display = companyContent.style.display === 'none' ? 'block' : 'none';
        });

        companyContent.appendChild(tabs);
        companyContent.appendChild(experienceList);
        companyContent.appendChild(compensationList);
        companySection.appendChild(companyHeader);
        companySection.appendChild(companyContent);
        companiesList.appendChild(companySection);
      });

      // Add companies list to main section
      mainSection.appendChild(companiesList);

      // Latest DSA Questions Section
      const dsaSection = document.createElement('div');
      dsaSection.className = 'latest-dsa';

      const dsaHeader = document.createElement('div');
      dsaHeader.className = 'section-header';
      dsaHeader.innerHTML = `
        <i class="material-icons">code</i>
        <h2 class="section-title">Latest DSA Questions</h2>
      `;

      const dsaList = document.createElement('div');
      dsaList.className = 'dsa-list';

      // Pagination variables
      const questionsPerPage = 5;
      let currentPage = 1;
      const totalQuestions = data.latest_dsa_questions.length;
      const totalPages = Math.ceil(totalQuestions / questionsPerPage);

      function showQuestionsForPage(page) {
        const startIdx = (page - 1) * questionsPerPage;
        const endIdx = startIdx + questionsPerPage;
        const dsaQuestions = data.latest_dsa_questions.slice(startIdx, endIdx);

        dsaList.innerHTML = dsaQuestions.map(question => `
          <a href="${question.link}" target="_blank" class="dsa-link">
            <div class="dsa-icon">
              <i class="material-icons">code</i>
            </div>
            <div class="dsa-details">
              <div class="dsa-title">${question.name}</div>
              <div class="dsa-meta">
                <i class="material-icons">schedule</i>
                Latest
              </div>
            </div>
          </a>
        `).join('');
      }

      // Create pagination controls
      const paginationContainer = document.createElement('div');
      paginationContainer.className = 'pagination-container';

      function updatePagination() {
        paginationContainer.innerHTML = `
          <button class="pagination-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="material-icons">chevron_left</i>
          </button>
          <span class="pagination-info">${currentPage} / ${totalPages}</span>
          <button class="pagination-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="material-icons">chevron_right</i>
          </button>
        `;

        // Add click event listeners to the new buttons
        const prevBtn = paginationContainer.querySelector('.prev-btn');
        const nextBtn = paginationContainer.querySelector('.next-btn');

        prevBtn.addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            showQuestionsForPage(currentPage);
            updatePagination();
          }
        });

        nextBtn.addEventListener('click', () => {
          if (currentPage < totalPages) {
            currentPage++;
            showQuestionsForPage(currentPage);
            updatePagination();
          }
        });
      }

      // Initial display
      showQuestionsForPage(currentPage);
      updatePagination();

      dsaSection.appendChild(dsaHeader);
      dsaSection.appendChild(dsaList);
      dsaSection.appendChild(paginationContainer);

      content.appendChild(mainSection);
      content.appendChild(dsaSection);
      container.appendChild(content);
      sectionsDiv.appendChild(container);
    })
    .catch(error => {
      console.error('Error loading interview data:', error);
      sectionsDiv.innerHTML = `
        <div class="interview-container">
          <div class="error-message" style="text-align: center; padding: 3rem;">
            <i class="material-icons" style="font-size: 4rem; color: #EF4444; margin-bottom: 1rem;">error_outline</i>
            <h2 style="color: #EF4444; margin-bottom: 1rem;">Error Loading Interview Data</h2>
            <p style="color: #94a3b8; margin-bottom: 0.5rem;">Unable to load interview experiences. Please try again later.</p>
            <p style="font-family: monospace; font-size: 0.9rem; color: #94a3b8;">${error.message}</p>
          </div>
        </div>
      `;
    });
}
*/
