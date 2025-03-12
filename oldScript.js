/***************************************************************
 * GLOBAL VARIABLES & HELPERS
 ***************************************************************/
let totalEasy = 0;       // total # of easy problems
let totalMedium = 0;     // total # of medium
let totalHard = 0;       // total # of hard
let problemData = [];    // store fetched data

// For storing notess: problemId -> notes text
let notess = {};

// We'll track which problem's notes is currently being edited
let currentNotesProblemId = null;

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
  const isSolved = icon.getAttribute('data-solved') === 'true';

  // Simple pulse animation
  icon.classList.add('pulse');
  setTimeout(() => icon.classList.remove('pulse'), 300);

  // Flip the state
  if (isSolved) {
    icon.setAttribute('data-solved', 'false');
    icon.textContent = 'check_box_outline_blank';
    icon.parentElement.parentElement.classList.remove('solved');
  } else {
    icon.setAttribute('data-solved', 'true');
    icon.textContent = 'check_box';
    icon.parentElement.parentElement.classList.add('solved');
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
    rows.forEach(row => {
      const problemText = row.querySelector('td:first-child').textContent.toLowerCase();
      if (problemText.includes(searchTerm)) {
        row.style.display = '';
        sectionHasMatch = true;
      } else {
        row.style.display = 'none';
      }
    });
    const li = collapsible.querySelector('li');
    if (li) {
      if (searchTerm !== '' && sectionHasMatch) {
        li.classList.add('active');
      } else {
        li.classList.remove('active');
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
  const easyFrac = overallTotal > 0 ? solved.easy / overallTotal : 0;
  const medFrac = overallTotal > 0 ? solved.medium / overallTotal : 0;
  const hardFrac = overallTotal > 0 ? solved.hard / overallTotal : 0;
  const solvedFrac = easyFrac + medFrac + hardFrac;
  const unsolvedFrac = 1 - solvedFrac;
  const easyWidth = (easyFrac * 100).toFixed(2) + '%';
  const medWidth = (medFrac * 100).toFixed(2) + '%';
  const hardWidth = (hardFrac * 100).toFixed(2) + '%';
  const unsolvedWidth = (unsolvedFrac * 100).toFixed(2) + '%';
  const easySeg = document.getElementById('easySegment');
  const medSeg = document.getElementById('mediumSegment');
  const hardSeg = document.getElementById('hardSegment');
  const unsolvedSeg = document.getElementById('unsolvedSegment');
  if (easySeg && medSeg && hardSeg && unsolvedSeg) {
    easySeg.style.width = easyWidth;
    medSeg.style.width = medWidth;
    hardSeg.style.width = hardWidth;
    unsolvedSeg.style.width = unsolvedWidth;
  }
  const progressOverall = overallTotal > 0
    ? Math.round((overallSolved / overallTotal) * 100)
    : 0;
  const percentElem = document.getElementById('percentSolved');
  if (percentElem) {
    percentElem.textContent = `${progressOverall}% solved`;
  }
  const overallElem = document.getElementById('overallSolvedText');
  if (overallElem) {
    overallElem.textContent = `${overallSolved}/${overallTotal} Solved`;
  }
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
  const stored = localStorage.getItem('dsaNotess');
  if (stored) {
    notess = JSON.parse(stored);
  } else {
    notess = {};
  }
}

function openNotesModal(problemId, label) {
  currentNotesProblemId = problemId;
  const existingNotes = notess[problemId] || '';
  document.getElementById('notesModalTextarea').value = existingNotes;
  document.getElementById('notesModalTitle').textContent = label || 'Add Notes';
  document.getElementById('notesModal').classList.add('active');
}

function closeNotesModal() {
  document.getElementById('notesModal').classList.remove('active');
  currentNotesProblemId = null;
}

function saveNotesModal() {
  if (!currentNotesProblemId) return;
  const text = document.getElementById('notesModalTextarea').value.trim();
  notess[currentNotesProblemId] = text;
  localStorage.setItem('dsaNotess', JSON.stringify(notess));
  closeNotesModal();
  alert('Notes saved!');
}

/***************************************************************
 * DARK MODE TOGGLE
 ***************************************************************/
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dsaDarkMode', document.body.classList.contains('dark-mode'));
  });
}

/***************************************************************
 * MAIN FETCH LOGIC (AFTER DOM LOADED)
 ***************************************************************/
document.addEventListener('DOMContentLoaded', function() {
  const tooltips = document.querySelectorAll('.tooltipped');
  M.Tooltip.init(tooltips);
  const sideNav = document.querySelectorAll('.sidenav');
  M.Sidenav.init(sideNav);
  const searchBoxMobile = document.getElementById('searchBoxMobile');
  if (searchBoxMobile) {
    searchBoxMobile.addEventListener('input', filterProblems);
  }
  fetch('problems.json')
    .then(res => res.json())
    .then(data => {
      problemData = data;
      renderSections(data);
      const elems = document.querySelectorAll('.collapsible');
      M.Collapsible.init(elems, { accordion: false });
      data.sections.forEach(section => {
        section.problems && section.problems.forEach(problem => {
          if (problem.difficulty === 'easy') totalEasy++;
          if (problem.difficulty === 'medium') totalMedium++;
          if (problem.difficulty === 'hard') totalHard++;
        });
        if (section.subsections && Array.isArray(section.subsections)) {
          section.subsections.forEach(subsec => {
            subsec.problems.forEach(problem => {
              if (problem.difficulty === 'easy') totalEasy++;
              if (problem.difficulty === 'medium') totalMedium++;
              if (problem.difficulty === 'hard') totalHard++;
            });
          });
        }
      });
      buildRectBar();
      loadProgress();
      const searchBox = document.getElementById('searchBox');
      if (searchBox) {
        searchBox.addEventListener('input', filterProblems);
      }
    })
    .catch(err => {
      console.error('Error loading JSON:', err);
      document.getElementById('sections').innerHTML = `
        <div class="card-panel red lighten-4">
          <span class="red-text text-darken-4">
            <i class="material-icons left">error</i>
            Failed to load problems data. Please check your JSON file.
          </span>
        </div>`;
    });
});
