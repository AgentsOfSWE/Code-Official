
export function writeNodes(nodes) {
  const ul = document.getElementById('nodes-list');
  nodes.forEach((node) => {
    const li = document.createElement('li');
    li.classList.add('modalNodes');

    // nodesModal();
    li.innerHTML = node;
    ul.appendChild(li);
  });
}

