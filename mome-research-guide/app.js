let guideData = null;
let selectedAtDepth = {};
let openCards = {};
let currentNodeId = null;

async function loadGuide() {
  const response = await fetch('data/research-guide.json');
  guideData = await response.json();
  selectedAtDepth = { 0: guideData.startNode };
  openCards = {};
  renderGuide();
}

function getNode(nodeId) {
  return guideData.nodes[nodeId];
}

function buildVisiblePath() {
  const visible = [];
  let currentId = guideData.startNode;
  let depth = 0;

  while (currentId) {
    visible.push({ id: currentId, depth, node: getNode(currentId) });
    const selectedId = selectedAtDepth[depth + 1];
    if (!selectedId) break;
    currentId = selectedId;
    depth += 1;
  }

  return visible;
}

function selectOption(targetId, depth) {
  selectedAtDepth[depth + 1] = targetId;

  Object.keys(selectedAtDepth)
    .map(Number)
    .filter(key => key > depth + 1)
    .forEach(key => delete selectedAtDepth[key]);

  Object.keys(openCards)
    .map(Number)
    .filter(key => key >= depth + 1)
    .forEach(key => delete openCards[key]);

  const targetNode = getNode(targetId);
  if (targetNode && targetNode.type === 'card') {
    openCards[depth + 1] = targetId;
  }

  renderGuide();
}

function goHome() {
  selectedAtDepth = { 0: guideData.startNode };
  openCards = {};
  renderGuide();
}

function goBack() {
  const levels = Object.keys(selectedAtDepth).map(Number).sort((a, b) => a - b);
  if (levels.length <= 1) return;
  const last = levels[levels.length - 1];
  delete selectedAtDepth[last];
  delete openCards[last];
  renderGuide();
}

function renderBreadcrumb(visiblePath) {
  const breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.innerHTML = '';

  visiblePath.forEach((entry, index) => {
    const item = document.createElement('span');
    item.className = 'breadcrumb-item';
    item.innerText = entry.node.title || entry.id;
    if (index === visiblePath.length - 1) item.classList.add('current');
    breadcrumb.appendChild(item);
  });
}

function createOptionsBlock(entry, depth) {
  const nodeWrap = document.createElement('section');
  nodeWrap.className = 'tree-node';

  const title = document.createElement('h2');
  title.className = 'tree-title';
  title.innerText = entry.node.title || entry.id;
  nodeWrap.appendChild(title);

  if (entry.node.description) {
    const desc = document.createElement('p');
    desc.className = 'tree-description';
    desc.innerText = entry.node.description;
    nodeWrap.appendChild(desc);
  }

  if (entry.node.type === 'question' && entry.node.options) {
    const optionList = document.createElement('div');
    optionList.className = 'option-stack';

    entry.node.options.forEach(option => {
      const targetNode = getNode(option.target);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option-button';
      button.innerHTML = `<span>${option.label}</span><span class="option-meta">${targetNode?.type === 'card' ? 'info' : 'lépés'}</span>`;

      const activeId = selectedAtDepth[depth + 1];
      if (activeId === option.target) button.classList.add('is-selected');
      else if (activeId) button.classList.add('is-faded');

      button.onclick = () => selectOption(option.target, depth);
      optionList.appendChild(button);
    });

    nodeWrap.appendChild(optionList);
  }

  return nodeWrap;
}

function renderCard(cardId) {
  const node = getNode(cardId);
  const cardView = document.getElementById('cardView');
  cardView.innerHTML = '';

  if (!node) return;

  const card = document.createElement('article');
  card.className = 'info-card';

  const title = document.createElement('h2');
  title.className = 'info-card-title';
  title.innerText = node.title || cardId;
  card.appendChild(title);

  if (node.description) {
    const description = document.createElement('p');
    description.className = 'info-card-description';
    description.innerText = node.description;
    card.appendChild(description);
  }

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
      card.appendChild(sectionWrap);
    });
  }

  cardView.appendChild(card);
  cardView.classList.remove('hidden');
}

function renderGuide() {
  const treeView = document.getElementById('questionView');
  const heroTitle = document.getElementById('screenTitle');
  const heroDescription = document.getElementById('screenDescription');
  const visiblePath = buildVisiblePath();
  const deepest = visiblePath[visiblePath.length - 1];

  currentNodeId = deepest.id;

  heroTitle.innerText = 'MOME Research Guide';
  heroDescription.innerText = 'Az ágak lefelé nyílnak meg, a kiválasztott információs kártya jobbra jelenik meg.';

  treeView.innerHTML = '';

  visiblePath.forEach((entry, depth) => {
    if (entry.node.type === 'question') {
      treeView.appendChild(createOptionsBlock(entry, depth));
    }
  });

  renderBreadcrumb(visiblePath);
  document.getElementById('backButton').disabled = visiblePath.length <= 1;

  const openCardDepths = Object.keys(openCards).map(Number).sort((a, b) => a - b);
  if (openCardDepths.length) {
    const lastCardDepth = openCardDepths[openCardDepths.length - 1];
    renderCard(openCards[lastCardDepth]);
  } else if (deepest?.node.type === 'card') {
    renderCard(deepest.id);
  } else {
    const cardView = document.getElementById('cardView');
    cardView.innerHTML = '';
    cardView.classList.add('hidden');
  }
}

document.getElementById('backButton').onclick = goBack;
document.getElementById('homeButton').onclick = goHome;

loadGuide();
