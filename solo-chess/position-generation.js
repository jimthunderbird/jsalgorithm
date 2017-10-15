/**
 * Algorithm summary:
 * There will be a game tree representing a piece and its move action (node)
 */

class SoloChessBoard {

  constructor(numOfPieces) {
    this.numOfPieces = numOfPieces;
    this.maxCapturesPerPiece = 2;
    this.gameTreeDepth = this.maxCapturesPerPiece + 1;
    this.gameTreeSize = this.numOfPieces; //for N pieces, we will have N nodes in the game tree
    this.maxNumOfChilds = 4;

    this.placementMap = {
      [PAWN]: {
        baseDelta: [
          [-1, 0]
        ],
        range: 1
      },
      [BISHOP] : {
        baseDelta: [
          [1, 1], [1, -1], [-1, 1], [-1, -1]
        ],
        range: 8
      },
      [ROOK]: {
        baseDelta: [
          [0, 1], [0, -1], [-1, 0], [1, 0]
        ],
        range: 8
      },
      [QUEEN]: {
        baseDelta: [
          [0, 1], [1, 1], [1, 0], [1, -1],
          [0, -1], [-1, 1], [-1, 0], [-1, -1]
        ],
        range: 8
      },
      [KING]: {
        baseDelta: [
          [0, 1], [1, 1], [1, 0], [1, -1],
          [0, -1], [-1, 1], [-1, 0], [-1, -1]
        ],
        range: 1
      },
      [KNIGHT]: {
        baseDelta: [
          [-1, 2], [-1, -2], [1, 2], [1, -2],
          [2, -1], [-2, -1], [2, 1], [-2, 1]
        ],
        range: 1
      }
    };
  }

  /**
   * generate a game tree
   */
  generateGameTree(size, depth) {
    let nodes = [];

    //for all nodes, randomly find node that having level between [2,depth - 1] as parent
    for (let i = 0; i < size; i += 1) {
      let level;
      let parentId = null;
      //the first node in the tree must be at level 1
      if (i === 0) { //this is the root node
        level = 1;
      } else {
        //randomly select a node
        const selectedNode = nodes[Math.floor(Math.random() * nodes.length)];
        //now the first one is a random existing node
        //now we can randomly decide whether treat it as a parent node or sibling node
        let treatAsSibling = Math.round(Math.random());

        //this existing node is at the bottom of the tree
        //we can only make it as a sibling node
        if (selectedNode.level === depth) {
          treatAsSibling = 1;
        }

        if (treatAsSibling && selectedNode.parentId) { //we can really treat it as a sibling node
          parentId = selectedNode.parentId;
          level = selectedNode.level;
        } else { //this is a parent node
          parentId = selectedNode.id;
          level = selectedNode.level + 1;
        }
        nodes[parentId].numOfChilds += 1;
      }

      const id = i;
      const node = {
        id: id,
        parentId: parentId,
        level: level,
        numOfChilds: 0
      };
      if (parentId !== null) {
        node.parentNode = nodes[parentId];
      }
      nodes.push(node);
    }

    return nodes;
  }

  getEmptyBoard() {
    return [
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 0
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 1
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 2
      ['-', '-', '-', '-', '-', '-', '-', '-'], //...
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-']
    ];
  }

  /**
   * get available squares when placing a piece to a specific square
   */
  getAvailableSourceSquaresForPlacement(piece, square) {
    const squaresHash = {};

    const deltas = this.placementMap[piece].baseDelta;
    const range = this.placementMap[piece].range;
    for (let ci = 0; ci < deltas.length; ci += 1) {
      const delta = deltas[ci];
      for (let r = 1; r <= range; r += 1) {
        const row = square.row + delta[0] * r;
        const col = square.col + delta[1] * r;
        //make sure:
        //this coordinate is inside the board
        //this coordinate is not occupied yet
        //no pawn promotion
        //do not block a piece
        let squareIsValid = false;
        const resultSquare = {};

        if ((row >= 0 && row <= 7) &&
          (col >= 0 && col <= 7) &&
          this.board[row][col] === '-' &&
          !(piece === PAWN && r < 2)) {
          /*
        if (affectedCoordinates.length > 0) {
          const affectedCoord = affectedCoordinates[ci];
          const ar = row + affectedCoord[0];
          const ac = col + affectedCoord[1];
          if (this.board[ar][ac] === '-') {
            resultSquare.affectedRow = ar;
            resultSquare.affectedCol = ac;
            resultSquare.affectedSquares.push({
              row: ar,
              col: ac
            });
            squareIsValid = true;
          }
        } else {
          squareIsValid = true;
        }
        */
          squareIsValid = true;
        }

        if (squareIsValid) {
          resultSquare.row = row;
          resultSquare.col = col;
          const key = `${row}${col}`;
          squaresHash[key] = resultSquare;
        }
      }
    }

    return Object.values(squaresHash);
  }

  /**
   * get path nodes of a specific node
   */
  getNodesInPathOf(node) {
    const nodes = [];
    let curNode = node;
    while (curNode.parentId) {
      nodes.unshift(this.gameTreeNodes[node.parentId]);
      curNode = this.gameTreeNodes[curNode.parentId];
    }
    //add the root node
    nodes.unshift(this.gameTreeNodes[0]);
    //finally add this node to the end
    nodes.push(node);
    return nodes;
  }

  /**
   * get a random piece
   */
  getRandomPiece() {
    return this.availablePcs[Math.floor(Math.random() * this.availablePcs.length)];
  }

  /**
   * get a random square
   */
  getRandomSquare() {
    return {
      row: Math.floor(Math.random() * 8),
      col: Math.floor(Math.random() * 8)
    };
  }

  addPieceToSquare(piece, square) {
    this.board[square.row][square.col] = piece;
    this.numOfPiecesOnBoard += 1;
  }

  /**
   * generate a piece for node
   */
  generatePieceForNode(node) {
    if (node.id > 0) { //only generate piece for non-root nodes
      //the last node must be a king
      if (node.isLastNode && this.hasKing) {
        node.piece = KING;
      } else {
        node.piece = this.getRandomPiece();
      }
    }
  }

  /**
   * given squares A and squares B
   * find the common squares that are in both A and B
   */
  getCommonSquares(squaresA, squaresB) {
    const squares = [];
    //build a hash for squaresA
    const squaresAHash = {};
    squaresA.forEach((square) => {
      const key = `${square.row}${square.col}`;
      squaresAHash[key] = square;
    });
    //see what square in squaresB exists in squaresAHash
    squaresB.forEach((square) => {
      const key = `${square.row}${square.col}`;
      if (squaresAHash[key] !== undefined) {
        squares.push(square);
      }
    });
    return squares;
  }

  /**
   * generate captures from a leaf node to the root node
   */
  generateCapturesForLeafNode(leafNode) {
    const captures = [];

    //this.addPieceToSquare(nodesInPath[i].piece, nodesInPath[i].square)

    /*const capture = {*/
    /*piece: leafNode.piece,*/
    /*from: nodesInPath[i].square,*/
    /*to: nodesInPath[i].parentNode.square*/
    /*}*/
    return captures;
  }

  generateSolution() {
    this.board = this.getEmptyBoard();
    this.numOfPiecesOnBoard = 0;
    console.log(this.getAvailableSourceSquaresForPlacement('Q', {row: 0, col: 0}));
    return;

    //try maximum 1000000 times
    let solution;
    for (let t = 1; t <= 100000; t += 1) {
      solution = {};
      solution.captures = [];

      this.hasKing = Math.round(Math.random()); //will this solution contains king?
      if (this.hasKing) {
        this.availablePcs = [KNIGHT, KING, QUEEN, PAWN, ROOK, BISHOP];
      } else {
        this.availablePcs = [KNIGHT, QUEEN, PAWN, ROOK, BISHOP];
      }

      this.numOfPiecesOnBoard = 0;
      this.board = this.getEmptyBoard();
      //generate the game tree, with levels ranging from 1 (the root node) to gameTreeDepth
      //also, make sure the game tree has up to the maximum number of child nodes
      for (;;) {
        this.gameTreeNodes = this.generateGameTree(this.gameTreeSize, this.gameTreeDepth);
        if (this.gameTreeNodes.filter((node) => {
          return node.numOfChilds <= this.maxNumOfChilds;
        }).length === this.gameTreeNodes.length) {
          break;
        }
      }

      //now find out all the leaf nodes, they are the nodes that launch captures
      let leafNodes = this.gameTreeNodes.filter((node) => {
        return node.numOfChilds === 0;
      });

      //if we have kings in the bord, the last leaf node should be a king
      if (this.hasKing) {
        leafNodes[leafNodes.length - 1].piece = KING;
      }

      leafNodes.forEach((leafNode) => {
        //attack the parent node
        if (leafNode.parentNode) {
          const parentNode = leafNode.parentNode;
          if (!parentNode.piece) {
            parentNode.piece = this.getRandomPiece();
            parentNode.square = this.getRandomSquare();
          }
          const sourceSquares = this.getAvailableSourceSquaresForPlacement(parentNode.piece, parentNode.square);
          leafNode.square = sourceSquares[Math.floor(Math.random() * sourceSquares.length)];
          if (parentNode.numOfChilds > 0) {
            parentNode.numOfChilds -= 1;
            console.log(parentNode.numOfChilds);
          }
        }
        //solution.captures = solution.captures.concat(this.generateCapturesForLeafNode(leafNode));
      });
      console.log('done');
      break;

      if (solution.captures.length > 0 && this.numOfPiecesOnBoard === this.numOfPieces) {
        solution.valid = true;
        console.log('found solution');
        console.log(solution.captures);
        console.log(t);
        break;
      } else {
        solution.valid = false;
      }
    }

    return solution;
  }

  print() {
    console.log(this.board);
  }
}

const { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } = {
  PAWN: 'P',
  KNIGHT: 'N',
  BISHOP: 'B',
  ROOK: 'R',
  QUEEN: 'Q',
  KING: 'K'
};

const shuffleArr = (arr) => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const arrToFen = (arr) => {
  const pieces = arr.map((row) => {
    let strRow = '';
    let counter = 0;
    row.forEach((square) => {
      //- means empty square, * means "empty but unavailable square"
      if (square === '-' || square === '*') {
        counter += 1;
      } else {
        if (counter !== 0) {
          strRow += counter;
          counter = 0;
        }
        strRow += square;
      }
    });
    strRow += (counter !== 0) ? counter : '';
    return strRow;
  }).join('/');

  return `${pieces} w KQkq - 0 1`;
};

function generatePosition(numOfPieces) {
  const board = new SoloChessBoard(numOfPieces);
  board.generateSolution();
  board.print();
}

/////////////////////// Main ///////////////////////////
generatePosition(16);
