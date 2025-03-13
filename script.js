/***************************************************************
 * GLOBAL VARIABLES & HELPERS
 ***************************************************************/
let totalEasy = 0;       // total # of easy problems
let totalMedium = 0;     // total # of medium
let totalHard = 0;       // total # of hard
let problemData = [];    // store fetched data

// For storing notess: problemId -> notes text
let notes = {};

// We'll track which problem's notes is currently being edited
let currentNotesProblemId = null;

// Add confetti script dynamically
const confettiScript = document.createElement('script');
confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
document.head.appendChild(confettiScript);

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
    solvedProblems[problemId] = true;
  });
  localStorage.setItem('dsaSolvedProblems', JSON.stringify(solvedProblems));
}

function loadProgress() {
  const saved = localStorage.getItem('dsaSolvedProblems');
  if (saved) {
    const solvedProblems = JSON.parse(saved);
    document.querySelectorAll('.done-icon').forEach(icon => {
      const problemId = icon.getAttribute('data-id');
      if (solvedProblems[problemId]) {
        icon.setAttribute('data-solved', 'true');
        icon.textContent = 'check_box';
        icon.parentElement.parentElement.classList.add('solved');
      }
    });
  }
  loadNotess();
  updateGlobalRectBar();
  updateSectionProgress();
}

/***************************************************************
 * FILTER PROBLEMS
 ***************************************************************/
function filterProblems() {
  const searchBox = document.getElementById('searchBox');
  if (!searchBox) return;
  const searchTerm = searchBox.value.toLowerCase();
  
  document.querySelectorAll('.collapsible').forEach(collapsible => {
    let sectionHasMatch = false;
    const rows = collapsible.querySelectorAll('tbody tr');
    
    // First hide/show rows based on search
    rows.forEach(row => {
      const problemText = row.querySelector('td:first-child').textContent.toLowerCase();
      if (problemText.includes(searchTerm)) {
        row.style.display = '';
        sectionHasMatch = true;
      } else {
        row.style.display = 'none';
      }
    });
    
    // Get the Materialize instance for this collapsible
    const instance = M.Collapsible.getInstance(collapsible);
    if (instance) {
      if (searchTerm === '') {
        // When search is cleared, collapse all sections
        instance.close(0);
      } else if (sectionHasMatch) {
        // Only expand if there's actually a match in this section
        instance.open(0);
      } else {
        // If no match in this section, collapse it
        instance.close(0);
      }
    }
  });
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
        <span id="easyStats" class="diff-easy">Easy: 0/0</span>
        <span id="mediumStats" class="diff-medium">Medium: 0/0</span>
        <span id="hardStats" class="diff-hard">Hard: 0/0</span>
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
  
  // Update difficulty stats
  const easyStatsElem = document.getElementById('easyStats');
  const mediumStatsElem = document.getElementById('mediumStats');
  const hardStatsElem = document.getElementById('hardStats');
  
  if (easyStatsElem) {
    easyStatsElem.textContent = `Easy: ${solved.easy}/${totalEasy}`;
  }
  if (mediumStatsElem) {
    mediumStatsElem.textContent = `Medium: ${solved.medium}/${totalMedium}`;
  }
  if (hardStatsElem) {
    hardStatsElem.textContent = `Hard: ${solved.hard}/${totalHard}`;
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
                  <span class="mini-label">Easy</span>
                  <div class="mini-progress"><div class="mini-fill easy-fill" style="width:0%"></div></div>
                  <span class="mini-count" data-diff="easy">(0/${aggEasy})</span>
                </div>
                <div class="mini-bar-line">
                  <span class="mini-label">Medium</span>
                  <div class="mini-progress"><div class="mini-fill medium-fill" style="width:0%"></div></div>
                  <span class="mini-count" data-diff="medium">(0/${aggMed})</span>
                </div>
                <div class="mini-bar-line">
                  <span class="mini-label">Hard</span>
                  <div class="mini-progress"><div class="mini-fill hard-fill" style="width:0%"></div></div>
                  <span class="mini-count" data-diff="hard">(0/${aggHard})</span>
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
                <span class="mini-label">Easy</span>
                <div class="mini-progress"><div class="mini-fill easy-fill" style="width:0%"></div></div>
                <span class="mini-count" data-diff="easy">(0/${easyCount})</span>
              </div>
              <div class="mini-bar-line">
                <span class="mini-label">Medium</span>
                <div class="mini-progress"><div class="mini-fill medium-fill" style="width:0%"></div></div>
                <span class="mini-count" data-diff="medium">(0/${mediumCount})</span>
              </div>
              <div class="mini-bar-line">
                <span class="mini-label">Hard</span>
                <div class="mini-progress"><div class="mini-fill hard-fill" style="width:0%"></div></div>
                <span class="mini-count" data-diff="hard">(0/${hardCount})</span>
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
              <span class="mini-label">Easy</span>
              <div class="mini-progress"><div class="mini-fill easy-fill" style="width:0%"></div></div>
              <span class="mini-count" data-diff="easy">(0/${easyCount})</span>
            </div>
            <div class="mini-bar-line">
              <span class="mini-label">Medium</span>
              <div class="mini-progress"><div class="mini-fill medium-fill" style="width:0%"></div></div>
              <span class="mini-count" data-diff="medium">(0/${mediumCount})</span>
            </div>
            <div class="mini-bar-line">
              <span class="mini-label">Hard</span>
              <div class="mini-progress"><div class="mini-fill hard-fill" style="width:0%"></div></div>
              <span class="mini-count" data-diff="hard">(0/${hardCount})</span>
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
      <table class="striped responsive-table highlight">
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
            const problemId = `${baseId}-${index}`;
            return `
              <tr class="${problem.difficulty}">
                <td>
                  <a href="${problem.question}" target="_blank">${problem.label}</a>
                </td>
                <td>
                  ${
                    problem.solution !== "-"
                      ? `<a href="${problem.solution}" target="_blank" class="btn-small waves-effect waves-light">Solution</a>`
                      : "-"
                  }
                </td>
                <td>
                  <div class="centered-container">
                    <i class="material-icons notes-icon" onclick="openNotesModal('${problemId}', '${problem.label}')">
                      sticky_note_2
                    </i>
                  </div>
                </td>
                <td>
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
function loadNotess() {
  const stored = localStorage.getItem('dsaNotes');
  if (stored) {
    notes = JSON.parse(stored);
  } else {
    notes = {};
  }
}

function openNotesModal(problemId, label) {
  currentNotesProblemId = problemId;
  const modal = document.getElementById('notesModal');
  const textarea = document.getElementById('notesModalTextarea');
  const title = document.getElementById('notesModalTitle');
  
  textarea.value = notes[problemId] || '';
  title.textContent = `Notes: ${label}`;
  
  modal.classList.add('active');
}

function closeNotesModal() {
  document.getElementById('notesModal').classList.remove('active');
  currentNotesProblemId = null;
}

function saveNotesModal() {
  if (!currentNotesProblemId) return;
  
  const text = document.getElementById('notesModalTextarea').value.trim();
  notes[currentNotesProblemId] = text;
  localStorage.setItem('dsaNotes', JSON.stringify(notes));
  
  // Show success message
  M.toast({
    html: '<span class="success-toast">Notes saved successfully!</span>',
    classes: 'rounded green',
    displayLength: 2000
  });
  
  closeNotesModal();
}

/***************************************************************
 * DARK MODE FUNCTIONS
 ***************************************************************/
function initializeDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (!darkModeToggle) return;
  
  // Load saved preference
  const isDarkMode = localStorage.getItem('dsaDarkMode') === 'true';
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

/***************************************************************
 * INITIALIZATION
 ***************************************************************/
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Materialize components
  M.AutoInit();
  
  // Initialize dark mode
  initializeDarkMode();
  
  // Set up search
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.addEventListener('input', filterProblems);
  }
  
  // Load problems data
  fetch('problems.json')
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      problemData = data;
      renderSections(data);
      
      // Count totals
      data.sections.forEach(section => {
        if (section.problems) {
          section.problems.forEach(problem => {
            if (problem.difficulty === 'easy') totalEasy++;
            if (problem.difficulty === 'medium') totalMedium++;
            if (problem.difficulty === 'hard') totalHard++;
          });
        }
        if (section.subsections) {
          section.subsections.forEach(subsec => {
            subsec.problems.forEach(problem => {
              if (problem.difficulty === 'easy') totalEasy++;
              if (problem.difficulty === 'medium') totalMedium++;
              if (problem.difficulty === 'hard') totalHard++;
            });
          });
        }
      });
      
      // Initialize UI
      const collapsibles = document.querySelectorAll('.collapsible');
      M.Collapsible.init(collapsibles, { accordion: false });
      
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
});
