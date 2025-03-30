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

  // If there's no search term, collapse everything unless it was from a checkbox click
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
        const rows = subsectionBody.querySelectorAll('tr');
        let hasMatchInSubsection = false;

        // Get difficulty filters for this subsection
        const subsectionId = subsection.querySelector('.mini-bars')?.dataset.id;
        if (!subsectionId) return;

        const easyChecked = subsection.querySelector(`.square-check.easy[data-section="${subsectionId}"]`)?.checked ?? true;
        const mediumChecked = subsection.querySelector(`.square-check.medium[data-section="${subsectionId}"]`)?.checked ?? true;
        const hardChecked = subsection.querySelector(`.square-check.hard[data-section="${subsectionId}"]`)?.checked ?? true;

        // Show all difficulties if none are checked
        const showAllDifficulties = !easyChecked && !mediumChecked && !hardChecked;

        rows.forEach(row => {
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
            }, 100); // Small delay to ensure parent section is opened first
          }
        } else {
          subsection.style.display = 'none';
        }
      });
    } else {
      // Handle sections without subsections
      const rows = sectionBody.querySelectorAll('tr');
      const sectionId = section.getAttribute('id');
      if (!sectionId) return;

      const easyChecked = section.querySelector(`.square-check.easy[data-section="${sectionId}"]`)?.checked ?? true;
      const mediumChecked = section.querySelector(`.square-check.medium[data-section="${sectionId}"]`)?.checked ?? true;
      const hardChecked = section.querySelector(`.square-check.hard[data-section="${sectionId}"]`)?.checked ?? true;

      const showAllDifficulties = !easyChecked && !mediumChecked && !hardChecked;

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const difficulty = row.classList.contains('easy') ? 'easy' :
          row.classList.contains('medium') ? 'medium' :
            row.classList.contains('hard') ? 'hard' : '';

        const difficultyEnabled = showAllDifficulties ||
          (difficulty === 'easy' && easyChecked) ||
          (difficulty === 'medium' && mediumChecked) ||
          (difficulty === 'hard' && hardChecked);

        // Then check if it matches the search term
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

  console.log('Filtering complete');
}

/***************************************************************
 * BUILD & UPDATE GLOBAL RECTANGULAR PROGRESS BAR
 ***************************************************************/
function buildRectBar() {
  const container = document.getElementById('rectChartContainer');
  if (!container) return;
  container.innerHTML = `
    <div class="progress-card">
      <h2>Overall Progress</h2>
      <div class="stacked-bar">
        <div class="bar-segment easy-segment" id="easySegment"></div>
        <div class="bar-segment medium-segment" id="mediumSegment"></div>
        <div class="bar-segment hard-segment" id="hardSegment"></div>
        <div class="bar-segment unsolved-segment" id="unsolvedSegment"></div>
      </div>
      <div class="progress-stats">
        <span id="percentSolved" class="percent-text">0% solved</span>
        <span id="overallSolvedText" class="overall-text">0/0 Solved</span>
      </div>
      <div class="difficulty-breakdown">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
          <div style="text-align: center;">
            <div id="easyStats" class="diff-easy">Easy: 0/0</div>
            <div class="unique-count easy-unique" style="opacity: 0.7;">(0 unique)</div>
          </div>
          <div style="text-align: center;">
            <div id="mediumStats" class="diff-medium">Medium: 0/0</div>
            <div class="unique-count medium-unique" style="opacity: 0.7;">(0 unique)</div>
          </div>
          <div style="text-align: center;">
            <div id="hardStats" class="diff-hard">Hard: 0/0</div>
            <div class="unique-count hard-unique" style="opacity: 0.7;">(0 unique)</div>
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
            ${generateProblemTable(sec.problems, sectionId)}
          </div>
        </li>
      </ul>
    `;
}

/***************************************************************
 * Subsection Collapsible
 ***************************************************************/
function generateSubsectionCollapsible(subsec) {
  const subsecId = subsec.title.replace(/\s+/g, '');
  const easyCount = subsec.problems.filter(p => p.difficulty === 'easy').length;
  const mediumCount = subsec.problems.filter(p => p.difficulty === 'medium').length;
  const hardCount = subsec.problems.filter(p => p.difficulty === 'hard').length;

  return `
      <li>
        <div class="collapsible-header subsection-header">
          <i class="material-icons subsection-icon">subdirectory_arrow_right</i>
          <span class="subsection-title">${subsec.title}</span>
          <div class="mini-bars small" data-id="${subsecId}">
            <div class="mini-bar-line">
              <label class="difficulty-filter-square" title="Filter Easy Problems" style="display:inline-flex; width:24px; height:24px; margin-right:0.25rem;">
                <input type="checkbox" class="square-check easy" data-section="${subsecId}" data-difficulty="easy" checked 
                  style="opacity:1; position:static; pointer-events:auto; width:22px; height:22px; border-radius:50%; border:3px solid var(--easy-color); display:block;">
              </label>
              <span class="mini-label" style="margin-right:0.25rem;">Easy</span>
              <div class="mini-progress" style="margin:0 0.25rem;"><div class="mini-fill easy-fill" style="width:0%"></div></div>
              <span class="mini-count" data-diff="easy" style="margin-left:0.25rem;">(0/${easyCount})</span>
            </div>
            <div class="mini-bar-line">
              <label class="difficulty-filter-square" title="Filter Medium Problems" style="display:inline-flex; width:24px; height:24px; margin-right:0.25rem;">
                <input type="checkbox" class="square-check medium" data-section="${subsecId}" data-difficulty="medium" checked
                  style="opacity:1; position:static; pointer-events:auto; width:22px; height:22px; border-radius:50%; border:3px solid var(--medium-color); display:block;">
              </label>
              <span class="mini-label" style="margin-right:0.25rem;">Medium</span>
              <div class="mini-progress" style="margin:0 0.25rem;"><div class="mini-fill medium-fill" style="width:0%"></div></div>
              <span class="mini-count" data-diff="medium" style="margin-left:0.25rem;">(0/${mediumCount})</span>
            </div>
            <div class="mini-bar-line">
              <label class="difficulty-filter-square" title="Filter Hard Problems" style="display:inline-flex; width:24px; height:24px; margin-right:0.25rem;">
                <input type="checkbox" class="square-check hard" data-section="${subsecId}" data-difficulty="hard" checked
                  style="opacity:1; position:static; pointer-events:auto; width:22px; height:22px; border-radius:50%; border:3px solid var(--hard-color); display:block;">
              </label>
              <span class="mini-label" style="margin-right:0.25rem;">Hard</span>
              <div class="mini-progress" style="margin:0 0.25rem;"><div class="mini-fill hard-fill" style="width:0%"></div></div>
              <span class="mini-count" data-diff="hard" style="margin-left:0.25rem;">(0/${hardCount})</span>
            </div>
          </div>
        </div>
        <div class="collapsible-body subsection-body">
          ${generateProblemTable(subsec.problems, subsecId)}
        </div>
      </li>
    `;
}

/***************************************************************
 * Problem Table Helper
 ***************************************************************/
function generateProblemTable(problemArray, baseId) {
  return `
      <table class="striped highlight problem-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Solution</th>
            <th>Notes</th>
            <th>Done</th>
          </tr>
        </thead>
        <tbody>
          ${problemArray.map((problem, index) => {
    const problemId = `${baseId}-${index}`.replace(/'/g, "$");
    // Escape any single quotes in the label to prevent breaking the onclick attribute
    const escapedLabel = problem.label.replace(/'/g, "$");

    return `
              <tr class="${problem.difficulty}">
                <td data-label="Question">
                  <a href="${problem.question}" target="_blank">${problem.label}</a>
                </td>
                <td data-label="Solution">
                  ${problem.solution !== "-"
        ? `<div class="solution-container"><a href="${problem.solution}" target="_blank" class="solution-link"><span style="display:inline-block;">SOLUTION</span></a></div>`
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
                <td data-label="Status">
                  <i class="material-icons done-icon"
                     data-difficulty="${problem.difficulty}"
                     data-id="${problemId}"
                     data-solved="false"
                     onclick="toggleSolved(this)">check_box_outline_blank</i>
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
 * INITIALIZATION
 ***************************************************************/
document.addEventListener('DOMContentLoaded', function () {
  // Initialize Materialize components
  M.AutoInit();

  // Initialize dark mode
  initializeDarkMode();

  // Initialize section controls
  initSectionControls();
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

      // Reset Sets before counting
      uniqueProblems.clear();
      uniqueEasy.clear();
      uniqueMedium.clear();
      uniqueHard.clear();

      // Count totals and track unique problems
      data.sections.forEach(section => {
        if (section.problems) {
          section.problems.forEach(problem => {
            uniqueProblems.add(problem.label);
            if (problem.difficulty === 'easy') {
              totalEasy++;
              uniqueEasy.add(problem.label);
            }
            if (problem.difficulty === 'medium') {
              totalMedium++;
              uniqueMedium.add(problem.label);
            }
            if (problem.difficulty === 'hard') {
              totalHard++;
              uniqueHard.add(problem.label);
            }
          });
        }
        if (section.subsections) {
          section.subsections.forEach(subsec => {
            subsec.problems.forEach(problem => {
              uniqueProblems.add(problem.label);
              if (problem.difficulty === 'easy') {
                totalEasy++;
                uniqueEasy.add(problem.label);
              }
              if (problem.difficulty === 'medium') {
                totalMedium++;
                uniqueMedium.add(problem.label);
              }
              if (problem.difficulty === 'hard') {
                totalHard++;
                uniqueHard.add(problem.label);
              }
            });
          });
        }
      });

      // console.log('First load complete');
      // console.log('Unique problems:', {
      //   totalProblems: totalEasy + totalMedium + totalHard,
      //   totalUnique: uniqueProblems.size,
      //   totalEasy: totalEasy,
      //   totalMedium: totalMedium,
      //   totalHard: totalHard,
      //   uniqueEasy: uniqueEasy.size,
      //   uniqueMedium: uniqueMedium.size,
      //   uniqueHard: uniqueHard.size
      // });

      renderSections(data);

      initializeCollapsibles();

      // Initialize all checkboxes
      initializeCheckboxes();

      buildRectBar();
      loadProgress();
      updateGlobalRectBar();
      updateSectionProgress();
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

  // Add click handlers for navigation
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

  document.getElementById('sqlLink').addEventListener('click', (e) => {
    e.preventDefault();
    switchSection('sql');
  });

  document.getElementById('interviewsLink').addEventListener('click', (e) => {
    e.preventDefault();
    switchSectionInterview('interviews');
  });

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

// Function to switch between sections
function switchSection(section) {
  // Update active nav link
  document.querySelectorAll('.nav-card').forEach(link => {
    link.classList.remove('active');
  });
  document.getElementById(`${section}Link`).classList.add('active');

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

  // Reset all counters and sets before loading new data
  totalEasy = 0;
  totalMedium = 0;
  totalHard = 0;
  uniqueProblems.clear();
  uniqueEasy.clear();
  uniqueMedium.clear();
  uniqueHard.clear();

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

      // Count totals and track unique problems
      data.sections.forEach(section => {
        if (section.problems) {
          section.problems.forEach(problem => {
            uniqueProblems.add(problem.label);
            if (problem.difficulty === 'easy') {
              totalEasy++;
              uniqueEasy.add(problem.label);
            }
            if (problem.difficulty === 'medium') {
              totalMedium++;
              uniqueMedium.add(problem.label);
            }
            if (problem.difficulty === 'hard') {
              totalHard++;
              uniqueHard.add(problem.label);
            }
          });
        }
        if (section.subsections) {
          section.subsections.forEach(subsec => {
            subsec.problems.forEach(problem => {
              uniqueProblems.add(problem.label);
              if (problem.difficulty === 'easy') {
                totalEasy++;
                uniqueEasy.add(problem.label);
              }
              if (problem.difficulty === 'medium') {
                totalMedium++;
                uniqueMedium.add(problem.label);
              }
              if (problem.difficulty === 'hard') {
                totalHard++;
                uniqueHard.add(problem.label);
              }
            });
          });
        }
      });

      // Build and update UI
      buildRectBar();
      renderSections(data);
      initializeCollapsibles();
      initializeCheckboxes();
      loadProgress();
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