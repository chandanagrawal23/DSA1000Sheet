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

// For storing notess: problemId -> notes text
let notes = {};

// We'll track which problem's notes is currently being edited
let currentNotesProblemId = null;

// Add confetti script dynamically
const confettiScript = document.createElement('script');
confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
document.head.appendChild(confettiScript);

// Track current section
let currentSection = 'dsa';

/***************************************************************
 * GO TO TOP BUTTON
 ***************************************************************/

var btn = document.getElementById('go-to-top-button');

window.addEventListener('scroll', function () {
  if (window.scrollY > 300) {
    btn.classList.add('show');
  } else {
    btn.classList.remove('show');
  }
});

btn.addEventListener('click', function (e) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/***************************************************************
 * MOBILE HAMBURGER MENU
 ***************************************************************/
function initializeMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileNavMenu = document.getElementById('mobileNavMenu');

  if (mobileMenuToggle && mobileNavMenu) {
    mobileMenuToggle.addEventListener('click', function() {
      // Toggle menu visibility
      mobileNavMenu.classList.toggle('active');
      mobileMenuToggle.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!mobileMenuToggle.contains(event.target) && !mobileNavMenu.contains(event.target)) {
        mobileNavMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
      }
    });

    // Close menu when clicking on a nav item
    const mobileNavCards = document.querySelectorAll('.mobile-nav-card');
    mobileNavCards.forEach(card => {
      card.addEventListener('click', function() {
        mobileNavMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
      });
    });

    // Handle window resize to close menu on desktop
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        mobileNavMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
      }
    });
  }
}

// Function to update mobile navigation active state
function updateMobileNavActive(activeId) {
  // Remove active class from all mobile nav cards
  document.querySelectorAll('.mobile-nav-card').forEach(card => {
    card.classList.remove('active');
  });

  // Add active class to the clicked mobile nav card
  const activeCard = document.getElementById(activeId);
  if (activeCard) {
    activeCard.classList.add('active');
  }
}


/***************************************************************
 * CELEBRATION FUNCTIONS
 ***************************************************************/
function triggerCelebration() {
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

  // Center burst
  confetti({
    particleCount: 50,
    spread: 360,
    origin: { x: 0.5, y: 0.5 },
    colors: colors
  });

  // Side bursts
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 0, y: 0.5 },
      colors: colors
    });
    confetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 1, y: 0.5 },
      colors: colors
    });
  }, 200);

  // Top corner bursts
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 0, y: 0 },
      colors: colors
    });
    confetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 1, y: 0 },
      colors: colors
    });
  }, 400);

  // Bottom corner bursts
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 0, y: 1 },
      colors: colors
    });
    confetti({
      particleCount: 30,
      spread: 90,
      origin: { x: 1, y: 1 },
      colors: colors
    });
  }, 600);

  // Final big burst
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
      ticks: 300
    });
  }, 800);
}

/***************************************************************
 * GET GLOBAL SOLVED
 ***************************************************************/
function getGlobalSolved() {
  const icons = document.querySelectorAll('.done-icon');
  let solved = { easy: 0, medium: 0, hard: 0 };
  icons.forEach(icon => {
    if (icon.getAttribute('data-solved') === 'true') {
      solved[icon.getAttribute('data-difficulty')]++;
    }
  });
  return solved;
}

/***************************************************************
 * TOGGLE SOLVED
 ***************************************************************/
function toggleSolved(icon) {
  const wasSolved = icon.getAttribute('data-solved') === 'true';

  // Toggle the solved state
  icon.setAttribute('data-solved', !wasSolved);
  icon.textContent = !wasSolved ? 'check_box' : 'check_box_outline_blank';
  icon.parentElement.parentElement.classList.toggle('solved', !wasSolved);

  // If marking as solved, trigger celebration
  if (!wasSolved) {
    triggerCelebration();
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
    const problemId = icon.getAttribute('data-id');
    const sectionName = problemId.split('-')[0];
    const problemLabel = icon.parentElement.parentElement.querySelector('td a').textContent;
    solvedProblems[sectionName + "-" + problemLabel] = true;
  });
  // Save to section-specific storage
  localStorage.setItem(`${currentSection}SolvedProblems`, JSON.stringify(solvedProblems));
}

function loadProgress() {
  // Load from section-specific storage
  const saved = localStorage.getItem(`${currentSection}SolvedProblems`);
  if (saved) {
    const solvedProblems = JSON.parse(saved);
    document.querySelectorAll('.done-icon').forEach(icon => {
      const problemId = icon.getAttribute('data-id');
      const sectionName = problemId.split('-')[0];
      const problemLabel = icon.parentElement.parentElement.querySelector('td a').textContent;
      if (solvedProblems[sectionName + "-" + problemLabel]) {
        icon.setAttribute('data-solved', 'true');
        icon.textContent = 'check_box';
        icon.parentElement.parentElement.classList.add('solved');
      }
    });
  }

  // Load notes after DOM is fully loaded
  setTimeout(() => {
    loadNotess();
  }, 500);
}

/***************************************************************
 * FILTER PROBLEMS
 ***************************************************************/
function filterProblems(event) {
  const searchBox = document.getElementById('searchBox');
  if (!searchBox) return;

  const searchTerm = searchBox.value.toLowerCase();
  console.log('Filtering with search term:', searchTerm);

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

          const matchesSearch = searchTerm ? text.includes(searchTerm) : true;

          // Only show if both conditions are met
          if (difficultyEnabled && matchesSearch) {
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

        const matchesSearch = searchTerm ? text.includes(searchTerm) : true;

        // Only show if both conditions are met
        if (difficultyEnabled && matchesSearch) {
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

  console.log('Filtering complete');
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

/***************************************************************
 * MINI PROGRESS BARS PER SECTION
 ***************************************************************/
function updateSectionProgress() {
  const collapsibles = document.querySelectorAll('.collapsible');
  collapsibles.forEach(sectionElem => {
    const sectionId = sectionElem.getAttribute('id');
    if (!sectionId) return;
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
    const miniBars = sectionElem.querySelector(`.mini-bars[data-id="${sectionId}"]`);
    if (!miniBars) return;
    updateMiniBar(miniBars, 'easy', solved.easy, total.easy);
    updateMiniBar(miniBars, 'medium', solved.medium, total.medium);
    updateMiniBar(miniBars, 'hard', solved.hard, total.hard);
  });
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
            <th>Notes</th>
            <th>Done</th>
          </tr>
        </thead>
        <tbody>
          ${problemArray.map((problem, index) => {
    const problemId = `${baseId}-${index}`.replace(/'/g, "$");
    // Escape any single quotes in the label to prevent breaking the onclick attribute
    const escapedLabel = problem.label.replace(/'/g, "$");
    const isLastRow = index === problemArray.length - 1;

    return `
              <tr class="${problem.difficulty}">
                <td data-label="Question">
                  <a href="${problem.question}" target="_blank">${problem.label}</a>
                </td>
                <td data-label="Solution">
                  ${problem.solution && problem.solution !== "-"
        ? `<div class="solution-container"><a href="${problem.solution}" target="_blank" class="solution-link"><span style="display:inline-block;">SOLUTION</span></a></div>`
        : "-"
      }
                </td>
                <td data-label="YouTube">
                  ${problem.youtube && problem.youtube !== "-"
        ? `<div class="solution-container"><a href="${problem.youtube}" target="_blank" class="youtube-link"><span style="display:inline-block;">WATCH</span></a></div>`
        : "-"
      }
                </td>
                <td data-label="Notes">
                  <div class="centered-container">
                    <i class="material-icons notes-icon" onclick="openNotesModal('${problemId}', '${escapedLabel}')">
                      sticky_note_2
                    </i>
                  </div>
                </td>
                <td data-label="Status" style="position: relative;">
                  <i class="material-icons done-icon"
                     data-difficulty="${problem.difficulty}"
                     data-id="${problemId}"
                     data-solved="false"
                     onclick="toggleSolved(this)">check_box_outline_blank</i>
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

// Separate function for LLD problems with multiple solutions and videos
function generateProblemsTableLLD(problemArray, baseId, showCollapseBtn = false) {
  return `
      <table class="striped highlight problem-table lld-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Solutions</th>
            <th>Videos</th>
            <th>Notes</th>
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
                  <a href="${problem.question}" target="_blank" class="question-link">${problem.label}</a>
                </td>
                <td data-label="Solutions">
                  ${solutionsHtml}
                </td>
                <td data-label="Videos">
                  ${youtubeHtml}
                </td>
                <td data-label="Notes">
                  <div class="centered-container">
                    <i class="material-icons notes-icon" onclick="openNotesModal('${problemId}', '${escapedLabel}')">
                      sticky_note_2
                    </i>
                  </div>
                </td>
                <td data-label="Status" style="position: relative;">
                  <i class="material-icons done-icon"
                     data-difficulty="${problem.difficulty}"
                     data-id="${problemId}"
                     data-solved="false"
                     onclick="toggleSolved(this)">check_box_outline_blank</i>
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

/***************************************************************
 * UPDATE SECTION PROGRESS
 * Now we must also update *subsection* progress bars
 ***************************************************************/
function updateSectionProgress() {
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
    // Collect the rows that belong to that subsection
    const subRows = document.querySelectorAll(`.collapsible-body.subsection-body table tbody tr`);
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
 * NOTES MODAL FUNCTIONS
 ***************************************************************/
/**
 * Load notes from localStorage with migration support for compatibility
 */
function loadNotess() {
  const stored = localStorage.getItem(`${currentSection}Notes`);
  if (stored) {
    notes = JSON.parse(stored);
  } else {
    notes = {};
  }
  // Update notes icons to be green if they have content
  updateNotesIcons();
}

// Helper function to update all notes icons based on note content
function updateNotesIcons() {
  console.log("Updating notes icons based on content...");
  document.querySelectorAll('.notes-icon').forEach(icon => {
    // Extract the problem ID from the onclick attribute
    const onclickAttr = icon.getAttribute('onclick');
    if (!onclickAttr) return;

    // Use a more robust regex to handle the escaped quotes in your labels
    const match = onclickAttr.match(/openNotesModal\('([^']+)',\s*'((?:[^'\\]|\\.)+)'\)/);
    if (!match) {
      console.log("No match found for:", onclickAttr);
      return;
    }

    const problemId = match[1];
    const escapedLabel = match[2];
    // Unescape the label to match how it's stored
    const label = escapedLabel.replace(/\\'/g, "'");
    const sectionName = problemId.split('-')[0];
    const stableNoteId = `${sectionName}-${label}`;

    // Set data-has-notes attribute based on whether notes exist and aren't empty
    if (notes[stableNoteId] && notes[stableNoteId].trim() !== '') {
      icon.setAttribute('data-has-notes', 'true');
      // console.log(`Notes found for ${stableNoteId}, setting icon to green`);
    } else {
      icon.setAttribute('data-has-notes', 'false');
    }
  });
}

/**
 * Updates the openNotesModal function to retrieve notes using stable identifiers
 */
function openNotesModal(problemId, label) {
  currentNotesProblemId = problemId;
  const modal = document.getElementById('notesModal');
  const textarea = document.getElementById('notesModalTextarea');
  const title = document.getElementById('notesModalTitle');

  // Extract section name from the problem ID
  const sectionName = problemId.split('-')[0];

  // Create the stable ID for lookup
  const stableNoteId = `${sectionName}-${label}`;

  // Try to find the note by stable ID first
  textarea.value = notes[stableNoteId] || '';
  title.textContent = `Notes: ${label}`;

  modal.classList.add('active');
}

function closeNotesModal() {
  document.getElementById('notesModal').classList.remove('active');
  currentNotesProblemId = null;
}

/**
 * Updates the saveNotesModal function to use stable identifiers
 * that won't break when problems are reordered
 */
function saveNotesModal() {
  if (!currentNotesProblemId) return;

  const text = document.getElementById('notesModalTextarea').value.trim();

  // Get the label and section for this problem
  const icon = document.querySelector(`.done-icon[data-id="${currentNotesProblemId}"]`);
  if (icon) {
    const row = icon.parentElement.parentElement;
    const label = row.querySelector('td a').textContent.replace(/'/g, "$");
    const sectionName = currentNotesProblemId.split('-')[0];

    // Create a stable key using section + label
    const stableNoteId = `${sectionName}-${label}`;

    // Store the note using the stable ID
    notes[stableNoteId] = text;

    // Save to localStorage with section-specific key
    localStorage.setItem(`${currentSection}Notes`, JSON.stringify(notes));
    // Update the notes icon color
    const notesIcon = row.querySelector('.notes-icon');
    if (notesIcon) {
      if (text && text.trim() !== '') {
        notesIcon.setAttribute('data-has-notes', 'true');
      } else {
        notesIcon.setAttribute('data-has-notes', 'false');
      }
    }

    // Show success message
    M.toast({
      html: '<span class="success-toast">Notes saved successfully!</span>',
      classes: 'rounded green',
      displayLength: 2000
    });
  }

  closeNotesModal();
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

  // If subsection, also check subsection completion
  if (isSubsection) {
    checkSubsectionCompletion(problemRow);
  }

  // Continue with parent section check (existing code)
  if (isSubsection) {
    // This is a subsection collapsible, find the parent section
    sectionElement = sectionElement.closest('.collapsible.z-depth-1');
  }

  if (!sectionElement) return;

  const sectionId = sectionElement.getAttribute('id');
  if (!sectionId) return;

  // Get section title
  const sectionTitle = sectionElement.querySelector('.topic-title')?.textContent;
  if (!sectionTitle) return;

  // Count total and solved problems in this section
  const allProblems = sectionElement.querySelectorAll('.done-icon');
  const solvedProblems = sectionElement.querySelectorAll('.done-icon[data-solved="true"]');

  const isCurrentlyCompleted = sectionElement.classList.contains('section-completed');
  const shouldBeCompleted = allProblems.length > 0 && allProblems.length === solvedProblems.length;

  //log all problems and solved problems for debugging
  console.log(`Section ID: ${sectionId}`);
  console.log(`Section Title: ${sectionTitle}`);
  console.log(`Total Problems: ${allProblems.length}`);
  console.log(`Solved Problems: ${solvedProblems.length}`);
  console.log(`Should be completed: ${shouldBeCompleted}`);
  console.log(`Is currently completed: ${isCurrentlyCompleted}`);


  if (shouldBeCompleted && !isCurrentlyCompleted) {
    // Section just became complete
    markSectionAsCompleted(sectionElement, sectionTitle);
    showCongratulationsBanner(sectionTitle);
    saveSectionCompletion(sectionId, sectionTitle);
  } else if (!shouldBeCompleted && isCurrentlyCompleted) {
    // Section is no longer complete
    markSectionAsIncomplete(sectionElement, sectionTitle);
    removeSectionCompletion(sectionId);
  }
}

function checkSubsectionCompletion(problemRow) {
  // Find the specific subsection li element that contains this problem
  const subsectionLi = problemRow.closest('.subsection-collapsible li');
  if (!subsectionLi) return;

  // Get subsection header and title
  const subsectionHeader = subsectionLi.querySelector('.collapsible-header.subsection-header');
  if (!subsectionHeader) return;

  const subsectionTitle = subsectionHeader.querySelector('.subsection-title')?.textContent?.split('[')[0]?.trim();
  if (!subsectionTitle) return;

  // Get the subsection ID from the mini-bars data-id
  const miniBars = subsectionHeader.querySelector('.mini-bars.small');
  const subsectionId = miniBars?.getAttribute('data-id');
  if (!subsectionId) return;

  // Count total and solved problems in this specific subsection
  const allProblems = subsectionLi.querySelectorAll('.done-icon');
  const solvedProblems = subsectionLi.querySelectorAll('.done-icon[data-solved="true"]');

  const isCurrentlyCompleted = subsectionHeader.classList.contains('subsection-completed');
  const shouldBeCompleted = allProblems.length > 0 && allProblems.length === solvedProblems.length;

  console.log(`Subsection ID: ${subsectionId}`);
  console.log(`Subsection Title: ${subsectionTitle}`);
  console.log(`Total Problems: ${allProblems.length}`);
  console.log(`Solved Problems: ${solvedProblems.length}`);
  console.log(`Should be completed: ${shouldBeCompleted}`);
  console.log(`Is currently completed: ${isCurrentlyCompleted}`);

  if (shouldBeCompleted && !isCurrentlyCompleted) {
    // Subsection just became complete
    markSubsectionAsCompleted(subsectionHeader, subsectionTitle);
    showSubsectionCompletionToast(subsectionTitle);
    saveSubsectionCompletion(subsectionId, subsectionTitle);
  } else if (!shouldBeCompleted && isCurrentlyCompleted) {
    // Subsection is no longer complete
    markSubsectionAsIncomplete(subsectionHeader, subsectionTitle);
    removeSubsectionCompletion(subsectionId);
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

  console.log(`Section "${sectionTitle}" marked as completed!`);
}

function markSectionAsIncomplete(sectionElement, sectionTitle) {
  // Remove completed class from section
  sectionElement.classList.remove('section-completed');

  // The folder icon will automatically return to normal color via CSS
  console.log(`Section "${sectionTitle}" marked as incomplete.`);
}

function markSubsectionAsCompleted(subsectionHeader, subsectionTitle) {
  // Add completed class to subsection header
  subsectionHeader.classList.add('subsection-completed');

  console.log(`Subsection "${subsectionTitle}" marked as completed!`);
}

function markSubsectionAsIncomplete(subsectionHeader, subsectionTitle) {
  // Remove completed class from subsection header
  subsectionHeader.classList.remove('subsection-completed');

  console.log(`Subsection "${subsectionTitle}" marked as incomplete.`);
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

// Temporary test function - remove in production
window.testWelcomeModal = function() {
  console.log('Manual test of welcome modal');
  showWelcomeModal();
};

function showCongratulationsBanner(sectionTitle) {
  const banner = document.getElementById('congratulationsBanner');
  const sectionNameSpan = document.getElementById('sectionName');
  const congratsMessage = document.getElementById('congratsMessage');
  const congratsTitle = document.getElementById('congratsTitle');

  if (banner && sectionNameSpan && congratsMessage && congratsTitle) {
    sectionNameSpan.textContent = sectionTitle;

    // Personalize the message if user name is available
    const userName = getUserName();
    if (userName) {
      congratsTitle.textContent = `Congratulations, ${userName}!`;
      congratsMessage.innerHTML = `Great job! You completed <strong>${sectionTitle}</strong>. Keep up the excellent work! 🎉`;
    } else {
      congratsTitle.textContent = 'Congratulations!';
      congratsMessage.innerHTML = `You completed <strong>${sectionTitle}</strong>. Great going!`;
    }

    banner.classList.add('active');
    // Prevent body scroll when banner is open
    document.body.style.overflow = 'hidden';

    // Trigger confetti celebration
    setTimeout(() => {
      triggerCelebration();
    }, 300);
  }
}

function hideCongratulationsBanner() {
  const banner = document.getElementById('congratulationsBanner');
  if (banner) {
    banner.classList.remove('active');
    // Restore body scroll
    document.body.style.overflow = '';
  }
}

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

function loadSectionCompletions() {
  try {
    const completedSections = JSON.parse(localStorage.getItem(`${currentSection}CompletedSections`) || '{}');

    Object.keys(completedSections).forEach(sectionId => {
      const sectionElement = document.getElementById(sectionId);
      if (sectionElement) {
        const sectionData = completedSections[sectionId];
        markSectionAsCompleted(sectionElement, sectionData.title);
      }
    });
  } catch (error) {
    console.error('Error loading section completions:', error);
  }
}

function loadSubsectionCompletions() {
  try {
    const completedSubsections = JSON.parse(localStorage.getItem(`${currentSection}CompletedSubsections`) || '{}');

    Object.keys(completedSubsections).forEach(subsectionId => {
      // Find the subsection header by looking for mini-bars with matching data-id
      const subsectionHeader = document.querySelector(`.mini-bars.small[data-id="${subsectionId}"]`)?.closest('.collapsible-header.subsection-header');
      if (subsectionHeader) {
        const subsectionData = completedSubsections[subsectionId];
        markSubsectionAsCompleted(subsectionHeader, subsectionData.title);
      }
    });
  } catch (error) {
    console.error('Error loading subsection completions:', error);
  }
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
    // Get all localStorage keys that contain progress or notes data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('SolvedProblems') ||
        key.includes('Notes') ||
        key.includes('CompletedSections') ||
        key.includes('CompletedSubsections') ||
        key === 'dsaSolvedProblems' || // Legacy key
        key === 'dsaNotess' || // Legacy key
        key === 'sqlSolvedProblems' ||
        key === 'sqlNotes' ||
        key === 'userProfile' // Include user profile in reset
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

    // Reset all notes icons
    document.querySelectorAll('.notes-icon').forEach(icon => {
      icon.setAttribute('data-has-notes', 'false');
    });

    // Reset all completed sections
    document.querySelectorAll('.section-completed').forEach(section => {
      section.classList.remove('section-completed');
    });

    // Reset all completed subsections
    document.querySelectorAll('.subsection-completed').forEach(subsection => {
      subsection.classList.remove('subsection-completed');
    });

    // Clear the notes object
    if (typeof notes !== 'undefined') {
      notes = {};
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
    }
  });

  // Initialize subsection collapsibles
  const subsectionCollapsibles = document.querySelectorAll('.subsection-collapsible');
  M.Collapsible.init(subsectionCollapsibles, {
    accordion: false,
    onOpenStart: function (el) {
      el.dataset.manuallyOpened = 'true';
    }
  });
}

/***************************************************************
 * Custom Tooltip Implementation
 ***************************************************************/
function setupCustomTooltips() {
  console.log("Setting up custom tooltips...");
  
  // Create a single tooltip element that we'll reuse
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.id = 'custom-tooltip';
  document.body.appendChild(tooltip);
  
  // Get all tooltip elements
  const tooltippedElements = document.querySelectorAll('.tooltipped');
  console.log(`Found ${tooltippedElements.length} tooltipped elements`);
  
  tooltippedElements.forEach(element => {
    // Get tooltip content from data-tooltip attribute
    const tooltipContent = element.getAttribute('data-tooltip');
    console.log(`Element: ${element.id}, tooltip content: ${tooltipContent}`);
    
    // Add mouse events
    element.addEventListener('mouseenter', function(e) {
      console.log(`Mouse entered ${element.id}`);
      // Set tooltip content
      tooltip.textContent = tooltipContent;
      
      // Position tooltip based on data-position
      const position = element.getAttribute('data-position') || 'bottom';
      positionTooltip(tooltip, element, position);
      
      // Show tooltip immediately (removed delay)
      tooltip.classList.add('visible');
    });
    
    element.addEventListener('mouseleave', function() {
      console.log(`Mouse left ${element.id}`);
      // Hide tooltip
      tooltip.classList.remove('visible');
    });
  });
}

// Position the tooltip relative to the target element
function positionTooltip(tooltip, targetElement, position) {
  const rect = targetElement.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // Default positioning (for bottom)
  let top = rect.bottom + 10;
  let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
  
  // Adjust based on position
  switch(position) {
    case 'top':
      top = rect.top - tooltipRect.height - 10;
      // Remove and re-add the arrow for proper styling
      tooltip.style.setProperty('--arrow-position', 'bottom');
      tooltip.setAttribute('data-position', 'top');
      break;
    case 'left':
      top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      left = rect.left - tooltipRect.width - 10;
      tooltip.style.setProperty('--arrow-position', 'right');
      tooltip.setAttribute('data-position', 'left');
      break;
    case 'right':
      top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      left = rect.right + 10;
      tooltip.style.setProperty('--arrow-position', 'left');
      tooltip.setAttribute('data-position', 'right');
      break;
    default: // bottom
      tooltip.style.setProperty('--arrow-position', 'top');
      tooltip.setAttribute('data-position', 'bottom');
      break;
  }
  
  // Make sure tooltip stays within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Adjust horizontally if needed
  if (left < 10) left = 10;
  if (left + tooltipRect.width > viewportWidth - 10) {
    left = viewportWidth - tooltipRect.width - 10;
  }
  
  // Adjust vertically if needed
  if (top < 10) top = 10;
  if (top + tooltipRect.height > viewportHeight - 10) {
    top = viewportHeight - tooltipRect.height - 10;
  }
  
  // Set tooltip position
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

/***************************************************************
 * FILTER CHECKBOX TUTORIAL TOOLTIP 
 ***************************************************************/
function showFirstCheckboxTooltip() {
  // Get refresh count from localStorage (default to 0)
  let refreshCount = parseInt(localStorage.getItem('refreshCount')) || 0;
  
  // Increment refresh count
  refreshCount++;
  localStorage.setItem('refreshCount', refreshCount);

  // Show tooltip only every 10th refresh
  if (refreshCount > 5 && refreshCount % 10 !== 0) {
    return;
  }

  const firstSection = document.querySelector('.collapsible');
  if (!firstSection) {
    console.log('No sections found yet, will retry');
    setTimeout(showFirstCheckboxTooltip, 1000);
    return;
  }

  const instance = M.Collapsible.getInstance(firstSection);
  if (instance) {
    instance.open(0);
  }

  setTimeout(() => {
    const firstEasyCheckbox = firstSection.querySelector('.square-check.easy');
    if (!firstEasyCheckbox) {
      console.log('No Easy checkbox found');
      return;
    }

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
      specialTooltip.style.left = `${checkboxRect.left}px`;
      specialTooltip.style.top = `${checkboxRect.top - specialTooltip.offsetHeight - 10}px`;
      specialTooltip.style.opacity = '1';
      specialTooltip.style.transform = 'translateY(0)';

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
      specialTooltip.style.left = `${newCheckboxRect.left}px`;
      specialTooltip.style.top = `${newCheckboxRect.top - specialTooltip.offsetHeight - 10}px`;
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
  // Initialize Materialize components
  M.AutoInit();

  // Initialize tooltips (we'll override this with our custom tooltips)
  var tooltipElems = document.querySelectorAll('.tooltipped');
  var tooltipInstances = M.Tooltip.init(tooltipElems, {
    enterDelay: 300,
    exitDelay: 100
  });

  // Custom tooltip implementation
  setupCustomTooltips();
  
  // Show temporary filter tooltip for the first Easy checkbox
  setTimeout(() => {
    showFirstCheckboxTooltip();
  }, 1000);

  // Initialize dark mode
  initializeDarkMode();

  // Initialize mobile menu
  initializeMobileMenu();

  // Initialize section controls
  initSectionControls();

  // Initialize reset progress button
  const resetBtn = document.getElementById('resetProgressBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', showResetConfirmation);
  }

  // Initialize reset banner click outside functionality
  initResetBannerClickOutside();

  loadProgress();
  loadNotess();
  updateGlobalRectBar();
  updateSectionProgress();

  // Add footer text with hyperlink
  const footer = document.createElement('a');
  footer.href = 'https://www.youtube.com/@BhajanMarg';
  footer.target = '_blank';
  footer.rel = 'noopener noreferrer';
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
        console.log('Search triggered with:', e.target.value);
        filterProblems(e);
      }, 300); // Debounce for 300ms
    });
    console.log('Search listener attached to:', searchBox);
  } else {
    console.warn('Search box not found!');
  }

  // Load problems data
  fetch('dsa-problems.json')
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      problemData = data;

      // Count unique problems
      countUniqueProblems(data);

      renderSections(data);

      initializeCollapsibles();

      // Initialize all checkboxes
      initializeCheckboxes();

      buildRectBar();
      loadProgress();
      loadSectionCompletions();
      loadSubsectionCompletions();
      updateGlobalRectBar();
      updateSectionProgress();

      // Check if this is the user's first visit and show welcome modal
      setTimeout(() => {
        checkFirstVisit();
      }, 1000);
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
  });

  document.getElementById('blind75Link').addEventListener('click', (e) => {
    e.preventDefault();
    switchSection('blind75');
  });

  document.getElementById('leetcode150Link').addEventListener('click', (e) => {
    e.preventDefault();
    switchSection('leetcode150');
  });
  //chandan
  // document.getElementById('sqlLink').addEventListener('click', (e) => {
  //   e.preventDefault();
  //   switchSection('sql');
  // });

  // document.getElementById('lldLink').addEventListener('click', (e) => {
  //   e.preventDefault();
  //   switchSection('lld');
  // });

  // document.getElementById('hldLink').addEventListener('click', (e) => {
  //   e.preventDefault();
  //   switchSection('hld');
  // });

  // Add click handlers for mobile navigation
  document.getElementById('dsaLinkMobile').addEventListener('click', (e) => {
    e.preventDefault();
    switchSection('dsa');
    updateMobileNavActive('dsaLinkMobile');
  });

  document.getElementById('blind75LinkMobile').addEventListener('click', (e) => {
    e.preventDefault();
    switchSection('blind75');
    updateMobileNavActive('blind75LinkMobile');
  });

  document.getElementById('leetcode150LinkMobile').addEventListener('click', (e) => {
    e.preventDefault();
    switchSection('leetcode150');
    updateMobileNavActive('leetcode150LinkMobile');
  });

  // chandan
  // document.getElementById('sqlLinkMobile').addEventListener('click', (e) => {
  //   e.preventDefault();
  //   switchSection('sql');
  //   updateMobileNavActive('sqlLinkMobile');
  // });

  // document.getElementById('lldLinkMobile').addEventListener('click', (e) => {
  //   e.preventDefault();
  //   switchSection('lld');
  //   updateMobileNavActive('lldLinkMobile');
  // });

  // document.getElementById('hldLinkMobile').addEventListener('click', (e) => {
  //   e.preventDefault();
  //   switchSection('hld');
  //   updateMobileNavActive('hldLinkMobile');
  // });

  /* do not remove this yet, we will need it later
  document.getElementById('interviewsLink').addEventListener('click', (e) => {
    e.preventDefault();
    switchSectionInterview('interviews');
  });
  */
});

// Function to initialize checkboxes
function initializeCheckboxes() {
  // Wait a short time to ensure DOM is fully rendered
  setTimeout(() => {
    console.log('Initializing checkboxes...');

    // Get all checkboxes and remove existing event listeners by cloning
    const checkboxes = document.querySelectorAll('.square-check');
    console.log('Found checkboxes:', checkboxes.length);
    checkboxes.forEach(checkbox => {
      const newCheckbox = checkbox.cloneNode(true);
      checkbox.parentNode.replaceChild(newCheckbox, checkbox);
    });

    // Add event listeners to the new checkboxes
    document.querySelectorAll('.square-check').forEach(checkbox => {
      // Ensure checkbox is visible and checked by default
      checkbox.checked = true;

      // Add click event listener
      checkbox.addEventListener('click', function (e) {
        // Stop event propagation to prevent collapsible from toggling
        e.stopPropagation();
        console.log('Checkbox clicked:', this.dataset.section, this.dataset.difficulty, this.checked);

        // If this checkbox is a parent (i.e. not inside a subsection container)
        if (!this.closest('.mini-bars.small')) {
          // Get the parent section (collapsible) that contains both parent and child checkboxes
          const parentSection = this.closest('.collapsible');
          if (parentSection) {
            const difficulty = this.dataset.difficulty; // e.g., "easy", "medium", or "hard"
            // Find all child checkboxes in subsections with the same difficulty
            const childCheckboxes = parentSection.querySelectorAll(`.mini-bars.small .square-check.${difficulty}`);
            childCheckboxes.forEach(child => {
              child.checked = this.checked;
            });
          }
        }

        // Filter problems based on the updated state
        filterProblems(e);
      });
    });

    // Add event listeners to the labels to prevent event propagation
    document.querySelectorAll('.difficulty-filter-square').forEach(label => {
      label.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    });
  }, 500);
}


/***************************************************************
 * EXPAND/COLLAPSE SECTION CONTROLS
 ***************************************************************/
function initSectionControls() {
  const sectionControls = document.createElement('div');
  sectionControls.className = 'section-controls';

  sectionControls.innerHTML = `
    <button class="control-button collapse-all">
      <i class="material-icons">unfold_less</i><span>Collapse All</span>
    </button>
    <button class="control-button expand-all">
      <i class="material-icons">unfold_more</i><span>Expand All</span>
    </button>
  `;

  sectionControls.querySelector('.collapse-all').addEventListener('click', () => toggleSections(false));
  sectionControls.querySelector('.expand-all').addEventListener('click', () => toggleSections(true));

  // Append the section controls to the dedicated container
  const controlsContainer = document.querySelector('.section-controls-container');
  if (controlsContainer) {
    controlsContainer.appendChild(sectionControls);
  }
}


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
function countUniqueProblems(data) {
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

  // Optional: Log counts for debugging
  console.log('Problem counts:', {
    totalProblems: totalEasy + totalMedium + totalHard,
    totalUnique: uniqueProblems.size,
    uniqueEasy: uniqueEasy.size,
    uniqueMedium: uniqueMedium.size,
    uniqueHard: uniqueHard.size
  });
}

// Function to switch between sections
function switchSection(section) {
  // Update active nav link (desktop)
  document.querySelectorAll('.nav-card').forEach(link => {
    link.classList.remove('active');
  });
  document.getElementById(`${section}Link`).classList.add('active');

  // Update active nav link (mobile)
  document.querySelectorAll('.mobile-nav-card').forEach(link => {
    link.classList.remove('active');
  });
  document.getElementById(`${section}LinkMobile`).classList.add('active');

  // Update current section
  currentSection = section;

  // Show the progress bar and controls for DSA and SQL sections
  const rectChartContainer = document.getElementById('rectChartContainer');
  const searchControls = document.querySelector('.search-and-controls');
  const sectionControls = document.querySelector('.section-controls');

  if (rectChartContainer) rectChartContainer.style.display = 'block';
  if (searchControls) searchControls.style.display = 'flex';
  if (sectionControls) sectionControls.style.display = 'flex';

  // Clear existing content
  document.getElementById('sections').innerHTML = '';
  // Load appropriate data
  const dataFile = `${section}-problems.json`;

  // Load and display new content
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

      // Build and update UI
      buildRectBar();
      renderSections(data);
      initializeCollapsibles();
      initializeCheckboxes();
      loadProgress();
      loadSectionCompletions();
      loadSubsectionCompletions();
      updateGlobalRectBar();
      updateSectionProgress();
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
  const searchControls = document.querySelector('.search-and-controls');
  const sectionControls = document.querySelector('.section-controls');

  if (rectChartContainer) rectChartContainer.style.display = 'none';
  if (searchControls) searchControls.style.display = 'none';
  if (sectionControls) sectionControls.style.display = 'none';

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
