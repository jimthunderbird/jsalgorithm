/**
 * Algorithm summary:
 * There will be a game tree representing a piece and its move action (node)
 */
const JCE = require('../jsChessEngine/bin/JCE.js');

class SoloChessBoard {

  constructor(numOfPieces) {
    this.numOfPieces = numOfPieces;
    this.pieceInfos = {};
    this.reachableSquaresCache = {};
    this.maxNumOfpiecesOnBoard = 0;
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
   * clear up the board
   */
  clear() {
    this.board = this.getEmptyBoard();
    this.piecesInfos = [];
    this.numOfPiecesOnBoard = 0;
    this.pieceInfoMap = [];
  }

  getReachableSquaresOfPiece(piece, square) {
    const key = `${piece}${square.row}${square.col}`;
    if (this.reachableSquaresCache[key] === undefined) {
      const onePieceBoard = this.getEmptyBoard();
      onePieceBoard[square.row][square.col] = piece;
      const reachableSquares = JCE.getLegalMoves(arrToFen(onePieceBoard)).map((move) => {
        return move.to;
      }).map((coordinate) => {
        return {
          row: 8 - coordinate[1],
          col: coordinate.charCodeAt(0) - 97
        };
      });
      this.reachableSquaresCache[key] = reachableSquares;
    }
    return this.reachableSquaresCache[key];
  }

  getAffectedSquaresOnPieceMove(piece, fromSquare, toSquare) {
    const squares = [];
    //only queen, bishop, rook should have affected squares
    if ([QUEEN, BISHOP, ROOK].includes(piece)) {
      const amplifier = Math.max(Math.abs(toSquare.row - fromSquare.row), Math.abs(toSquare.col - fromSquare.col));
      let delta = [
        (fromSquare.row - toSquare.row) / amplifier,
        (fromSquare.col - toSquare.col) / amplifier
      ];
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

  /**
   * get available source squares when placing a piece to a specific square
   */
  getAvailableSourceSquaresForPlacement(piece, square) {
    //special treatment for pawn, we just place pawn below the square
    let squares = [];
    if (piece === PAWN) {
      const sourceSquare = [{
        row: square.row + 1,
        col: square.col
      }];
      //make sure we do not have pawn promotion and the source square is still inside board
      if (sourceSquare.row > 1 && sourceSquare.row <= 7) {
        squares.push(sourceSquare);
      }
    } else {
      squares = this.getReachableSquaresOfPiece(piece, square).filter((square) => {
        //we should make sure:
        //1. the square is an empty square
        //2. there is no pawn promotion
        return this.board[square.row][square.col] === '-';
      });
    }

    return squares;
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
    const key = `${square.row}${square.col}`;
    this.pieceInfos[key] = {piece, square, key};
    this.numOfPiecesOnBoard += 1;
  }

  getExistingPieces() {
    const pieceInfos = [];
    Object.keys(this.pieceInfos).map((key) => {
      pieceInfos.push(this.pieceInfos[key]);
    });
    return pieceInfos;
  }

  containsSolution() {
    const pieceInfos = this.getExistingPieces();

  }

  generateSolution() {
    let solution;
    for (let t = 1; t <= 1000; t += 1) { //t means outer trys
      solution = {};
      solution.captures = [];

      this.clear();

      this.hasKing = Math.round(Math.random()); //will this solution contains king?

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
        // the last piece to stay should be a king
        for (let it = 1; it <= 200; it += 1) { //it means inner trys
          if (i === this.numOfPieces - 2 && this.hasKing) {
            piece = KING;
          } else {
            piece = this.getRandomPiece();
          }
          const result = this.placePieceAroundSquare(piece, rootSquare);
          if (result.success) {
            //now generate the capture
            solution.captures.push({
              piece: piece,
              from: result.square,
              to: rootSquare
            });
            break;
          }
        }
      }

      if (this.numOfPiecesOnBoard === this.numOfPieces) {
        this.maxNumOfpiecesOnBoard = this.numOfPiecesOnBoard;
        solution.fen = arrToFen(this.board);
        this.solution = solution;
        break;
      } else if( this.numOfPiecesOnBoard > this.maxNumOfpiecesOnBoard ) {
        this.maxNumOfpiecesOnBoard = this.numOfPiecesOnBoard;
        solution.fen = arrToFen(this.board);
        this.solution = solution;
      }
    }

    /*
    console.log(solution.captures.map((capture) => {
      return `${capture.piece}:${capture.from.row}${capture.from.col}->${capture.to.row}${capture.to.col}`;
    }));
    console.log(this.board);
    console.log(this.solution);
    */
    console.log(this.maxNumOfpiecesOnBoard);
    return solution;
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
