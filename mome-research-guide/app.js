let guideData = null;
let selectedPath = {};
let multiSelections = {};

async function loadGuide() {
  const response = await fetch('data/research-guide.json');
  guideData = await response.json();
  selectedPath = { 0: guideData.startNode };
  multiSelections = {};
  renderGuide();
}

function getNode(nodeId) {
  return guideData?.nodes?.[nodeId] || null;
}

function buildVisiblePath() {
  const visible = [];
  let currentId = guideData.startNode;
  let depth = 0;

  while (currentId) {
    const node = getNode(currentId);
    if (!node) break;
    visible.push({ id: currentId, depth, node });

    if (node.type === 'single') {
      const nextId = selectedPath[depth + 1];
      if (!nextId) break;
      currentId = nextId;
      depth += 1;
      continue;
    }

    break;
  }

  return visible;
}

function selectSingle(targetId, depth) {
  selectedPath[depth + 1] = targetId;
  Object.keys(selectedPath)
    .map(Number)
    .filter(key => key > depth + 1)
    .forEach(key => delete selectedPath[key]);
  renderGuide();
}

function toggleMulti(parentId, targetId) {
  if (!multiSelections[parentId]) multiSelections[parentId] = [];
  const current = new Set(multiSelections[parentId]);
  if (current.has(targetId)) current.delete(targetId);
  else current.add(targetId);
  multiSelections[parentId] = Array.from(current);
  renderGuide();
}

function goHome() {
  selectedPath = { 0: guideData.startNode };
  multiSelections = {};
  renderGuide();
}

function goBack() {
  const levels = Object.keys(selectedPath).map(Number).sort((a, b) => a - b);
  if (levels.length <= 1) return;
  delete selectedPath[levels[levels.length - 1]];
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

function createNodeBlock(entry) {
  const nodeWrap = document.createElement('section');
  nodeWrap.className = 'tree-node';

  const title = document.createElement('div');
  title.className = 'tree-title';
  title.innerText = entry.node.title || entry.id;
  nodeWrap.appendChild(title);

  if (entry.node.description) {
    const desc = document.createElement('p');
    desc.className = 'tree-description';
    desc.innerText = entry.node.description;
    nodeWrap.appendChild(desc);
  }

  const trail = document.createElement('div');
  trail.className = 'trail-line';
  trail.innerHTML = '<span class="trail-segment"></span><span class="trail-arrow">→</span>';
  nodeWrap.appendChild(trail);

  const optionList = document.createElement('div');
  optionList.className = 'option-stack';
  if (entry.node.layout === 'compact-inline') {
    optionList.classList.add('compact-inline');
  }

  const nextActiveId = selectedPath[entry.depth + 1];
  const selectedSet = new Set(multiSelections[entry.id] || []);

  (entry.node.options || []).forEach(option => {
    const targetNode = getNode(option.target);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-button';

    const isMulti = entry.node.type === 'multi';
    const isSelected = isMulti ? selectedSet.has(option.target) : nextActiveId === option.target;
    const hasAnySingleSelected = entry.node.type === 'single' && !!nextActiveId;

    if (isSelected) button.classList.add('is-selected');
    else if (hasAnySingleSelected) button.classList.add('is-faded');

    button.innerHTML = `<span class="option-label">${option.label}</span><span class="option-meta">${targetNode?.type === 'card' ? 'info' : entry.node.type}</span>`;

    button.onclick = () => {
      if (entry.node.type === 'single') selectSingle(option.target, entry.depth);
      if (entry.node.type === 'multi') toggleMulti(entry.id, option.target);
    };

    optionList.appendChild(button);
  });

  nodeWrap.appendChild(optionList);
  return nodeWrap;
}

function gatherCards(visiblePath) {
  const cards = [];

  visiblePath.forEach((entry, index) => {
    const node = entry.node;
    if (node.type === 'card') cards.push(entry.id);

    if (node.type === 'single') {
      const nextId = selectedPath[index + 1];
      const nextNode = getNode(nextId);
      if (nextNode && nextNode.type === 'card') cards.push(nextId);
    }

    if (node.type === 'multi') {
      (multiSelections[entry.id] || []).forEach(targetId => {
        const targetNode = getNode(targetId);
        if (targetNode && targetNode.type === 'card') cards.push(targetId);
      });
    }
  });

  return [...new Set(cards)];
}

function appendSectionItem(list, item, isRouteSection = false) {
  const li = document.createElement('li');
  if (isRouteSection) li.classList.add('route-item');

  const addText = (target, text) => {
    const span = document.createElement('span');
    span.innerText = text;
    target.appendChild(span);
  };

  if (typeof item === 'string') {
    addText(li, item);
  } else if (item && typeof item === 'object') {
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerText = item.label || item.url;
      li.appendChild(a);
    } else {
      addText(li, item.label || '');
    }

    if (Array.isArray(item.children) && item.children.length) {
      const childList = document.createElement('ul');
      childList.className = 'route-children';
      item.children.forEach(child => {
        const childLi = document.createElement('li');
        childLi.className = 'route-child-item';
        if (typeof child === 'string') {
          childLi.innerText = child;
        } else if (child && typeof child === 'object') {
          if (child.url) {
            const a = document.createElement('a');
            a.href = child.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.innerText = child.label || child.url;
            childLi.appendChild(a);
          } else {
            childLi.innerText = child.label || '';
          }
        }
        childList.appendChild(childLi);
      });
      li.appendChild(childList);
    }
  }

  list.appendChild(li);
}

function renderCards(cardIds) {
  const cardView = document.getElementById('cardView');
  cardView.innerHTML = '';

  if (!cardIds.length) {
    cardView.classList.add('hidden');
    return;
  }

  const bundle = document.createElement('div');
  bundle.className = 'card-bundle';
  bundle.dataset.bundleCount = String(cardIds.length);

  cardIds.forEach(cardId => {
    const node = getNode(cardId);
    if (!node) return;

    const card = document.createElement('article');
    card.className = 'info-card';
    card.dataset.cardId = cardId;

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

    (node.sections || []).forEach(section => {
      const sectionWrap = document.createElement('section');
      sectionWrap.className = 'card-section';
      const isRouteSection = section.variant === 'route' || section.heading === 'Haladj tovább';
      if (isRouteSection) sectionWrap.classList.add('route-box');
      if (section.variant === 'boxed') sectionWrap.classList.add('boxed');
      if (section.variant === 'help') sectionWrap.classList.add('help-box');

      const heading = document.createElement('h3');
      heading.innerText = section.heading;
      sectionWrap.appendChild(heading);

      const list = document.createElement('ul');
      if (isRouteSection) list.classList.add('route-list');
      (section.items || []).forEach(item => appendSectionItem(list, item, isRouteSection));

      sectionWrap.appendChild(list);
      card.appendChild(sectionWrap);
    });

    bundle.appendChild(card);
  });

  cardView.appendChild(bundle);
  cardView.classList.remove('hidden');
}

function renderGuide() {
  const treeView = document.getElementById('questionView');
  const heroTitle = document.getElementById('screenTitle');
  const heroDescription = document.getElementById('screenDescription');
  const visiblePath = buildVisiblePath();
  const current = visiblePath[visiblePath.length - 1];

  heroTitle.innerText = current?.node?.title || 'MOME Research Guide';
  heroDescription.innerText = current?.node?.description || 'A guide kérdésekkel és rövid útmutatókkal segít megtalálni a megfelelő forrásokat.';

  treeView.innerHTML = '';
  visiblePath.forEach(entry => {
    if (entry.node.type === 'single' || entry.node.type === 'multi') {
      treeView.appendChild(createNodeBlock(entry));
    }
  });

  renderBreadcrumb(visiblePath);
  renderCards(gatherCards(visiblePath));
  document.getElementById('backButton').disabled = visiblePath.length <= 1;
}

document.getElementById('backButton').onclick = goBack;
document.getElementById('homeButton').onclick = goHome;

loadGuide();
