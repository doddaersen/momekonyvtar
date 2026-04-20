let guideData = null;
let history = [];
let currentNodeId = null;

async function loadGuide() {
  const response = await fetch('data/research-guide.json');
  guideData = await response.json();
  renderNode(guideData.startNode);
}

function renderNode(nodeId) {
  currentNodeId = nodeId;
  const node = guideData.nodes[nodeId];
  const questionView = document.getElementById('questionView');
  const cardView = document.getElementById('cardView');
  const title = document.getElementById('screenTitle');
  const description = document.getElementById('screenDescription');

  questionView.innerHTML = '';
  cardView.innerHTML = '';

  title.innerText = node.title || 'Research Guide';
  description.innerText = node.description || '';

  if (node.type === 'question') {
    node.options.forEach(option => {
      const button = document.createElement('button');
      button.className = 'option-button';
      button.type = 'button';
      button.innerText = option.label;
      button.onclick = () => {
        history.push(nodeId);
        renderNode(option.target);
      };
      questionView.appendChild(button);
    });

    questionView.classList.remove('hidden');
    cardView.classList.add('hidden');
  }

  if (node.type === 'card') {
    if (node.sections && node.sections.length) {
      node.sections.forEach(section => {
        const sectionWrap = document.createElement('section');
        sectionWrap.className = 'card-section';

        const heading = document.createElement('h3');
        heading.innerText = section.heading;
        sectionWrap.appendChild(heading);

        const list = document.createElement('ul');
        section.items.forEach(item => {
          const li = document.createElement('li');
          li.innerText = item;
          list.appendChild(li);
        });

        sectionWrap.appendChild(list);
        cardView.appendChild(sectionWrap);
      });
    }

    questionView.classList.add('hidden');
    cardView.classList.remove('hidden');
  }

  renderBreadcrumb();
  updateNavigationState();
}

function renderBreadcrumb() {
  const breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.innerHTML = '';

  const trail = [...history, currentNodeId].filter(Boolean);
  trail.forEach((nodeId, index) => {
    const item = document.createElement('span');
    item.className = 'breadcrumb-item';
    item.innerText = guideData.nodes[nodeId].title || nodeId;
    if (index === trail.length - 1) {
      item.classList.add('current');
    }
    breadcrumb.appendChild(item);
  });
}

function updateNavigationState() {
  document.getElementById('backButton').disabled = history.length === 0;
}

document.getElementById('backButton').onclick = () => {
  const previousNode = history.pop();
  if (previousNode) {
    renderNode(previousNode);
  }
};

document.getElementById('homeButton').onclick = () => {
  history = [];
  renderNode(guideData.startNode);
};

loadGuide();
