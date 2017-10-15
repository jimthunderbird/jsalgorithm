/**
 * Algorithm summary:
 * There will be a game tree representing a piece and its move action (node)
 */
const JCE = require('../jsChessEngine/bin/JCE.js');

class SoloChessBoard {

  constructor(numOfPieces) {
    this.numOfPieces = numOfPieces;

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
    for (let i = 0; i < deltas.length; i += 1) {
      const delta = deltas[i];
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

    /*
    console.log('hash way');
    console.log(Object.values(squaresHash));
    console.log('jce way');
    console.log(this.getReachableSquaresOfPiece(piece, square));
    */
    return Object.values(squaresHash);
  }

  /**
   * place a piece around a specific square
   */
  placePieceAroundSquare(piece, square) {
    const result = {};
    const sourceSquares = this.getAvailableSourceSquaresForPlacement(piece, square);
    if (sourceSquares.length === 0) {
      result.success = false;
      return result;
    }
    const sourceSquare = sourceSquares[Math.floor(Math.random() * sourceSquares.length)];
    this.addPieceToSquare(piece, sourceSquare);
    const affectedSquares = this.getAffectedSquaresOnPieceMove(piece, sourceSquare, square);

    affectedSquares.forEach((square) => {
      this.board[square.row][square.col] = '*';
    });

    result.success = true;
    result.square = sourceSquare;
    return result;
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

  getReachableSquaresOfPiece(piece, square) {
    const onePieceBoard = this.getEmptyBoard();
    onePieceBoard[square.row][square.col] = piece;
    const reachableSquares = JCE.getLegalMoves(arrToFen(onePieceBoard)).map((move) => {
      return move.to;
    }).map((coordinate) => {
      return {
        row: 8 - coordinate[1],
        col: coordinate.charCodeAt(0) - 97
      };
    }).filter((coordinate) => {
      //make sure this coordinate is not affected
      return this.board[coordinate.row][coordinate.col] !== '*';
    });
    return reachableSquares;
  }

  getAffectedSquaresOnPieceMove(piece, fromSquare, toSquare) {
    const squares = [];
    //only queen, bishop, rook should have affected squares
    if ([QUEEN, BISHOP, ROOK].includes(piece)) {
      const amplifier = Math.max(Math.abs(toSquare.row - fromSquare.row), Math.abs(toSquare.col - fromSquare.col));
      let delta = [(fromSquare.row - toSquare.row) / amplifier, (fromSquare.col - toSquare.col) / amplifier];
      let row = fromSquare.row;
      let col = fromSquare.col;
      for (;;) {
        row -= delta[0];
        col -= delta[1];
        if (Math.abs(row - toSquare.row) === 0 && Math.abs(col - toSquare.col) === 0) {
          break;
        } else {
          //the affected square should just be an empty square
          if (this.board[row][col] === '-') {
            squares.push({row, col});
          }
        }
      }
    }
    return squares;
  }

  generateSolution() {
    let solution;
    for (let t = 1; t <= 10000; t += 1) { //t means outer trys
      solution = {};
      solution.captures = [];

      this.board = this.getEmptyBoard();
      this.numOfPiecesOnBoard = 0;

      this.hasKing = true;

      if (this.hasKing) {
        this.availablePcs = [KNIGHT, KING, QUEEN, PAWN, ROOK, BISHOP];
      } else {
        this.availablePcs = [KNIGHT, QUEEN, PAWN, ROOK, BISHOP];
      }

      //randomly generate the rootSquare
      let rootSquare;
      let rootPiece;
      for (;;) {
        rootSquare = this.getRandomSquare()
        rootPiece = this.getRandomPiece();
        //root piece should not have pawn promotion
        if (!(rootPiece === PAWN && rootSquare.row < 2)) {
          break;
        }
      }

      this.addPieceToSquare(rootPiece, rootSquare);

      let piece;

      for (let i = 0; i < this.numOfPieces - 1; i += 1) {
        // the last piec to stay should be a king
        for (let it = 1; it <= 200; it += 1) { //it means inner trys
          if (i === this.numOfPieces - 2 && this.hasKing) {
            piece = KING;
          } else {
            piece = this.getRandomPiece();
          }
          const result = this.placePieceAroundSquare(piece, rootSquare);
          if (result.success) {
            break;
          }
        }
      }

      if (this.numOfPiecesOnBoard === this.numOfPieces) {
        break;
      }
    }

    this.print();
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
}

/////////////////////// Main ///////////////////////////
generatePosition(20);
