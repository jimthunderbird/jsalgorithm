const JCE = require('../jsChessEngine/bin/JCE.js');

const { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } = {
  PAWN: 'P',
  KNIGHT: 'N',
  BISHOP: 'B',
  ROOK: 'R',
  QUEEN: 'Q',
  KING: 'K'
};

const MAX_NUM_OF_MOVES_PER_PIECE = 2;

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

  return `${pieces}`;
};


class SolutionCache {
  constructor() {
    this.cache = {};
    this.sizePerSlot = 5;
  }

  addSolution(solution) {
    const numOfPieces = solution.numOfPieces;
    if (this.cache[numOfPieces] === undefined) {
      this.cache[numOfPieces] = [];
    }

    if (this.cache[numOfPieces].length < this.sizePerSlot) {
      this.cache[numOfPieces].push({
        fen: solution.fen,
        encodedCaptures: solution.encodedCaptures
      });
    }
  }

  getSolution(numOfPieces) {
    let solution;
    for (let n = numOfPieces; n >= 1; n -= 1) {
      if (this.cache[n] !== undefined && this.cache[n].length > 0) {
        const index = Math.floor(Math.random() * this.cache[n].length);
        solution = this.cache[n][index];
        break;
      }
    }
    return solution;
  }
}

class SoloChessGame {
  constructor() {
    //cache to store the reachable squares for each piece and square combo
    this.reachableSquaresCache = {};
    //define the solution cache
    this.solutionCache = new SolutionCache();

    //some configurations
    this.maxNumOfMovesPerPiece = MAX_NUM_OF_MOVES_PER_PIECE;
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
    this.numOfPiecesOnBoard = 0;
  }

  getEncodedCaptures(captures) {
    return captures.map((capture) => {
      const fromRowCol = `${capture.from.row}${capture.from.col}`;
      const toRowCol = `${capture.to.row}${capture.to.col}`;
      return `${capture.piece}:${fromRowCol}:${toRowCol}`;
    }).join(',');
  }

  /**
   * check if the board is in pawn promotion state
   * make it more strict so that pawn only be at rank 4 or further down
   */
  isPawnPromotion() {
    let result = false;
    for (let i = 0; i < this.maxNumOfMovesPerPiece; i += 1) {
      result = result || this.board[i].includes(PAWN);
    }
    return result;
  }

  /**
   * check if all captures are valid
   */
  allCapturesAreValid(captures) {
    let result = true;
    //see if there are any bad captures
    for (let i = 0; i < captures.length; i += 1) {
      const capture = captures[i];

      //get the affected squares
      const affectedSquares = this.getAffectedSquaresOnPieceMove(
        capture.piece,
        capture.from,
        capture.to
      );
      //perform the part of the capture, set the from square to empty
      this.board[capture.from.row][capture.from.col] = '-';
      if (affectedSquares.some(square => this.board[square.row][square.col] !== '-' &&
        this.board[square.row][square.col] !== '*')) {
        //bad capture, the capture is blocked by a piece
        result = false;
        break;
      } else if (this.board[capture.to.row][capture.to.col] === '-') {
        //bad capture, move to an empty square
        result = false;
        break;
      }
    }
    return result;
  }

  getReachableSquaresOfPiece(piece, square) {
    const key = `${piece}${square.row}${square.col}`;
    if (this.reachableSquaresCache[key] === undefined) {
      const onePieceBoard = this.getEmptyBoard();
      onePieceBoard[square.row][square.col] = piece;
      const reachableSquares = JCE.getLegalMoves(arrToFen(onePieceBoard))
        .map(move => move.to)
        .map(coordinate => ({
          row: 8 - coordinate[1],
          col: coordinate.charCodeAt(0) - 97
        }));

      this.reachableSquaresCache[key] = reachableSquares;
    }
    return this.reachableSquaresCache[key];
  }

  /**
   * get the affected squares on piece move
   */
  getAffectedSquaresOnPieceMove(piece, fromSquare, toSquare) {
    const affectedSquares = [];
    //scan all the squares along the lines between fromSquare and toSquare
    //only perform the scan when the piece is queen, bishop or rook
    if ([QUEEN, BISHOP, ROOK].includes(piece)) {
      const amplifier = Math.max(
        Math.abs(toSquare.row - fromSquare.row),
        Math.abs(toSquare.col - fromSquare.col)
      );
      const delta = [
        Math.floor((fromSquare.row - toSquare.row) / amplifier),
        Math.floor((fromSquare.col - toSquare.col) / amplifier)
      ];
      let row = fromSquare.row;
      let col = fromSquare.col;
      for (;;) {
        row -= delta[0];
        col -= delta[1];
        if (Math.abs(row - toSquare.row) === 0 && Math.abs(col - toSquare.col) === 0) {
          //we have reached the toSquare, stop
          break;
        } else {
          affectedSquares.push({ row, col });
        }
      }
    }
    return affectedSquares;
  }

  /**
   * mark the affected squares
   */
  markAffectedSquares(affectedSquares) {
    affectedSquares.forEach((affectedSquare) => {
      //only mark the empty squares
      if (this.board[affectedSquare.row][affectedSquare.col] === '-') {
        this.board[affectedSquare.row][affectedSquare.col] = '*';
      }
    });
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
      if (sourceSquare.row > 1 && sourceSquare.row <= 7) {
        squares.push(sourceSquare);
      }
    } else {
      //we should make sure the square is an empty square
      squares = this.getReachableSquaresOfPiece(piece, square)
        .filter(reachableSquare => this.board[reachableSquare.row][reachableSquare.col] === '-');
    }
    return squares;
  }

  /**
   * place a piece around a targetSquare
   */
  placePieceAroundSquare(piece, toSquare, distance = 1) {
    let paths = [toSquare];
    for (let d = 1; d <= distance; d += 1) {
      const availableSquares = this.getAvailableSourceSquaresForPlacement(piece, paths[d - 1]);
      if (availableSquares.length > 0) {
        const square = availableSquares[Math.floor(Math.random() * availableSquares.length)];
        paths.push(square);
      } else {
        //no available square, clear the path
        paths = [];
        break;
      }
    }

    for (let i = paths.length - 1; i >= 1; i -= 1) {
      const s2 = paths[i];
      const s1 = paths[i - 1];
      const affectedSquares = this.getAffectedSquaresOnPieceMove(piece, s2, s1);
      let pieceAtSquare;
      if (i === paths.length - 1) {
        pieceAtSquare = piece;
      } else {
        pieceAtSquare = this.getRandomPiece();
      }
      this.addPieceToSquare(pieceAtSquare, s2);
      this.markAffectedSquares(affectedSquares);
      this.solution.captures.push({
        piece,
        from: s2,
        to: s1
      });
    }
  }

  /**
   * get a random piece
   * we optionally pass in piece power
   */
  getRandomPiece(piecePower = 1) {
    let availablePcs = [KNIGHT, QUEEN, PAWN, ROOK, BISHOP];
    if (piecePower > 10) {
      availablePcs = [QUEEN, ROOK, BISHOP, KNIGHT];
    } else if (piecePower > 20) {
      availablePcs = [QUEEN, BISHOP, KNIGHT];
    }
    return availablePcs[Math.floor(Math.random() * availablePcs.length)];
  }

  /**
   * get a random square
   * with higher piece power, we generate close-to-center squares
   */
  getRandomSquare(piecePower) {
    let square;
    if (piecePower > 10) {
      square = {
        row: 2 + Math.floor(Math.random() * 4),
        col: 2 + Math.floor(Math.random() * 4)
      };
    } else {
      square = {
        row: Math.floor(Math.random() * 8),
        col: Math.floor(Math.random() * 8)
      };
    }
    return square;
  }

  addPieceToSquare(piece, square) {
    this.board[square.row][square.col] = piece;
    this.numOfPiecesOnBoard += 1;
  }

  generateSolution(numOfPieces) {
    const hasKing = Math.round(Math.random()); //will this solution contains king?

    for (let round = 1; round <= 500; round += 1) {
      this.solution = {};
      this.solution.captures = [];
      this.clear();
      const rootPiece = this.getRandomPiece();
      const piecePower = round;
      const rootSquare = this.getRandomSquare(piecePower);
      this.addPieceToSquare(rootPiece, rootSquare); //root

      for (let t = 1; t <= 1000; t += 1) {
        const numOfMovements = 1 + Math.floor(Math.random() * this.maxNumOfMovesPerPiece);
        let piece;
        if (this.numOfPiecesOnBoard === numOfPieces - numOfMovements) {
          //the last piece is king if this solution has king
          piece = hasKing ? KING : this.getRandomPiece(piecePower + t);
        } else {
          piece = this.getRandomPiece(piecePower + t);
        }
        this.placePieceAroundSquare(piece, rootSquare, numOfMovements);
        //compute the fen string
        const fen = arrToFen(this.board);
        const board = JSON.parse(JSON.stringify(this.board));
        if (this.numOfPiecesOnBoard === numOfPieces &&
          !this.isPawnPromotion() &&
          this.allCapturesAreValid(this.solution.captures)) {
          this.solution.fen = fen;
          this.solution.board = board;
          this.solutionCache.addSolution({
            encodedCaptures: this.getEncodedCaptures(this.solution.captures),
            fen,
            numOfPieces
          });
          return this.solution;
        }
      }
    }

    //now we do not have a solution, look up the cache
    this.solution = this.solutionCache.getSolution(numOfPieces);
    return this.solution;
  }
}

const game = new SoloChessGame();
const solution = game.generateSolution(10);
console.log(solution.board);
console.log(solution.captures);
