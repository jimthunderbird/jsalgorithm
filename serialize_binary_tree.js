class Node {

  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }

  getVal() {
    return this.val;
  }

  getLeft() {
    return this.left;
  }

  getRight() {
    return this.right;
  }
}

function serializeTree(root) {
  const treeQueue = {
    size: 0,
    elements: []
  };

  let curIndex = 1;

  treeQueue.elements[curIndex - 1] = root;

  for(;;) {
    const leftIndex = 2*curIndex - 1;
    const rightIndex = 2*curIndex;

    if (treeQueue.elements[curIndex - 1]) {
      if (treeQueue.elements[curIndex - 1].left) {
        treeQueue.elements[leftIndex] = treeQueue.elements[curIndex - 1].left;
      } else {
        treeQueue.elements[leftIndex] = null;
      }
      treeQueue.size = treeQueue.size + 1;
    }

    if (treeQueue.elements[curIndex - 1]) {
      if (treeQueue.elements[curIndex - 1].right) {
        treeQueue.elements[rightIndex] = treeQueue.elements[curIndex - 1].right;
      } else {
        treeQueue.elements[rightIndex] = null;
      }
      treeQueue.size = treeQueue.size + 1;
    }

    curIndex = curIndex + 1;

    if (curIndex > treeQueue.size) {
      break;
    }
  }

  //now encode it
  let ret = '';
  for (let i = 0; i < treeQueue.size - 1; i = i + 1) {

    let val = '.';
    if (treeQueue.elements[i]) {
      val = treeQueue.elements[i].getVal();
    }

    if (i === 0) {
      ret = ret + val;
    } else {
      ret = ret + ',' + val;
    }
  }

  console.log(ret);
  return ret;
}

function deSerializeTree(serializedTreeStr) {
  const ret = [];
  const elements = serializedTreeStr.split(',');
  const treeSize = elements.length;
  for (let i = 1; i <= treeSize; i = i + 1) {
    if (elements[i - 1] != '.') { //this is not null
      const node = new Node(elements[i - 1]);

      const leftIndex = 2 * i - 1;
      const rightIndex = 2 * i;

      if (leftIndex < treeSize && elements[leftIndex] != '.') { //left node is not null
        node.left = new Node(elements[leftIndex]);
      } else {
        node.left = null;
      }

     if (rightIndex < treeSize && elements[rightIndex] != '.') { //left node is not null
        node.right = new Node(elements[rightIndex]);
      } else {
        node.right = null;
      }


      ret.push(node);
    }
  }

  return ret;
}

const root = new Node(3);
root.left = new Node(2);
root.right = new Node(5);
root.right.left = new Node(4);
root.right.right = new Node(8);
root.left.left = new Node(1);

console.log(deSerializeTree(serializeTree(root)));
