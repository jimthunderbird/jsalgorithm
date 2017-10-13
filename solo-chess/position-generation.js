/**
 * Algorithm summary:
 * There will be a game tree representing each move action (node)
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
        //shuffle existing nodes
        nodes = shuffleArr(nodes);
        //now the first one is a random existing node
        //now we can randomly decide whether treat it as a parent node or sibling node
        let treatAsParent = Math.round(Math.random());

        //this existing capture is at the bottom of the tree
        //we can only make it as a sibling capture
        if (nodes[0].level === depth) {
          treatAsParent = 1;
        }

        if (treatAsParent) { //this is a parent node
          parentId = nodes[0].parentId;
          level = nodes[0].level;
        } else { //this is a sibling node
          parentId = nodes[0].id;
          level = nodes[0].level + 1;
        }
      }

      const id = i;
      const node = {
        id: id,
        parentId: parentId,
        level: level
      };
      nodes.push(node);
    }

    //now sort the nodes by level in ascending order
    nodes.sort((nodeA, nodeB) => {
      return nodeA.level - nodeB.level;
    });

    console.log(nodes);

    for (let i = 0; i < size; i += 1) {
      const node = nodes[i];
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

      }
    }

    return nodes;
  }

  /**
   * get incoming captue squares around a target square
   */
  getIncomingCaptureSquares(piece, targetRow, targetCol) {
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
      const r = targetRow + coord[0];
      const c = targetCol + coord[1];
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
          const ar = targetRow + affectedCoord[0];
          const ac = targetCol + affectedCoord[1];
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
  }

  /**
   * place a piece around a target square
   */
  placePieceAroundSquare(piece, targetRow, targetCol) {
    const result = {};
    result.success = false;
    //the fromPiece will occupy target square after the capture
    const possibleFromSquares = this.getIncomingCaptureSquares(piece, targetRow, targetCol);
    if (possibleFromSquares.length === 0) {
      //no more squares to choose
      result.success = false;
      return result;
    }
    //now we need to find a square to place the fromPiece
    const square = possibleFromSquares[
      Math.floor(Math.random() * possibleFromSquares.length)
    ];

    const row = square.row;
    const col = square.col;

    this.board[row][col] = piece;

    if ('affectedRow' in square && 'affectedCol' in square) {
      this.board[square.affectedRow][square.affectedCol] = '*';
    }

    result.row = row;
    result.col = col;
    result.success = true;
    return result;
  }

  generateSolution() {
    const maxCapturesPerPiece = 2;
    const gameTreeDepth = maxCapturesPerPiece + 1;
    const gameTreeSize = this.numOfPieces; //for N pieces, we will have N nodes in the game tree

    //generate the game tree, with levels ranging from 1 (the root node) to gameTreeDepth
    const nodes = this.generateGameTree(gameTreeSize, gameTreeDepth);
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
