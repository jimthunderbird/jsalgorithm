/**
 * Solo Chess Rules:
 * 1. Any pieces can not move more than 2 times
 * 2. King should be the last one to stand
 * 3. There should be only one king in each challenge
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

  /**
   * check if a piece is in pawn promotion state
   */
  isPawnPromotion(piece, square) {
    return rootPiece === PAWN && rootSquare.row < 2;
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
      //make sure the source square is still inside board
      //also not in pawn promotion
      if (sourceSquare.row > 1 && sourceSquare.row <= 7 &&
      !this.isPawnPromotion(piece, sourceSquare)) {
        squares.push(sourceSquare);
      }
    } else {
      squares = this.getReachableSquaresOfPiece(piece, square).filter((square) => {
        //we should make sure:
        //the square is an empty square
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
   * note: we exclude kings here
   */
  getRandomPiece() {
    const availablePcs = [KNIGHT, QUEEN, PAWN, ROOK, BISHOP];
    return availablePcs[Math.floor(Math.random() * availablePcs.length)];
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

  getExistingPieceInfos() {
    const pieceInfos = [];
    Object.keys(this.pieceInfos).map((key) => {
      pieceInfos.push(this.pieceInfos[key]);
    });
    return pieceInfos;
  }

  generateSolutionWithRootPiece(rootPiece, rootSquare, numOfPieces, hasKing) {
    const solution = {};
    solution.lastPiece = rootPiece;
    this.addPieceToSquare(rootPiece, rootSquare);

    let piece;
    let previousPiece = '';

    for (let i = 0; i < numOfPieces - 1; i += 1) {
      for (let it = 1; it <= 200; it += 1) { //it means inner trys
        // the last piece to stay should be a king
        if (i === numOfPieces - 2 && hasKing) {
          piece = KING; //we just simpy add king at last
        } else { //the new piece should not capture king
          piece = this.getRandomPiece();
        }
        const result = this.placePieceAroundSquare(piece, rootSquare);
        if (result.success) {
          solution.lastPiece = piece;
          previousPiece = piece;
          //now generate the capture
          this.solution.captures.push({
            piece: piece,
            from: result.square,
            to: rootSquare
          });
          break;
        }
      }
    }
    return solution;
  }

  generateSolution() {
    this.solution = {};
    for (let t = 1; t <= 1000; t += 1) { //t means outer trys
      this.solution.captures = [];
      this.clear();

      this.hasKing = Math.round(Math.random()); //will this solution contains king?

      //divide all nodes among 2 trees
      const numOfPieces1 = 1 + Math.floor(Math.random() * (this.numOfPieces - 1));
      const numOfPieces2 = this.numOfPieces - numOfPieces1;

      //randomly generate the rootSquare
      let rootSquare;
      let rootPiece;
      let nextRootPiece;
      let nextRootSquare;
      let reachableSquares;

      for (;;) {
        //the first tree does not have king
        rootPiece = this.getRandomPiece();
        rootSquare = this.getRandomSquare();
        reachableSquares = this.getReachableSquaresOfPiece(rootPiece, rootSquare);

        //the second tree might have king
        if (numOfPieces2 === 1 && this.hasKing) {
          //special case, if the tree has just one piece
          nextRootPiece = KING;
        } else {
          nextRootPiece = this.getRandomPiece();
        }

        nextRootSquare = reachableSquares[
          Math.floor(Math.random() * reachableSquares.length)
        ];

        //do not select pawn as root
        if (!(rootPiece === PAWN) && !(nextRootPiece === PAWN)) {
          break;
        }
      }

      //now we have the context:
      //1. rootPiece,
      //2. rootSquare,
      //3. nextRootPiece,
      //4. nextRootSquare

      let lastPiece;
      //the first tree will not have king
      lastPiece = this.generateSolutionWithRootPiece(
        rootPiece,
        rootSquare,
        numOfPieces1,
        false).lastPiece;
      //the second tree might have king
      lastPiece = this.generateSolutionWithRootPiece(
        nextRootPiece,
        nextRootSquare,
        numOfPieces2, this.hasKing).lastPiece;

      //simply record capture from next root node to the first root node
      this.solution.captures.push({
        piece: lastPiece,
        from: nextRootSquare,
        to: rootSquare
      });

      if (this.numOfPiecesOnBoard === this.numOfPieces) {
        this.maxNumOfpiecesOnBoard = this.numOfPiecesOnBoard;
        this.solution.fen = arrToFen(this.board);
        break;
      } else if( this.numOfPiecesOnBoard > this.maxNumOfpiecesOnBoard ) {
        this.maxNumOfpiecesOnBoard = this.numOfPiecesOnBoard;
        this.solution.fen = arrToFen(this.board);
      }
    }

    console.log(this.solution.captures);
    console.log(this.board);
    return this.solution;
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
generatePosition(10);
