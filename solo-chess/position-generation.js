/**
 * Algorithm summary:
 * There will be a game tree representing a piece and its move action (node)
 */

class SoloChessBoard {

  constructor(numOfPieces) {
    this.numOfPieces = numOfPieces;
    this.board = this.getEmptyBoard();
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
        //or has the parent node
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
    const row = square.row;
    const col = square.col;

    const squares = [];

    //use the target square as the origin, we will have the coordinates
    let coordinates;
    let affectedCoordinates = [];

    if (piece === PAWN) { //pawn can only move up
      coordinates = [
        [-1, 0]
      ];
    } else if (piece === BISHOP) { //bishop has 4 possible moves
      coordinates = [
        [2, 2], [2, -2], [-2, 2], [-2, -2]
      ];
      affectedCoordinates = [ //each move will affect one square in the diagonal
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];
    } else if (piece === ROOK) { //root has 4 possible moves
      coordinates = [
        [0, 1], [0, -1], [-1, 0], [1, 0]
      ];
    } else if (piece === KING || piece === QUEEN) { //king and queen has 8 possible moves
      coordinates = [
        [0, 1], [1, 1], [1, 0], [1, -1],
        [0, -1], [-1, 1], [-1, 0], [-1, -1]
      ];
    } else if (piece === KNIGHT) { //knight has 8 possible moves
      coordinates = [
        [-1, 2], [-1, -2], [1, 2], [1, -2],
        [2, -1], [-2, -1], [2, 1], [-2, 1]
      ];
    }

    for (let ci = 0; ci < coordinates.length; ci += 1) {
      const coord = coordinates[ci];
      const r = row + coord[0];
      const c = col + coord[1];
      //make sure:
      //this coordinate is inside the board
      //this coordinate is not occupied yet
      //no pawn promotion
      //do not block a bishop
      let squareIsValid = false;
      const resultSquare = {};
      resultSquare.affectedSquares = [];

      if ((r >= 0 && r <= 7) &&
        (c >= 0 && c <= 7) &&
        this.board[r][c] === '-' &&
        !(piece === PAWN && r < 2)) {
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
      }

      if (squareIsValid) {
        resultSquare.row = r;
        resultSquare.col = c;
        squares.push(resultSquare);
      }
    }

    return squares;
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

  addPieceOnSquare(piece, square) {
    this.board[square.row][square.col] = piece;
    this.numOfPiecesOnBoard += 1;
  }

  /**
   * generate the first piece in the board
   */
  generateFirstPiece() {
    const row = Math.floor(Math.random() * 8);
    const col = Math.floor(Math.random() * 8);
    const piece = this.getRandomPiece();
    this.firstOccupiedSquare = { row, col };
    this.addPieceOnSquare(piece, this.firstOccupiedSquare);
    const square = { row, col };
    return { piece, square };
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

    const nodesInPath = this.getNodesInPathOf(leafNode);

    let fromNode;
    let toNode;
    let commonSquares = [];
    for (let i = 0; i < nodesInPath.length - 1; i += 1) {
      toNode = nodesInPath[i];
      this.generatePieceForNode(toNode);
      for (let j = i + 1; j < nodesInPath.length; j += 1) {
        fromNode = nodesInPath[j];
        this.generatePieceForNode(fromNode);

        const availableSquares = this.getAvailableSourceSquaresForPlacement(fromNode.piece, toNode.square);
        fromNode.square = availableSquares[Math.floor(Math.random() * availableSquares.length)];
        if (j === 1) {
          commonSquares = availableSquares;
        } else {
          commonSquares = this.getCommonSquares(commonSquares, availableSquares);
        }
      }
    }

    if (commonSquares.length > 0) {
      //there are common squares available, this is a good capture!
      //now add the piece on square, no need to add for root node
      for (let i = 1; i < nodesInPath.length; i += 1) {
        this.addPieceOnSquare(nodesInPath[i].piece, nodesInPath[i].square);
        nodesInPath[i].square.affectedSquares.forEach((square) => {
          this.board[square.row][square.col] = '*';
        });
      }

      for (let i = nodesInPath.length - 1; i >= 1; i -= 1) {
        const capture = {
          piece: leafNode.piece,
          from: nodesInPath[i].square,
          to: nodesInPath[i].parentNode.square
        }
        captures.push(capture);
      }
    }
    return captures;
  }

  generateSolution() {
    //try maximum 100 times
    let solution;
    for (let t = 1; t <= 100; t += 1) {
      solution = {};
      solution.captures = [];

      const maxCapturesPerPiece = 2;
      const gameTreeDepth = maxCapturesPerPiece + 1;
      const gameTreeSize = this.numOfPieces; //for N pieces, we will have N nodes in the game tree

      this.hasKing = Math.round(Math.random()); //will this solution contains king?
      if (this.hasKing) {
        this.availablePcs = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING];
      } else {
        this.availablePcs = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN];
      }

      this.numOfPiecesOnBoard = 0;

      //generate the game tree, with levels ranging from 1 (the root node) to gameTreeDepth
      this.gameTreeNodes = this.generateGameTree(gameTreeSize, gameTreeDepth);

      //now find out all the leaf nodes, they are the nodes that launch captures
      const leafNodes = this.gameTreeNodes.filter((node) => {
        return node.numOfChilds === 0;
      });

      //generate the first piece
      const { piece, square } = this.generateFirstPiece();
      //also, we add the piece to the root node of the game tree
      this.gameTreeNodes[0].piece = piece;
      this.gameTreeNodes[0].square = square;

      leafNodes.forEach((leafNode, index) => {
        leafNode.isLastNode = false;
        if (index === leafNodes.length - 1) {
          leafNode.isLastNode = true;
        }

        solution.captures = solution.captures.concat(this.generateCapturesForLeafNode(leafNode));
      });

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
generatePosition(5);
