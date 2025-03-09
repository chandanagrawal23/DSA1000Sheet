/***************************************************************
 * GLOBAL VARIABLES & HELPERS
 ***************************************************************/
let totalEasy = 0;       // total # of easy problems
let totalMedium = 0;     // total # of medium
let totalHard = 0;       // total # of hard
let problemData = [];    // store fetched data

// For storing comments: problemId -> comment text
let comments = {};       

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
  // Load "solved" icons
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
  // Then load comments
  loadComments();

  // Update progress bars
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
    
    // Loop through each collapsible (each section)
    document.querySelectorAll('.collapsible').forEach(collapsible => {
      let sectionHasMatch = false;
      
      // Loop through each table row in this section
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
      
      // Automatically expand the section if there is a match
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
  let rectContainer = document.getElementById('rectChartContainer');
  if (!rectContainer) {
    rectContainer = document.createElement('div');
    rectContainer.id = 'rectChartContainer';
    rectContainer.className = 'rect-chart-container';
    document.body.insertAdjacentElement('afterbegin', rectContainer);
  }
  rectContainer.innerHTML = `
    <h5>Overall Progress</h5>
    <div class="rect-chart">
      <div class="rect-segment rect-easy" id="rectEasy"></div>
      <div class="rect-segment rect-medium" id="rectMedium"></div>
      <div class="rect-segment rect-hard" id="rectHard"></div>
    </div>
    <div class="rect-progress-text" id="rectProgressText">0% solved</div>
  `;
  updateGlobalRectBar();
}

function updateGlobalRectBar() {
  const solved = getGlobalSolved();
  const overallTotal = totalEasy + totalMedium + totalHard;
  const overallSolved = solved.easy + solved.medium + solved.hard;
  
  const easyPercent = overallTotal > 0 ? (solved.easy / overallTotal) * 100 : 0;
  const mediumPercent = overallTotal > 0 ? (solved.medium / overallTotal) * 100 : 0;
  const hardPercent = overallTotal > 0 ? (solved.hard / overallTotal) * 100 : 0;
  
  const rectEasy = document.getElementById('rectEasy');
  const rectMedium = document.getElementById('rectMedium');
  const rectHard = document.getElementById('rectHard');
  if (rectEasy && rectMedium && rectHard) {
    rectEasy.style.width = easyPercent + '%';
    rectMedium.style.width = mediumPercent + '%';
    rectHard.style.width = hardPercent + '%';
  }
  
  const progressText = document.getElementById('rectProgressText');
  if (progressText) {
    const progressOverall = overallTotal > 0
      ? Math.round((overallSolved / overallTotal) * 100)
      : 0;
    progressText.textContent = `${progressOverall}% solved`;
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
    
    // The mini-bars are in the collapsible header (with data-id=sectionId)
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
 * GENERATE COLLAPSIBLE (with heading + mini bars + table)
 ***************************************************************/
function generateAccordion(section) {
  const sectionId = section.title.replace(/\s+/g, '');
  
  // Count total E/M/H
  const easyCount = section.problems.filter(p => p.difficulty === 'easy').length;
  const mediumCount = section.problems.filter(p => p.difficulty === 'medium').length;
  const hardCount = section.problems.filter(p => p.difficulty === 'hard').length;
  
  return `
    <ul class="collapsible z-depth-1" id="${sectionId}">
      <li>
        <div class="collapsible-header">
          <!-- Left: folder icon + topic title -->
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="material-icons">folder</i>
            <span class="topic-title">${section.title}</span>
          </div>
          <!-- Right: mini bars -->
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
          <table class="striped responsive-table highlight">
            <thead>
              <tr>
                <th>Question</th>
                <th>Solution</th>
                <th>Comment</th>
                <th>Done</th>
              </tr>
            </thead>
            <tbody>
              ${section.problems.map((problem, index) => {
                const problemId = `${sectionId}-${index}`;
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
                      <!-- multiline text area for comment -->
                      <textarea class="comment-area" data-id="${problemId}" placeholder="Add a comment..."></textarea>
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
        </div>
      </li>
    </ul>
  `;
}

/***************************************************************
 * COMMENTS - Save & Load
 ***************************************************************/
// We'll store comment text in localStorage under 'dsaComments'
function loadComments() {
  const stored = localStorage.getItem('dsaComments');
  if (stored) {
    comments = JSON.parse(stored);
  } else {
    comments = {};
  }
  applyComments();
}

function applyComments() {
  // Set each textarea's value from comments object
  document.querySelectorAll('.comment-area').forEach(area => {
    const cId = area.getAttribute('data-id');
    if (comments[cId]) {
      area.value = comments[cId];
    }
  });
}

function handleCommentChange(e) {
  // If it's not a .comment-area, ignore
  if (!e.target.classList.contains('comment-area')) return;
  
  const cId = e.target.getAttribute('data-id');
  comments[cId] = e.target.value;
  localStorage.setItem('dsaComments', JSON.stringify(comments));
}

// We'll listen for 'change' or 'input' on the entire document
document.addEventListener('change', handleCommentChange);

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
  // Initialize Materialize
  const tooltips = document.querySelectorAll('.tooltipped');
  M.Tooltip.init(tooltips);
  const sideNav = document.querySelectorAll('.sidenav');
  M.Sidenav.init(sideNav);

  // Mobile search
  const searchBoxMobile = document.getElementById('searchBoxMobile');
  if (searchBoxMobile) {
    searchBoxMobile.addEventListener('input', filterProblems);
  }
  
  // Fetch JSON
  fetch('problems.json')
    .then(res => res.json())
    .then(data => {
      problemData = data;
      
      // Render collapsibles
      renderSections(data);
      
      // Initialize collapsibles
      const elems = document.querySelectorAll('.collapsible');
      M.Collapsible.init(elems, { accordion: false });
      
      // Count total E/M/H
      data.sections.forEach(section => {
        section.problems.forEach(problem => {
          if (problem.difficulty === 'easy') totalEasy++;
          if (problem.difficulty === 'medium') totalMedium++;
          if (problem.difficulty === 'hard') totalHard++;
        });
      });
      
      // Build & update rectangular bar
      buildRectBar();
      
      // Load progress states & comments
      loadProgress();
      
      // Hook up search
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
