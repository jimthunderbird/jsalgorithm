/**
 * Algorithm summary:
 * There will be a game tree representing move actions (node)
 * To simplify the solution generate, each node will have one or many moves
 */

class SoloChessBoard {

  constructor(numOfPieces) {
    this.numOfPieces = numOfPieces;
    this.board = [
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 0
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 1
      ['-', '-', '-', '-', '-', '-', '-', '-'], //row 2
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-'],
      ['-', '-', '-', '-', '-', '-', '-', '-']
    ];
    this.hasKing = Math.round(Math.random()); //will this board have king?
    if (this.hasKing) {
      this.availablePcs = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING];
    } else {
      this.availablePcs = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN];
    }
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
      nodes.push(node);
    }

    return nodes;
  }

  /**
   * get incoming captue squares of a piece around a specific square
   */
  getIncomingCaptureSquares(piece, row, col) {
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
      const square = {};

      if ((r >= 0 && r <= 7) &&
        (c >= 0 && c <= 7) &&
        this.board[r][c] === '-' &&
        !(piece === PAWN && r < 2)) {
        if (affectedCoordinates.length > 0) {
          const affectedCoord = affectedCoordinates[ci];
          const ar = row + affectedCoord[0];
          const ac = col + affectedCoord[1];
          if (this.board[ar][ac] === '-') {
            square.affectedRow = ar;
            square.affectedCol = ac;
            squareIsValid = true;
          }
        } else {
          squareIsValid = true;
        }
      }

      if (squareIsValid) {
        square.row = r;
        square.col = c;
        squares.push(square);
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
    return nodes;
  }

  /**
   * get a random piece
   */
  getRandomPiece() {
    return this.availablePcs[Math.floor(Math.random() * this.availablePcs.length)];
  }

  addPieceOnSquare(piece, row, col) {
    this.board[row][col] = piece;
  }

  /**
   * generate the first piece in the board
   */
  generateFirstPiece() {
    const row = Math.floor(Math.random() * 8);
    const col = Math.floor(Math.random() * 8);
    const piece = this.getRandomPiece();
    this.firstOccupiedSquare = { row, col };
    this.addPieceOnSquare(piece, row, col);
    //also, we add the piece to the root node of the game tree
    this.gameTreeNodes[0].piece = piece;
  }

  /**
   * place a piece around a specific square
   */
  placePieceAroundSquare(piece, row, col) {
    const result = {};
    result.success = false;
    //this piece will occupy target square after the capture
    const availableSquares = this.getIncomingCaptureSquares(piece, row, col);
    if (availableSquares.length === 0) {
      //no more squares to choose
      result.success = false;
      return result;
    }
    //now we need to find a square to place the fromPiece
    const square = availableSquares[
      Math.floor(Math.random() * availableSquares.length)
    ];

    this.board[square.row][square.col] = piece;

    if ('affectedRow' in square && 'affectedCol' in square) {
      this.board[square.affectedRow][square.affectedCol] = '*';
    }

    result.row = square.row;
    result.col = square.col;
    result.success = true;
    return result;
  }

  generateSolution() {
    const solution = {};
    solution.captures = [];

    const maxCapturesPerPiece = 2;
    const gameTreeDepth = maxCapturesPerPiece + 1;
    const gameTreeSize = this.numOfPieces; //for N pieces, we will have N nodes in the game tree

    //generate the game tree, with levels ranging from 1 (the root node) to gameTreeDepth
    this.gameTreeNodes = this.generateGameTree(gameTreeSize, gameTreeDepth);

    //now find out all the leaf nodes, they are the nodes that launch captures
    const leafNodes = shuffleArr(this.gameTreeNodes.filter((node) => {
      return node.numOfChilds === 0;
    }));

    //generate the first piece
    this.generateFirstPiece();

    leafNodes.forEach((node) => {
      node.piece = this.getRandomPiece();
      //all leaf nodes should eventually capture the first occupied square
      this.placePieceAroundSquare(node.piece, this.firstOccupiedSquare.row, this.firstOccupiedSquare.col);
      console.log(node);
      console.log(this.getNodesInPathOf(node));
      /*
      if (node.level === 1) { //this is the root node
        this.generateFirstPiece();
        node.moves = []; //the root node should not have any moves
        node.square = this.firstOccupiedSquare;
      } else {
        const move = {
          from: { //from square
            row: 0,
            col: 0
          },
          to: { //to square
            row: 0,
            col: 0
          }
        };
        if (node.level === 2) {
      //the nodes are in second level, place a piece around the first occupied square
          node.piece = this.getRandomPiece();
          this.placePieceAroundSquare(node.piece, this.firstOccupiedSquare.row, this.firstOccupiedSquare.col);
        } else {
      //for captures in other levels,
        }
        */
    });

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
  console.log(board.firstOccupiedSquare);
}

/////////////////////// Main ///////////////////////////
generatePosition(16);
