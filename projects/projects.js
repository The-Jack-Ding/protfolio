import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
const title = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let query = '';
let selectedIndex = -1;
let selectedYear = null;

function getSearchFilteredProjects() {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function getVisibleProjects() {
  let searchedProjects = getSearchFilteredProjects();

  if (selectedYear) {
    return searchedProjects.filter((project) => project.year === selectedYear);
  }

  return searchedProjects;
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  let sliceGenerator = d3.pie().value((d) => d.value);

  let arcData = sliceGenerator(data);

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  arcData.forEach((d, idx) => {
    svg
      .append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(idx))
      .attr('class', d.data.label === selectedYear ? 'selected' : '')
      .on('click', () => {
        if (selectedYear === d.data.label) {
          selectedYear = null;
          selectedIndex = -1;
        } else {
          selectedYear = d.data.label;
          selectedIndex = idx;
        }

        renderPage();
      });
  });

  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color: ${colors(idx)}`)
      .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        if (selectedYear === d.label) {
          selectedYear = null;
          selectedIndex = -1;
        } else {
          selectedYear = d.label;
          selectedIndex = idx;
        }

        renderPage();
      });
  });
}

function renderPage() {
  let searchedProjects = getSearchFilteredProjects();

  if (selectedYear && !searchedProjects.some((project) => project.year === selectedYear)) {
    selectedYear = null;
    selectedIndex = -1;
  }

  let visibleProjects = getVisibleProjects();

  renderProjects(visibleProjects, projectsContainer, 'h2');
  renderPieChart(searchedProjects);

  if (title) {
    title.textContent = `${visibleProjects.length} Projects`;
  }
}

renderPage();

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  renderPage();
});